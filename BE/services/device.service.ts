import DeviceModel from '../models/device.model';
import PlugModel from '../models/plug.model';
import OwnershipModel from '../models/ownership.model';
import ownershipService from './ownership.service';
import { IDevice } from '../types/device.type';

export class DeviceService {
  /**
   * Creates a new Device entity in the database
   * @param data The device data to be inserted
   * @returns The created device entity
   */
  async createDevice(data: Partial<IDevice>): Promise<IDevice> {
    if (data.plugId && data.plugPort) {
      await DeviceModel.updateMany(
        { plugId: data.plugId, plugPort: data.plugPort },
        { $set: { plugId: null, plugPort: null } }
      );
    }
    if (!data.user && data.plugId) {
      const ownership = await OwnershipModel.findOne({ plug: data.plugId });
      if (ownership?.user) {
        data.user = ownership.user as any;
      }
    }
    const created = await DeviceModel.create(data);
    const populated = await DeviceModel.findById(created._id).populate('plugId', 'name');
    return (populated || created) as IDevice;
  }

  /**
   * Retrieves all Device entities for the specified user (or all if no userId is provided)
   * @param userId Optional user ID to filter devices
   * @returns Array of device entities
   */
  async getAllDevices(userId?: string): Promise<IDevice[]> {
    if (!userId) {
      return await DeviceModel.find({}).populate('plugId', 'name');
    }

    const userPlugIds = await ownershipService.getUserPlugIds(userId);

    return await DeviceModel.find({
      $or: [
        { user: userId },
        { plugId: { $in: userPlugIds } },
      ],
    }).populate('plugId', 'name');
  }

  /**
   * Retrieves all unassigned Device entities (and optionally those assigned to a specific plug)
   * scoped to the specified user
   * @param plugId Optional plug ID to include its devices
   * @param userId Optional user ID to filter devices
   * @returns Array of device entities
   */
  async getUnassignedDevices(plugId?: string, userId?: string): Promise<IDevice[]> {
    if (!userId) {
      if (plugId) {
        return await DeviceModel.find({ $or: [{ plugId: null }, { plugId }] });
      }
      return await DeviceModel.find({ plugId: null });
    }

    const userPlugIds = await ownershipService.getUserPlugIds(userId);

    const userFilter = {
      $or: [
        { user: userId },
        { plugId: { $in: userPlugIds } },
      ],
    };

    if (plugId) {
      return await DeviceModel.find({
        $and: [
          { $or: [{ plugId: null }, { plugId }] },
          userFilter,
        ],
      });
    }

    return await DeviceModel.find({
      $and: [{ plugId: null }, userFilter],
    });
  }

  /**
   * Retrieves a single Device entity by ID and populates plug details
   * @param id The ID of the device
   * @returns The device entity
   */
  async getDeviceById(id: string): Promise<IDevice | null> {
    return await DeviceModel.findById(id).populate('plugId', 'name');
  }

  /**
   * Updates an existing Device entity in the database
   * @param id The ID of the device to update
   * @param data The updated data
   * @returns The updated device entity
   */
  async updateDevice(id: string, data: Partial<IDevice>): Promise<IDevice | null> {
    if (data.plugId && data.plugPort) {
      await DeviceModel.updateMany(
        { _id: { $ne: id }, plugId: data.plugId, plugPort: data.plugPort },
        { $set: { plugId: null, plugPort: null } }
      );
    } else if ("plugId" in data && !data.plugId) {
      data.plugId = null as any;
      data.plugPort = null as any;
    }
    return await DeviceModel.findByIdAndUpdate(id, data, { new: true }).populate('plugId', 'name');
  }

  /**
   * Deletes a Device entity from the database
   * @param id The id of the device to delete
   */
  async deleteDevice(id: string): Promise<void> {
    await DeviceModel.findByIdAndDelete(id);
  }

  /**
   * Toggles the device outlet ON or OFF using hardware service
   * and updates lastTurnedOn if it's turned ON
   */
  async toggleDeviceOutlet(deviceId: string, state: 'on' | 'off'): Promise<IDevice | null> {
    const device = await DeviceModel.findById(deviceId);
    if (!device) throw new Error('Device not found');
    if (!device.plugId || !device.plugPort) {
      throw new Error('Device is not assigned to any plug or port');
    }

    // Command format: up:onoff:PORT:on/off\r\n
    const command = `up:onoff:${device.plugPort}:${state}\r\n`;
    
    // Lazy load hardwareService to avoid circular dependency issues if any
    const hardwareService = (await import('./hardware.service')).default;
    hardwareService.sendCommand(device.plugId.toString(), command);
    
    // Force the hardware to broadcast its updated state immediately
    hardwareService.sendCommand(device.plugId.toString(), 'up:getinfo:all\r\n');

    if (state === 'on') {
      device.lastTurnedOn = new Date();
      await device.save();
    }

    return device;
  }

  /**
   * Sets a sleep timer on a device. Allowed durations:
   * 1 (testing), 15, 30, 60, 120, 240, or 480 minutes.
   * @param deviceId ID of the device
   * @param durationMins Duration in minutes
   * @returns Updated device
   */
  async setTimer(deviceId: string, durationMins: number): Promise<IDevice | null> {
    const { ALLOWED_TIMER_DURATIONS } = await import('./timer.service');

    if (!(ALLOWED_TIMER_DURATIONS as readonly number[]).includes(durationMins)) {
      throw new Error(
        `Invalid duration. Allowed values are: ${ALLOWED_TIMER_DURATIONS.join(', ')} minutes.`
      );
    }

    const device = await DeviceModel.findById(deviceId);
    if (!device) throw new Error('Device not found');
    if (!device.plugId || !device.plugPort) {
      throw new Error('Device is not assigned to any plug or port');
    }

    const closesAt = new Date(Date.now() + durationMins * 60_000);
    device.timerClosesAt = closesAt;
    device.timerDurationMins = durationMins;
    await device.save();

    // Force immediate registry sync so the timer is active straight away
    const timerService = (await import('./timer.service')).default;
    timerService.invalidate();

    return device;
  }

  /**
   * Cancels any active sleep timer on a device.
   * @param deviceId ID of the device
   * @returns Updated device
   */
  async cancelTimer(deviceId: string): Promise<IDevice | null> {
    const device = await DeviceModel.findByIdAndUpdate(
      deviceId,
      { timerClosesAt: null, timerDurationMins: null },
      { new: true }
    );

    const timerService = (await import('./timer.service')).default;
    timerService.invalidate();

    return device;
  }
}

export default new DeviceService();

