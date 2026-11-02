export type UserStatus = "ACTIVE" | "INACTIVE" | "PENDING" | "SUSPENDED";

export type UserLanguage = "ar" | "en";

export type UserTheme = "dark" | "light" | "system";

export interface User {
  _id: string;
  email: string;
  name: string;
  imageUrl?: string | null;
  phoneNumber?: string | null;
  status: UserStatus;
  language: UserLanguage;
  theme: UserTheme;
  lastLogin?: string | null;
  kwhCost?: number;
  monthlyBudget?: number;
  overBudgetAlertEnabled?: boolean;
  budgetAlertPercent?: number;
  powerUnit?: "W" | "kW";
  createdAt?: string;
  updatedAt?: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  data: {
    accessToken: string;
    user: User;
  };
}

export interface UpdateProfilePayload {
  name?: string;
  email?: string;
  phoneNumber?: string | null;
  imageUrl?: string | null;
  language?: UserLanguage;
  theme?: UserTheme;
  kwhCost?: number;
  monthlyBudget?: number;
  overBudgetAlertEnabled?: boolean;
  budgetAlertPercent?: number;
  powerUnit?: "W" | "kW";
}

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
  confirmPassword?: string;
}

export interface UploadAvatarResponse {
  success: boolean;
  message: string;
  data: {
    imageUrl: string;
  };
}

export interface ForgetPasswordPayload {
  email: string;
}

export interface ForgetPasswordResponse {
  success: boolean;
  message: string;
}

export interface SendOTPPayload {
  email: string;
}

export interface SendOTPResponse {
  success: boolean;
  message: string;
}

export interface CheckOTPPayload {
  email: string;
  otp: string;
}

export interface CheckOTPResponse {
  success: boolean;
  message: string;
}

export interface ResetPasswordPayload {
  email: string;
  otp: string;
  newPassword?: string;
  password?: string;
  passwordConfirmation?: string;
  confirmPassword?: string;
}

export interface ResetPasswordResponse {
  success: boolean;
  message: string;
}

export interface RegisterPayload {
  email: string;
  name: string;
  phoneNumber?: string;
  password: string;
  passwordConfirmation: string;
}

export interface RegisterResponse {
  success: boolean;
  message: string;
  data?: {
    user: User;
  };
}

export interface ActivateWithCodePayload {
  email: string;
  code: string;
}

export interface ActivateWithTokenPayload {
  token: string;
}

export interface ActivateAccountResponse {
  success: boolean;
  message: string;
  data: {
    accessToken: string;
    user: User;
  };
}

export interface ResendActivationPayload {
  email: string;
}

export interface ResendActivationResponse {
  success: boolean;
  message: string;
}

export interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string, user: User) => Promise<void> | void;
  logout: () => Promise<void> | void;
  updateUser: (user: Partial<User>) => void;
}
