import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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

/**
 * Creates a new device
 */
export const useCreateDevice = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      name: string;
      plugId?: string | null;
      plugPort?: number | null;
    }) => {
      const response = await api.post<{
        success: boolean;
        data: IDevice;
      }>("/devices", data);
      return response.data?.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["devices"] });
      queryClient.invalidateQueries({ queryKey: ["plugs"] });
    },
  });
};

/**
 * Updates an existing device by ID
 */
export const useUpdateDevice = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: {
        name: string;
        plugId?: string | null;
        plugPort?: number | null;
      };
    }) => {
      const response = await api.put<{
        success: boolean;
        data: IDevice;
      }>(`/devices/${id}`, data);
      return response.data?.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["devices"] });
      queryClient.invalidateQueries({ queryKey: ["plugs"] });
    },
  });
};

/**
 * Deletes a device by ID
 */
export const useDeleteDevice = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.delete<{
        success: boolean;
        message: string;
      }>(`/devices/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["devices"] });
    },
  });
};

/**
 * Fetches a single device by ID (/devices/:id)
 */
export const useGetDevice = (id?: string) => {
  return useQuery<IDevice | null>({
    enabled: !!id,
    queryKey: ["device", id],
    queryFn: async () => {
      const { data } = await api.get<{
        success: boolean;
        data: IDevice;
      }>(`/devices/${id}`);
      return data.data ?? null;
    },
  });
};

/**
 * Toggles a device outlet ON or OFF
 */
export const useToggleDevice = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      state,
    }: {
      id: string;
      state: "on" | "off";
    }) => {
      const response = await api.post<{
        success: boolean;
        data: IDevice;
      }>(`/devices/${id}/toggle`, { state });
      return response.data?.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["device", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["devices"] });
      queryClient.invalidateQueries({ queryKey: ["plugs"] });
    },
  });
};

/**
 * Sets a sleep timer on a device
 */
export const useSetDeviceTimer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      durationMins,
    }: {
      id: string;
      durationMins: number;
    }) => {
      const response = await api.post<{
        success: boolean;
        data: IDevice;
      }>(`/devices/${id}/timer`, { durationMins });
      return response.data?.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["device", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["devices"] });
    },
  });
};

/**
 * Cancels the active sleep timer on a device
 */
export const useCancelDeviceTimer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.delete<{
        success: boolean;
        data: IDevice;
      }>(`/devices/${id}/timer`);
      return response.data?.data;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["device", id] });
      queryClient.invalidateQueries({ queryKey: ["devices"] });
    },
  });
};

