import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { IGuard } from "@/types/guard";
import api from "./axios";

export type GetGuardsParams = string | { deviceId?: string } | undefined;

/**
 * Hook to fetch guards for a device or all guards
 */
export const useGetGuards = (params?: GetGuardsParams) => {
  const deviceId = typeof params === "string" ? params : params?.deviceId;

  return useQuery<IGuard[]>({
    retry: false,
    queryKey: deviceId ? ["guards", deviceId] : ["guards"],
    queryFn: async () => {
      const url = deviceId ? `/guards/device/${deviceId}` : "/guards";
      const response = await api.get<{
        success: boolean;
        data: IGuard[];
      }>(url);
      return response.data?.data || [];
    },
    enabled: typeof params === "string" ? !!params : true,
  });
};

/**
 * Hook to create a new guard
 */
export const useCreateGuard = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Partial<IGuard> & Record<string, any>) => {
      const response = await api.post<{
        success: boolean;
        data: IGuard;
      }>("/guards", data);
      return response.data?.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["guards"] });
      if (variables?.deviceId) {
        queryClient.invalidateQueries({
          queryKey: ["guards", variables.deviceId],
        });
      }
    },
  });
};

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
      const response = await api.patch<{
        success: boolean;
        data: IGuard;
      }>(`/guards/${id}`, data);
      return response.data?.data;
    },
    onSuccess: (result, variables) => {
      queryClient.invalidateQueries({ queryKey: ["guards"] });
      if (variables?.data?.deviceId) {
        queryClient.invalidateQueries({
          queryKey: ["guards", variables.data.deviceId],
        });
      }
      if (result?.deviceId) {
        queryClient.invalidateQueries({
          queryKey: ["guards", result.deviceId],
        });
      }
    },
  });
};

/**
 * Hook to delete a guard
 */
export const useDeleteGuard = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.delete<{
        success: boolean;
        message: string;
      }>(`/guards/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["guards"] });
    },
  });
};

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
      const id = typeof arg === "string" ? arg : arg.id;
      const isEnabled = typeof arg === "object" ? arg.isEnabled : undefined;
      const response = await api.patch<{
        success: boolean;
        data: IGuard;
      }>(`/guards/${id}/toggle`, { isEnabled });
      return response.data?.data;
    },
    onMutate: async (arg: ToggleGuardParams) => {
      const id = typeof arg === "string" ? arg : arg.id;
      const explicitIsEnabled =
        typeof arg === "object" ? arg.isEnabled : undefined;

      await queryClient.cancelQueries({ queryKey: ["guards"] });

      const previousQueries = queryClient.getQueriesData<IGuard[]>({
        queryKey: ["guards"],
      });

      queryClient.setQueriesData<IGuard[]>({ queryKey: ["guards"] }, (old) => {
        if (!old || !Array.isArray(old)) return old;
        return old.map((guard) => {
          if (guard._id === id) {
            return {
              ...guard,
              isEnabled:
                explicitIsEnabled !== undefined
                  ? explicitIsEnabled
                  : !guard.isEnabled,
            };
          }
          return guard;
        });
      });

      return { previousQueries };
    },
    onError: (_err, _arg, context) => {
      if (context?.previousQueries) {
        context.previousQueries.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["guards"] });
    },
  });
};
