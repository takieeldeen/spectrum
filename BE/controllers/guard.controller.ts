import { Request, Response } from "express";
import guardService from "../services/guard.service";

export class GuardController {
  /**
   * Handles the request to create a new safety guard
   */
  createGuard = async (req: Request, res: Response) => {
    try {
      const data = req.body;
      const newGuard = await guardService.createGuard(data);

      return res.status(201).json({
        success: true,
        data: newGuard,
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        message: error.message || "An error occurred while creating the guard.",
      });
    }
  };

  /**
   * Handles the request to fetch all guards, optionally filtered by deviceId query param
   */
  getAllGuards = async (req: Request, res: Response) => {
    try {
      const { deviceId } = req.query;
      if (!deviceId) {
        throw new Error("deviceId is required");
      }
      const guards = await guardService.getAllGuards({
        deviceId: deviceId as string,
      });

      return res.status(200).json({
        success: true,
        data: guards,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message || "An error occurred while fetching guards.",
      });
    }
  };

  /**
   * Handles the request to fetch all guards for a specific device
   */
  getGuardsByDeviceId = async (req: Request, res: Response) => {
    try {
      const { deviceId } = req.params;
      const guards = await guardService.getGuardsByDeviceId(deviceId);

      return res.status(200).json({
        success: true,
        data: guards,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message || "An error occurred while fetching guards.",
      });
    }
  };

  /**
   * Handles the request to update an existing guard
   */
  updateGuard = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const data = req.body;
      const updatedGuard = await guardService.updateGuard(id, data);

      return res.status(200).json({
        success: true,
        data: updatedGuard,
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        message: error.message || "An error occurred while updating the guard.",
      });
    }
  };

  /**
   * Handles the request to delete a guard
   */
  deleteGuard = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      await guardService.deleteGuard(id);

      return res.status(200).json({
        success: true,
        message: "Guard deleted successfully.",
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message || "An error occurred while deleting the guard.",
      });
    }
  };

  /**
   * Handles the request to toggle a guard enabled state
   */
  toggleGuard = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { isEnabled } = req.body;
      const updatedGuard = await guardService.toggleGuard(id, isEnabled);

      return res.status(200).json({
        success: true,
        data: updatedGuard,
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        message: error.message || "An error occurred while toggling the guard.",
      });
    }
  };
}

export default new GuardController();
