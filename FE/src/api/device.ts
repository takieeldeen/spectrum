import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { IDevice } from 'src/types/device';
import axiosInstance from 'src/utils/axios';

export const useCreateDevice = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: any) => {
      const response = await axiosInstance.post('/devices', {
        nameEn: data.name,
        nameAr: data.arabicName,
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
