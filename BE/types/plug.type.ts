import { Document, Types } from 'mongoose';

export interface IPlug extends Document {
  _id: Types.ObjectId;
  name: string;
  arabicName?: string;
  serialNumber: string;
  ipAddress: string;
  roomId?: string;
}
