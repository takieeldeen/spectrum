import React, { useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Pressable,
  ActivityIndicator,
  Alert,
  I18nManager,
  Platform,
} from "react-native";
import Svg, { Defs, LinearGradient, Stop, Rect, Path } from "react-native-svg";
import { useTranslation } from "react-i18next";
import { useRouter } from "expo-router";
import { Lucide } from "@react-native-vector-icons/lucide";

import { useTheme } from "@/hooks/use-theme";
import ThemedText from "@/components/themed-text";
import { Fade } from "@/components/ui/fade";
import { useSnackbar } from "@/components/ui/snackbar-provider";
import { useGetDevice, useToggleDevice, useDeleteDevice } from "@/api/device";
import { useControlStrip } from "@/hooks/use-control-strip";
import { DeviceNewEditBottomSheet } from "../new-edit-view";
import { DeviceDetailsLoadingView } from "./loading-view";
import { DeviceTelemetryGrid } from "../components/device-telemetry-grid";
import { DevicePowerChart } from "../components/device-power-chart";
import { DeviceGuardsList } from "../components/device-guards-list";
import { DeviceSpecificationsCard } from "../components/device-specifications-card";
import { GuardNewEditBottomSheet } from "@/../sections/guards";
import { IGuard } from "@/types/guard";
import { Button, Divider } from "@/components/ui";
import {
  DeviceTimerBottomSheet,
  useTimerCountdown,
} from "../components/device-timer-bottom-sheet";

export interface DeviceDetailsViewProps {
  deviceId: string;
}

export function DeviceDetailsView({ deviceId }: DeviceDetailsViewProps) {
  const theme = useTheme();
  const styles = createStyles(theme);
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const snackbar = useSnackbar();
  const isArabic = (i18n.language || "ar").startsWith("ar");
  const isRtl = I18nManager.isRTL || isArabic;

  // Following user rule: do NOT rename `data` to plural
  const { data, isLoading, isFetching, refetch } = useGetDevice(deviceId);
  const toggleMutation = useToggleDevice();
  const deleteMutation = useDeleteDevice();

  const [editSheetVisible, setEditSheetVisible] = useState(false);
  const [guardSheetVisible, setGuardSheetVisible] = useState(false);
  const [timerSheetVisible, setTimerSheetVisible] = useState(false);
  const [selectedGuard, setSelectedGuard] = useState<IGuard | null>(null);
  const [isTogglingPower, setIsTogglingPower] = useState(false);

  const { isActive: hasActiveTimer, formatted: countdownFormatted } =
    useTimerCountdown(data?.timerClosesAt);

  // Strip Control Integration
  const stripId =
    typeof data?.plugId === "string" ? data?.plugId : data?.plugId?._id;
  const isAssigned = !!data?.plugId && data?.plugId !== "";

  const { liveData, stripState, toggleOutlet } = useControlStrip({
    stripId: stripId || "",
  });

  const outletState = stripState?.[`outlet${data?.plugPort}` as "outlet1"];
  const outletLiveData =
    liveData?.outlets?.[`outlet${data?.plugPort}` as "outlet1"];

  const isOn = !!outletState?.on;

  React.useEffect(() => {
    if (!isOn && timerSheetVisible) {
      setTimerSheetVisible(false);
    }
  }, [isOn, timerSheetVisible]);

  const plugObj = typeof data?.plugId === "object" ? data.plugId : undefined;
  const stripName = plugObj?.name;

  const subtitle = !isAssigned
    ? t("DEVICE_DETAILS.STATUS_UNASSIGNED")
    : stripName
      ? `${stripName} • ${t("DEVICE_CARD.OUTLET_NUMBER", { num: data?.plugPort })}`
      : t("DEVICE_CARD.OUTLET_NUMBER", { num: data?.plugPort });

  const stateColors = !isAssigned
    ? {
        primary: "#9CA3AF",
        bg: theme.backgroundSecondary,
        label: t("DEVICE_DETAILS.STATUS_UNASSIGNED"),
      }
    : isOn
      ? {
          primary: "#10B981",
          bg: theme.activeCardBackground,
          label: t("DEVICE_DETAILS.STATUS_ONLINE"),
        }
      : {
          primary: "#F97316",
          bg: theme.backgroundSecondary,
          label: t("DEVICE_DETAILS.STATUS_OFFLINE"),
        };

  const currentVal =
    outletLiveData?.current_A !== undefined
      ? `${outletLiveData.current_A.toFixed(2)}A`
      : "0.00A";
  const voltageVal =
    liveData?.voltage !== undefined
      ? `${Math.round(liveData.voltage)}V`
      : "220V";
  const powerVal =
    outletLiveData?.power_W !== undefined
      ? `${outletLiveData.power_W.toFixed(1)}W`
      : "0.0W";
  const tempVal =
    outletLiveData?.temperature_c !== undefined
      ? `${outletLiveData.temperature_c.toFixed(1)}°`
      : "25.0°";

  const handleTogglePower = async () => {
    if (!isAssigned || isTogglingPower) return;
    const nextState = !isOn ? "on" : "off";
    setIsTogglingPower(true);

    try {
      // 1. Instant local hardware command via socket
      toggleOutlet(nextState, data?.plugPort!);

      // 2. Synchronize with backend API
      await toggleMutation.mutateAsync({
        id: deviceId,
        state: nextState,
      });

      snackbar.success(
        nextState === "on"
          ? t("DEVICE_DETAILS.POWER_TURNING_ON")
          : t("DEVICE_DETAILS.POWER_TURNING_OFF"),
      );
    } catch (err: any) {
      snackbar.error(err?.message || "Failed to toggle power");
    } finally {
      setIsTogglingPower(false);
    }
  };

  const handleDeleteDevice = () => {
    Alert.alert(
      t("DEVICE_DETAILS.DELETE_CONFIRM_TITLE"),
      t("DEVICE_DETAILS.DELETE_CONFIRM_MESSAGE"),
      [
        {
          text: t("DEVICE_DETAILS.CANCEL"),
          style: "cancel",
        },
        {
          text: t("DEVICE_DETAILS.DELETE"),
          style: "destructive",
          onPress: async () => {
            try {
              await deleteMutation.mutateAsync(deviceId);
              snackbar.success(t("DEVICE_DETAILS.DELETE_SUCCESS"));
              router.back();
            } catch (err: any) {
              snackbar.error(err?.message || "Failed to delete device");
            }
          },
        },
      ],
    );
  };

  return (
    <View style={styles.container}>
      {/* 1. Loading State with Fade */}
      <Fade in={isLoading} duration={250} style={styles.stateWrapper}>
        <DeviceDetailsLoadingView />
      </Fade>

      {/* 2. Loaded Details Content with Fade */}
      <Fade
        in={!isLoading && !!data}
        duration={250}
        style={styles.stateWrapper}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isFetching}
              onRefresh={refetch}
              tintColor={theme.primary}
            />
          }
        >
          <View style={styles.cardContainer}>
            <View style={StyleSheet.absoluteFill}>
              <Svg width="100%" height="100%">
                <Defs>
                  <LinearGradient
                    id="cardGrad"
                    x1="0%"
                    y1="0%"
                    x2="100%"
                    y2="100%"
                  >
                    <Stop offset="0%" stopColor="#0B875D" />
                    <Stop offset="50%" stopColor="#0A7A55" />
                    <Stop offset="100%" stopColor="#066746" />
                  </LinearGradient>
                </Defs>
                <Rect
                  width="100%"
                  height="100%"
                  rx={12}
                  fill="url(#cardGrad)"
                />
                {/* Subtle decorative wavy curves */}
                <Path
                  d="M -20,120 Q 80,60 220,130 T 450,110 L 450,220 L -20,220 Z"
                  fill="rgba(255, 255, 255, 0.05)"
                />
                <Path
                  d="M -30,80 Q 70,140 180,90 T 460,130 L 460,220 L -30,220 Z"
                  fill="rgba(0, 0, 0, 0.04)"
                />
              </Svg>
            </View>
            <View
              style={{
                flexDirection: "row",
                gap: 12,
                alignItems: "flex-start",
              }}
            >
              <View
                style={[styles.heroIconBox, { backgroundColor: "#ffffff30" }]}
              >
                <Lucide name="plug" size={32} color={"white"} />
              </View>
              <View style={{ flex: 1 }}>
                <ThemedText
                  style={{
                    color: "white",
                    fontSize: 18,
                    fontWeight: "800",
                  }}
                  numberOfLines={1}
                >
                  {data?.name || t("DEVICE_DETAILS.DEFAULT_TYPE_VAL")}
                </ThemedText>
                <ThemedText
                  style={{
                    color: "rgba(255, 255, 255, 0.8)",
                    fontSize: 12,
                    marginTop: 2,
                  }}
                  numberOfLines={1}
                >
                  {subtitle}
                </ThemedText>
              </View>
              <View
                style={[
                  styles.statusBadge,
                  {
                    backgroundColor: "rgba(255, 255, 255, 0.22)",
                    borderRadius: 24,
                  },
                ]}
              >
                <View
                  style={[
                    styles.statusDot,
                    { backgroundColor: stateColors.primary },
                  ]}
                />
                <ThemedText
                  style={[styles.statusBadgeText, { color: "white" }]}
                >
                  {stateColors.label}
                </ThemedText>
              </View>
            </View>

            {/* Four Telemetry Metrics: Current, Voltage, Power, Temperature */}
            <View style={{ marginTop: 16 }}>
              {/* Row 1: Current & Voltage */}
              <View
                style={{
                  flexDirection: "row",
                  paddingVertical: 10,
                }}
              >
                <View style={{ flex: 1, alignItems: "center" }}>
                  <ThemedText
                    style={{
                      color: "rgba(255, 255, 255, 0.75)",
                      fontSize: 13,
                      fontWeight: "600",
                    }}
                  >
                    {t("DEVICE_DETAILS.METRIC_CURRENT")}
                  </ThemedText>
                  <ThemedText
                    style={{
                      color: "white",
                      fontSize: 18,
                      fontWeight: "800",
                      marginTop: 2,
                    }}
                  >
                    {currentVal}
                  </ThemedText>
                </View>
                <Divider
                  orientation="vertical"
                  flexItem
                  color="rgba(255, 255, 255, 0.22)"
                />
                <View style={{ flex: 1, alignItems: "center" }}>
                  <ThemedText
                    style={{
                      color: "rgba(255, 255, 255, 0.75)",
                      fontSize: 13,
                      fontWeight: "600",
                    }}
                  >
                    {t("DEVICE_DETAILS.METRIC_VOLTAGE")}
                  </ThemedText>
                  <ThemedText
                    style={{
                      color: "white",
                      fontSize: 18,
                      fontWeight: "800",
                      marginTop: 2,
                    }}
                  >
                    {voltageVal}
                  </ThemedText>
                </View>
              </View>

              <Divider color="rgba(255, 255, 255, 0.22)" />

              {/* Row 2: Power & Temperature */}
              <View
                style={{
                  flexDirection: "row",
                  paddingVertical: 10,
                }}
              >
                <View style={{ flex: 1, alignItems: "center" }}>
                  <ThemedText
                    style={{
                      color: "rgba(255, 255, 255, 0.75)",
                      fontSize: 13,
                      fontWeight: "600",
                    }}
                  >
                    {t("DEVICE_DETAILS.METRIC_POWER")}
                  </ThemedText>
                  <ThemedText
                    style={{
                      color: "white",
                      fontSize: 18,
                      fontWeight: "800",
                      marginTop: 2,
                    }}
                  >
                    {powerVal}
                  </ThemedText>
                </View>
                <Divider
                  orientation="vertical"
                  flexItem
                  color="rgba(255, 255, 255, 0.22)"
                />
                <View style={{ flex: 1, alignItems: "center" }}>
                  <ThemedText
                    style={{
                      color: "rgba(255, 255, 255, 0.75)",
                      fontSize: 13,
                      fontWeight: "600",
                    }}
                  >
                    {t("DEVICE_DETAILS.METRIC_TEMP")}
                  </ThemedText>
                  <ThemedText
                    style={{
                      color: "white",
                      fontSize: 18,
                      fontWeight: "800",
                      marginTop: 2,
                    }}
                  >
                    {tempVal}
                  </ThemedText>
                </View>
              </View>
            </View>
          </View>

          {/* Action Buttons: Edit, Play/Pause, Delete */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              gap: 12,
            }}
          >
            {/* 1. Edit Button */}
            <Button
              style={{ flex: 1, height: 86 }}
              variant="outlined"
              onPress={() => setEditSheetVisible(true)}
            >
              <View style={{ alignItems: "center", gap: 6 }}>
                <Lucide name="edit" color={theme.primary} size={22} />
                <ThemedText style={{ color: theme.primary, fontWeight: "700" }}>
                  {t("DEVICE_DETAILS.EDIT")}
                </ThemedText>
              </View>
            </Button>

            {/* 2. Play / Pause Action Button */}
            <Button
              style={{ flex: 1, height: 86 }}
              variant="outlined"
              onPress={handleTogglePower}
              disabled={!isAssigned || isTogglingPower}
            >
              <View style={{ alignItems: "center", gap: 6 }}>
                {isTogglingPower ? (
                  <ActivityIndicator size="small" color={theme.primary} />
                ) : (
                  <Lucide
                    name={isOn ? "pause" : "play"}
                    color={theme.primary}
                    size={22}
                  />
                )}
                <ThemedText style={{ color: theme.primary, fontWeight: "700" }}>
                  {isOn
                    ? t("DEVICE_DETAILS.ACTION_PAUSE")
                    : t("DEVICE_DETAILS.ACTION_PLAY")}
                </ThemedText>
              </View>
            </Button>

            {/* 3. Delete Button */}
            <Button
              style={{ flex: 1, height: 86 }}
              variant="outlined"
              onPress={handleDeleteDevice}
            >
              <View style={{ alignItems: "center", gap: 6 }}>
                <Lucide name="trash-2" color={theme.logoutText} size={22} />
                <ThemedText
                  style={{ color: theme.logoutText, fontWeight: "700" }}
                >
                  {t("DEVICE_DETAILS.DELETE")}
                </ThemedText>
              </View>
            </Button>
          </View>

          {/* Sleep Timer Card (Only visible when device is ON) */}
          <Fade in={isOn && isAssigned} duration={250} unmountOnExit>
            <Pressable
              onPress={() => setTimerSheetVisible(true)}
              style={({ pressed }) => [
                styles.timerCard,
                hasActiveTimer && styles.activeTimerCard,
                pressed && { opacity: 0.85 },
              ]}
            >
              <View style={[styles.timerCardContent, { flexDirection: "row" }]}>
                <View
                  style={[
                    styles.timerCardIconBox,
                    hasActiveTimer && styles.activeTimerCardIconBox,
                  ]}
                >
                  <Lucide
                    name={hasActiveTimer ? "hourglass" : "timer"}
                    size={24}
                    color={theme.primary}
                  />
                </View>

                <View
                  style={[
                    styles.timerCardTextGroup,
                    // { alignItems: isArabic ? "flex-end" : "flex-start" },
                  ]}
                >
                  <ThemedText style={styles.timerCardTitle}>
                    {hasActiveTimer
                      ? t("SLEEP_TIMER.ACTIVE_TIMER")
                      : t("SLEEP_TIMER.TITLE")}
                  </ThemedText>
                  <ThemedText
                    style={styles.timerCardSubtitle}
                    numberOfLines={1}
                  >
                    {hasActiveTimer
                      ? `${t("SLEEP_TIMER.TURNS_OFF_IN")} ${countdownFormatted}`
                      : t("SLEEP_TIMER.SUBTITLE")}
                  </ThemedText>
                </View>

                <View style={styles.timerCardAction}>
                  {hasActiveTimer ? (
                    <ThemedText style={styles.timerCountdownBig}>
                      {countdownFormatted}
                    </ThemedText>
                  ) : (
                    <View
                      style={[styles.setTimerChip, { flexDirection: "row" }]}
                    >
                      <ThemedText style={styles.setTimerChipText}>
                        {t("SLEEP_TIMER.SET_TIMER")}
                      </ThemedText>
                      <Lucide
                        name={isArabic ? "chevron-left" : "chevron-right"}
                        size={16}
                        color={theme.primary}
                      />
                    </View>
                  )}
                </View>
              </View>
            </Pressable>
          </Fade>

          {/* Technical Specifications & Location */}
          <DeviceSpecificationsCard device={data} isConnected={!!liveData} />
          {/* Smart Safety Guards */}
          <DeviceGuardsList
            deviceId={deviceId}
            onAddGuard={() => {
              setSelectedGuard(null);
              setGuardSheetVisible(true);
            }}
            onEditGuard={(guard) => {
              setSelectedGuard(guard);
              setGuardSheetVisible(true);
            }}
          />
        </ScrollView>
      </Fade>

      {/* Edit Device Bottom Sheet */}
      <DeviceNewEditBottomSheet
        visible={editSheetVisible}
        onClose={() => setEditSheetVisible(false)}
        currentDevice={data}
        onSuccess={refetch}
      />

      {/* Guard New / Edit Bottom Sheet */}
      <GuardNewEditBottomSheet
        visible={guardSheetVisible}
        onClose={() => {
          setGuardSheetVisible(false);
          setSelectedGuard(null);
        }}
        deviceId={deviceId}
        currentGuard={selectedGuard}
        onSuccess={refetch}
      />

      {/* Sleep Timer Bottom Sheet */}
      <DeviceTimerBottomSheet
        visible={timerSheetVisible}
        onClose={() => setTimerSheetVisible(false)}
        device={data}
        onSuccess={refetch}
      />
    </View>
  );
}

const createStyles = (theme: ReturnType<typeof useTheme>) =>
  StyleSheet.create({
    cardContainer: {
      width: "100%",
      borderRadius: 12,
      overflow: "hidden",
      paddingHorizontal: 16,
      paddingTop: 18,
      paddingBottom: 16,
      marginBottom: 8,
      position: "relative",
      ...Platform.select({
        ios: {
          shadowColor: "#0A7A55",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.25,
          shadowRadius: 10,
        },
        android: {
          elevation: 4,
        },
      }),
    },
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    stateWrapper: {
      flex: 1,
    },
    scrollContent: {
      paddingHorizontal: 20,
      paddingTop: 12,
      paddingBottom: 48,
      gap: 12,
    },
    heroCard: {
      backgroundColor: theme.cardBackground,
      borderRadius: 24,
      padding: 20,
      borderWidth: 1,
      borderColor: theme.divider,
      gap: 16,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.05,
      shadowRadius: 10,
      elevation: 2,
    },
    heroTopRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    deviceIdentity: {
      flexDirection: "row",
      alignItems: "center",
      gap: 14,
      flex: 1,
      marginRight: 10,
    },
    heroIconBox: {
      width: 58,
      height: 58,
      borderRadius: 20,
      alignItems: "center",
      justifyContent: "center",
    },
    heroTitles: {
      flex: 1,
      gap: 3,
    },
    deviceName: {
      fontSize: 20,
      fontWeight: "800",
      color: theme.text,
    },
    deviceSubtitle: {
      fontSize: 13,
      color: theme.textSecondary,
    },
    statusBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 20,
    },
    statusDot: {
      width: 7,
      height: 7,
      borderRadius: 4,
    },
    statusBadgeText: {
      fontSize: 12,
      fontWeight: "700",
    },
    masterPowerButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 10,
      height: 52,
      borderRadius: 18,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.12,
      shadowRadius: 6,
      elevation: 3,
    },
    masterPowerText: {
      fontSize: 16,
      fontWeight: "700",
      color: "#FFFFFF",
    },
    quickActionsRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
    actionButton: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      height: 42,
      borderRadius: 14,
      backgroundColor: theme.backgroundSecondary,
      borderWidth: 1,
      borderColor: theme.divider,
    },
    deleteButton: {
      backgroundColor: theme.isDark ? "rgba(239, 68, 68, 0.12)" : "#FEF2F2",
      borderColor: theme.isDark ? "rgba(239, 68, 68, 0.25)" : "#FEE2E2",
    },
    actionButtonText: {
      fontSize: 13,
      fontWeight: "700",
      color: theme.text,
    },
    timerCard: {
      backgroundColor: theme.cardBackground,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: theme.cardBorder,
      padding: 16,
    },
    activeTimerCard: {
      backgroundColor: theme.activeCardBackground,
      borderColor: theme.activeCardBorder,
    },
    timerCardContent: {
      alignItems: "center",
      gap: 12,
    },
    timerCardIconBox: {
      width: 44,
      height: 44,
      borderRadius: 14,
      backgroundColor: theme.tintedIconBackground,
      alignItems: "center",
      justifyContent: "center",
    },
    activeTimerCardIconBox: {
      backgroundColor: theme.cardBackground,
    },
    timerCardTextGroup: {
      flex: 1,
    },
    timerCardTitle: {
      fontSize: 15,
      fontWeight: "700",
      color: theme.text,
    },
    timerCardSubtitle: {
      fontSize: 12,
      color: theme.textSecondary,
      marginTop: 2,
    },
    timerCardAction: {
      alignItems: "center",
      justifyContent: "center",
    },
    timerCountdownBig: {
      fontSize: 17,
      fontWeight: "800",
      color: theme.primary,
      fontVariant: ["tabular-nums"],
    },
    setTimerChip: {
      alignItems: "center",
      gap: 4,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 12,
      backgroundColor: theme.tintedIconBackground,
    },
    setTimerChipText: {
      fontSize: 12,
      fontWeight: "700",
      color: theme.primary,
    },
  });

export default DeviceDetailsView;
