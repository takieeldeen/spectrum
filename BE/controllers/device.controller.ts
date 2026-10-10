import { Request, Response } from 'express';
import deviceService from '../services/device.service';

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
        message: error.message || 'An error occurred while creating the device.',
      });
    }
  };

  /**
   * Handles the request to fetch all devices
   */
  getAllDevices = async (req: Request, res: Response) => {
    try {
      await new Promise((resolve) => setTimeout(resolve, 3000));
      const devices = await deviceService.getAllDevices();

      return res.status(200).json({
        success: true,
        data: devices,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message || 'An error occurred while fetching the devices.',
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
        message: 'Device deleted successfully.',
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message || 'An error occurred while deleting the device.',
      });
    }
  };
}

export default new DeviceController();
