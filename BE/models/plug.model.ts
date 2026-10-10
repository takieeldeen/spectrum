import mongoose, { Schema } from 'mongoose';
import { IPlug } from '../types/plug.type';

const PlugSchema: Schema<IPlug> = new Schema(
  {
    name: { type: String, required: true },
    arabicName: { type: String, required: false },
    serialNumber: { type: String, required: true },
    ipAddress: { type: String, required: true },
    roomId: { type: String, required: false },
    device1: { type: String, required: false },
    device2: { type: String, required: false },
    device3: { type: String, required: false },
    device4: { type: String, required: false },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IPlug>('Plug', PlugSchema);
