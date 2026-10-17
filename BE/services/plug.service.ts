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
   * Updates an existing Plug entity belonging to the user
   * @param id The ID of the plug
   * @param data The updated data
   * @param userId Optional user ID to ensure ownership
   * @returns The updated plug entity
   */
  async updatePlug(id: string, data: Partial<IPlug>, userId?: string): Promise<IPlug | null> {
    const filter: Record<string, any> = { _id: id };
    if (userId) {
      filter.user = userId;
    }
    return await PlugModel.findOneAndUpdate(filter, data, { new: true });
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
   * Retrieves all Plug entities for a given user from the database
   * @param userId Optional user ID to filter plugs
   * @returns Array of plug entities
   */
  async getAllPlugs(userId?: string): Promise<IPlug[]> {
    const filter: Record<string, any> = {};
    if (userId) {
      filter.user = userId;
    }
    return await PlugModel.find(filter);
  }

  /**
   * Retrieves a single Plug entity by ID and optional user ID
   * @param id The ID of the plug
   * @param userId Optional user ID to ensure ownership
   * @returns The plug entity or null if not found
   */
  async getPlugById(id: string, userId?: string): Promise<IPlug | null> {
    const filter: Record<string, any> = { _id: id };
    if (userId) {
      filter.user = userId;
    }
    return await PlugModel.findOne(filter);
  }
}

export default new PlugService();
