import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  IWifi,
  CreateWifiPayload,
  WifiApiResponse,
  WifiListApiResponse,
} from "@/types/wifi";
import api from "./axios";

/**
 * Fetches all saved Wi-Fi networks for the authenticated user
 */
export async function getWifiList(): Promise<IWifi[]> {
  const { data } = await api.get<WifiListApiResponse>("/wifi");
  return data.data;
}

/**
 * Creates or updates a Wi-Fi network credential on the backend
 */
export async function createWifi(payload: CreateWifiPayload): Promise<IWifi> {
  const { data } = await api.post<WifiApiResponse>("/wifi", payload);
  return data.data;
}

/**
 * TanStack Query hook to fetch the list of saved Wi-Fi networks
 */
export const useGetWifiList = () => {
  return useQuery<IWifi[], Error>({
    queryKey: ["wifi"],
    queryFn: () => getWifiList(),
  });
};

/**
 * TanStack Query mutation hook to create a new Wi-Fi network
 */
export const useCreateWifi = () => {
  const queryClient = useQueryClient();

  return useMutation<IWifi, Error, CreateWifiPayload>({
    mutationFn: (payload) => createWifi(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wifi"] });
    },
  });
};
