import GuardModel from '../models/guard.model';
import DeviceModel from '../models/device.model';
import PlugModel from '../models/plug.model';
import notificationService from './notification.service';
import { IGuard, GuardComparator, GuardTarget, GuardAction } from '../types/guard.type';

export class GuardService {
  /**
   * Creates a new safety guard for a device with contradiction validation
   * @param data Guard payload
   * @returns The created Guard entity
   */
  async createGuard(data: Partial<IGuard> & Record<string, any>): Promise<IGuard> {
    const deviceId = data.deviceId;
    const target: GuardTarget = (data.target || data.metric)?.toUpperCase() as GuardTarget;
    const comparator: GuardComparator = (data.comparator || data.comparatorType)?.toUpperCase() as GuardComparator;
    const action: GuardAction = data.action?.toUpperCase() as GuardAction;
    const rawValue = data.value !== undefined ? data.value : data.threshold;
    const value = Number(rawValue);

    if (!deviceId) {
      throw new Error('deviceId is required');
    }

    if (!target || !['CURRENT', 'TEMPERATURE', 'POWER'].includes(target)) {
      throw new Error(`Invalid target. Allowed targets are: CURRENT, TEMPERATURE, POWER`);
    }

    if (!comparator || !['MAX', 'MIN'].includes(comparator)) {
      throw new Error(`Invalid comparator. Allowed comparators are: MAX, MIN`);
    }

    if (!action || !['ON', 'OFF'].includes(action)) {
      throw new Error(`Invalid action. Allowed actions are: ON, OFF`);
    }

    if (rawValue === undefined || rawValue === null || isNaN(value)) {
      throw new Error('value is required and must be a valid number');
    }

    if (value < 0) {
      throw new Error('Comparing value must be 0 or positive');
    }

    // Verify the device exists
    const device = await DeviceModel.findById(deviceId);
    if (!device) {
      throw new Error('Device not found');
    }

    // Check if an identical guard already exists for this device (same target and comparator)
    const existingSameGuard = await GuardModel.findOne({
      deviceId,
      target,
      comparator,
    });
    if (existingSameGuard) {
      throw new Error(
        `A guard with target ${target} and comparator ${comparator} already exists for this device.`
      );
    }

    // Contradiction Check:
    // If setting MAX, it cannot be <= existing MIN for the same target
    // If setting MIN, it cannot be >= existing MAX for the same target
    if (comparator === 'MAX') {
      const existingMin = await GuardModel.findOne({
        deviceId,
        target,
        comparator: 'MIN',
      });

      if (existingMin && value <= existingMin.value) {
        throw new Error(
          `Contradiction: MAX ${target} (${value}) cannot be less than or equal to existing MIN ${target} (${existingMin.value}).`
        );
      }
    } else if (comparator === 'MIN') {
      const existingMax = await GuardModel.findOne({
        deviceId,
        target,
        comparator: 'MAX',
      });

      if (existingMax && value >= existingMax.value) {
        throw new Error(
          `Contradiction: MIN ${target} (${value}) cannot be greater than or equal to existing MAX ${target} (${existingMax.value}).`
        );
      }
    }

    return await GuardModel.create({
      deviceId,
      action,
      target,
      comparator,
      value,
      isEnabled: data.isEnabled !== undefined ? data.isEnabled : true,
    });
  }

  /**
   * Retrieves all guards, optionally filtered by deviceId
   * @param filter Filter criteria
   * @returns Array of guards
   */
  async getAllGuards(filter: { deviceId?: string } = {}): Promise<IGuard[]> {
    const query = filter.deviceId ? { deviceId: filter.deviceId } : {};
    return await GuardModel.find(query).sort({ createdAt: -1 });
  }

  /**
   * Retrieves all guards assigned to a specific device
   * @param deviceId ID of the device
   * @returns Array of guards
   */
  async getGuardsByDeviceId(deviceId: string): Promise<IGuard[]> {
    return await GuardModel.find({ deviceId }).sort({ createdAt: -1 });
  }

  /**
   * Updates an existing safety guard
   * @param id Guard ID
   * @param data Update payload
   * @returns Updated guard entity
   */
  async updateGuard(id: string, data: Partial<IGuard> & Record<string, any>): Promise<IGuard | null> {
    const guard = await GuardModel.findById(id);
    if (!guard) {
      throw new Error('Guard not found');
    }

    const deviceId = data.deviceId || guard.deviceId;
    const target: GuardTarget = ((data.target || data.metric)?.toUpperCase() || guard.target) as GuardTarget;
    const comparator: GuardComparator = ((data.comparator || data.comparatorType)?.toUpperCase() || guard.comparator) as GuardComparator;
    const action: GuardAction = (data.action?.toUpperCase() || guard.action) as GuardAction;
    const rawValue = data.value !== undefined ? data.value : (data.threshold !== undefined ? data.threshold : guard.value);
    const value = Number(rawValue);

    if (target && !['CURRENT', 'TEMPERATURE', 'POWER'].includes(target)) {
      throw new Error(`Invalid target. Allowed targets are: CURRENT, TEMPERATURE, POWER`);
    }

    if (comparator && !['MAX', 'MIN'].includes(comparator)) {
      throw new Error(`Invalid comparator. Allowed comparators are: MAX, MIN`);
    }

    if (action && !['ON', 'OFF'].includes(action)) {
      throw new Error(`Invalid action. Allowed actions are: ON, OFF`);
    }

    if (rawValue !== undefined && (isNaN(value) || value < 0)) {
      throw new Error('Comparing value must be 0 or positive');
    }

    // Check duplicate guard for this device
    const existingSameGuard = await GuardModel.findOne({
      _id: { $ne: id },
      deviceId,
      target,
      comparator,
    });
    if (existingSameGuard) {
      throw new Error(
        `A guard with target ${target} and comparator ${comparator} already exists for this device.`
      );
    }

    // Contradiction Check
    if (comparator === 'MAX') {
      const existingMin = await GuardModel.findOne({
        _id: { $ne: id },
        deviceId,
        target,
        comparator: 'MIN',
      });
      if (existingMin && value <= existingMin.value) {
        throw new Error(
          `Contradiction: MAX ${target} (${value}) cannot be less than or equal to existing MIN ${target} (${existingMin.value}).`
        );
      }
    } else if (comparator === 'MIN') {
      const existingMax = await GuardModel.findOne({
        _id: { $ne: id },
        deviceId,
        target,
        comparator: 'MAX',
      });
      if (existingMax && value >= existingMax.value) {
        throw new Error(
          `Contradiction: MIN ${target} (${value}) cannot be greater than or equal to existing MAX ${target} (${existingMax.value}).`
        );
      }
    }

    if (data.deviceId) guard.deviceId = data.deviceId;
    if (action) guard.action = action;
    if (target) guard.target = target;
    if (comparator) guard.comparator = comparator;
    if (rawValue !== undefined) guard.value = value;
    if (data.isEnabled !== undefined) guard.isEnabled = data.isEnabled;

    await guard.save();
    return guard;
  }

  /**
   * Retrieves a single guard by ID
   * @param id Guard ID
   * @returns Guard entity or null
   */
  async getGuardById(id: string): Promise<IGuard | null> {
    return await GuardModel.findById(id);
  }

  /**
   * Deletes a guard entity by ID
   * @param id Guard ID
   */
  async deleteGuard(id: string): Promise<void> {
    await GuardModel.findByIdAndDelete(id);
  }

  /**
   * Toggles or sets the enabled state of a guard
   * @param id Guard ID
   * @param isEnabled Optional explicit state to set
   * @returns Updated guard entity
   */
  async toggleGuard(id: string, isEnabled?: boolean): Promise<IGuard | null> {
    const guard = await GuardModel.findById(id);
    if (!guard) throw new Error('Guard not found');

    guard.isEnabled = typeof isEnabled === 'boolean' ? isEnabled : !guard.isEnabled;
    await guard.save();
    return guard;
  }

  private cooldownMap = new Map<string, number>();

  /**
   * Evaluates all active guards for devices connected to a specific plug
   * against the latest live telemetry from the power strip.
   * If a guard condition is met, automatically executes the guard's action
   * (e.g. turning OFF the outlet upon overload or overheating) on the hardware strip.
   */
  async evaluateGuardsForPlug(plugId: string, outlets: Record<string, any>): Promise<void> {
    if (!plugId || !outlets) return;

    // 1. Fetch all devices assigned to this plug
    const devices = await DeviceModel.find({ plugId }).lean();
    if (!devices || devices.length === 0) return;

    const deviceIds = devices.map((d) => d._id);

    // 2. Fetch all enabled guards for these devices
    const guards = await GuardModel.find({
      deviceId: { $in: deviceIds },
      isEnabled: true,
    }).lean();

    if (!guards || guards.length === 0) return;

    const deviceMap = new Map<string, any>();
    for (const d of devices) {
      deviceMap.set(d._id.toString(), d);
    }

    const now = Date.now();
    const hardwareService = (await import('./hardware.service')).default;

    for (const guard of guards) {
      const device = deviceMap.get(guard.deviceId.toString());
      if (!device || !device.plugPort) continue;

      const port = device.plugPort;
      const outlet = outlets[`outlet${port}`];
      if (!outlet) continue;

      // Extract current metric value from live telemetry
      let currentValue: number | undefined;
      switch (guard.target) {
        case 'POWER':
          currentValue = outlet.power_W !== undefined ? outlet.power_W : outlet.watts;
          break;
        case 'CURRENT':
          currentValue = outlet.current_A;
          break;
        case 'TEMPERATURE':
          currentValue = outlet.temperature_c;
          break;
        default:
          break;
      }

      if (currentValue === undefined || isNaN(currentValue)) continue;

      // Check condition violation
      let isViolated = false;
      if (guard.comparator === 'MAX') {
        isViolated = currentValue >= guard.value;
      } else if (guard.comparator === 'MIN') {
        isViolated = currentValue <= guard.value;
      }

      if (!isViolated) continue;

      // For MIN guards: check startup grace period (15 seconds after turning on)
      if (guard.comparator === 'MIN' && device.lastTurnedOn) {
        const elapsedSinceTurnOn = now - new Date(device.lastTurnedOn).getTime();
        const STARTUP_GRACE_PERIOD_MS = 15000;
        if (elapsedSinceTurnOn < STARTUP_GRACE_PERIOD_MS) {
          // Device is still warming up/starting, skip MIN guard
          continue;
        }
      }

      // Check if action actually needs to change state
      const isCurrentlyOn = !!outlet.on;
      if (guard.action === 'OFF' && !isCurrentlyOn) {
        continue;
      }
      if (guard.action === 'ON' && isCurrentlyOn) {
        continue;
      }

      // Cooldown check (5 seconds per guard) to prevent spamming TCP packets
      const lastTriggered = this.cooldownMap.get(guard._id.toString()) || 0;
      if (now - lastTriggered < 5000) {
        continue;
      }

      // Execute action on hardware strip!
      const targetState = guard.action === 'OFF' ? 'off' : 'on';
      const command = `up:onoff:${port}:${targetState}\r\n`;

      hardwareService.sendCommand(plugId, command);
      hardwareService.sendCommand(plugId, 'up:getinfo:all\r\n');
      this.cooldownMap.set(guard._id.toString(), now);

      console.log(
        `🚨 GUARD TRIGGERED on Plug ${plugId}, Socket ${port} (${device.name || 'Device'}): ` +
          `${guard.target} reached ${currentValue} (Threshold: ${guard.comparator} ${guard.value}). ` +
          `Action executed: Turned ${targetState.toUpperCase()}`
      );

      // Emit event for socket broadcasting and alerts
      hardwareService.emit('guard_triggered', {
        plugId,
        port,
        deviceId: device._id.toString(),
        deviceName: device.name,
        guardId: guard._id.toString(),
        target: guard.target,
        comparator: guard.comparator,
        threshold: guard.value,
        actualValue: currentValue,
        action: guard.action,
        timestamp: new Date().toISOString(),
      });

      // Persist notification and push real-time socket alert to user room
      try {
        const plug = await PlugModel.findById(plugId).lean();
        if (plug && plug.user) {
          await notificationService.createNotification({
            userId: plug.user.toString(),
            type: 'GUARD',
            entityType: 'DEVICE',
            entityId: device._id.toString(),
            data: {
              entityName: device.name,
              plugId,
              plugName: plug.name,
              port,
              action: guard.action,
              target: guard.target,
              comparator: guard.comparator,
              threshold: guard.value,
              actualValue: currentValue,
              timestamp: new Date().toISOString(),
            },
          });
        }
      } catch (notifErr) {
        console.error('Failed to create guard notification:', notifErr);
      }
    }
  }
}

export default new GuardService();
