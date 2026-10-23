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
import { useTogglePlugOutlet, useDeletePlug } from "@/api/plug";
import { OutletState, useControlStrip } from "@/hooks/use-control-strip";

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
  const {
    liveData,
    toggleOutlet,
    toggleAllOutlet,
    stripState,
    connected: stripConnected,
    isLoading: stripLoading,
  } = useControlStrip({
    stripId: plug?._id!,
  });
  const connected = !stripLoading && stripConnected;
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

  // Outlets toggling (calls backend API which relays to strip via TCP)
  const handleToggleOutlet = async (
    key: "outlet1" | "outlet2" | "outlet3" | "outlet4",
  ) => {
    const portMap = { outlet1: 1, outlet2: 2, outlet3: 3, outlet4: 4 } as const;
    const outletNum = portMap[key];
    const nextState = !stripState?.[key].on;

    if (plugId) {
      try {
        toggleOutlet(nextState ? "on" : "off", outletNum);
      } catch (err) {
        console.warn("Cloud toggle failed:", err);
      }
    }

    onToggleOutlet?.(key, nextState);
  };

  const handleToggleMaster = async () => {
    const anyOn = Object.values(stripState!).some((o) => o.on);
    const nextState = !anyOn;
    toggleAllOutlet();
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
            // backgroundColor: isDark ? theme.backgroundElement : "white",
            borderColor: isDark ? theme.backgroundSelected : "rgba(0,0,0,0.06)",
          },
        ]}
      >
        {/* 1. Header: Name + Connected Badge & Popover Menu Button */}
        <View style={styles.cardHeader}>
          <View style={{ flex: 1 }}>
            <ThemedText style={styles.plugNameText}>{plugName}</ThemedText>
          </View>
          <View style={styles.headerRight}>
            <View
              style={[
                styles.connectedBadge,
                connected ? styles.badgeOnline : styles.badgeOffline,
              ]}
            >
              <View
                style={[
                  styles.connectedDot,
                  connected ? styles.dotOnline : styles.dotOffline,
                ]}
              />
              <ThemedText
                style={[
                  styles.connectedText,
                  connected ? styles.textOnline : styles.textOffline,
                ]}
              >
                {connected ? t("DASHBOARD.ONLINE") : t("DASHBOARD.OFFLINE")}
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
          disabled={!connected}
          outlets={stripState!}
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
                const outletKey = `outlet${num}` as
                  | "outlet1"
                  | "outlet2"
                  | "outlet3"
                  | "outlet4";
                const outletLiveData = liveData?.outlets?.[outletKey];

                return (
                  <View
                    key={num}
                    style={[
                      styles.outletCard,
                      {
                        backgroundColor: theme.backgroundSecondary,
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
                            outlet={outletLiveData}
                            hideSwitch
                            disabled={!connected}
                          />
                        </View>
                        <ThemedText style={styles.outletTitleText}>
                          {t("OUTLET_NUMBER", { num })}
                        </ThemedText>
                      </View>

                      <Switch
                        disabled={!connected}
                        value={outletLiveData?.on}
                        onValueChange={() => handleToggleOutlet(outletKey)}
                        trackColor={{
                          false: isDark ? "#38383A" : "#D1D5DB",
                          true: !connected
                            ? isDark
                              ? "#4B5563"
                              : "#9CA3AF"
                            : theme.primary,
                        }}
                        thumbColor={
                          !connected
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
                          color={
                            outletLiveData?.on
                              ? theme.primary
                              : theme.textSecondary
                          }
                        />
                        <ThemedText
                          numberOfLines={1}
                          adjustsFontSizeToFit
                          minimumFontScale={0.75}
                          style={[
                            styles.statCardText,
                            outletLiveData?.on && { color: theme.primary },
                          ]}
                        >
                          {`${outletLiveData?.power_W?.toFixed(2) ?? 0} ${t("UNIT_WATT")}`}
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
                          color={
                            outletLiveData?.on
                              ? theme.primary
                              : theme.textSecondary
                          }
                        />
                        <ThemedText
                          numberOfLines={1}
                          adjustsFontSizeToFit
                          minimumFontScale={0.75}
                          style={[
                            styles.statCardText,
                            outletLiveData?.on && { color: theme.primary },
                          ]}
                        >
                          {`${liveData?.voltage?.toFixed(0) ?? 0} ${t("VOLT")}`}
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
                          color={
                            outletLiveData?.on
                              ? theme.primary
                              : theme.textSecondary
                          }
                        />
                        <ThemedText
                          numberOfLines={1}
                          adjustsFontSizeToFit
                          minimumFontScale={0.75}
                          style={[
                            styles.statCardText,
                            outletLiveData?.on && { color: theme.primary },
                          ]}
                        >
                          {`${outletLiveData?.current_A?.toFixed(2) ?? 0} ${t("UNIT_AMPERE")}`}
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
                          color={
                            outletLiveData?.on
                              ? theme.primary
                              : theme.textSecondary
                          }
                        />
                        <ThemedText
                          numberOfLines={1}
                          adjustsFontSizeToFit
                          minimumFontScale={0.75}
                          style={[
                            styles.statCardText,
                            outletLiveData?.on && { color: theme.primary },
                          ]}
                        >
                          {`${outletLiveData?.temperature_c ?? (outletLiveData?.on ? 32 : 24)}${t("UNIT_CELSIUS")}`}
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
