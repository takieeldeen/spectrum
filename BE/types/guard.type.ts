import { Document, Types } from "mongoose";

export type GuardAction = "ON" | "OFF";

export type GuardTarget = "CURRENT" | "TEMPERATURE" | "POWER";

export type GuardComparator = "MAX" | "MIN";

export interface IGuard extends Document {
  _id: Types.ObjectId;
  deviceId: Types.ObjectId;
  action: GuardAction;
  target: GuardTarget;
  metric?: GuardTarget;
  comparator: GuardComparator;
  comparatorType?: GuardComparator;
  value: number;
  threshold?: number;
  comparingValue?: number;
  isEnabled?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}
