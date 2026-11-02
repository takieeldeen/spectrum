import { useMutation } from "@tanstack/react-query";
import {
  LoginPayload,
  LoginResponse,
  User,
  ForgetPasswordPayload,
  ForgetPasswordResponse,
  SendOTPPayload,
  SendOTPResponse,
  CheckOTPPayload,
  CheckOTPResponse,
  ResetPasswordPayload,
  ResetPasswordResponse,
  RegisterPayload,
  RegisterResponse,
  ActivateWithCodePayload,
  ActivateWithTokenPayload,
  ActivateAccountResponse,
  ResendActivationPayload,
  ResendActivationResponse,
} from "@/types/user";
import api from "./axios";

/**
 * Sends login credentials to the backend API
 */
export async function loginUser(payload: LoginPayload): Promise<LoginResponse> {
  const { data } = await api.post<LoginResponse>("/auth/login", payload);
  return data;
}

/**
 * Fetches authenticated user profile from backend using Bearer token
 */
export async function getMe(token?: string): Promise<User> {
  const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
  const { data } = await api.get<{ success: boolean; data: User }>("/auth/me", {
    headers,
  });
  return data.data;
}

/**
 * Sends forgot password request to the backend API
 */
export async function forgetPassword(
  payload: ForgetPasswordPayload,
): Promise<ForgetPasswordResponse> {
  const { data } = await api.post<ForgetPasswordResponse>(
    "/auth/send-otp",
    payload,
  );
  return data;
}

/**
 * Sends OTP to user email
 */
export async function sendOTP(
  payload: SendOTPPayload,
): Promise<SendOTPResponse> {
  const { data } = await api.post<SendOTPResponse>("/auth/send-otp", payload);
  return data;
}

/**
 * Checks validity and expiration of OTP
 */
export async function checkOTP(
  payload: CheckOTPPayload,
): Promise<CheckOTPResponse> {
  const { data } = await api.post<CheckOTPResponse>("/auth/check-otp", payload);
  return data;
}

/**
 * Resets user password using verified OTP
 */
export async function resetPassword(
  payload: ResetPasswordPayload,
): Promise<ResetPasswordResponse> {
  const { data } = await api.post<ResetPasswordResponse>(
    "/auth/reset-password",
    payload,
  );
  return data;
}

/**
 * Registers a new user account
 */
export async function registerUser(
  payload: RegisterPayload,
): Promise<RegisterResponse> {
  const { data } = await api.post<RegisterResponse>("/auth/signup", payload);
  return data;
}

/**
 * TanStack Query mutation hook for user login
 */
export const useLoginMutation = () => {
  return useMutation<LoginResponse, Error, LoginPayload>({
    mutationFn: loginUser,
  });
};

/**
 * TanStack Query mutation hook for forgot password
 */
export const useForgetPasswordMutation = () => {
  return useMutation<
    ForgetPasswordResponse,
    Error,
    ForgetPasswordPayload
  >({
    mutationFn: forgetPassword,
  });
};

/**
 * TanStack Query mutation hook for send OTP
 */
export const useSendOTPMutation = () => {
  return useMutation<SendOTPResponse, Error, SendOTPPayload>({
    mutationFn: sendOTP,
  });
};

/**
 * TanStack Query mutation hook for check OTP
 */
export const useCheckOTPMutation = () => {
  return useMutation<CheckOTPResponse, Error, CheckOTPPayload>({
    mutationFn: checkOTP,
  });
};

/**
 * TanStack Query mutation hook for reset password
 */
export const useResetPasswordMutation = () => {
  return useMutation<ResetPasswordResponse, Error, ResetPasswordPayload>({
    mutationFn: resetPassword,
  });
};

/**
 * TanStack Query mutation hook for user registration
 */
export const useRegisterMutation = () => {
  return useMutation<RegisterResponse, Error, RegisterPayload>({
    mutationFn: registerUser,
  });
};

/**
 * Activates account using 6-digit verification code
 */
export async function activateAccountWithCode(
  payload: ActivateWithCodePayload,
): Promise<ActivateAccountResponse> {
  const { data } = await api.post<ActivateAccountResponse>(
    "/auth/activate-code",
    payload,
  );
  return data;
}

/**
 * Activates account using deep link token
 */
export async function activateAccountWithToken(
  payload: ActivateWithTokenPayload,
): Promise<ActivateAccountResponse> {
  const { data } = await api.post<ActivateAccountResponse>(
    "/auth/activate",
    payload,
  );
  return data;
}

/**
 * Resends activation invitation email with new token & code
 */
export async function resendActivation(
  payload: ResendActivationPayload,
): Promise<ResendActivationResponse> {
  const { data } = await api.post<ResendActivationResponse>(
    "/auth/resend-invitation",
    payload,
  );
  return data;
}

/**
 * TanStack Query mutation hook for activating account with 6-digit code
 */
export const useActivateWithCodeMutation = () => {
  return useMutation<ActivateAccountResponse, Error, ActivateWithCodePayload>({
    mutationFn: activateAccountWithCode,
  });
};

/**
 * TanStack Query mutation hook for activating account with token
 */
export const useActivateWithTokenMutation = () => {
  return useMutation<ActivateAccountResponse, Error, ActivateWithTokenPayload>({
    mutationFn: activateAccountWithToken,
  });
};

/**
 * TanStack Query mutation hook for resending activation email
 */
export const useResendActivationMutation = () => {
  return useMutation<ResendActivationResponse, Error, ResendActivationPayload>({
    mutationFn: resendActivation,
  });
};
