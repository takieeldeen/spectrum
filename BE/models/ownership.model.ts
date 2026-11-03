import mongoose, { Schema } from "mongoose";
import { IOwnership } from "../types/ownership.type";

const OwnershipSchema: Schema<IOwnership> = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User reference is required"],
      index: true,
    },
    plug: {
      type: Schema.Types.ObjectId,
      ref: "Plug",
      required: [true, "Plug reference is required"],
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound unique index: a user can only have one ownership record per plug
OwnershipSchema.index({ user: 1, plug: 1 }, { unique: true });

export const OwnershipModel =
  mongoose.models.Ownership ||
  mongoose.model<IOwnership>("Ownership", OwnershipSchema);

export default OwnershipModel;
