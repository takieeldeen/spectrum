import DeviceModel from '../models/device.model';
import { IDevice } from '../types/device.type';

export class DeviceService {
  /**
   * Creates a new Device entity in the database
   * @param data The device data to be inserted
   * @returns The created device entity
   */
  async createDevice(data: Partial<IDevice>): Promise<IDevice> {
    return await DeviceModel.create(data);
  }

  /**
   * Retrieves all Device entities from the database
   * @returns Array of device entities
   */
  async getAllDevices(): Promise<IDevice[]> {
    return await DeviceModel.find({}).populate('plugId', 'name arabicName');
  }

  /**
   * Retrieves all unassigned Device entities (and optionally those assigned to a specific plug)
   * @param plugId Optional plug ID to include its devices
   * @returns Array of device entities
   */
  async getUnassignedDevices(plugId?: string): Promise<IDevice[]> {
    if (plugId) {
      return await DeviceModel.find({ $or: [{ plugId: null }, { plugId }] });
    }
    return await DeviceModel.find({ plugId: null });
  }

  /**
   * Retrieves a single Device entity by ID and populates plug details
   * @param id The ID of the device
   * @returns The device entity
   */
  async getDeviceById(id: string): Promise<IDevice | null> {
    return await DeviceModel.findById(id).populate('plugId', 'name arabicName');
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
}

export default new DeviceService();
