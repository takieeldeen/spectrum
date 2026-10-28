import { Document, Types } from "mongoose";

export interface IMetricInput {
  stripId: Types.ObjectId | string;
  outlet1: number;
  outlet2: number;
  outlet3: number;
  outlet4: number;
  hourTimestamp: Date;
  kwh: number;
  cumulativeKwh: number;
  type: "hour" | "day";
}

export interface IMetric extends Document {
  _id: Types.ObjectId;
  stripId: Types.ObjectId;
  outlet1: number;
  outlet2: number;
  outlet3: number;
  outlet4: number;
  hourTimestamp: Date;
  kwh: number;
  cumulativeKwh: number;
  type: "hour" | "day";
  createdAt?: Date;
  updatedAt?: Date;
}

export type MetricPayload = IMetricInput;
export type MetricType = IMetricInput;
