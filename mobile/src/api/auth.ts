import { useMutation } from "@tanstack/react-query";
import { LoginPayload, LoginResponse, User } from "@/types/user";
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
 * TanStack Query mutation hook for user login
 */
export const useLoginMutation = () => {
  const mutation = useMutation<LoginResponse, Error, LoginPayload>({
    mutationFn: loginUser,
  });

  return mutation;
};
