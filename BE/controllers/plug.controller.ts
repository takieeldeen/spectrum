import { Request, Response } from 'express';
import plugService from '../services/plug.service';

export class PlugController {
  /**
   * Handles the request to create a new plug
   */
  createPlug = async (req: Request, res: Response) => {
    try {
      const data = req.body;
      const newPlug = await plugService.createPlug(data);

      return res.status(201).json({
        success: true,
        data: newPlug,
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        message: error.message || 'An error occurred while creating the plug.',
      });
    }
  };

  /**
   * Handles the request to fetch all plugs
   */
  getAllPlugs = async (req: Request, res: Response) => {
    try {
      const plugs = await plugService.getAllPlugs();

      return res.status(200).json({
        success: true,
        data: plugs,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message || 'An error occurred while fetching the plugs.',
      });
    }
  };

  /**
   * Handles the request to fetch a plug by ID
   */
  getPlugById = async (req: Request, res: Response) => {
    try {
      const { plugId } = req.params;
      const plug = await plugService.getPlugById(plugId);

      if (!plug) {
        return res.status(404).json({
          success: false,
          message: 'Plug not found',
        });
      }

      return res.status(200).json({
        success: true,
        data: plug,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message || 'An error occurred while fetching the plug.',
      });
    }
  };
}

export default new PlugController();
