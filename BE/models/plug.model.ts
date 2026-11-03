import mongoose, { Schema } from "mongoose";
import { IPlug } from "../types/plug.type";

const PlugSchema: Schema<IPlug> = new Schema(
  {
    name: { type: String, required: true },
    serialNumber: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    SSID: { type: String, required: false },
    wifiPassword: { type: String, required: false },
    roomId: { type: String, required: false },
    ipAddress: { type: String, required: false },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IPlug>("Plug", PlugSchema);
