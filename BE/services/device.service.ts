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
    return await DeviceModel.find({});
  }

  /**
   * Deletes a Device entity from the database
   * @param id The id of the device to delete
   */
  async deleteDevice(id: string): Promise<void> {
    await DeviceModel.findByIdAndDelete(id);
  }
}

export default new DeviceService();
