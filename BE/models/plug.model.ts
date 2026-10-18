import mongoose, { Schema } from "mongoose";
import { IPlug } from "../types/plug.type";

const PlugSchema: Schema<IPlug> = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    name: { type: String, required: true },
    arabicName: { type: String, required: false },
    serialNumber: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
    },
    SSID: { type: String, required: false },
    wifiPassword: { type: String, required: false },
    roomId: { type: String, required: false },
  },
  {
    timestamps: true,
  }
);

// Unique serial number per user (multiple users can connect to the same physical strip)
PlugSchema.index({ user: 1, serialNumber: 1 }, { unique: true });

export default mongoose.model<IPlug>("Plug", PlugSchema);
