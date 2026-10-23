import { useQuery } from "@tanstack/react-query";
import { IDevice } from "@/types/device";
import api from "./axios";

/**
 * Fetches unassigned devices from the backend endpoint (/devices/unassigned)
 */
export const useGetUnassignedDevices = (plugId?: string) => {
  return useQuery<IDevice[]>({
    retry: false,
    queryKey: ["devices", "unassigned", plugId],
    queryFn: async () => {
      const { data } = await api.get<{
        success: boolean;
        data: IDevice[];
      }>("/devices/unassigned", {
        params: plugId ? { plugId } : undefined,
      });

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
      const { data } = await api.get<{
        success: boolean;
        data: IDevice[];
      }>("/devices");

      return data.data || [];
    },
  });
};
