import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { API_BASE_URL } from "@/constants/api";
import {
  IPlug,
  CreatePlugPayload,
  PlugApiResponse,
  PlugListApiResponse,
} from "@/types/plug";
import { getAuthSession } from "@/utils/storage";

/**
 * Fetches all plugs belonging to the authenticated user
 */
export async function getPlugList(token?: string | null): Promise<IPlug[]> {
  const authToken = token ?? (await getAuthSession())?.token;

  const response = await fetch(`${API_BASE_URL}/plugs`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
    },
  });

  const data: PlugListApiResponse = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data.message || "Failed to fetch plugs list.");
  }

  return data.data || [];
}

/**
 * Creates a new plug entity on the backend
 */
export async function createPlug(
  payload: CreatePlugPayload,
  token?: string | null
): Promise<IPlug> {
  const authToken = token ?? (await getAuthSession())?.token;

  const response = await fetch(`${API_BASE_URL}/plugs`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
    },
    body: JSON.stringify(payload),
  });

  const data: PlugApiResponse = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data.message || "Failed to create plug.");
  }

  return data.data;
}

/**
 * Fetches a single plug by ID
 */
export async function getPlugById(
  plugId: string,
  token?: string | null
): Promise<IPlug> {
  const authToken = token ?? (await getAuthSession())?.token;

  const response = await fetch(`${API_BASE_URL}/plugs/${plugId}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
    },
  });

  const data: PlugApiResponse = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data.message || "Failed to fetch plug details.");
  }

  return data.data;
}

/**
 * Updates an existing plug on the backend
 */
export async function updatePlug(
  id: string,
  payload: Partial<CreatePlugPayload>,
  token?: string | null
): Promise<IPlug> {
  const authToken = token ?? (await getAuthSession())?.token;

  const response = await fetch(`${API_BASE_URL}/plugs/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
    },
    body: JSON.stringify(payload),
  });

  const data: PlugApiResponse = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data.message || "Failed to update plug.");
  }

  return data.data;
}

/**
 * TanStack Query hook to fetch the list of plugs
 */
export const useGetPlugList = (token?: string | null) => {
  return useQuery<IPlug[], Error>({
    queryKey: ["plugs"],
    queryFn: () => getPlugList(token),
  });
};

export const useGetPlugs = useGetPlugList;

/**
 * TanStack Query hook to fetch a single plug by ID
 */
export const useGetPlugById = (plugId?: string, token?: string | null) => {
  return useQuery<IPlug, Error>({
    queryKey: ["plugs", plugId],
    queryFn: () => getPlugById(plugId!, token),
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
  token?: string | null
): Promise<{ success: boolean; message: string }> {
  const authToken = token ?? (await getAuthSession())?.token;

  const response = await fetch(`${API_BASE_URL}/plugs/${plugId}/toggle`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
    },
    body: JSON.stringify({ outlet, state }),
  });

  const data = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data.message || "Failed to toggle plug outlet.");
  }

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
  token?: string | null
): Promise<{ success: boolean; message: string }> {
  const authToken = token ?? (await getAuthSession())?.token;

  const response = await fetch(`${API_BASE_URL}/plugs/${id}`, {
    method: "DELETE",
    headers: {
      Accept: "application/json",
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
    },
  });

  const data = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data.message || "Failed to delete plug.");
  }

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
