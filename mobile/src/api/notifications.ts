import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { INotificationItem, PaginatedNotificationsResponse } from "@/types/notifications";
import api from "./axios";

export const NOTIFICATIONS_QUERY_KEY = ["notifications", "list"];
export const UNREAD_COUNT_QUERY_KEY = ["notifications", "unread-count"];

/**
 * Hook to fetch the total unread notifications count
 */
export const useGetUnreadNotificationsCount = () => {
  return useQuery<number>({
    queryKey: UNREAD_COUNT_QUERY_KEY,
    queryFn: async () => {
      const response = await api.get<PaginatedNotificationsResponse>(
        "/notifications?filter=UNREAD&limit=1"
      );
      return response.data?.total || 0;
    },
    staleTime: 1000 * 15,
  });
};

/**
 * Hook to fetch paginated notification list with infinite scroll (20 per page)
 * strictly sorted in descending creation order.
 */
export const useGetNotificationList = (filter?: string) => {
  return useInfiniteQuery<PaginatedNotificationsResponse>({
    queryKey: filter && filter !== "ALL" ? ["notifications", "list", filter] : NOTIFICATIONS_QUERY_KEY,
    initialPageParam: 1,
    queryFn: async ({ pageParam = 1 }) => {
      const filterParam = filter && filter !== "ALL" ? `&filter=${filter}` : "";
      const response = await api.get<PaginatedNotificationsResponse>(
        `/notifications?page=${pageParam}&limit=20${filterParam}`
      );
      return response.data;
    },
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.page + 1 : undefined,
    staleTime: 1000 * 30, // 30 seconds
  });
};

/**
 * Hook to mark a single notification as read
 */
export const useMarkNotificationRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.patch<{ success: boolean; data: INotificationItem }>(
        `/notifications/${id}/read`
      );
      return response.data?.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: UNREAD_COUNT_QUERY_KEY });
    },
  });
};

/**
 * Hook to mark all unread notifications as read
 */
export const useMarkAllNotificationsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await api.patch<{ success: boolean }>(
        `/notifications/read-all`
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.setQueryData(UNREAD_COUNT_QUERY_KEY, 0);
      queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: UNREAD_COUNT_QUERY_KEY });
    },
  });
};

export default useGetNotificationList;
