import { Request, Response } from "express";
import plugService from "../services/plug.service";
import wifiService from "../services/wifi.service";

export class PlugController {
  /**
   * Handles the request to create a new plug
   */
  createPlug = async (req: Request, res: Response) => {
    try {
      const userId = req.user?._id?.toString() || req.userId;
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      const { device1, device2, device3, device4, ...plugData } = req.body;

      // If wifiPassword not explicitly provided but SSID is, look up saved Wi-Fi credentials

      if (!plugData.wifiPassword && plugData.SSID) {
        const savedWifi = await wifiService.getWifiWithPassword(
          userId,
          plugData.SSID,
        );
        if (savedWifi?.password) {
          plugData.wifiPassword = savedWifi.password;
        }
      }

      const newPlug = await plugService.createPlug(plugData, userId);

      await plugService.assignDevicesToPlug(
        newPlug._id.toString(),
        {
          1: device1,
          2: device2,
          3: device3,
          4: device4,
        },
        userId,
      );

      return res.status(201).json({
        success: true,
        data: newPlug,
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        message: error.message || "An error occurred while creating the plug.",
      });
    }
  };

  /**
   * Handles the request to update an existing plug
   */
  updatePlug = async (req: Request, res: Response) => {
    try {
      const userId = req.user?._id?.toString() || req.userId;
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      const { id } = req.params;
      const { device1, device2, device3, device4, ...plugData } = req.body;

      // If wifiPassword not explicitly provided but SSID is, look up saved Wi-Fi credentials
      if (!plugData.wifiPassword && plugData.SSID) {
        const savedWifi = await wifiService.getWifiWithPassword(
          userId,
          plugData.SSID,
        );
        if (savedWifi?.password) {
          plugData.wifiPassword = savedWifi.password;
        }
      }

      const updatedPlug = await plugService.updatePlug(id, plugData, userId);

      if (!updatedPlug) {
        return res.status(404).json({
          success: false,
          message: "Plug not found",
        });
      }

      await plugService.unassignAllDevicesForPlug(id);
      await plugService.assignDevicesToPlug(id, {
        1: device1,
        2: device2,
        3: device3,
        4: device4,
      });

      return res.status(200).json({
        success: true,
        data: updatedPlug,
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        message: error.message || "An error occurred while updating the plug.",
      });
    }
  };

  /**
   * Handles the request to fetch all plugs for the current user
   */
  getAllPlugs = async (req: Request, res: Response) => {
    try {
      const userId = req.user?._id?.toString() || req.userId;
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      const plugs = await plugService.getAllPlugs(userId);
      const hardwareService = (await import("../services/hardware.service"))
        .default;

      const enrichedPlugs = plugs.map((plug) => {
        const pObj = (plug as any).toObject
          ? (plug as any).toObject()
          : { ...plug };
        const cleanSerial = pObj.serialNumber
          ? hardwareService.normalizeSerial(pObj.serialNumber)
          : "";
        const isConnected = cleanSerial
          ? hardwareService.isSerialConnected(cleanSerial)
          : hardwareService.isPlugConnected(pObj._id?.toString());
        const stripIp = cleanSerial
          ? hardwareService.getStripIpBySerial(cleanSerial)
          : hardwareService.getStripIpByPlugId(pObj._id?.toString());

        return {
          ...pObj,
          connected: isConnected,
          isOnline: isConnected,
          ipAddress: stripIp || undefined,
        };
      });

      return res.status(200).json({
        success: true,
        data: enrichedPlugs,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message || "An error occurred while fetching the plugs.",
      });
    }
  };

  /**
   * Handles the request to fetch a plug by ID for the current user
   */
  getPlugById = async (req: Request, res: Response) => {
    try {
      const userId = req.user?._id?.toString() || req.userId;
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      const { plugId } = req.params;
      const plug = await plugService.getPlugById(plugId, userId);

      if (!plug) {
        return res.status(404).json({
          success: false,
          message: "Plug not found",
        });
      }
      const hardwareService = (await import("../services/hardware.service"))
        .default;
      const cleanSerial = plug.serialNumber
        ? hardwareService.normalizeSerial(plug.serialNumber)
        : "";
      const isConnected = cleanSerial
        ? hardwareService.isSerialConnected(cleanSerial)
        : hardwareService.isPlugConnected(plugId);
      const stripIp = cleanSerial
        ? hardwareService.getStripIpBySerial(cleanSerial)
        : hardwareService.getStripIpByPlugId(plugId);
      const plugObj = (plug as any).toObject
        ? (plug as any).toObject()
        : { ...plug };
      const assignedDevices =
        await plugService.getAssignedDevicesForPlug(plugId);

      return res.status(200).json({
        success: true,
        data: {
          ...plugObj,
          connected: isConnected,
          isOnline: isConnected,
          ipAddress: stripIp || undefined,
          ...assignedDevices,
        },
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message || "An error occurred while fetching the plug.",
      });
    }
  };

  /**
   * Handles toggling a specific outlet on a plug
   */
  toggleOutlet = async (req: Request, res: Response) => {
    try {
      const userId = req.user?._id?.toString() || req.userId;
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      const plugId = req.params.id || req.params.plugId;
      const { outlet, state } = req.body;

      if (!plugId) {
        return res.status(400).json({
          success: false,
          message: "Plug ID is required.",
        });
      }

      const outletNum = Number(outlet);
      const normalizedState =
        typeof state === "string" ? state.toLowerCase() : "";

      if (
        !outletNum ||
        (normalizedState !== "on" && normalizedState !== "off")
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid outlet or state. Outlet must be between 1 and 4, state must be 'on' or 'off'.",
        });
      }

      const result = await plugService.toggleOutlet(
        plugId,
        outletNum,
        normalizedState as "on" | "off",
        userId,
      );

      return res.status(200).json(result);
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        message: error.message || "Failed to toggle plug outlet.",
      });
    }
  };

  /**
   * Handles the request to delete a plug
   */
  deletePlug = async (req: Request, res: Response) => {
    try {
      const userId = req.user?._id?.toString() || req.userId;
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      const { id } = req.params;
      const deleted = await plugService.deletePlug(id, userId);

      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: "Plug not found",
        });
      }

      return res.status(200).json({
        success: true,
        message: "Plug deleted successfully",
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message || "An error occurred while deleting the plug.",
      });
    }
  };

  verifyPlugConnection = async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?._id?.toString() || (req as any).user?.id || (req as any).userId;
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      const { plugId } = req.params;
      const plug = await plugService.getPlugById(plugId, userId);
      if (!plug) {
        return res.status(404).json({
          success: false,
          message: "Plug not found",
        });
      }

      const hardwareService = (await import("../services/hardware.service"))
        .default;
      const cleanSerial = plug.serialNumber
        ? hardwareService.normalizeSerial(plug.serialNumber)
        : "";

      const isConnected = cleanSerial
        ? hardwareService.isSerialConnected(cleanSerial)
        : hardwareService.isPlugConnected(plugId);

      const dataReceived =
        hardwareService.hasReceivedStripData(cleanSerial) ||
        hardwareService.hasReceivedStripData(plugId);

      const lastDataTime =
        hardwareService.getLastDataTimestamp(cleanSerial) ||
        hardwareService.getLastDataTimestamp(plugId);

      const ipAddress = cleanSerial
        ? hardwareService.getStripIpBySerial(cleanSerial)
        : hardwareService.getStripIpByPlugId(plugId);

      res.setHeader(
        "Cache-Control",
        "no-store, no-cache, must-revalidate, proxy-revalidate",
      );
      res.setHeader("Pragma", "no-cache");
      res.setHeader("Expires", "0");

      return res.status(200).json({
        success: true,
        data: {
          connected: isConnected,
          dataReceived,
          lastDataTime,
          ipAddress: ipAddress || undefined,
        },
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message:
          error.message ||
          "An error occurred while verifying plug connection.",
      });
    }
  };
}

export default new PlugController();
