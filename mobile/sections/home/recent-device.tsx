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
  isRtl,
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

export const RecentDevices: React.FC = () => {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const router = useRouter();
  const isArabic = (i18n.language || "ar").startsWith("ar");
  const isRtl = I18nManager.isRTL || isArabic;
  const { data: apiDevices } = useGetDevices();
  const { liveData, connected, sendOrder } = usePlugs();

  // Local optimistic state for device toggles
  const [localToggles, setLocalToggles] = useState<Record<string, boolean>>({});

  // Map API devices with live socket data, or fall back to default screenshot samples
  const displayDevices = useMemo<DeviceItemDisplay[]>(() => {
    if (apiDevices && apiDevices.length > 0) {
      const activeOrRecent = apiDevices.slice(0, 4).map((device: IDevice) => {
        const stripId =
          typeof device.plugId === "string"
            ? device.plugId
            : device.plugId?._id;
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
            ? (isArabic ? device.plugId.arabicName : device.plugId.name) ||
              device.plugId.name ||
              device.plugId.arabicName
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
    }

    // Default sample devices matching the design
    const sampleDevices = [
      {
        id: "sample-1",
        name: t("DASHBOARD.BALCONY_RADIO"),
        portNumber: 3,
        location: "",
        watts: 6.06,
        defaultOn: true,
      },
      {
        id: "sample-2",
        name: t("DASHBOARD.ROUTER"),
        portNumber: 4,
        location: t("DASHBOARD.LIVING_ROOM"),
        watts: 0.56,
        defaultOn: true,
      },
    ];

    return sampleDevices.map((d) => {
      const isOn = localToggles[d.id] ?? d.defaultOn;
      const statusPart = isOn
        ? t("DASHBOARD.RUNNING_NOW")
        : t("DASHBOARD.STOPPED");
      const locationPart = d.location ? `${d.location} · ` : "";
      const portPart = t("DASHBOARD.OUTLET_NUMBER", { number: d.portNumber });
      return {
        id: d.id,
        name: d.name,
        isOn,
        watts: d.watts,
        subtitle: `${locationPart}${portPart} · ${statusPart}`,
      };
    });
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

  const styles = useMemo(
    () => createStyles(theme, isRtl, isArabic),
    [theme, isRtl, isArabic],
  );

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
            color="#0A7A55"
          />
        </Pressable>
      </View>

      {/* List of Device Cards with transition animations */}
      <View style={styles.cardList}>
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
      </View>
    </View>
  );
};

export default RecentDevices;

const createStyles = (
  theme: ReturnType<typeof useTheme>,
  isRtl: boolean,
  isArabic: boolean,
) => {
  const isDark = theme.isDark;
  const naturalRow = isArabic
    ? I18nManager.isRTL
      ? "row"
      : "row-reverse"
    : I18nManager.isRTL
      ? "row-reverse"
      : "row";

  return StyleSheet.create({
    container: {
      gap: 12,
      width: "100%",
    },
    headerRow: {
      flexDirection: naturalRow,
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 4,
    },
    headerTitle: {
      fontSize: 18,
      lineHeight: 26,
      fontWeight: "800",
      color: theme.text,
      textAlign: isRtl ? "right" : "left",
    },
    seeAllButton: {
      flexDirection: naturalRow,
      alignItems: "center",
      gap: 3,
      paddingVertical: 4,
      paddingHorizontal: 2,
    },
    seeAllText: {
      fontSize: 14,
      fontWeight: "700",
      color: "#0A7A55",
    },
    cardList: {
      gap: 12,
    },
    card: {
      width: "100%",
      backgroundColor: isDark ? theme.backgroundElement : "#FFFFFF",
      borderRadius: 24,
      paddingHorizontal: 16,
      paddingVertical: 13,
      borderWidth: 1,
      borderColor: isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.04)",
      flexDirection: naturalRow,
      alignItems: "center",
      justifyContent: "space-between",
      ...Platform.select({
        ios: {
          shadowColor: "#000000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: isDark ? 0.2 : 0.04,
          shadowRadius: 8,
        },
        android: {
          elevation: 2,
        },
      }),
    },
    rightGroup: {
      flexDirection: naturalRow,
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
      borderColor: isDark ? theme.backgroundElement : "#FFFFFF",
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
      textAlign: isRtl ? "right" : "left",
    },
    deviceSubtitle: {
      fontSize: 12.5,
      lineHeight: 18,
      fontWeight: "500",
      color: theme.textSecondary,
      marginTop: 2,
      textAlign: isRtl ? "right" : "left",
    },
    leftGroup: {
      flexDirection: naturalRow,
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
          shadowColor: "#0A7A55",
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
  });
};
