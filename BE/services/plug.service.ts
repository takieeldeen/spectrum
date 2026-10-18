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
   * Deletes a plug entity and unassigns all associated devices
   */
  async deletePlug(id: string, userId?: string): Promise<boolean> {
    const filter: Record<string, any> = { _id: id };
    if (userId) {
      filter.user = userId;
    }
    await this.unassignAllDevicesForPlug(id);
    const result = await PlugModel.findOneAndDelete(filter);
    return Boolean(result);
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

  /**
   * Toggles a plug outlet ON or OFF using hardware service
   * and updates lastTurnedOn if a device is assigned to that port
   */
  async toggleOutlet(
    plugId: string,
    outlet: number,
    state: "on" | "off",
    userId?: string
  ): Promise<{ success: boolean; message: string }> {
    const plug = await this.getPlugById(plugId, userId);
    if (!plug) {
      throw new Error("Plug not found");
    }

    if (outlet < 1 || outlet > 4) {
      throw new Error("Invalid outlet number. Must be between 1 and 4.");
    }

    const normalizedState = state.toLowerCase() as "on" | "off";
    if (normalizedState !== "on" && normalizedState !== "off") {
      throw new Error("Invalid state. Must be 'on' or 'off'.");
    }

    // Lazy load hardwareService to avoid circular dependency
    const hardwareService = (await import("./hardware.service")).default;

    // Ensure connection is mapped if plug has serialNumber
    if (plug.serialNumber) {
      hardwareService.connectToPlug(plugId, plug.serialNumber);
    }

    // Command format: up:onoff:PORT:on/off\r\n
    const command = `up:onoff:${outlet}:${normalizedState}\r\n`;
    hardwareService.sendCommand(plugId, command);

    // Request immediate info refresh
    hardwareService.sendCommand(plugId, "up:getinfo:all\r\n");

    // If state is 'on', update the device assigned to this port
    if (normalizedState === "on") {
      await DeviceModel.findOneAndUpdate(
        { plugId, plugPort: outlet },
        { lastTurnedOn: new Date() }
      ).exec();
    }

    return {
      success: true,
      message: `Outlet ${outlet} successfully turned ${normalizedState}`,
    };
  }
}

export default new PlugService();
