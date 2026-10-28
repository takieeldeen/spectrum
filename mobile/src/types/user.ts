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

export interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string, user: User) => Promise<void> | void;
  logout: () => Promise<void> | void;
  updateUser: (user: Partial<User>) => void;
}
