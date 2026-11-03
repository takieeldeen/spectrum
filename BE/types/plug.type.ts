import { Document, Types } from "mongoose";

export interface IPlug extends Document {
  _id: Types.ObjectId;
  name: string;
  serialNumber: string;
  SSID?: string;
  wifiPassword?: string;
  roomId?: string;
  ipAddress?: string;
  createdAt?: Date;
  updatedAt?: Date;
}
