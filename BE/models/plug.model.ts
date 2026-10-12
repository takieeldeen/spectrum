import mongoose, { Schema } from "mongoose";
import { IPlug } from "../types/plug.type";

const PlugSchema: Schema<IPlug> = new Schema(
  {
    name: { type: String, required: true },
    arabicName: { type: String, required: false },
    serialNumber: { type: String, required: true },
    ipAddress: { type: String, required: true },
    roomId: { type: String, required: false },
  },
  {
    timestamps: true,
  },
);

export default mongoose.model<IPlug>("Plug", PlugSchema);
