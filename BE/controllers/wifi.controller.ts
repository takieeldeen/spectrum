import { Request, Response } from "express";
import wifiService from "../services/wifi.service";

export class WifiController {
  /**
   * Creates or updates a Wi-Fi network credential
   */
  createWifi = async (req: Request, res: Response) => {
    try {
      const userId = req.user?._id?.toString() || req.userId;
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      const { ssid, password } = req.body;
      if (!ssid || !password) {
        return res.status(400).json({
          success: false,
          message: "SSID and password are required",
        });
      }

      const wifi = await wifiService.createWifi(userId, { ssid, password });

      return res.status(201).json({
        success: true,
        message: "Wi-Fi network saved successfully",
        data: {
          _id: wifi._id,
          ssid: wifi.ssid,
          createdAt: wifi.createdAt,
          updatedAt: wifi.updatedAt,
        },
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        message: error.message || "Failed to save Wi-Fi network",
      });
    }
  };

  /**
   * Returns list of saved Wi-Fi networks for user (excluding password)
   */
  getWifiList = async (req: Request, res: Response) => {
    try {
      const userId = req.user?._id?.toString() || req.userId;
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      const list = await wifiService.getWifiList(userId);

      return res.status(200).json({
        success: true,
        data: list,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message || "Failed to fetch Wi-Fi networks",
      });
    }
  };
}

export default new WifiController();
