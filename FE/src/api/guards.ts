import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { IGuard } from 'src/types/guard';
import axiosInstance from 'src/utils/axios';

export type GetGuardsParams = string | { deviceId?: string } | undefined;

/**
 * Hook to fetch the list of guards.
 * Can be called with:
 * - deviceId as string: usegetlist(deviceId) -> fetches /guards/device/:deviceId
 * - params object: usegetlist({ deviceId }) -> fetches /guards/device/:deviceId
 * - no args: usegetlist() -> fetches all /guards
 */
export const useGetGuards = (params?: GetGuardsParams) => {
  const deviceId = typeof params === 'string' ? params : params?.deviceId;

  return useQuery<IGuard[]>({
    retry: false,
    queryKey: deviceId ? ['guards', deviceId] : ['guards'],
    queryFn: async () => {
      const url = deviceId ? `/guards/device/${deviceId}` : '/guards';
      const response = await axiosInstance.get(url);
      return response.data?.data || [];
    },
    enabled: typeof params === 'string' ? !!params : true,
  });
};

/**
 * Hook to fetch a single guard by ID
 */
export const useGetGuardGuard = (guardId: string) => {
  return useQuery<IGuard>({
    retry: false,
    queryKey: ['guard', guardId],
    queryFn: async () => {
      const response = await axiosInstance.get(`/guards/${guardId}`);
      return response.data?.data;
    },
    enabled: !!guardId,
  });
};

/**
 * Hook to create a new guard
 */
export const useCreateGuard = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Partial<IGuard> & Record<string, any>) => {
      const response = await axiosInstance.post('/guards', data);
      return response.data?.data || response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['guards'] });
      if (variables?.deviceId) {
        queryClient.invalidateQueries({ queryKey: ['guards', variables.deviceId] });
      }
    },
  });
};

export const useCreate = useCreateGuard;

/**
 * Hook to update an existing guard
 */
export const useUpdateGuard = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: Partial<IGuard> & Record<string, any>;
    }) => {
      const response = await axiosInstance.patch(`/guards/${id}`, data);
      return response.data?.data || response.data;
    },
    onSuccess: (result, variables) => {
      queryClient.invalidateQueries({ queryKey: ['guards'] });
      if (variables?.data?.deviceId) {
        queryClient.invalidateQueries({ queryKey: ['guards', variables.data.deviceId] });
      }
      if (result?.deviceId) {
        queryClient.invalidateQueries({ queryKey: ['guards', result.deviceId] });
      }
      if (variables?.id) {
        queryClient.invalidateQueries({ queryKey: ['guard', variables.id] });
      }
    },
  });
};

export const useUpdate = useUpdateGuard;

/**
 * Hook to delete a guard
 */
export const useDeleteGuard = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await axiosInstance.delete(`/guards/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['guards'] });
    },
  });
};

export const useDelete = useDeleteGuard;
export const useGetGuard = useGetGuardGuard;

export type ToggleGuardParams =
  | string
  | {
      id: string;
      isEnabled?: boolean;
    };

/**
 * Hook to toggle guard state with optimistic update
 */
export const useToggleGuard = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (arg: ToggleGuardParams) => {
      const id = typeof arg === 'string' ? arg : arg.id;
      const isEnabled = typeof arg === 'object' ? arg.isEnabled : undefined;
      const response = await axiosInstance.patch(`/guards/${id}/toggle`, { isEnabled });
      return response.data?.data || response.data;
    },
    onMutate: async (arg: ToggleGuardParams) => {
      const id = typeof arg === 'string' ? arg : arg.id;
      const explicitIsEnabled = typeof arg === 'object' ? arg.isEnabled : undefined;

      // Cancel any outgoing refetches so they don't overwrite optimistic update
      await queryClient.cancelQueries({ queryKey: ['guards'] });

      // Snapshot previous query data for rollback
      const previousQueries = queryClient.getQueriesData<IGuard[]>({ queryKey: ['guards'] });

      // Optimistically update all guard queries containing this guard
      queryClient.setQueriesData<IGuard[]>({ queryKey: ['guards'] }, (old) => {
        if (!old || !Array.isArray(old)) return old;
        return old.map((guard) => {
          if (guard._id === id) {
            return {
              ...guard,
              isEnabled: explicitIsEnabled !== undefined ? explicitIsEnabled : !guard.isEnabled,
            };
          }
          return guard;
        });
      });

      return { previousQueries };
    },
    onError: (_err, _arg, context) => {
      // Rollback to snapshot on error
      if (context?.previousQueries) {
        context.previousQueries.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['guards'] });
    },
  });
};

export const useToggle = useToggleGuard;
