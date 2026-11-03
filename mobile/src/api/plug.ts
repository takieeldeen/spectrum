import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  IPlug,
  CreatePlugPayload,
  PlugApiResponse,
  PlugListApiResponse,
  PlugVerificationData,
  PlugVerificationResponse,
} from "@/types/plug";
import api from "./axios";

/**
 * Fetches all plugs belonging to the authenticated user
 */
export async function getPlugList(): Promise<IPlug[]> {
  const { data } = await api.get<PlugListApiResponse>("/plugs");
  return data.data || [];
}

/**
 * Creates a new plug entity on the backend
 */
export async function createPlug(payload: CreatePlugPayload): Promise<IPlug> {
  const { data } = await api.post<PlugApiResponse>("/plugs", payload);
  return data.data;
}

/**
 * Fetches a single plug by ID
 */
export async function getPlugById(plugId: string): Promise<IPlug> {
  const { data } = await api.get<PlugApiResponse>(`/plugs/${plugId}`);
  return data.data;
}

/**
 * Updates an existing plug on the backend
 */
export async function updatePlug(
  id: string,
  payload: Partial<CreatePlugPayload>,
): Promise<IPlug> {
  const { data } = await api.put<PlugApiResponse>(`/plugs/${id}`, payload);
  return data.data;
}

/**
 * TanStack Query hook to fetch the list of plugs
 */
export const useGetPlugList = () => {
  return useQuery<IPlug[], Error>({
    queryKey: ["plugs"],
    queryFn: () => getPlugList(),
  });
};

export const useGetPlugs = useGetPlugList;

/**
 * TanStack Query hook to fetch a single plug by ID
 */
export const useGetPlugById = (plugId?: string) => {
  return useQuery<IPlug, Error>({
    queryKey: ["plugs", plugId],
    queryFn: () => getPlugById(plugId!),
    enabled: Boolean(plugId),
  });
};

/**
 * TanStack Query mutation hook to create a new plug
 */
export const useCreatePlug = () => {
  const queryClient = useQueryClient();

  return useMutation<IPlug, Error, CreatePlugPayload>({
    mutationFn: (payload) => createPlug(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["plugs"] });
    },
  });
};

/**
 * TanStack Query mutation hook to update an existing plug
 */
export const useUpdatePlug = () => {
  const queryClient = useQueryClient();

  return useMutation<
    IPlug,
    Error,
    { id: string; payload: Partial<CreatePlugPayload> }
  >({
    mutationFn: ({ id, payload }) => updatePlug(id, payload),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["plugs"] });
      queryClient.invalidateQueries({ queryKey: ["plugs", variables.id] });
    },
  });
};

/**
 * Toggles an outlet on a plug via the cloud backend
 */
export async function togglePlugOutlet(
  plugId: string,
  outlet: number,
  state: "on" | "off",
): Promise<{ success: boolean; message: string }> {
  const { data } = await api.post<{ success: boolean; message: string }>(
    `/plugs/${plugId}/toggle`,
    { outlet, state },
  );
  return data;
}

/**
 * TanStack Query mutation hook to toggle a plug outlet
 */
export const useTogglePlugOutlet = () => {
  const queryClient = useQueryClient();

  return useMutation<
    { success: boolean; message: string },
    Error,
    { plugId: string; outlet: number; state: "on" | "off" }
  >({
    mutationFn: ({ plugId, outlet, state }) =>
      togglePlugOutlet(plugId, outlet, state),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["plugs"] });
      queryClient.invalidateQueries({ queryKey: ["plugs", variables.plugId] });
    },
  });
};

/**
 * Deletes a plug by ID
 */
export async function deletePlug(
  id: string,
): Promise<{ success: boolean; message: string }> {
  const { data } = await api.delete<{ success: boolean; message: string }>(
    `/plugs/${id}`,
  );
  return data;
}

/**
 * TanStack Query mutation hook to delete a plug
 */
export const useDeletePlug = () => {
  const queryClient = useQueryClient();

  return useMutation<{ success: boolean; message: string }, Error, string>({
    mutationFn: (id) => deletePlug(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["plugs"] });
    },
  });
};

/**
 * Checks whether backend has received telemetry from the strip
 */
export async function verifyPlugConnection(
  plugId: string,
): Promise<PlugVerificationData> {
  const { data } = await api.get<PlugVerificationResponse>(
    `/plugs/${plugId}/verify`,
    {
      params: { _t: Date.now() },
      headers: {
        "Cache-Control": "no-cache",
        Pragma: "no-cache",
      },
    },
  );
  return data.data;
}

/**
 * TanStack Query hook to verify strip connection with the backend
 */
export const useVerifyPlugConnection = (plugId?: string) => {
  return useQuery<PlugVerificationData, Error>({
    queryKey: ["plugs", "verify", plugId],
    queryFn: () => verifyPlugConnection(plugId!),
    enabled: Boolean(plugId),
    refetchInterval: 2000,
  });
};
