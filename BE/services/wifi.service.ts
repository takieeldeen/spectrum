import mongoose from "mongoose";
import WifiModel, { decryptPassword } from "../models/wifi.model";
import { IWifi } from "../types/wifi.type";

export class WifiService {
  /**
   * Creates or updates a Wi-Fi network credential for a user
   */
  async createWifi(
    userId: string,
    data: { ssid: string; password: string }
  ): Promise<IWifi> {
    const trimmedSsid = data.ssid.trim();
    const existing = await WifiModel.findOne({ user: userId, ssid: trimmedSsid });
    if (existing) {
      existing.password = data.password;
      await existing.save();
      return existing;
    }

    const wifi = new WifiModel({
      user: userId,
      ssid: trimmedSsid,
      password: data.password,
    });
    await wifi.save();
    return wifi;
  }

  /**
   * Retrieves all Wi-Fi networks for a user (without password)
   */
  async getWifiList(userId: string): Promise<IWifi[]> {
    return await WifiModel.find({ user: userId }).sort({ createdAt: -1 });
  }

  /**
   * Retrieves a Wi-Fi network with its decrypted password
   */
  async getWifiWithPassword(
    userId: string,
    ssidOrId: string
  ): Promise<{ ssid: string; password: string } | null> {
    if (!ssidOrId || typeof ssidOrId !== "string") return null;

    const trimmed = ssidOrId.trim();
    if (!trimmed) return null;

    const isObjectId = mongoose.isValidObjectId(trimmed);
    const query = isObjectId
      ? { user: userId, $or: [{ _id: trimmed }, { ssid: trimmed }] }
      : { user: userId, ssid: trimmed };

    const wifi = await WifiModel.findOne(query).select("+password");

    if (!wifi) return null;

    return {
      ssid: wifi.ssid,
      password: decryptPassword(wifi.password),
    };
  }
}

export default new WifiService();
