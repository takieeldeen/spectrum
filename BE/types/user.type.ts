import { Document, Types } from 'mongoose';

export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'PENDING' | 'SUSPENDED';

export type UserLanguage = 'ar' | 'en';

export type UserTheme = 'dark' | 'light';

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
  activationTokenExpiration?: Date | null;
  lastLogin?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
  resendInvitation(): string;
}
