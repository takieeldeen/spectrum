import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { IDevice } from 'src/types/device';
import axiosInstance from 'src/utils/axios';

export const useCreateDevice = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: any) => {
      const response = await axiosInstance.post('/devices', {
        name: data.name,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['devices'] });
    },
  });
};

export const useGetDevices = () => {
  return useQuery<IDevice[]>({
    retry: false,
    queryKey: ['devices'],
    queryFn: async () => {
      const response = await axiosInstance.get('/devices');
      return response.data?.data || [];
    },
  });
};

export const useGetUnassignedDevices = (plugId?: string) => {
  return useQuery<IDevice[]>({
    retry: false,
    queryKey: ['devices', 'unassigned', plugId],
    queryFn: async () => {
      const url = plugId ? `/devices/unassigned?plugId=${plugId}` : '/devices/unassigned';
      const response = await axiosInstance.get(url);
      return response.data?.data || [];
    },
  });
};

export const useGetDevice = (id: string) => {
  return useQuery<any>({
    retry: false,
    queryKey: ['devices', id],
    queryFn: async () => {
      if (!id) return null;
      const response = await axiosInstance.get(`/devices/${id}`);
      return response.data?.data || null;
    },
    enabled: !!id,
  });
};

export const useDeleteDevice = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await axiosInstance.delete(`/devices/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['devices'] });
    },
  });
};

export const useToggleDevice = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, state }: { id: string; state: 'on' | 'off' }) => {
      const response = await axiosInstance.post(`/devices/${id}/toggle`, { state });
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['devices'] });
      queryClient.invalidateQueries({ queryKey: ['devices', variables.id] });
    },
  });
};

export const useSetDeviceTimer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, durationMins }: { id: string; durationMins: number }) => {
      const response = await axiosInstance.post(`/devices/${id}/timer`, { durationMins });
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['devices'] });
      queryClient.invalidateQueries({ queryKey: ['devices', variables.id] });
    },
  });
};

export const useCancelDeviceTimer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await axiosInstance.delete(`/devices/${id}/timer`);
      return response.data;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['devices'] });
      queryClient.invalidateQueries({ queryKey: ['devices', id] });
    },
  });
};

