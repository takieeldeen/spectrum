import { useQuery } from "@tanstack/react-query";
import { IDevice } from "@/types/device";
import { API_BASE_URL } from "@/constants/api";
import { getAuthSession } from "@/utils/storage";

/**
 * Fetches unassigned devices from the same backend endpoint used in Next.js project (/devices/unassigned)
 */
export const useGetUnassignedDevices = (plugId?: string) => {
  return useQuery<IDevice[]>({
    retry: false,
    queryKey: ["devices", "unassigned", plugId],
    queryFn: async () => {
      const session = await getAuthSession();
      const token = session?.token;
      const url = plugId
        ? `${API_BASE_URL}/devices/unassigned?plugId=${plugId}`
        : `${API_BASE_URL}/devices/unassigned`;

      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to fetch unassigned devices");
      }

      return data.data || [];
    },
  });
};

/**
 * Fetches all devices for the current user (/devices)
 */
export const useGetDevices = () => {
  return useQuery<IDevice[]>({
    retry: false,
    queryKey: ["devices"],
    queryFn: async () => {
      const session = await getAuthSession();
      const token = session?.token;

      const response = await fetch(`${API_BASE_URL}/devices`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to fetch devices");
      }

      return data.data || [];
    },
  });
};
