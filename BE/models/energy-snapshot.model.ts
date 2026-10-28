import mongoose, { Schema, Document } from "mongoose";

/**
 * EnergySnapshot: One document per (stripId, outletNumber, slotStart).
 *
 * Design:
 *  - slotType "hour" → slotStart = top-of-hour UTC. Max 24 per (strip, outlet).
 *  - slotType "day"  → slotStart = start-of-day UTC.  Max 30 per (strip, outlet).
 *
 * kwhAtSlotStart = cumulative energy_kwh the device reported at slotStart.
 * kwhLatest      = last cumulative energy_kwh reading seen in this slot.
 * deltaKwh       = kwhLatest - kwhAtSlotStart  (consumption in this slot so far).
 *
 * maxWatts / sumWatts / samplesCount let us compute avgWatts for the slot.
 */
export interface IEnergySnapshot extends Document {
  stripId: mongoose.Types.ObjectId;
  outletNumber: number; // 0 = whole strip, 1–4 = individual outlet
  slotType: "hour" | "day";
  slotStart: Date; // UTC top-of-hour or start-of-day
  kwhAtSlotStart: number; // Cumulative kWh the device reported at slot boundary
  kwhLatest: number; // Latest cumulative kWh reading in this slot
  deltaKwh: number; // kwhLatest - kwhAtSlotStart (may be 0 on counter reset)
  maxWatts: number;
  sumWatts: number;
  samplesCount: number;
  voltageSum: number;
}

const EnergySnapshotSchema = new Schema<IEnergySnapshot>(
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
    slotType: {
      type: String,
      enum: ["hour", "day"],
      required: true,
      index: true,
    },
    slotStart: {
      type: Date,
      required: true,
    },
    kwhAtSlotStart: {
      type: Number,
      default: 0,
    },
    kwhLatest: {
      type: Number,
      default: 0,
    },
    deltaKwh: {
      type: Number,
      default: 0,
    },
    maxWatts: {
      type: Number,
      default: 0,
    },
    sumWatts: {
      type: Number,
      default: 0,
    },
    samplesCount: {
      type: Number,
      default: 0,
    },
    voltageSum: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Unique compound index: one doc per (strip, outlet, slotType, slotStart)
EnergySnapshotSchema.index(
  { stripId: 1, outletNumber: 1, slotType: 1, slotStart: 1 },
  { unique: true }
);

// Fast queries by (strip, slotType, slotStart desc)
EnergySnapshotSchema.index({ stripId: 1, slotType: 1, slotStart: -1 });

export default mongoose.model<IEnergySnapshot>(
  "EnergySnapshot",
  EnergySnapshotSchema
);
