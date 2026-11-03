import { Document, Types } from "mongoose";
import { IUser } from "./user.type";
import { IPlug } from "./plug.type";

export interface IOwnership extends Document {
  _id: Types.ObjectId;
  user: Types.ObjectId | IUser | string;
  plug: Types.ObjectId | IPlug | string;
  createdAt: Date;
  updatedAt: Date;
}
