import { Request, Response } from "express";
import deviceService from "../services/device.service";

export class DeviceController {
  /**
   * Handles the request to create a new device
   */
  createDevice = async (req: Request, res: Response) => {
    try {
      const data = req.body;
      const newDevice = await deviceService.createDevice(data);

      return res.status(201).json({
        success: true,
        data: newDevice,
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        message:
          error.message || "An error occurred while creating the device.",
      });
    }
  };

  /**
   * Handles the request to fetch all devices
   */
  getAllDevices = async (req: Request, res: Response) => {
    try {
      const devices = await deviceService.getAllDevices();

      return res.status(200).json({
        success: true,
        data: devices,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message:
          error.message || "An error occurred while fetching the devices.",
      });
    }
  };

  /**
   * Handles the request to fetch all unassigned devices
   */
  getUnassignedDevices = async (req: Request, res: Response) => {
    try {
      const { plugId } = req.query;
      const devices = await deviceService.getUnassignedDevices(
        plugId as string,
      );

      return res.status(200).json({
        success: true,
        data: devices,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message:
          error.message ||
          "An error occurred while fetching unassigned devices.",
      });
    }
  };

  /**
   * Handles the request to fetch a device by ID
   */
  getDeviceById = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const device = await deviceService.getDeviceById(id);

      if (!device) {
        return res.status(404).json({
          success: false,
          message: "Device not found",
        });
      }

      return res.status(200).json({
        success: true,
        data: device,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message:
          error.message || "An error occurred while fetching the device.",
      });
    }
  };

  /**
   * Handles the request to update an existing device
   */
  updateDevice = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const data = req.body;
      const updatedDevice = await deviceService.updateDevice(id, data);

      if (!updatedDevice) {
        return res.status(404).json({
          success: false,
          message: "Device not found",
        });
      }

      return res.status(200).json({
        success: true,
        data: updatedDevice,
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        message:
          error.message || "An error occurred while updating the device.",
      });
    }
  };

  /**
   * Handles the request to delete a device
   */
  deleteDevice = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      await deviceService.deleteDevice(id);

      return res.status(200).json({
        success: true,
        message: "Device deleted successfully.",
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message:
          error.message || "An error occurred while deleting the device.",
      });
    }
  };

  /**
   * Handles toggling a device
   */
  toggleDevice = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { state } = req.body;

      if (state !== "on" && state !== "off") {
        return res
          .status(400)
          .json({ success: false, message: "State must be 'on' or 'off'" });
      }

      const device = await deviceService.toggleDeviceOutlet(id, state);

      return res.status(200).json({
        success: true,
        message: `Device successfully turned ${state}`,
        data: device,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message:
          error.message || "An error occurred while toggling the device.",
      });
    }
  };

  /**
   * Handles setting a sleep timer on a device
   */
  setTimer = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { durationMins } = req.body;

      if (durationMins === undefined || durationMins === null) {
        return res.status(400).json({
          success: false,
          message: "durationMins is required.",
        });
      }

      const device = await deviceService.setTimer(id, Number(durationMins));

      return res.status(200).json({
        success: true,
        message: `Sleep timer set for ${durationMins} minutes.`,
        data: device,
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        message: error.message || "Failed to set sleep timer.",
      });
    }
  };

  /**
   * Handles cancelling an active sleep timer on a device
   */
  cancelTimer = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const device = await deviceService.cancelTimer(id);

      return res.status(200).json({
        success: true,
        message: "Sleep timer cancelled.",
        data: device,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message || "Failed to cancel sleep timer.",
      });
    }
  };
}

export default new DeviceController();

