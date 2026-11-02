import { Document, Types } from "mongoose";
import { IUser } from "./user.type";

export interface IPlug extends Document {
  _id: Types.ObjectId;
  user: Types.ObjectId | IUser | string;
  name: string;
  serialNumber: string;
  SSID?: string;
  wifiPassword?: string;
  roomId?: string;
  ipAddress?: string;
  createdAt?: Date;
  updatedAt?: Date;
}
