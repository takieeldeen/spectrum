import React from "react";
import {
  View,
  Pressable,
  StyleSheet,
  StyleProp,
  ViewStyle,
} from "react-native";
import { useTranslation } from "react-i18next";
import Lucide from "@react-native-vector-icons/lucide";
import { useTheme } from "@/hooks/use-theme";
import ThemedText from "@/components/themed-text";
import { INotificationItem } from "@/types/notifications";
import {
  normalizeNotification,
  NormalizedNotification,
} from "@/utils/notification-normalizer";
import i18n from "@/i18n";

export interface NotificationItemProps {
  item: INotificationItem;
  onPress?: (
    item: INotificationItem,
    normalized: NormalizedNotification,
  ) => void;
  style?: StyleProp<ViewStyle>;
}

export type DateGroupKey = "GROUP_TODAY" | "GROUP_YESTERDAY" | "GROUP_EARLIER";

export function getDateGroupKey(dateInput: Date | string): DateGroupKey {
  const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
  const now = new Date();

  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

  if (isToday) return "GROUP_TODAY";

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);

  const isYesterday =
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear();

  if (isYesterday) return "GROUP_YESTERDAY";

  return "GROUP_EARLIER";
}

export function formatNotificationTime(
  dateInput: Date | string,
  t: (key: string, options?: any) => string,
): string {
  const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
  const now = new Date();

  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

  if (isToday) {
    const diffSec = Math.max(
      0,
      Math.floor((now.getTime() - date.getTime()) / 1000),
    );
    if (diffSec < 60) {
      return t("NOTIFICATIONS.JUST_NOW");
    }
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) {
      return t("NOTIFICATIONS.MINUTES_AGO", { count: diffMin });
    }
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours === 1) {
      return t("NOTIFICATIONS.ONE_HOUR_AGO");
    }
    if (diffHours < 24) {
      return t("NOTIFICATIONS.HOURS_AGO", { count: diffHours });
    }
  }

  // Not today (Yesterday or older): format as time of day like "11:45 م" / "11:45 PM"
  const hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, "0");
  const period =
    hours >= 12 ? t("NOTIFICATIONS.TIME_PM") : t("NOTIFICATIONS.TIME_AM");
  const displayHours = hours % 12 || 12;

  return `${displayHours}:${minutes} ${period}`;
}

export const NotificationItem: React.FC<NotificationItemProps> = ({
  item,
  onPress,
  style,
}) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const styles = createStyles(theme);

  const normalized = normalizeNotification(item, t);
  const isUnread = normalized.readAt === null;
  const timeDisplay = formatNotificationTime(normalized.createdAt, t);

  return (
    <Pressable
      onPress={() => onPress?.(item, normalized)}
      style={({ pressed }) => [
        styles.card,
        isUnread ? styles.unreadCard : styles.readCard,
        pressed && styles.pressed,
        style,
      ]}
    >
      {/* Icon Squircle Box */}
      <View style={styles.iconBox}>
        <Lucide
          name={(normalized.icon as any) || "bell"}
          size={24}
          color={theme.isDark ? theme.primaryLight : theme.primaryDark}
        />
      </View>

      {/* Main Content (Title & Body) */}
      <View style={styles.contentContainer}>
        <ThemedText style={styles.title}>{normalized.title}</ThemedText>
        <ThemedText style={styles.body}>{normalized.body}</ThemedText>
      </View>

      {/* Timestamp & Unread Indicator */}
      <View style={styles.metaContainer}>
        {isUnread && <View style={styles.unreadDot} />}
        <ThemedText style={styles.timeText}>{timeDisplay}</ThemedText>
      </View>
    </Pressable>
  );
};

export interface NotificationItemSkeletonProps {
  style?: StyleProp<ViewStyle>;
}

export const NotificationItemSkeleton: React.FC<
  NotificationItemSkeletonProps
> = ({ style }) => {
  const theme = useTheme();
  const styles = createStyles(theme);

  return (
    <View style={[styles.card, styles.skeletonCard, style]}>
      {/* Icon Squircle Box Skeleton */}
      <View style={[styles.iconBox, styles.skeletonIconBox]} />

      {/* Main Content Skeleton */}
      <View style={styles.contentContainer}>
        <View style={[styles.skeletonLine, styles.skeletonTitle]} />
        <View style={[styles.skeletonLine, styles.skeletonBody1]} />
        <View style={[styles.skeletonLine, styles.skeletonBody2]} />
      </View>

      {/* Timestamp Skeleton */}
      <View style={styles.metaContainer}>
        <View style={[styles.skeletonLine, styles.skeletonMeta]} />
      </View>
    </View>
  );
};

const createStyles = (theme: ReturnType<typeof useTheme>) =>
  StyleSheet.create({
    card: {
      width: "100%",
      borderRadius: 20,
      padding: 14,
      flexDirection: i18n.language === "ar" ? "row-reverse" : "row",
      alignItems: "flex-start",
      gap: 12,
    },
    unreadCard: {
      backgroundColor: theme.isDark ? "#142823" : "#E8F6ED",
      borderWidth: 1,
      borderColor: theme.isDark
        ? "rgba(34, 197, 94, 0.28)"
        : "rgba(10, 122, 85, 0.16)",
    },
    readCard: {
      backgroundColor: theme.backgroundElement,
      borderWidth: 1,
      borderColor: theme.isDark
        ? "rgba(255, 255, 255, 0.06)"
        : "rgba(0, 0, 0, 0.05)",
    },
    pressed: {
      opacity: 0.9,
      transform: [{ scale: 0.99 }],
    },
    iconBox: {
      width: 48,
      height: 48,
      borderRadius: 14,
      backgroundColor: theme.isDark ? theme.backgroundSecondary : "#FFFFFF",
      justifyContent: "center",
      alignItems: "center",
      borderWidth: 1,
      borderColor: theme.isDark
        ? "rgba(255, 255, 255, 0.08)"
        : "rgba(10, 122, 85, 0.08)",
    },
    contentContainer: {
      flex: 1,
      gap: 4,
      alignItems: i18n.language === "ar" ? "flex-end" : "flex-start",
    },
    title: {
      fontSize: 15.5,
      fontWeight: "800",
      color: theme.text,
      textAlign: i18n.language === "ar" ? "right" : "left",
    },
    body: {
      fontSize: 13,
      lineHeight: 18,
      color: theme.textSecondary,
      textAlign: i18n.language === "ar" ? "right" : "left",
    },
    metaContainer: {
      flexDirection: i18n.language === "ar" ? "row-reverse" : "row",
      alignItems: "center",
      gap: 6,
      paddingTop: 2,
    },
    unreadDot: {
      width: 9,
      height: 9,
      borderRadius: 4.5,
      backgroundColor: theme.primary,
    },
    timeText: {
      fontSize: 12,
      fontWeight: "600",
      color: theme.textSecondary,
    },
    // Skeleton styles
    skeletonCard: {
      backgroundColor: theme.backgroundElement,
      borderWidth: 1,
      borderColor: theme.isDark
        ? "rgba(255, 255, 255, 0.05)"
        : "rgba(0, 0, 0, 0.05)",
    },
    skeletonIconBox: {
      backgroundColor: theme.isDark ? theme.backgroundSecondary : "#F1F5F9",
      borderColor: theme.isDark
        ? "rgba(255, 255, 255, 0.05)"
        : "rgba(0, 0, 0, 0.04)",
    },
    skeletonLine: {
      backgroundColor: theme.isDark ? "rgba(255, 255, 255, 0.12)" : "#E2E8F0",
      borderRadius: 6,
    },
    skeletonTitle: {
      width: "60%",
      height: 16,
      marginBottom: 6,
    },
    skeletonBody1: {
      width: "92%",
      height: 12,
      marginBottom: 4,
    },
    skeletonBody2: {
      width: "70%",
      height: 12,
    },
    skeletonMeta: {
      width: 44,
      height: 12,
    },
  });

export default NotificationItem;
