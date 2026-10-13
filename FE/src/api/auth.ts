import { useMutation } from '@tanstack/react-query';
import axiosInstance from 'src/utils/axios';

export interface SignUpPayload {
  name: string;
  email: string;
  password: string;
  passwordConfirmation: string;
  language?: string;
  theme?: string;
  phoneNumber?: string;
  imageUrl?: string;
}

export interface SignUpResponse {
  success: boolean;
  message: string;
  data: any;
}

export interface ActivateAccountPayload {
  token: string;
}

export interface ActivateAccountResponse {
  success: boolean;
  message: string;
  data: {
    _id: string;
    email: string;
    name: string;
    status: string;
    language: string;
    theme: string;
    [key: string]: any;
  };
}

/**
 * React Query mutation hook for user signup
 */
export const useSignUpMutation = () => {
  return useMutation<SignUpResponse, any, SignUpPayload>({
    mutationFn: async (payload: SignUpPayload) => {
      const response = await axiosInstance.post('/auth/signup', payload);
      return response.data;
    },
  });
};

export const useSignUp = useSignUpMutation;

/**
 * React Query mutation hook for account activation
 */
export const useActivateAccountMutation = () => {
  return useMutation<ActivateAccountResponse, any, ActivateAccountPayload | string>({
    mutationFn: async (payload: ActivateAccountPayload | string) => {
      const token = typeof payload === 'string' ? payload : payload.token;
      const response = await axiosInstance.post('/auth/activate', { token });
      return response.data;
    },
  });
};

export const useActivateAccount = useActivateAccountMutation;

export interface ResendInvitationPayload {
  email?: string;
  token?: string;
  identifier?: string;
}

export interface ResendInvitationResponse {
  success: boolean;
  message: string;
  data: any;
}

/**
 * React Query mutation hook for resending activation invitation
 */
export const useResendInvitationMutation = () => {
  return useMutation<ResendInvitationResponse, any, ResendInvitationPayload | string>({
    mutationFn: async (payload: ResendInvitationPayload | string) => {
      const body =
        typeof payload === 'string'
          ? (payload.includes('@') ? { email: payload } : { token: payload, identifier: payload })
          : payload;
      const response = await axiosInstance.post('/auth/resend-invitation', body);
      return response.data;
    },
  });
};

export const useResendInvitation = useResendInvitationMutation;

export interface LoginPayload {
  email: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  data: {
    accessToken: string;
    user: {
      _id: string;
      email: string;
      name: string;
      status: string;
      [key: string]: any;
    };
  };
}

/**
 * React Query mutation hook for user login
 */
export const useLoginMutation = () => {
  return useMutation<LoginResponse, any, LoginPayload>({
    mutationFn: async (payload: LoginPayload) => {
      const response = await axiosInstance.post('/auth/login', payload);
      return response.data;
    },
  });
};

export const useLogin = useLoginMutation;

export interface UpdateProfilePayload {
  name?: string;
  phoneNumber?: string;
  language?: string;
  theme?: string;
  imageUrl?: string;
}

export const useUpdateProfileMutation = () => {
  return useMutation({
    mutationFn: async (payload: UpdateProfilePayload) => {
      const response = await axiosInstance.patch('/auth/profile', payload);
      return response.data;
    },
  });
};

export const useUpdateProfile = useUpdateProfileMutation;

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
}

export const useChangePasswordMutation = () => {
  return useMutation({
    mutationFn: async (payload: ChangePasswordPayload) => {
      const response = await axiosInstance.post('/auth/change-password', payload);
      return response.data;
    },
  });
};

export const useChangePassword = useChangePasswordMutation;
