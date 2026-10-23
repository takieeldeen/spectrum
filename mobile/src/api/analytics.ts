import { useQuery } from "@tanstack/react-query";
import api from "./axios";
import {
  IStripSummary,
  IAnalyticsDayResponse,
  IAnalyticsWeekResponse,
  IAnalyticsBreakdownResponse,
} from "@/types/analytics";

/**
 * Hook to fetch summary metrics across all strips owned by the authenticated user (/analytics/strips)
 */
export const useGetStripsSummary = () => {
  return useQuery<IStripSummary[]>({
    retry: false,
    queryKey: ["analytics", "strips-summary"],
    queryFn: async () => {
      const { data } = await api.get<{
        success: boolean;
        data: IStripSummary[];
      }>("/analytics/strips");
      return data.data || [];
    },
    refetchInterval: 30000, // Refresh summary every 30 seconds
  });
};

/**
 * Hook to fetch 24-hour Day analytics (either user-wide or for a specific strip)
 */
export const useGetDayAnalytics = (stripId?: string, outlet?: number) => {
  return useQuery<IAnalyticsDayResponse>({
    retry: false,
    queryKey: ["analytics", "day", stripId, outlet],
    queryFn: async () => {
      const { data } = await api.get<{
        success: boolean;
        data: IAnalyticsDayResponse;
      }>("/analytics/day", {
        params: { stripId, outlet },
      });
      return data.data;
    },
  });
};

/**
 * Hook to fetch 7-day Week analytics (either user-wide or for a specific strip)
 */
export const useGetWeekAnalytics = (stripId?: string, outlet?: number) => {
  return useQuery<IAnalyticsWeekResponse>({
    retry: false,
    queryKey: ["analytics", "week", stripId, outlet],
    queryFn: async () => {
      const { data } = await api.get<{
        success: boolean;
        data: IAnalyticsWeekResponse;
      }>("/analytics/week", {
        params: { stripId, outlet },
      });
      return data.data;
    },
  });
};

/**
 * Hook to fetch outlet consumption breakdown for a strip
 */
export const useGetBreakdownAnalytics = (
  stripId: string,
  period: "day" | "week" | "month" = "day",
) => {
  return useQuery<IAnalyticsBreakdownResponse>({
    enabled: Boolean(stripId),
    retry: false,
    queryKey: ["analytics", "breakdown", stripId, period],
    queryFn: async () => {
      const { data } = await api.get<{
        success: boolean;
        data: IAnalyticsBreakdownResponse;
      }>("/analytics/breakdown", {
        params: { stripId, period },
      });
      return data.data;
    },
  });
};
