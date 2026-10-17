export type UserStatus = "ACTIVE" | "INACTIVE" | "PENDING" | "SUSPENDED";

export type UserLanguage = "ar" | "en";

export type UserTheme = "dark" | "light";

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

export interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string, user: User) => Promise<void> | void;
  logout: () => Promise<void> | void;
  updateUser: (user: Partial<User>) => void;
}
