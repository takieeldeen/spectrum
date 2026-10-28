import React from "react";
import { View, StyleSheet, ScrollView, StyleProp, ViewStyle } from "react-native";
import { useTheme } from "@/hooks/use-theme";
import { Skeleton } from "@/components/ui/skeleton";
import { DeviceCardSkeleton } from "../device-card";

export interface DeviceListLoadingViewProps {
  count?: number;
  style?: StyleProp<ViewStyle>;
}

export interface DeviceDetailsLoadingViewProps {
  style?: StyleProp<ViewStyle>;
}

/**
 * Loading state for the devices list view.
 * Renders repeated DeviceCardSkeleton cards matching the design mockup wireframe.
 */
export const DeviceListLoadingView: React.FC<DeviceListLoadingViewProps> = ({
  count = 3,
  style,
}) => {
  const theme = useTheme();
  const styles = createStyles(theme);

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={[styles.listContainer, style]}
    >
      {Array.from({ length: count }).map((_, i) => (
        <DeviceCardSkeleton key={`device-skeleton-${i}`} animation="wave" />
      ))}
    </ScrollView>
  );
};

/**
 * Loading state for device details view.
 */
export const DeviceDetailsLoadingView: React.FC<DeviceDetailsLoadingViewProps> = ({
  style,
}) => {
  const theme = useTheme();
  const styles = createStyles(theme);

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={[styles.detailsContainer, style]}
    >
      {/* Hero Card Skeleton */}
      <View style={styles.heroSkeleton}>
        <View style={styles.heroRow}>
          <Skeleton width={64} height={64} borderRadius={22} animation="pulse" />
          <View style={{ gap: 8, flex: 1 }}>
            <Skeleton width={140} height={20} borderRadius={6} animation="pulse" />
            <Skeleton width={100} height={14} borderRadius={4} animation="pulse" />
          </View>
        </View>
        <Skeleton width="100%" height={50} borderRadius={16} animation="pulse" />
      </View>

      {/* 2x2 Telemetry Grid Skeleton */}
      <View style={styles.gridSkeleton}>
        <Skeleton width="48%" height={90} borderRadius={18} animation="pulse" />
        <Skeleton width="48%" height={90} borderRadius={18} animation="pulse" />
        <Skeleton width="48%" height={90} borderRadius={18} animation="pulse" />
        <Skeleton width="48%" height={90} borderRadius={18} animation="pulse" />
      </View>

      {/* Chart Skeleton */}
      <Skeleton width="100%" height={220} borderRadius={20} animation="pulse" />
    </ScrollView>
  );
};

const createStyles = (theme: ReturnType<typeof useTheme>) =>
  StyleSheet.create({
    listContainer: {
      paddingHorizontal: 20,
      paddingTop: 8,
      paddingBottom: 40,
      gap: 14,
    },
    detailsContainer: {
      padding: 20,
      gap: 18,
    },
    heroSkeleton: {
      backgroundColor: theme.cardBackground,
      borderRadius: 24,
      padding: 20,
      borderWidth: 1,
      borderColor: theme.divider,
      gap: 16,
    },
    heroRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 14,
    },
    gridSkeleton: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 12,
      justifyContent: "space-between",
    },
  });

export default DeviceListLoadingView;
