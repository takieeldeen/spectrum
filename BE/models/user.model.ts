import mongoose, { Schema } from "mongoose";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { IUser } from "../types/user.type";

const UserSchema: Schema<IUser> = new Schema(
  {
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
      match: [/^\S+@\S+\.\S+$/, "Please provide a valid email address"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters long"],
      select: false,
    },
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    imageUrl: {
      type: String,
      required: false,
      default: null,
    },
    phoneNumber: {
      type: String,
      required: false,
      trim: true,
      default: null,
    },
    status: {
      type: String,
      enum: {
        values: ["ACTIVE", "INACTIVE", "PENDING", "SUSPENDED"],
        message: "{VALUE} is not a valid status",
      },
      default: "PENDING",
    },
    language: {
      type: String,
      enum: {
        values: ["ar", "en"],
        message: "{VALUE} is not a valid language",
      },
      default: "ar",
    },
    theme: {
      type: String,
      enum: {
        values: ["dark", "light", "system"],
        message: "{VALUE} is not a valid theme",
      },
      default: "dark",
    },
    lastPasswordChange: {
      type: Date,
      required: false,
    },
    activationToken: {
      type: String,
      required: false,
      select: false,
    },
    activationTokenExpiration: {
      type: Date,
      required: false,
    },
    lastLogin: {
      type: Date,
      required: false,
    },
    kwhCost: {
      type: Number,
      required: false,
      default: 0.7,
    },
    monthlyBudget: {
      type: Number,
      required: false,
      default: 300,
    },
    overBudgetAlertEnabled: {
      type: Boolean,
      required: false,
      default: true,
    },
    budgetAlertPercent: {
      type: Number,
      required: false,
      default: 80,
    },
    powerUnit: {
      type: String,
      enum: {
        values: ["W", "kW"],
        message: "{VALUE} is not a valid power unit",
      },
      default: "W",
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret: Record<string, any>) {
        delete ret.password;
        delete ret.activationToken;
        delete ret.__v;
        return ret;
      },
    },
  },
);

// Pre-save hook to hash password before saving
UserSchema.pre<IUser>("save", async function () {
  if (!this.isModified("password")) {
    return;
  }

  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);

  if (!this.isNew) {
    this.lastPasswordChange = new Date();
  }
});

// Compare candidate password with hashed password
UserSchema.methods.comparePassword = async function (
  candidatePassword: string,
): Promise<boolean> {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Recreates activationToken with new expiration if user is INACTIVE
UserSchema.methods.resendInvitation = function (): string {
  if (this.status !== "INACTIVE") {
    throw new Error("User is not in INACTIVE status");
  }

  const token = crypto.randomBytes(32).toString("hex");
  this.activationToken = token;
  this.activationTokenExpiration = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now
  return token;
};

export default mongoose.model<IUser>("User", UserSchema);
