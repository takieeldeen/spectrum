import mongoose, { Schema } from "mongoose";
import crypto from "crypto";
import { IWifi } from "../types/wifi.type";

const ALGORITHM = "aes-256-cbc";
const SECRET =
  process.env.WIFI_ENCRYPTION_KEY ||
  process.env.JWT_SECRET ||
  "spectrum-wifi-secret-key-salt-32";
const ENCRYPTION_KEY = crypto.scryptSync(SECRET, "salt", 32);
const IV_LENGTH = 16;

export function encryptPassword(text: string): string {
  if (!text) return text;
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  return `${iv.toString("hex")}:${encrypted}`;
}

export function decryptPassword(encryptedText: string): string {
  if (!encryptedText) return encryptedText;
  try {
    const [ivHex, encrypted] = encryptedText.split(":");
    if (!ivHex || !encrypted) return encryptedText;
    const iv = Buffer.from(ivHex, "hex");
    const decipher = crypto.createDecipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
    let decrypted = decipher.update(encrypted, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  } catch (err) {
    return encryptedText;
  }
}

const WifiSchema: Schema<IWifi> = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    ssid: {
      type: String,
      required: [true, "SSID is required"],
      trim: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      select: false,
    },
  },
  {
    timestamps: true,
  }
);

// Encrypt password before saving if modified
WifiSchema.pre<IWifi>("save", async function () {
  if (this.isModified("password") && this.password) {
    this.password = encryptPassword(this.password);
  }
});

// Compound index so a user doesn't have duplicate SSIDs
WifiSchema.index({ user: 1, ssid: 1 }, { unique: true });

export const WifiModel = mongoose.model<IWifi>("Wifi", WifiSchema);

// Register alias SSID model for consistency
export const SSIDModel = mongoose.models.SSID || mongoose.model<IWifi>("SSID", WifiSchema);

export default WifiModel;
