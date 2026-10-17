import { useMutation } from "@tanstack/react-query";
import { LoginPayload, LoginResponse, User } from "@/types/user";
import { API_BASE_URL } from "@/constants/api";

/**
 * Sends login credentials to the backend API
 */
export async function loginUser(payload: LoginPayload): Promise<LoginResponse> {
  console.log(API_BASE_URL);
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(
      data.message || "Failed to log in. Please check your credentials.",
    );
  }

  return data;
}

/**
 * Fetches authenticated user profile from backend using Bearer token
 */
export async function getMe(token: string): Promise<User> {
  const response = await fetch(`${API_BASE_URL}/auth/me`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data.message || "Failed to fetch user profile.");
  }

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

export const useLogin = useLoginMutation;
