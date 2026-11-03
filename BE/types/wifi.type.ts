import { Document, Types } from "mongoose";
import { IUser } from "./user.type";

export interface IWifi extends Document {
  _id: Types.ObjectId;
  user: Types.ObjectId | IUser | string;
  ssid: string;
  password: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IWifiResponse {
  _id: Types.ObjectId | string;
  ssid: string;
  username: string;
  password?: string;
  createdAt: Date;
  updatedAt: Date;
}
