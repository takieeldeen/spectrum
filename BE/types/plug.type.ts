import { Document, Types } from 'mongoose';

export interface IPlug extends Document {
  _id: Types.ObjectId;
  name: string;
  arabicName?: string;
  serialNumber: string;
  ipAddress: string;
  roomId?: string;
  device1?: string;
  device2?: string;
  device3?: string;
  device4?: string;
}
