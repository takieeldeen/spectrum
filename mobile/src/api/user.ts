import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Platform } from "react-native";
import {
  User,
  UpdateProfilePayload,
  ChangePasswordPayload,
  UploadAvatarResponse,
} from "@/types/user";
import api from "./axios";

/**
 * Updates profile information for the authenticated user
 */
export async function updateProfile(payload: UpdateProfilePayload): Promise<User> {
  const { data } = await api.patch<{ success: boolean; message: string; data: User }>(
    "/auth/profile",
    payload
  );
  return data.data;
}

/**
 * Changes password for the authenticated user
 */
export async function changePassword(
  payload: Pick<ChangePasswordPayload, "currentPassword" | "newPassword">
): Promise<{ success: boolean; message: string }> {
  const { data } = await api.post<{ success: boolean; message: string }>(
    "/auth/change-password",
    payload
  );
  return data;
}

/**
 * Uploads user profile picture (avatar) to S3 via backend endpoint
 */
export async function uploadAvatar(
  imageUri: string,
  base64?: string | null,
  userId?: string
): Promise<string> {
  if (base64) {
    const { data } = await api.post<UploadAvatarResponse>("/auth/avatar", {
      image: base64.startsWith("data:") ? base64 : `data:image/jpeg;base64,${base64}`,
    });
    return data.data.imageUrl;
  }

  const formData = new FormData();
  const extMatch = imageUri.split(".").pop()?.toLowerCase();
  const ext =
    extMatch && ["jpg", "jpeg", "png", "webp"].includes(extMatch)
      ? extMatch === "jpeg"
        ? "jpg"
        : extMatch
      : "jpg";
  const filename = userId ? `avatar-${userId}.${ext}` : `avatar.${ext}`;
  const type = `image/${ext === "jpg" ? "jpeg" : ext}`;

  formData.append("file", {
    uri: Platform.OS === "android" ? imageUri : imageUri.replace("file://", ""),
    name: filename,
    type,
  } as any);

  const { data } = await api.post<UploadAvatarResponse>("/auth/avatar", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return data.data.imageUrl;
}

/**
 * TanStack Query mutation hook for updating user profile
 */
export const useUpdateProfileMutation = () => {
  const queryClient = useQueryClient();

  return useMutation<User, Error, UpdateProfilePayload>({
    mutationFn: updateProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user", "me"] });
    },
  });
};

/**
 * TanStack Query mutation hook for changing password
 */
export const useChangePasswordMutation = () => {
  return useMutation<{ success: boolean; message: string }, Error, Pick<ChangePasswordPayload, "currentPassword" | "newPassword">>({
    mutationFn: changePassword,
  });
};

/**
 * TanStack Query mutation hook for uploading profile picture
 */
export const useUploadAvatarMutation = () => {
  return useMutation<string, Error, { imageUri: string; base64?: string | null; userId?: string }>({
    mutationFn: ({ imageUri, base64, userId }) => uploadAvatar(imageUri, base64, userId),
  });
};
