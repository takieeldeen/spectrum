import PlugModel from '../models/plug.model';
import { IPlug } from '../types/plug.type';

import DeviceModel from '../models/device.model';

export class PlugService {
  /**
   * Creates a new Plug entity in the database
   * @param data The plug data to be inserted
   * @returns The created plug entity
   */
  async createPlug(data: Partial<IPlug>): Promise<IPlug> {
    return await PlugModel.create(data);
  }

  /**
   * Updates an existing Plug entity
   * @param id The ID of the plug
   * @param data The updated data
   * @returns The updated plug entity
   */
  async updatePlug(id: string, data: Partial<IPlug>): Promise<IPlug | null> {
    return await PlugModel.findByIdAndUpdate(id, data, { new: true });
  }

  /**
   * Unassigns all devices currently assigned to a plug
   */
  async unassignAllDevicesForPlug(plugId: string): Promise<void> {
    await DeviceModel.updateMany(
      { plugId },
      { $set: { plugId: null, plugPort: null } }
    );
  }

  /**
   * Assigns devices to a plug
   */
  async assignDevicesToPlug(plugId: string, devices: Record<number, string | null | undefined>): Promise<void> {
    for (const [portStr, deviceId] of Object.entries(devices)) {
      if (deviceId) {
        await DeviceModel.findByIdAndUpdate(deviceId, {
          plugId: plugId,
          plugPort: parseInt(portStr, 10),
        });
      }
    }
  }

  /**
   * Retrieves all Plug entities from the database
   * @returns Array of plug entities
   */
  async getAllPlugs(): Promise<IPlug[]> {
    return await PlugModel.find({});
  }

  /**
   * Retrieves a single Plug entity by ID
   * @param id The ID of the plug
   * @returns The plug entity or null if not found
   */
  async getPlugById(id: string): Promise<IPlug | null> {
    return await PlugModel.findById(id);
  }
}

export default new PlugService();
