import mongoose, { Schema } from 'mongoose';
import { IDevice } from '../types/device.type';

const DeviceSchema: Schema<IDevice> = new Schema(
  {
    name: { type: String, required: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: false, index: true },
    plugId: { type: Schema.Types.ObjectId, ref: 'Plug', required: false },
    plugPort: { type: Number, required: false },
    lastTurnedOn: { type: Date, required: false },
    timerClosesAt: { type: Date, required: false, default: null },
    timerDurationMins: { type: Number, required: false, default: null },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IDevice>('Device', DeviceSchema);
