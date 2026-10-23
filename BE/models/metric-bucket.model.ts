import mongoose, { Schema, Document } from "mongoose";

export interface IMetricBucket extends Document {
  stripId: mongoose.Types.ObjectId;
  outletNumber: number; // 0 for total strip, 1..4 for individual outlets
  timestamp: Date; // 5-minute bucket floor
  count: number;
  sumWatts: number;
  avgWatts: number;
  maxWatts: number;
  minWatts: number;
  energyKwhEnd: number;
  deltaKwh: number;
  voltageAvg: number;
}

const MetricBucketSchema = new Schema<IMetricBucket>(
  {
    stripId: {
      type: Schema.Types.ObjectId,
      ref: "Plug",
      required: true,
      index: true,
    },
    outletNumber: {
      type: Number,
      required: true,
      min: 0,
      max: 4,
    },
    timestamp: {
      type: Date,
      required: true,
    },
    count: {
      type: Number,
      default: 1,
    },
    sumWatts: {
      type: Number,
      default: 0,
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
    energyKwhEnd: {
      type: Number,
      default: 0,
    },
    deltaKwh: {
      type: Number,
      default: 0,
    },
    voltageAvg: {
      type: Number,
      default: 220,
    },
  },
  {
    timestamps: false,
    versionKey: false,
  }
);

// TTL index to automatically purge high-resolution documents after 7 days
MetricBucketSchema.index({ timestamp: 1 }, { expireAfterSeconds: 7 * 24 * 3600 });

// Compound unique index for atomic upserts per strip + outlet + 5-min bucket
MetricBucketSchema.index(
  { stripId: 1, outletNumber: 1, timestamp: 1 },
  { unique: true }
);

export default mongoose.model<IMetricBucket>("MetricBucket", MetricBucketSchema);
