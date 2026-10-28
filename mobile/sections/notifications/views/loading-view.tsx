import React from "react";
import { View, StyleSheet, ScrollView, StyleProp, ViewStyle } from "react-native";
import { useTheme } from "@/hooks/use-theme";
import { NotificationItemSkeleton } from "../notification-item";


export interface NotificationsLoadingListProps {
  count?: number;
  style?: StyleProp<ViewStyle>;
}

export interface NotificationsLoadingDetailProps {
  style?: StyleProp<ViewStyle>;
}

/**
 * Loading state for the notifications list view.
 * Displays grouped skeleton items mimicking the actual notifications layout.
 */
export const NotificationsLoadingList: React.FC<NotificationsLoadingListProps> = ({
  count = 5,
  style,
}) => {
  const theme = useTheme();
  const styles = createStyles(theme);

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={[styles.listContainer, style]}
    >
      {/* Group 1 Skeleton Header */}
      <View style={styles.sectionHeaderSkeleton} />
      <View style={styles.itemsGap}>
        {Array.from({ length: Math.min(3, count) }).map((_, i) => (
          <NotificationItemSkeleton key={`skeleton-g1-${i}`} />
        ))}
      </View>

      {/* Group 2 Skeleton Header */}
      {count > 3 && (
        <>
          <View style={[styles.sectionHeaderSkeleton, { width: 50, marginTop: 12 }]} />
          <View style={styles.itemsGap}>
            {Array.from({ length: count - 3 }).map((_, i) => (
              <NotificationItemSkeleton key={`skeleton-g2-${i}`} />
            ))}
          </View>
        </>
      )}
    </ScrollView>
  );
};

/**
 * Loading state for notification details view.
 */
export const NotificationsLoadingDetails: React.FC<NotificationsLoadingDetailProps> = ({
  style,
}) => {
  const theme = useTheme();
  const styles = createStyles(theme);

  return (
    <View style={[styles.detailsContainer, style]}>
      {/* Icon + Title Header */}
      <View style={styles.detailsHeader}>
        <View style={styles.detailsIconSkeleton} />
        <View style={styles.detailsHeaderTexts}>
          <View style={styles.detailsTitleSkeleton} />
          <View style={styles.detailsMetaSkeleton} />
        </View>
      </View>

      {/* Body Paragraph Skeletons */}
      <View style={styles.detailsBody}>
        <View style={[styles.skeletonLine, { width: "100%", height: 16 }]} />
        <View style={[styles.skeletonLine, { width: "95%", height: 16 }]} />
        <View style={[styles.skeletonLine, { width: "80%", height: 16 }]} />
        <View style={[styles.skeletonLine, { width: "60%", height: 16 }]} />
      </View>

      {/* Extra Details Card Skeleton */}
      <View style={styles.detailsCardSkeleton} />
    </View>
  );
};

const createStyles = (theme: ReturnType<typeof useTheme>) =>
  StyleSheet.create({
    listContainer: {
      paddingBottom: 32,
      gap: 12,
    },
    sectionHeaderSkeleton: {
      width: 65,
      height: 18,
      borderRadius: 6,
      backgroundColor: theme.isDark ? "rgba(255, 255, 255, 0.12)" : "#E2E8F0",
      marginHorizontal: 4,
      marginBottom: 4,
    },
    itemsGap: {
      gap: 10,
    },
    detailsContainer: {
      padding: 16,
      gap: 20,
      flex: 1,
    },
    detailsHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: 14,
    },
    detailsIconSkeleton: {
      width: 56,
      height: 56,
      borderRadius: 16,
      backgroundColor: theme.isDark ? theme.backgroundSecondary : "#E2E8F0",
    },
    detailsHeaderTexts: {
      flex: 1,
      gap: 8,
    },
    detailsTitleSkeleton: {
      width: "70%",
      height: 20,
      borderRadius: 6,
      backgroundColor: theme.isDark ? "rgba(255, 255, 255, 0.12)" : "#E2E8F0",
    },
    detailsMetaSkeleton: {
      width: "40%",
      height: 14,
      borderRadius: 4,
      backgroundColor: theme.isDark ? "rgba(255, 255, 255, 0.08)" : "#CBD5E1",
    },
    detailsBody: {
      gap: 10,
      marginTop: 8,
    },
    skeletonLine: {
      borderRadius: 6,
      backgroundColor: theme.isDark ? "rgba(255, 255, 255, 0.12)" : "#E2E8F0",
    },
    detailsCardSkeleton: {
      width: "100%",
      height: 120,
      borderRadius: 16,
      backgroundColor: theme.backgroundElement,
      marginTop: 12,
    },
  });

export default NotificationsLoadingList;

