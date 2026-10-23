import mongoose, { Schema, Document } from "mongoose";

export interface IMetricHourly extends Document {
  stripId: mongoose.Types.ObjectId;
  userId?: mongoose.Types.ObjectId;
  outletNumber: number; // 0 = total strip, 1..4 = outlet
  hourTimestamp: Date; // Rounded to top of hour (e.g. 2026-10-22T08:00:00Z)
  avgWatts: number;
  maxWatts: number;
  minWatts: number;
  totalKwh: number;
  estimatedCost: number;
  samplesCount: number;
}

const MetricHourlySchema = new Schema<IMetricHourly>(
  {
    stripId: {
      type: Schema.Types.ObjectId,
      ref: "Plug",
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: false,
      index: true,
    },
    outletNumber: {
      type: Number,
      required: true,
      min: 0,
      max: 4,
    },
    hourTimestamp: {
      type: Date,
      required: true,
    },
    avgWatts: {
      type: Number,
      default: 0,
    },
    maxWatts: {
      type: Number,
      default: 0,
    },
    minWatts: {
      type: Number,
      default: 0,
    },
    totalKwh: {
      type: Number,
      default: 0,
    },
    estimatedCost: {
      type: Number,
      default: 0,
    },
    samplesCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Retention: 90 days TTL
MetricHourlySchema.index({ hourTimestamp: 1 }, { expireAfterSeconds: 90 * 24 * 3600 });

// Compound unique index for atomic hourly rollup
MetricHourlySchema.index(
  { stripId: 1, outletNumber: 1, hourTimestamp: 1 },
  { unique: true }
);
MetricHourlySchema.index({ userId: 1, hourTimestamp: -1 });

export default mongoose.model<IMetricHourly>("MetricHourly", MetricHourlySchema);
