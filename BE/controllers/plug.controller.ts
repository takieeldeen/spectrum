import { Request, Response } from "express";
import plugService from "../services/plug.service";

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
      const newPlug = await plugService.createPlug({
        ...plugData,
        user: userId,
      });

      await plugService.assignDevicesToPlug(newPlug._id.toString(), {
        1: device1,
        2: device2,
        3: device3,
        4: device4,
      });

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

      return res.status(200).json({
        success: true,
        data: plugs,
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

      return res.status(200).json({
        success: true,
        data: plug,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message || "An error occurred while fetching the plug.",
      });
    }
  };
}

export default new PlugController();
