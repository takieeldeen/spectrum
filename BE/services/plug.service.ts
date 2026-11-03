import PlugModel from "../models/plug.model";
import { IPlug } from "../types/plug.type";
import OwnershipModel from "../models/ownership.model";
import DeviceModel from "../models/device.model";
import mongoose from "mongoose";
import ownershipService from "./ownership.service";

export class PlugService {
  /**
   * Creates or joins a Plug entity and assigns user ownership
   * @param data The plug data to be inserted or updated
   * @param userId The user ID creating or joining the plug
   * @returns The plug entity
   */
  async createPlug(data: Partial<IPlug>, userId?: string): Promise<IPlug> {
    let plug: IPlug | null = null;
    if (data.serialNumber) {
      plug = await PlugModel.findOne({ serialNumber: data.serialNumber });
    }

    if (!plug) {
      plug = await PlugModel.create(data);
    } else {
      if (data.name) plug.name = data.name;
      if (data.SSID) plug.SSID = data.SSID;
      if (data.wifiPassword) plug.wifiPassword = data.wifiPassword;
      if (data.roomId) plug.roomId = data.roomId;
      if (data.ipAddress) plug.ipAddress = data.ipAddress;
      await plug.save();
    }

    if (userId) {
      try {
        await ownershipService.addOwnership(userId, plug._id.toString());
      } catch (_) {}
    }

    // Register immediately in HardwareService in-memory map
    if (plug.serialNumber) {
      try {
        const { default: hardwareService } = await import("./hardware.service");
        hardwareService.bindPlugToSerial(plug._id.toString(), plug.serialNumber);
      } catch (_) {}
    }
    return plug;
  }

  /**
   * Updates an existing Plug entity if the user has ownership
   * @param id The ID of the plug
   * @param data The updated data
   * @param userId Optional user ID to ensure ownership
   * @returns The updated plug entity
   */
  async updatePlug(
    id: string,
    data: Partial<IPlug>,
    userId?: string,
  ): Promise<IPlug | null> {
    if (userId) {
      const hasAccess = await ownershipService.hasOwnership(userId, id);
      if (!hasAccess) {
        return null;
      }
    }
    return await PlugModel.findByIdAndUpdate(id, data, { new: true });
  }

  /**
   * Deletes ownership for the specified user, and removes the plug if no owners remain
   */
  async deletePlug(id: string, userId?: string): Promise<boolean> {
    if (userId) {
      const hasAccess = await ownershipService.hasOwnership(userId, id);
      if (!hasAccess) return false;

      await ownershipService.removeOwnership(userId, id);

      const remainingOwners = await OwnershipModel.countDocuments({
        plug: new mongoose.Types.ObjectId(id),
      });

      if (remainingOwners === 0) {
        await this.unassignAllDevicesForPlug(id);
        const result = await PlugModel.findByIdAndDelete(id);
        return Boolean(result);
      }
      return true;
    }

    // System-wide deletion
    await OwnershipModel.deleteMany({ plug: new mongoose.Types.ObjectId(id) });
    await this.unassignAllDevicesForPlug(id);
    const result = await PlugModel.findByIdAndDelete(id);
    return Boolean(result);
  }

  /**
   * Unassigns all devices currently assigned to a plug
   */
  async unassignAllDevicesForPlug(plugId: string): Promise<void> {
    await DeviceModel.updateMany(
      { plugId },
      { $set: { plugId: null, plugPort: null } },
    );
  }

  /**
   * Assigns devices to a plug
   */
  async assignDevicesToPlug(
    plugId: string,
    devices: Record<number, string | null | undefined>,
    userId?: string,
  ): Promise<void> {
    for (const [portStr, deviceId] of Object.entries(devices)) {
      if (deviceId) {
        const updateData: Record<string, any> = {
          plugId: plugId,
          plugPort: parseInt(portStr, 10),
        };
        if (userId) {
          updateData.user = userId;
        }
        await DeviceModel.findByIdAndUpdate(deviceId, updateData);
      }
    }
  }

  /**
   * Retrieves all Plug entities for a given user via OwnershipModel
   * @param userId Optional user ID to filter plugs
   * @returns Array of plug entities
   */
  async getAllPlugs(userId?: string): Promise<IPlug[]> {
    if (!userId) {
      return await PlugModel.find();
    }
    const plugIds = await ownershipService.getUserPlugIds(userId);
    return await PlugModel.find({ _id: { $in: plugIds } });
  }

  /**
   * Retrieves a single Plug entity by ID and optional user ID
   * @param id The ID of the plug
   * @param userId Optional user ID to ensure ownership
   * @returns The plug entity or null if not found
   */
  async getPlugById(id: string, userId?: string): Promise<IPlug | null> {
    if (userId) {
      const hasAccess = await ownershipService.hasOwnership(userId, id);
      if (!hasAccess) {
        return null;
      }
    }
    return await PlugModel.findById(id);
  }

  /**
   * Retrieves devices assigned to each outlet port (1-4) for a plug
   */
  async getAssignedDevicesForPlug(plugId: string): Promise<{
    device1: string;
    device2: string;
    device3: string;
    device4: string;
  }> {
    const devices = await DeviceModel.find({ plugId }).lean();
    return {
      device1: devices.find((d) => d.plugPort === 1)?._id?.toString() || "",
      device2: devices.find((d) => d.plugPort === 2)?._id?.toString() || "",
      device3: devices.find((d) => d.plugPort === 3)?._id?.toString() || "",
      device4: devices.find((d) => d.plugPort === 4)?._id?.toString() || "",
    };
  }

  /**
   * Toggles a plug outlet ON or OFF using hardware service
   * and updates lastTurnedOn if a device is assigned to that port
   */
  async toggleOutlet(
    plugId: string,
    outlet: number,
    state: "on" | "off",
    userId?: string,
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
        { lastTurnedOn: new Date() },
      ).exec();
    }

    return {
      success: true,
      message: `Outlet ${outlet} successfully turned ${normalizedState}`,
    };
  }

  static async ownPlug(plugId: string, userId: string): Promise<boolean> {
    return await ownershipService.hasOwnership(userId, plugId);
  }
}

export default new PlugService();
