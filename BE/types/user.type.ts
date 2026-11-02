import { Document, Types } from 'mongoose';

export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'PENDING' | 'SUSPENDED';

export type UserLanguage = 'ar' | 'en';

export type UserTheme = 'dark' | 'light' | 'system';

export interface IUser extends Document {
  _id: Types.ObjectId;
  email: string;
  password: string;
  name: string;
  imageUrl?: string | null;
  phoneNumber?: string | null;
  status: UserStatus;
  language: UserLanguage;
  theme: UserTheme;
  lastPasswordChange?: Date | null;
  activationToken?: string | null;
  activationCode?: string | null;
  activationTokenExpiration?: Date | null;
  lastLogin?: Date | null;
  kwhCost?: number;
  monthlyBudget?: number;
  overBudgetAlertEnabled?: boolean;
  budgetAlertPercent?: number;
  powerUnit?: 'W' | 'kW';
  createdAt?: Date;
  updatedAt?: Date;
  OTP?: string | null;
  OTPExpiration?: Date | null;
  OTPChecked?: boolean;
  comparePassword(candidatePassword: string): Promise<boolean>;
  resendInvitation(): { token: string; code: string };
}
