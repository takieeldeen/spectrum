import mongoose, { Schema } from "mongoose";
import { IMetric } from "../types/metric.type";

const metricSchema: Schema<IMetric> = new Schema({
  stripId: {
    type: Schema.Types.ObjectId,
    ref: "Plug",
    required: true,
    index: true,
  },
  type: {
    type: String,
    enum: ["hour", "day"],
    required: true,
  },
  outlet1: {
    type: Number,
    required: true,
  },
  outlet2: {
    type: Number,
    required: true,
  },
  outlet3: {
    type: Number,
    required: true,
  },
  outlet4: {
    type: Number,
    required: true,
  },
  hourTimestamp: {
    type: Date,
    required: true,
  },
  kwh: {
    type: Number,
    required: true,
  },
  cumulativeKwh: {
    type: Number,
    required: true,
  },
});

metricSchema.index(
  { stripId: 1, type: 1, hourTimestamp: 1 },
  { unique: true },
);

export const Metric = mongoose.model<IMetric>("Metric", metricSchema);
export { IMetric };
