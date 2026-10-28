import { Document, Types } from "mongoose";

export type NotificationType = "GUARD" | "CONSUMPTION" | "DEVICE" | "SYSTEM";
export type NotificationEntityType = "DEVICE" | "STRIP" | "GUARD" | "SYSTEM";

export interface INotification extends Document {
  userId: Types.ObjectId;
  type: NotificationType;
  entityType: NotificationEntityType;
  entityId: string;
  data: Record<string, any>;
  readAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
