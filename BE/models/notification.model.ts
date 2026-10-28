import mongoose, { Schema } from "mongoose";
import { INotification } from "../types/notification.type";

const NotificationSchema: Schema<INotification> = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ["GUARD", "CONSUMPTION", "DEVICE", "SYSTEM"],
      required: true,
      default: "GUARD",
    },
    entityType: {
      type: String,
      enum: ["DEVICE", "STRIP", "GUARD", "SYSTEM"],
      required: true,
      default: "DEVICE",
    },
    entityId: {
      type: String,
      required: true,
      index: true,
    },
    data: {
      type: Schema.Types.Mixed,
      default: {},
    },
    readAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for sorted user notifications in descending order
NotificationSchema.index({ userId: 1, createdAt: -1 });

export default mongoose.model<INotification>("Notification", NotificationSchema);
