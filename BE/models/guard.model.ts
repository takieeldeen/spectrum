import mongoose, { Schema } from "mongoose";
import { IGuard } from "../types/guard.type";

const GuardSchema: Schema<IGuard> = new Schema(
  {
    deviceId: {
      type: Schema.Types.ObjectId,
      ref: "Device",
      required: true,
      index: true,
    },
    action: {
      type: String,
      enum: ["ON", "OFF"],
      required: true,
      default: "OFF",
    },
    target: {
      type: String,
      enum: ["CURRENT", "TEMPERATURE", "POWER"],
      required: true,
      alias: "metric",
    },
    comparator: {
      type: String,
      enum: ["MAX", "MIN"],
      required: true,
      alias: "comparatorType",
    },
    value: {
      type: Number,
      required: true,
      min: [0, "Value must be 0 or positive"],
      alias: "threshold",
    },
    isEnabled: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
);

GuardSchema.index({ deviceId: 1, target: 1, comparator: 1 }, { unique: true });

export default mongoose.model<IGuard>("Guard", GuardSchema);
