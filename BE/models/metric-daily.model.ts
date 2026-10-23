import mongoose, { Schema, Document } from "mongoose";

export interface IMetricDaily extends Document {
  stripId: mongoose.Types.ObjectId;
  userId?: mongoose.Types.ObjectId;
  outletNumber: number; // 0 = total strip, 1..4 = outlet
  date: string; // "YYYY-MM-DD"
  dateTimestamp: Date; // Start of day UTC/local
  totalKwh: number;
  avgWatts: number;
  peakWatts: number;
  peakHour: number; // 0..23
  estimatedCost: number;
}

const MetricDailySchema = new Schema<IMetricDaily>(
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
    date: {
      type: String,
      required: true,
      index: true,
    },
    dateTimestamp: {
      type: Date,
      required: true,
    },
    totalKwh: {
      type: Number,
      default: 0,
    },
    avgWatts: {
      type: Number,
      default: 0,
    },
    peakWatts: {
      type: Number,
      default: 0,
    },
    peakHour: {
      type: Number,
      default: 0,
    },
    estimatedCost: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

MetricDailySchema.index(
  { stripId: 1, outletNumber: 1, date: 1 },
  { unique: true }
);
MetricDailySchema.index({ userId: 1, dateTimestamp: -1 });

export default mongoose.model<IMetricDaily>("MetricDaily", MetricDailySchema);
