import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { IPlug } from 'src/types/plug';
import axiosInstance from 'src/utils/axios';

export const useCreatePlug = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: any) => {
      const response = await axiosInstance.post('/plugs', data);
      return response.data;
    },
    onSuccess: () => {
      // Invalidate the 'plugs' query to trigger a refetch
      queryClient.invalidateQueries({ queryKey: ['plugs'] });
    },
  });
};

export const useGetPlugs = () => {
  return useQuery<IPlug[]>({
    queryKey: ['plugs'],
    queryFn: async () => {
      const response = await axiosInstance.get('/plugs');
      return response.data?.data || [];
    },
  });
};

export const useGetPlug = (plugId: string) => {
  return useQuery<IPlug>({
    queryKey: ['plug', plugId],
    queryFn: async () => {
      const response = await axiosInstance.get(`/plugs/${plugId}`);
      return response.data?.data;
    },
    enabled: !!plugId,
  });
};

export const useUpdatePlug = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await axiosInstance.put(`/plugs/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plugs'] });
      queryClient.invalidateQueries({ queryKey: ['plug'] });
    },
  });
};

export const useDeletePlug = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await axiosInstance.delete(`/plugs/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plugs'] });
    },
  });
};
