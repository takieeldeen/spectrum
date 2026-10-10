import mongoose, { Schema } from 'mongoose';
import { IDevice } from '../types/device.type';

const DeviceSchema: Schema<IDevice> = new Schema(
  {
    nameEn: { type: String, required: true },
    nameAr: { type: String, required: false },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IDevice>('Device', DeviceSchema);
