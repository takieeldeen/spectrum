import DeviceModel from '../models/device.model';
import PlugModel from '../models/plug.model';
import notificationService from './notification.service';

/** Allowed preset durations (minutes). 1 minute is for testing purposes only */
export const ALLOWED_TIMER_DURATIONS = [1, 15, 30, 60, 120, 240, 480] as const;
export type AllowedTimerDuration = (typeof ALLOWED_TIMER_DURATIONS)[number];

interface TimerEntry {
  deviceId: string;
  plugId: string;
  plugPort: number;
  closesAt: Date;
  durationMins: number;
  retryCount: number;
  lastAttemptAt?: number; // Date.now()
  /** Whether the OFF command has been sent at least once (awaiting confirmation) */
  commandSent: boolean;
}

const MAX_RETRIES = 3;
/** Milliseconds between each retry attempt */
const RETRY_INTERVAL_MS = 10_000;

export class TimerService {
  private registry = new Map<string, TimerEntry>();
  /** Cooldown map per deviceId to avoid flooding the strip */
  private cooldownMap = new Map<string, number>();

  constructor() {
    // Initial load then refresh every 5 minutes
    this.syncFromDB();
    setInterval(() => this.syncFromDB(), 5 * 60 * 1000);
  }

  // ---------------------------------------------------------------------------
  // DB Sync
  // ---------------------------------------------------------------------------

  /**
   * Fetches all devices that have an active timer from MongoDB and refreshes
   * the in-memory registry. Devices that have been cleared in the DB are
   * removed from memory. Called on startup, every 5 minutes, and after
   * setting/cancelling a timer.
   */
  async syncFromDB(): Promise<void> {
    try {
      const devices = await DeviceModel.find({
        timerClosesAt: { $ne: null },
        plugId: { $ne: null },
        plugPort: { $ne: null },
      }).lean();

      const activeIds = new Set<string>();

      for (const device of devices) {
        const id = device._id.toString();
        activeIds.add(id);

        const existing = this.registry.get(id);
        // Preserve retry state if already tracking this timer
        this.registry.set(id, {
          deviceId: id,
          plugId: device.plugId!.toString(),
          plugPort: device.plugPort!,
          closesAt: device.timerClosesAt!,
          durationMins: device.timerDurationMins!,
          retryCount: existing?.retryCount ?? 0,
          lastAttemptAt: existing?.lastAttemptAt,
          commandSent: existing?.commandSent ?? false,
        });
      }

      // Remove entries that no longer have a timer in DB
      for (const id of this.registry.keys()) {
        if (!activeIds.has(id)) {
          this.registry.delete(id);
          this.cooldownMap.delete(id);
        }
      }

      if (devices.length > 0) {
        console.log(`⏱  TimerService: synced ${devices.length} active timer(s) from DB`);
      }
    } catch (err) {
      console.error('TimerService: DB sync error:', err);
    }
  }

  /**
   * Force an immediate re-sync (called after setting or cancelling a timer via API).
   */
  public invalidate(): void {
    this.syncFromDB();
  }

  // ---------------------------------------------------------------------------
  // TCP Evaluation Hook
  // ---------------------------------------------------------------------------

  /**
   * Called on every incoming TCP packet (hardware_data event).
   * Mirrors the GuardService.evaluateGuardsForPlug pattern.
   */
  async evaluateTimersForPlug(
    plugId: string,
    outlets: Record<string, any>
  ): Promise<void> {
    if (!plugId || !outlets) return;

    const hardwareService = (await import('./hardware.service')).default;
    const now = Date.now();

    for (const [deviceId, entry] of this.registry.entries()) {
      if (entry.plugId !== plugId) continue;

      const outlet = outlets[`outlet${entry.plugPort}`];

      // ── 1. Outlet absent → device/strip offline ───────────────────────────
      if (!outlet) {
        console.log(
          `⏱  TimerService: device ${deviceId} outlet missing (offline?) — clearing timer`
        );
        await this.clearTimer(deviceId);
        await this.notify(plugId, deviceId, 'offline');
        continue;
      }

      // ── 2. Outlet already OFF ─────────────────────────────────────────────
      if (!outlet.on) {
        if (entry.commandSent) {
          // The OFF command we sent was confirmed — success!
          console.log(`⏱  TimerService: timer completed for device ${deviceId}`);
          await this.clearTimer(deviceId);
          await this.notify(plugId, deviceId, 'success');
        }
        // If commandSent is false, the device was already off when timer started
        // → clear silently (nothing to do)
        else {
          await this.clearTimer(deviceId);
        }
        continue;
      }

      // ── 3. Not yet time ───────────────────────────────────────────────────
      if (now < entry.closesAt.getTime()) {
        continue;
      }

      // ── 4. Max retries exhausted ──────────────────────────────────────────
      if (entry.commandSent && entry.retryCount >= MAX_RETRIES) {
        console.warn(
          `⏱  TimerService: device ${deviceId} did not turn off after ${MAX_RETRIES} retries — giving up`
        );
        await this.clearTimer(deviceId);
        await this.notify(plugId, deviceId, 'failure');
        continue;
      }

      // ── 5. Retry cooldown ─────────────────────────────────────────────────
      const lastAttempt = entry.lastAttemptAt ?? 0;
      if (entry.commandSent && now - lastAttempt < RETRY_INTERVAL_MS) {
        continue;
      }

      // ── 6. Send OFF command ───────────────────────────────────────────────
      const command = `up:onoff:${entry.plugPort}:off\r\n`;
      hardwareService.sendCommand(plugId, command);
      hardwareService.sendCommand(plugId, 'up:getinfo:all\r\n');

      entry.commandSent = true;
      entry.retryCount += entry.lastAttemptAt ? 1 : 0; // only count retries, not first attempt
      entry.lastAttemptAt = now;

      console.log(
        `⏱  TimerService: sent OFF command to device ${deviceId} (port ${entry.plugPort})` +
          (entry.retryCount > 0 ? ` — retry ${entry.retryCount}/${MAX_RETRIES}` : '')
      );
    }
  }

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  private async clearTimer(deviceId: string): Promise<void> {
    try {
      await DeviceModel.findByIdAndUpdate(deviceId, {
        timerClosesAt: null,
        timerDurationMins: null,
      });
    } catch (err) {
      console.error('TimerService: failed to clear timer from DB:', err);
    }
    this.registry.delete(deviceId);
    this.cooldownMap.delete(deviceId);
  }

  private async notify(
    plugId: string,
    deviceId: string,
    outcome: 'success' | 'failure' | 'offline'
  ): Promise<void> {
    try {
      const plug = await PlugModel.findById(plugId).lean();
      if (!plug?.user) return;

      const device = await DeviceModel.findById(deviceId).lean();
      const deviceName = device?.name || 'Device';

      let message = `${deviceName} was turned off by sleep timer`;
      if (outcome === 'failure') {
        message = `Sleep timer failed to turn off ${deviceName}`;
      } else if (outcome === 'offline') {
        message = `${deviceName} was offline when sleep timer fired`;
      }

      await notificationService.createNotification({
        userId: plug.user.toString(),
        type: 'DEVICE',
        entityType: 'DEVICE',
        entityId: deviceId,
        data: {
          event: 'SLEEP_TIMER',
          outcome,
          deviceName,
          title: 'Sleep Timer',
          message,
          plugId,
          plugName: plug.name,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (err) {
      console.error('TimerService: failed to send notification:', err);
    }
  }
}

export default new TimerService();
