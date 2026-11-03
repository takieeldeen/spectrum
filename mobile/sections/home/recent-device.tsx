import React, { useState, useMemo, useEffect } from "react";
import {
  View,
  StyleSheet,
  Pressable,
  I18nManager,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { Lucide } from "@react-native-vector-icons/lucide";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
  interpolateColor,
  Easing,
} from "react-native-reanimated";
import { useTranslation } from "react-i18next";

import ThemedText from "@/components/themed-text";
import { useTheme } from "@/hooks/use-theme";
import { useGetDevices } from "@/api";
import { usePlugs } from "@/providers/plug.provider";
import { IDevice } from "@/types/device";
import { Fade } from "@/components/ui/fade";
import { Skeleton } from "@/components/ui/skeleton";
import i18n from "@/i18n";

interface DeviceItemDisplay {
  id: string;
  name: string;
  subtitle: string;
  watts: number;
  isOn: boolean;
  stripId?: string;
  port?: number;
}

const TRANSITION_DURATION = 350; // Smooth transition duration in ms

const getOrderCommand = (orderType: "ON" | "OFF", outletNumber: number) => {
  return orderType === "ON"
    ? `up:onoff:${outletNumber}:on\r\n`
    : `up:onoff:${outletNumber}:off\r\n`;
};

interface DeviceCardItemProps {
  item: DeviceItemDisplay;
  onToggle: (item: DeviceItemDisplay) => void;
  theme: ReturnType<typeof useTheme>;
  isRtl: boolean;
  styles: ReturnType<typeof createStyles>;
}

const DeviceCardItem: React.FC<DeviceCardItemProps> = ({
  item,
  onToggle,
  theme,
  styles,
}) => {
  const { t } = useTranslation();
  const isDark = theme.isDark;

  // Shared progress value: 1 for ON, 0 for OFF
  const progress = useSharedValue(item.isOn ? 1 : 0);

  useEffect(() => {
    progress.value = withTiming(item.isOn ? 1 : 0, {
      duration: TRANSITION_DURATION,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
    });
  }, [item.isOn, progress]);

  // Animated card border transition
  const animatedCardStyle = useAnimatedStyle(() => {
    const borderColor = interpolateColor(
      progress.value,
      [0, 1],
      [
        isDark ? "rgba(255, 255, 255, 0.06)" : "rgba(0, 0, 0, 0.04)",
        isDark ? "rgba(52, 211, 153, 0.28)" : "rgba(10, 122, 85, 0.22)",
      ],
    );
    return {
      borderColor,
    };
  });

  // Animated icon badge background transition
  const animatedIconBadgeStyle = useAnimatedStyle(() => {
    const backgroundColor = interpolateColor(
      progress.value,
      [0, 1],
      [
        isDark ? "rgba(255, 255, 255, 0.06)" : "#F1F5F9",
        isDark ? "rgba(10, 122, 85, 0.24)" : "#EAF7F0",
      ],
    );
    return {
      backgroundColor,
    };
  });

  // Active indicator dot scale and opacity transition
  const animatedDotStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: progress.value }],
      opacity: progress.value,
    };
  });

  // Power button background transition
  const animatedButtonStyle = useAnimatedStyle(() => {
    const backgroundColor = interpolateColor(
      progress.value,
      [0, 1],
      [isDark ? "rgba(255, 255, 255, 0.12)" : "#E2E8F0", "#0A7A55"],
    );
    return {
      backgroundColor,
    };
  });

  // Smooth cross-fade between active (white) and inactive (gray) power icons
  const animatedActiveIconStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
  }));
  const animatedInactiveIconStyle = useAnimatedStyle(() => ({
    opacity: 1 - progress.value,
  }));

  // Subtle dimming transition for inactive text/metrics
  const animatedContentStyle = useAnimatedStyle(() => {
    const opacity = interpolate(progress.value, [0, 1], [0.65, 1]);
    return { opacity };
  });

  return (
    <Animated.View style={[styles.card, animatedCardStyle]}>
      {/* Right Group: Icon badge with active indicator + Title & Subtitle */}
      <View style={styles.rightGroup}>
        <View style={styles.iconContainer}>
          <Animated.View style={[styles.iconBadge, animatedIconBadgeStyle]}>
            <Lucide
              name="plug"
              size={22}
              color={theme.isDark ? "#34D399" : "#0A7A55"}
            />
          </Animated.View>
          <Animated.View style={[styles.activeDot, animatedDotStyle]} />
        </View>

        <Animated.View style={[styles.deviceInfo, animatedContentStyle]}>
          <ThemedText style={styles.deviceName} numberOfLines={1}>
            {item.name}
          </ThemedText>
          <ThemedText style={styles.deviceSubtitle} numberOfLines={1}>
            {item.subtitle}
          </ThemedText>
        </Animated.View>
      </View>

      {/* Left Group: Wattage info + Power on/off button */}
      <View style={styles.leftGroup}>
        <Animated.View style={[styles.powerInfo, animatedContentStyle]}>
          <ThemedText style={styles.powerValue}>
            {item.isOn ? item.watts.toFixed(2) : "0.00"}
          </ThemedText>
          <ThemedText style={styles.powerUnit}>
            {t("DASHBOARD.WATT")}
          </ThemedText>
        </Animated.View>

        <Pressable
          onPress={() => onToggle(item)}
          style={({ pressed }) => [
            pressed && { opacity: 0.85, transform: [{ scale: 0.95 }] },
          ]}
          accessibilityLabel={t("DASHBOARD.TOGGLE_POWER")}
        >
          <Animated.View style={[styles.powerButton, animatedButtonStyle]}>
            <View style={styles.iconCenterWrapper}>
              <Animated.View
                style={[styles.iconAbsolute, animatedActiveIconStyle]}
              >
                <Lucide name="power" size={19} color="#FFFFFF" />
              </Animated.View>
              <Animated.View
                style={[styles.iconAbsolute, animatedInactiveIconStyle]}
              >
                <Lucide name="power" size={19} color={theme.textSecondary} />
              </Animated.View>
            </View>
          </Animated.View>
        </Pressable>
      </View>
    </Animated.View>
  );
};

/* ==========================================================================
   SKELETON COMPONENT (For small RecentDevice card)
   ========================================================================== */

export interface RecentDeviceItemSkeletonProps {
  styles: ReturnType<typeof createStyles>;
}

export const RecentDeviceItemSkeleton: React.FC<
  RecentDeviceItemSkeletonProps
> = ({ styles }) => {
  return (
    <View style={styles.skeletonCard}>
      <View style={styles.rightGroup}>
        <Skeleton
          variant="rounded"
          width={46}
          height={46}
          borderRadius={15}
          animation="wave"
        />
        <View style={styles.skeletonInfo}>
          <Skeleton
            variant="text"
            width={120}
            height={16}
            borderRadius={6}
            animation="wave"
          />
          <Skeleton
            variant="text"
            width={160}
            height={12}
            borderRadius={4}
            animation="wave"
          />
        </View>
      </View>
      <View style={styles.leftGroup}>
        <View style={styles.powerInfo}>
          <Skeleton
            variant="text"
            width={36}
            height={16}
            borderRadius={6}
            animation="wave"
          />
          <Skeleton
            variant="text"
            width={20}
            height={10}
            borderRadius={4}
            animation="wave"
          />
        </View>
        <Skeleton
          variant="circular"
          width={44}
          height={44}
          borderRadius={22}
          animation="wave"
        />
      </View>
    </View>
  );
};

/* ==========================================================================
   EMPTY STATE COMPONENT (For small RecentDevices section)
   ========================================================================== */

export interface RecentDevicesEmptyStateProps {
  onAddDevice?: () => void;
  styles: ReturnType<typeof createStyles>;
  theme: ReturnType<typeof useTheme>;
}

export const RecentDevicesEmptyState: React.FC<
  RecentDevicesEmptyStateProps
> = ({ onAddDevice, styles, theme }) => {
  const { t } = useTranslation();

  return (
    <View style={styles.emptyCard}>
      <View style={styles.emptyIconBadge}>
        <Lucide name="plug-zap" size={24} color={theme.primary} />
      </View>
      <ThemedText weight="700" style={styles.emptyTitle}>
        {t("DASHBOARD.NO_RECENT_DEVICES")}
      </ThemedText>
      <ThemedText style={styles.emptySubtitle}>
        {t("DASHBOARD.NO_RECENT_DEVICES_DESCRIPTION")}
      </ThemedText>
      {onAddDevice && (
        <Pressable
          onPress={onAddDevice}
          style={({ pressed }) => [
            styles.emptyButton,
            pressed && { opacity: 0.8 },
          ]}
          accessibilityRole="button"
        >
          <Lucide name="plus" size={16} color={theme.primary} />
          <ThemedText weight="700" style={styles.emptyButtonText}>
            {t("NEW_DEVICE")}
          </ThemedText>
        </Pressable>
      )}
    </View>
  );
};

/* ==========================================================================
   MAIN RECENT DEVICES COMPONENT
   ========================================================================== */

export const RecentDevices: React.FC = () => {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const router = useRouter();
  const isArabic = (i18n.language || "ar").startsWith("ar");
  const isRtl = I18nManager.isRTL || isArabic;
  const { data: apiDevices, isLoading } = useGetDevices();
  const { liveData, connected, sendOrder } = usePlugs();

  // Local optimistic state for device toggles
  const [localToggles, setLocalToggles] = useState<Record<string, boolean>>({});

  // Map API devices with live socket data
  const displayDevices = useMemo<DeviceItemDisplay[]>(() => {
    if (!apiDevices || apiDevices.length === 0) {
      return [];
    }

    const activeOrRecent = apiDevices.slice(0, 4).map((device: IDevice) => {
      const stripId =
        typeof device.plugId === "string" ? device.plugId : device.plugId?._id;
      const port = device.plugPort;
      const outletKey = port ? (`outlet${port}` as "outlet1") : undefined;
      const outletLiveData =
        stripId && outletKey
          ? liveData?.[stripId]?.outlets?.[outletKey]
          : undefined;

      const liveOn = outletLiveData?.on ?? false;
      const isOn = localToggles[device._id] ?? liveOn;
      const watts = outletLiveData?.power_W ?? (isOn ? 4.5 : 0);

      const stripName =
        typeof device.plugId === "object" && device.plugId
          ? device.plugId.name || ""
          : "";

      const locationPart = stripName ? `${stripName} · ` : "";
      const portPart = port
        ? t("DASHBOARD.OUTLET_NUMBER", { number: port })
        : t("DASHBOARD.UNASSIGNED");
      const statusPart = isOn
        ? t("DASHBOARD.RUNNING_NOW")
        : t("DASHBOARD.STOPPED");
      const subtitle = `${locationPart}${portPart} · ${statusPart}`;

      return {
        id: device._id,
        name: device.name || t("DASHBOARD.UNNAMED_DEVICE"),
        subtitle,
        watts,
        isOn,
        stripId,
        port,
      };
    });

    return activeOrRecent;
  }, [apiDevices, liveData, localToggles, t, isArabic]);

  const handleToggle = (item: DeviceItemDisplay) => {
    const nextState = !item.isOn;
    setLocalToggles((prev) => ({ ...prev, [item.id]: nextState }));

    if (item.stripId && item.port && connected) {
      sendOrder(
        item.stripId,
        getOrderCommand(nextState ? "ON" : "OFF", item.port),
      );
    }
  };

  const handleNavigateToAll = () => {
    try {
      router.push("/(tabs)/devices" as any);
    } catch {
      // fallback
    }
  };

  const styles = useMemo(() => createStyles(theme), [theme]);

  const hasDevices = !isLoading && displayDevices.length > 0;
  const isEmpty = !isLoading && displayDevices.length === 0;

  return (
    <View style={styles.container}>
      {/* Header: Title on one side, "See All" with chevron on the other side */}
      <View style={styles.headerRow}>
        <ThemedText style={styles.headerTitle}>
          {t("DASHBOARD.ACTIVE_DEVICES")}
        </ThemedText>
        <Pressable
          onPress={handleNavigateToAll}
          style={({ pressed }) => [
            styles.seeAllButton,
            pressed && { opacity: 0.7 },
          ]}
        >
          <ThemedText style={styles.seeAllText}>
            {t("DASHBOARD.SEE_ALL")}
          </ThemedText>
          <Lucide
            name={isRtl ? "chevron-left" : "chevron-right"}
            size={17}
            color={theme.primaryDark}
          />
        </Pressable>
      </View>

      {/* 1. Loading State with Fade */}
      <Fade in={isLoading} duration={250} unmountOnExit style={styles.cardList}>
        <RecentDeviceItemSkeleton styles={styles} />
        <RecentDeviceItemSkeleton styles={styles} />
      </Fade>

      {/* 2. Empty State with Fade */}
      <Fade in={isEmpty} duration={250} unmountOnExit>
        <RecentDevicesEmptyState
          onAddDevice={handleNavigateToAll}
          styles={styles}
          theme={theme}
        />
      </Fade>

      {/* 3. Loaded Device List with Fade */}
      <Fade
        in={hasDevices}
        duration={250}
        unmountOnExit
        style={styles.cardList}
      >
        {displayDevices.map((item) => (
          <DeviceCardItem
            key={item.id}
            item={item}
            onToggle={handleToggle}
            theme={theme}
            isRtl={isRtl}
            styles={styles}
          />
        ))}
      </Fade>
    </View>
  );
};

export default RecentDevices;

/* ==========================================================================
   THEME-AWARE STYLES
   ========================================================================== */

const createStyles = (theme: ReturnType<typeof useTheme>) => {
  return StyleSheet.create({
    container: {
      gap: 12,
      width: "100%",
    },
    headerRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 4,
    },
    headerTitle: {
      fontSize: 18,
      lineHeight: 26,
      fontWeight: "800",
      color: theme.text,
    },
    seeAllButton: {
      flexDirection: "row",
      alignItems: "center",
      gap: 3,
      paddingVertical: 4,
      paddingHorizontal: 2,
    },
    seeAllText: {
      fontSize: 14,
      fontWeight: "700",
      color: theme.primaryDark,
    },
    cardList: {
      gap: 12,
    },
    card: {
      width: "100%",
      backgroundColor: theme.cardBackground,
      borderRadius: 24,
      paddingHorizontal: 16,
      paddingVertical: 13,
      borderWidth: 1,
      borderColor: theme.cardBorder,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      ...Platform.select({
        ios: {
          shadowColor: "#000000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: theme.isDark ? 0.2 : 0.04,
          shadowRadius: 8,
        },
        android: {
          elevation: 2,
        },
      }),
    },
    skeletonCard: {
      width: "100%",
      backgroundColor: theme.cardBackground,
      borderRadius: 24,
      paddingHorizontal: 16,
      paddingVertical: 13,
      borderWidth: 1,
      borderColor: theme.cardBorder,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    skeletonInfo: {
      gap: 6,
      justifyContent: "center",
    },
    rightGroup: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      flex: 1,
    },
    iconContainer: {
      position: "relative",
      width: 46,
      height: 46,
    },
    iconBadge: {
      width: 46,
      height: 46,
      borderRadius: 15,
      alignItems: "center",
      justifyContent: "center",
    },
    activeDot: {
      position: "absolute",
      bottom: 1,
      right: 1,
      width: 11,
      height: 11,
      borderRadius: 6,
      backgroundColor: "#10B981",
      borderWidth: 2,
      borderColor: theme.cardBackground,
    },
    deviceInfo: {
      flex: 1,
      alignItems: "flex-start",
      justifyContent: "center",
    },
    deviceName: {
      fontSize: 16,
      lineHeight: 22,
      fontWeight: "800",
      color: theme.text,
    },
    deviceSubtitle: {
      fontSize: 12.5,
      lineHeight: 18,
      fontWeight: "500",
      color: theme.textSecondary,
      marginTop: 2,
    },
    leftGroup: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      marginStart: 12,
    },
    powerInfo: {
      alignItems: "center",
      justifyContent: "center",
      minWidth: 44,
    },
    powerValue: {
      fontSize: 17,
      lineHeight: 22,
      fontWeight: "800",
      color: theme.text,
      textAlign: "center",
    },
    powerUnit: {
      fontSize: 12,
      lineHeight: 16,
      fontWeight: "500",
      color: theme.textSecondary,
      textAlign: "center",
    },
    powerButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: "center",
      justifyContent: "center",
      ...Platform.select({
        ios: {
          shadowColor: theme.primaryDark,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.25,
          shadowRadius: 4,
        },
        android: {
          elevation: 2,
        },
      }),
    },
    iconCenterWrapper: {
      width: 22,
      height: 22,
      alignItems: "center",
      justifyContent: "center",
      position: "relative",
    },
    iconAbsolute: {
      position: "absolute",
      alignItems: "center",
      justifyContent: "center",
    },
    emptyCard: {
      width: "100%",
      backgroundColor: theme.cardBackground,
      borderRadius: 24,
      paddingHorizontal: 20,
      paddingVertical: 28,
      borderWidth: 1,
      borderColor: theme.cardBorder,
      borderStyle: "dashed",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      ...Platform.select({
        ios: {
          shadowColor: "#000000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: theme.isDark ? 0.2 : 0.04,
          shadowRadius: 8,
        },
        android: {
          elevation: 1,
        },
      }),
    },
    emptyIconBadge: {
      width: 52,
      height: 52,
      borderRadius: 26,
      backgroundColor: theme.tintedIconBackground,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 4,
    },
    emptyTitle: {
      fontSize: 16,
      lineHeight: 22,
      color: theme.text,
      textAlign: "center",
    },
    emptySubtitle: {
      fontSize: 13,
      lineHeight: 18,
      color: theme.textSecondary,
      textAlign: "center",
      maxWidth: 280,
    },
    emptyButton: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      marginTop: 8,
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: theme.primary,
      backgroundColor: theme.tintedIconBackground,
    },
    emptyButtonText: {
      fontSize: 13,
      color: theme.primary,
    },
  });
};
