import React, { useState, useEffect } from "react";
import { StyleSheet, View, Switch, Pressable } from "react-native";
import { useTranslation } from "react-i18next";
import { useRouter } from "expo-router";
import { Lucide } from "@react-native-vector-icons/lucide";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from "react-native-reanimated";

import { ThemedText } from "@/components/themed-text";
import { useTheme } from "@/hooks/use-theme";
import {
  ElectricPlug,
  PlugSocket,
  OutletProps,
} from "@/components/electric-plug";
import { Card, Button, Popover, usePopover } from "@/components/ui";
import {
  ConfirmationMessage,
  useConfirmationMessage,
} from "@/components/confirmation-message";
import { usePairWithStrip } from "@/hooks/use-pair-with-strip";
import { useTogglePlugOutlet, useDeletePlug } from "@/api/plug";

/* ==========================================================================
   1. TYPES & PROPS
   ========================================================================== */

export interface IPlugOutlets {
  outlet1?: OutletProps;
  outlet2?: OutletProps;
  outlet3?: OutletProps;
  outlet4?: OutletProps;
}

export interface IPlug {
  _id?: string;
  id?: string;
  user?: string;
  name: string;
  arabicName?: string;
  nameAr?: string;
  nameEn?: string;
  serialNumber: string;
  ipAddress?: string;
  roomId?: string;
  connected?: boolean;
  isOnline?: boolean;
  createdAt?: string;
  updatedAt?: string;
  outlets?: IPlugOutlets;
}

export interface PlugCardProps {
  plug?: IPlug;
  onToggleOutlet?: (
    outletKey: "outlet1" | "outlet2" | "outlet3" | "outlet4",
    state: boolean,
  ) => void;
  onToggleMaster?: (state: boolean) => void;
  onEdit?: (plug: IPlug) => void;
  onDelete?: (plug: IPlug) => void;
}

const DEFAULT_OUTLETS: Record<
  "outlet1" | "outlet2" | "outlet3" | "outlet4",
  OutletProps
> = {
  outlet1: {
    on: true,
    watts: 45,
    power_mw: 45000,
    runtime: 120,
    temperature_c: 32,
  },
  outlet2: {
    on: true,
    watts: 12,
    power_mw: 12000,
    runtime: 340,
    temperature_c: 28,
  },
  outlet3: { on: false, watts: 0, power_mw: 0, runtime: 0, temperature_c: 24 },
  outlet4: {
    on: true,
    watts: 95,
    power_mw: 95000,
    runtime: 85,
    temperature_c: 35,
  },
};

/* ==========================================================================
   2. PLUG CARD COMPONENT
   ========================================================================== */

export function PlugCard({
  plug,
  onToggleOutlet,
  onToggleMaster,
  onEdit,
  onDelete,
}: PlugCardProps) {
  const router = useRouter();
  const theme = useTheme();
  const { t, i18n } = useTranslation();
  const isArabic = i18n.language?.startsWith("ar") ?? false;
  const isDark = theme.isDark;

  const popover = usePopover();
  const { showConfirmation, confirmationProps } = useConfirmationMessage();
  const deleteMutation = useDeletePlug();

  // Plug info
  const plugName =
    (isArabic
      ? plug?.arabicName || plug?.nameAr
      : plug?.name || plug?.nameEn) ||
    plug?.arabicName ||
    plug?.name ||
    t("DEFAULT_PLUG_NAME");

  const plugId = plug?._id || plug?.id;

  const handleEdit = () => {
    popover.onClose();
    if (onEdit && plug) {
      onEdit(plug);
      return;
    }
    if (plugId) {
      router.push({
        pathname: "/(tabs)/plugs/plug-create-edit-page",
        params: { plugId },
      });
    }
  };

  const handleDelete = () => {
    popover.onClose();
    showConfirmation({
      variant: "Warning",
      title: t("CONFIRM_DELETE_PLUG_TITLE"),
      subtitle: t("CONFIRM_DELETE_PLUG_MESSAGE", { name: plugName }),
      confirmText: t("DELETE"),
      cancelText: t("CANCEL"),
      onConfirm: async () => {
        if (onDelete && plug) {
          onDelete(plug);
          return;
        }
        if (plugId) {
          try {
            await deleteMutation.mutateAsync(plugId);
          } catch (err) {
            console.error("Failed to delete plug:", err);
          }
        }
      },
    });
  };

  // Hook: Pair with strip over local Wi-Fi / TCP (port 10086)
  const {
    isConnected: isStripSocketConnected,
    connectedStripIp,
    outletStates: liveOutletStates,
    outletDetails: liveOutletDetails,
    telemetry: liveTelemetry,
    toggleOutlet: toggleStripOutlet,
    setAllOutlets: setAllStripOutlets,
  } = usePairWithStrip({
    targetStripIp: plug?.ipAddress,
    autoStart: false,
  });

  const toggleMutation = useTogglePlugOutlet();

  const isConnected =
    isStripSocketConnected ||
    Boolean(plug?.connected ?? plug?.isOnline ?? true);
  // Local state for interactive outlets
  const [outlets, setOutlets] = useState<{
    outlet1: OutletProps;
    outlet2: OutletProps;
    outlet3: OutletProps;
    outlet4: OutletProps;
  }>(() => ({
    outlet1: { ...DEFAULT_OUTLETS.outlet1, ...plug?.outlets?.outlet1 },
    outlet2: { ...DEFAULT_OUTLETS.outlet2, ...plug?.outlets?.outlet2 },
    outlet3: { ...DEFAULT_OUTLETS.outlet3, ...plug?.outlets?.outlet3 },
    outlet4: { ...DEFAULT_OUTLETS.outlet4, ...plug?.outlets?.outlet4 },
  }));

  // Sync if plug.outlets changes
  useEffect(() => {
    if (plug?.outlets) {
      setOutlets({
        outlet1: { ...DEFAULT_OUTLETS.outlet1, ...plug.outlets.outlet1 },
        outlet2: { ...DEFAULT_OUTLETS.outlet2, ...plug.outlets.outlet2 },
        outlet3: { ...DEFAULT_OUTLETS.outlet3, ...plug.outlets.outlet3 },
        outlet4: { ...DEFAULT_OUTLETS.outlet4, ...plug.outlets.outlet4 },
      });
    }
  }, [plug?.outlets]);

  // Sync incoming real-time socket states & telemetry from strip (explore.tsx logic)
  useEffect(() => {
    if (Object.keys(liveOutletStates).length > 0) {
      setOutlets((prev) => ({
        outlet1: {
          ...prev.outlet1,
          on: liveOutletStates[1] ?? prev.outlet1.on,
          watts: liveOutletDetails?.[1]?.watts ?? prev.outlet1.watts,
          power_mw: liveOutletDetails?.[1]?.power_mw ?? prev.outlet1.power_mw,
          temperature_c:
            liveOutletDetails?.[1]?.temperature_c ||
            liveTelemetry.temperature ||
            prev.outlet1.temperature_c,
        },
        outlet2: {
          ...prev.outlet2,
          on: liveOutletStates[2] ?? prev.outlet2.on,
          watts: liveOutletDetails?.[2]?.watts ?? prev.outlet2.watts,
          power_mw: liveOutletDetails?.[2]?.power_mw ?? prev.outlet2.power_mw,
          temperature_c:
            liveOutletDetails?.[2]?.temperature_c ||
            liveTelemetry.temperature ||
            prev.outlet2.temperature_c,
        },
        outlet3: {
          ...prev.outlet3,
          on: liveOutletStates[3] ?? prev.outlet3.on,
          watts: liveOutletDetails?.[3]?.watts ?? prev.outlet3.watts,
          power_mw: liveOutletDetails?.[3]?.power_mw ?? prev.outlet3.power_mw,
          temperature_c:
            liveOutletDetails?.[3]?.temperature_c ||
            liveTelemetry.temperature ||
            prev.outlet3.temperature_c,
        },
        outlet4: {
          ...prev.outlet4,
          on: liveOutletStates[4] ?? prev.outlet4.on,
          watts: liveOutletDetails?.[4]?.watts ?? prev.outlet4.watts,
          power_mw: liveOutletDetails?.[4]?.power_mw ?? prev.outlet4.power_mw,
          temperature_c:
            liveOutletDetails?.[4]?.temperature_c ||
            liveTelemetry.temperature ||
            prev.outlet4.temperature_c,
        },
      }));
    }
  }, [liveOutletStates, liveOutletDetails, liveTelemetry]);

  // Outlets toggling (calls local TCP socket if available + cloud backend for 24/7 reliability)
  const handleToggleOutlet = async (
    key: "outlet1" | "outlet2" | "outlet3" | "outlet4",
  ) => {
    const portMap = { outlet1: 1, outlet2: 2, outlet3: 3, outlet4: 4 } as const;
    const outletNum = portMap[key];
    const nextState = !outlets[key].on;

    // Optimistic UI update
    setOutlets((prev) => ({
      ...prev,
      [key]: { ...prev[key], on: nextState },
    }));

    // 1. Direct local TCP if strip is dialed into this phone
    if (isStripSocketConnected) {
      await toggleStripOutlet(outletNum, nextState);
    }

    // 2. Cloud backend API (where strip is dialed into 13.62.76.178:10086)
    if (plugId) {
      try {
        await toggleMutation.mutateAsync({
          plugId,
          outlet: outletNum,
          state: nextState ? "on" : "off",
        });
      } catch (err) {
        console.warn("Cloud toggle failed:", err);
      }
    }

    onToggleOutlet?.(key, nextState);
  };

  const handleToggleMaster = async () => {
    const anyOn = Object.values(outlets).some((o) => o.on);
    const nextState = !anyOn;

    setOutlets({
      outlet1: { ...outlets.outlet1, on: nextState },
      outlet2: { ...outlets.outlet2, on: nextState },
      outlet3: { ...outlets.outlet3, on: nextState },
      outlet4: { ...outlets.outlet4, on: nextState },
    });

    if (isStripSocketConnected) {
      await setAllStripOutlets(nextState);
    }

    if (plugId) {
      for (let i = 1; i <= 4; i++) {
        toggleMutation.mutate({
          plugId,
          outlet: i,
          state: nextState ? "on" : "off",
        });
      }
    }

    onToggleMaster?.(nextState);
  };

  // Reanimated smooth accordion
  const [isExpanded, setIsExpanded] = useState(false);
  const animationProgress = useSharedValue(0);
  const measuredHeight = useSharedValue(600);

  const toggleExpanded = () => {
    const next = !isExpanded;
    setIsExpanded(next);
    animationProgress.value = withTiming(next ? 1 : 0, {
      duration: 380,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
    });
  };

  const animatedAccordionStyle = useAnimatedStyle(() => {
    return {
      height: animationProgress.value * measuredHeight.value,
      opacity: animationProgress.value,
      overflow: "hidden",
    };
  });

  const chevronAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          rotate: `${animationProgress.value * 180}deg`,
        },
      ],
    };
  });

  return (
    <>
      <Card
        style={[
          styles.cardContainer,
          {
            backgroundColor: isDark ? theme.backgroundElement : "white",
            borderColor: isDark ? theme.backgroundSelected : "rgba(0,0,0,0.06)",
          },
        ]}
      >
        {/* 1. Header: Name + Connected Badge & Popover Menu Button */}
        <View style={styles.cardHeader}>
          <View style={{ flex: 1 }}>
            <ThemedText style={styles.plugNameText}>{plugName}</ThemedText>
            {isStripSocketConnected && liveTelemetry.voltage > 0 && (
              <ThemedText
                style={{
                  fontSize: 12,
                  color: theme.primary,
                  fontWeight: "600",
                  marginTop: 2,
                }}
              >
                {liveTelemetry.voltage}V • {liveTelemetry.watts}W •{" "}
                {liveTelemetry.temperature}°C
              </ThemedText>
            )}
          </View>

          <View style={styles.headerRight}>
            <View
              style={[
                styles.connectedBadge,
                isConnected ? styles.badgeOnline : styles.badgeOffline,
              ]}
            >
              <View
                style={[
                  styles.connectedDot,
                  isConnected ? styles.dotOnline : styles.dotOffline,
                ]}
              />
              <ThemedText
                style={[
                  styles.connectedText,
                  isConnected ? styles.textOnline : styles.textOffline,
                ]}
              >
                {isStripSocketConnected
                  ? t("LAN_CONNECTED")
                  : isConnected
                    ? t("DASHBOARD.ONLINE")
                    : t("DASHBOARD.OFFLINE")}
              </ThemedText>
            </View>

            <Pressable
              ref={popover.anchorRef}
              collapsable={false}
              onPress={popover.onOpen}
              hitSlop={8}
              style={({ pressed }) => [
                styles.menuButton,
                pressed && { opacity: 0.6 },
              ]}
            >
              <Lucide
                name="ellipsis-vertical"
                size={18}
                color={theme.textSecondary}
              />
            </Pressable>
          </View>
        </View>

      {/* 2. Electric Power Strip Visual */}
      <ElectricPlug
        disabled={!isConnected}
        outlets={outlets}
        onToggleOutlet={handleToggleOutlet}
        onToggleMaster={handleToggleMaster}
      />

      {/* 3. Outlets Accordion (Smooth Reanimated Container) */}
      <Animated.View
        style={animatedAccordionStyle}
        pointerEvents={isExpanded ? "auto" : "none"}
      >
        <View
          onLayout={(e) => {
            const h = e.nativeEvent.layout.height;
            if (h > 0) {
              measuredHeight.value = h;
            }
          }}
          style={styles.accordionInner}
        >
          <View style={styles.outletsColumn}>
            {([1, 2, 3, 4] as const).map((num) => {
              const outletKey = `outlet${num}` as keyof typeof outlets;
              const outlet = outlets[outletKey];
              const currentAmp =
                outlet.on && outlet.watts
                  ? (outlet.watts / 220).toFixed(2)
                  : "0";

              return (
                <View
                  key={num}
                  style={[
                    styles.outletCard,
                    {
                      backgroundColor: isDark
                        ? theme.backgroundSelected
                        : "#F8FAFC",
                      borderColor: isDark
                        ? theme.backgroundSelected
                        : "rgba(0,0,0,0.06)",
                    },
                  ]}
                >
                  {/* First Line: Outlet Socket, Name, and Switch */}
                  <View style={styles.outletFirstLine}>
                    <View style={styles.outletSocketSection}>
                      <View style={styles.socketMiniWrapper}>
                        <PlugSocket
                          outlet={outlet}
                          hideSwitch
                          disabled={!isConnected}
                        />
                      </View>
                      <ThemedText style={styles.outletTitleText}>
                        {t("OUTLET_NUMBER", { num })}
                      </ThemedText>
                    </View>

                    <Switch
                      disabled={!isConnected}
                      value={outlet.on}
                      onValueChange={() => handleToggleOutlet(outletKey)}
                      trackColor={{
                        false: isDark ? "#38383A" : "#D1D5DB",
                        true: !isConnected
                          ? isDark
                            ? "#4B5563"
                            : "#9CA3AF"
                          : theme.primary,
                      }}
                      thumbColor={
                        !isConnected
                          ? isDark
                            ? "#9CA3AF"
                            : "#D1D5DB"
                          : "#FFFFFF"
                      }
                    />
                  </View>

                  {/* Second Line: Four Stat Cards Stacked in a Row */}
                  <View style={styles.fourStatsRow}>
                    {/* 1. Watts */}
                    <View
                      style={[
                        styles.statCardBox,
                        {
                          backgroundColor: isDark
                            ? "rgba(255,255,255,0.05)"
                            : "rgba(0,0,0,0.03)",
                          borderColor: isDark
                            ? "rgba(255,255,255,0.08)"
                            : "rgba(0,0,0,0.05)",
                        },
                      ]}
                    >
                      <Lucide
                        name="zap"
                        size={15}
                        color={outlet.on ? theme.primary : theme.textSecondary}
                      />
                      <ThemedText
                        numberOfLines={1}
                        adjustsFontSizeToFit
                        minimumFontScale={0.75}
                        style={[
                          styles.statCardText,
                          outlet.on && { color: theme.primary },
                        ]}
                      >
                        {`${outlet.watts ?? 0} ${t("UNIT_WATT")}`}
                      </ThemedText>
                    </View>

                    {/* 2. Milliwatts */}
                    <View
                      style={[
                        styles.statCardBox,
                        {
                          backgroundColor: isDark
                            ? "rgba(255,255,255,0.05)"
                            : "rgba(0,0,0,0.03)",
                          borderColor: isDark
                            ? "rgba(255,255,255,0.08)"
                            : "rgba(0,0,0,0.05)",
                        },
                      ]}
                    >
                      <Lucide
                        name="battery-charging"
                        size={15}
                        color={outlet.on ? theme.primary : theme.textSecondary}
                      />
                      <ThemedText
                        numberOfLines={1}
                        adjustsFontSizeToFit
                        minimumFontScale={0.75}
                        style={[
                          styles.statCardText,
                          outlet.on && { color: theme.primary },
                        ]}
                      >
                        {`${outlet.power_mw ?? 0} ${t("UNIT_MILLIWATT")}`}
                      </ThemedText>
                    </View>

                    {/* 3. Current in Amperes */}
                    <View
                      style={[
                        styles.statCardBox,
                        {
                          backgroundColor: isDark
                            ? "rgba(255,255,255,0.05)"
                            : "rgba(0,0,0,0.03)",
                          borderColor: isDark
                            ? "rgba(255,255,255,0.08)"
                            : "rgba(0,0,0,0.05)",
                        },
                      ]}
                    >
                      <Lucide
                        name="activity"
                        size={15}
                        color={outlet.on ? theme.primary : theme.textSecondary}
                      />
                      <ThemedText
                        numberOfLines={1}
                        adjustsFontSizeToFit
                        minimumFontScale={0.75}
                        style={[
                          styles.statCardText,
                          outlet.on && { color: theme.primary },
                        ]}
                      >
                        {`${currentAmp} ${t("UNIT_AMPERE")}`}
                      </ThemedText>
                    </View>

                    {/* 4. Temperature */}
                    <View
                      style={[
                        styles.statCardBox,
                        {
                          backgroundColor: isDark
                            ? "rgba(255,255,255,0.05)"
                            : "rgba(0,0,0,0.03)",
                          borderColor: isDark
                            ? "rgba(255,255,255,0.08)"
                            : "rgba(0,0,0,0.05)",
                        },
                      ]}
                    >
                      <Lucide
                        name="thermometer"
                        size={15}
                        color={outlet.on ? theme.primary : theme.textSecondary}
                      />
                      <ThemedText
                        numberOfLines={1}
                        adjustsFontSizeToFit
                        minimumFontScale={0.75}
                        style={[
                          styles.statCardText,
                          outlet.on && { color: theme.primary },
                        ]}
                      >
                        {`${outlet.temperature_c ?? (outlet.on ? 32 : 24)}${t("UNIT_CELSIUS")}`}
                      </ThemedText>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      </Animated.View>

      {/* 4. Accordion Toggle Button */}
      <Button
        variant="soft"
        color="primary"
        size="medium"
        fullWidth
        onPress={toggleExpanded}
        style={styles.showMoreButton}
        endIcon={
          <Animated.View style={chevronAnimatedStyle}>
            <Lucide name="chevron-down" size={18} color={theme.primary} />
          </Animated.View>
        }
      >
        {isExpanded ? t("SHOW_LESS") : t("SHOW_MORE")}
      </Button>
      </Card>

      {/* Popover Action Menu */}
      <Popover {...popover} placement="bottom-end">
        <Popover.Item
          icon={<Lucide name="pencil" size={18} color={theme.text} />}
          onPress={handleEdit}
        >
          {t("EDIT")}
        </Popover.Item>
        <Popover.Item
          destructive
          icon={<Lucide name="trash-2" size={18} color="#EF4444" />}
          onPress={handleDelete}
        >
          {t("DELETE")}
        </Popover.Item>
      </Popover>

      {/* Localized Delete Confirmation Dialog */}
      <ConfirmationMessage {...confirmationProps} />
    </>
  );
}

export default PlugCard;

/* ==========================================================================
   3. STYLES
   ========================================================================== */

const styles = StyleSheet.create({
  cardContainer: {
    padding: 16,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  menuButton: {
    padding: 6,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  plugNameText: {
    fontSize: 22,
    fontWeight: "700",
    lineHeight: 35,
  },
  connectedBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 4,
    paddingHorizontal: 9,
    borderRadius: 12,
    gap: 6,
  },
  badgeOnline: {
    backgroundColor: "rgba(16, 185, 129, 0.12)",
  },
  badgeOffline: {
    backgroundColor: "rgba(156, 163, 175, 0.14)",
  },
  connectedDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  dotOnline: {
    backgroundColor: "#10B981",
  },
  dotOffline: {
    backgroundColor: "#9CA3AF",
  },
  connectedText: {
    fontSize: 12,
    fontWeight: "700",
  },
  textOnline: {
    color: "#059669",
  },
  textOffline: {
    color: "#6B7280",
  },
  accordionInner: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
  },
  outletsColumn: {
    gap: 12,
    paddingTop: 18,
  },
  outletCard: {
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    gap: 10,
  },
  outletFirstLine: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  outletSocketSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  socketMiniWrapper: {
    width: 38,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
  },
  outletTitleText: {
    fontSize: 15,
    fontWeight: "700",
  },
  fourStatsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  statCardBox: {
    flex: 1,
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 10,
    borderWidth: 1,
    gap: 4,
    minHeight: 52,
  },
  statCardText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#6B7280",
    textAlign: "center",
  },
  showMoreButton: {
    marginTop: 16,
    borderRadius: 12,
  },
});
