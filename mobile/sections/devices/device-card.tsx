import React, { useState } from "react";
import {
  View,
  Pressable,
  StyleSheet,
  I18nManager,
  Platform,
} from "react-native";
import { useTranslation } from "react-i18next";
import { useRouter } from "expo-router";
import { Lucide } from "@react-native-vector-icons/lucide";

import { ThemedText } from "@/components/themed-text";
import { useTheme } from "@/hooks/use-theme";
import {
  Card,
  Popover,
  usePopover,
  Skeleton,
  SkeletonAnimation,
} from "@/components/ui";
import { IDevice } from "@/types/device";
import { useControlStrip } from "@/hooks/use-control-strip";
import {
  DeviceTimerBottomSheet,
  useTimerCountdown,
} from "./components/device-timer-bottom-sheet";

export interface DeviceStrip {
  _id: string;
  name: string;
  nameEn?: string;
  outletsCount?: number;
  totalOutlets?: number;
}

export interface DeviceCardProps {
  /** The device object passed as `device` or `devices` */
  device?: IDevice;
  onEdit?: (device: IDevice) => void;
  // onDelete?: (device: DeviceItem) => void;
  // onTogglePower?: (device: DeviceItem) => void;
  // onMoreDetails?: (device: DeviceItem) => void;
}

export function DeviceCard({
  device,
  onEdit,
  // onDelete,
  // onTogglePower,
  // onMoreDetails,
}: DeviceCardProps) {
  const theme = useTheme();
  const styles = createStyles(theme);
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const isArabic = i18n.language?.startsWith("ar") ?? true;
  const isDark = theme.isDark;
  const isAssigned = !!device?.plugId && device?.plugId !== "";
  const stripId =
    typeof device?.plugId === "string" ? device?.plugId : device?.plugId?._id;
  const { liveData, stripState, toggleOutlet } = useControlStrip({
    stripId: stripId!,
  });
  const popover = usePopover();
  const [timerSheetVisible, setTimerSheetVisible] = useState(false);
  const { isActive: hasActiveTimer, formatted: countdownFormatted } =
    useTimerCountdown(device?.timerClosesAt);
  const outletState = stripState?.[`outlet${device?.plugPort}` as "outlet1"];
  const outletLiveData =
    liveData?.outlets?.[`outlet${device?.plugPort}` as "outlet1"];

  React.useEffect(() => {
    if (!outletState?.on && timerSheetVisible) {
      setTimerSheetVisible(false);
    }
  }, [outletState?.on, timerSheetVisible]);

  const isRtl = isArabic;
  const rowDir = "row";

  const deviceState: "on" | "off" | "not-assigned" = !isAssigned
    ? "not-assigned"
    : outletState?.on
      ? "on"
      : "off";

  const stateColors = {
    on: {
      primary: "#10B981",
      bg: isDark ? "rgba(16, 185, 129, 0.15)" : "#E8FAF4",
    },
    off: {
      primary: "#F97316",
      bg: isDark ? "rgba(249, 115, 22, 0.15)" : "#FFF7ED",
    },
    "not-assigned": {
      primary: "#9CA3AF",
      bg: isDark ? "rgba(156, 163, 175, 0.15)" : "#F3F4F6",
    },
  }[deviceState];

  const deviceName = device?.name;
  const plugObj =
    typeof device?.plugId === "object" ? device.plugId : undefined;
  const stripName = plugObj?.name;

  const outletsText = isAssigned
    ? t("DEVICE_CARD.OUTLET_NUMBER", { num: device?.plugPort })
    : t("DEVICE_CARD.UNASSIGNED");

  const subtitle = !isAssigned
    ? t("DEVICE_CARD.UNASSIGNED")
    : stripName
      ? `${stripName} • ${outletsText}`
      : outletsText;

  const voltageValue = liveData?.voltage?.toFixed(2) ?? 0;
  const currentValue = outletLiveData?.current_A?.toFixed(2) ?? 0;
  const powerValue = outletLiveData?.power_W?.toFixed(2) ?? 0;

  const voltageUnit = t("DEVICE_CARD.UNIT_VOLT");
  const currentUnit = t("DEVICE_CARD.UNIT_AMPERE");
  const powerUnit = t("DEVICE_CARD.UNIT_WATT");

  const powerButtonText = !isAssigned
    ? t("DEVICE_CARD.UNASSIGNED")
    : (outletState?.on
        ? t("DEVICE_CARD.TURN_OFF")
        : t("DEVICE_CARD.TURN_ON")
      ).replace(/\s+/g, "\u00A0");

  const detailsButtonText = t("DEVICE_CARD.MORE_DETAILS").replace(
    /\s+/g,
    "\u00A0",
  );

  const handleToggle = () => {
    if (!isAssigned) return;
    const nextState = !outletState?.on ? "on" : "off";
    toggleOutlet(nextState, device?.plugPort!);
  };

  const handleNavigateToDetails = () => {
    if (device?._id) {
      router.push(`/(tabs)/devices/${device._id}` as any);
    }
  };
  return (
    <>
      <Card style={styles.card}>
        {/* 1. Header Row */}
        {/* Child 0 (Right in Arabic): Plug icon with corner indicator & Titles */}
        {/* Child 1 (Left in Arabic): 3-dots menu button */}
        <View style={[styles.headerRow, { flexDirection: rowDir }]}>
          {/* Right Group: Plug Icon with Corner Indicator & Titles */}
          <View style={[styles.titleGroup, { flexDirection: rowDir }]}>
            <View style={styles.iconWrapper}>
              <View
                style={[
                  styles.plugIconBox,
                  {
                    backgroundColor: stateColors.bg,
                  },
                ]}
              >
                <Lucide name="plug" size={24} color={stateColors.primary} />
              </View>

              {/* Status Indicator Dot at the Corner of the Icon Box */}
              <View
                style={[
                  styles.cornerIndicatorDot,
                  {
                    backgroundColor: stateColors.primary,
                    borderColor: isDark ? theme.backgroundElement : "#FFFFFF",
                  },
                ]}
              />
            </View>

            <View
              style={[styles.titleTextContainer, { alignItems: "flex-start" }]}
            >
              <ThemedText
                style={[
                  styles.titleText,
                  {
                    color: isDark ? theme.text : "#111827",
                    textAlign: isArabic ? "right" : "left",
                  },
                ]}
                numberOfLines={1}
              >
                {deviceName}
              </ThemedText>
              <ThemedText
                style={[
                  styles.subtitleText,
                  {
                    color: isDark ? theme.textSecondary : "#6B7280",
                    textAlign: isArabic ? "right" : "left",
                  },
                ]}
              >
                {subtitle}
              </ThemedText>
            </View>
          </View>

          {/* Left Group: Timer Badge & Popover 3-dots Menu Button */}
          <View style={[styles.actionGroup, { flexDirection: rowDir }]}>
            {hasActiveTimer && outletState?.on && (
              <Pressable
                onPress={() => setTimerSheetVisible(true)}
                hitSlop={6}
                style={({ pressed }) => [
                  styles.timerBadge,
                  pressed && { opacity: 0.75 },
                  { flexDirection: rowDir },
                ]}
              >
                <Lucide name="timer" size={13} color={theme.primary} />
                <ThemedText style={styles.timerBadgeText}>
                  {countdownFormatted}
                </ThemedText>
              </Pressable>
            )}

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
                size={20}
                color={theme.textSecondary}
              />
            </Pressable>
          </View>
        </View>

        {/* 2. Real-time 3-Column Metrics Panel */}
        {/* Child 0 (Right in Arabic): Voltage (فرق الجهد) */}
        {/* Child 2 (Center in Arabic): Current (شدة التيار) */}
        {/* Child 4 (Left in Arabic): Power (الاستهلاك الآن) */}
        <View style={[styles.metricsBox, { flexDirection: rowDir }]}>
          {/* Column 1 (Right in Arabic): Voltage */}
          <View style={styles.metricColumn}>
            <View
              style={[
                styles.circledV,
                {
                  borderColor: outletState?.on
                    ? theme.primary
                    : theme.textSecondary,
                },
              ]}
            >
              <ThemedText
                style={[
                  styles.circledVText,
                  {
                    color: outletState?.on
                      ? theme.primary
                      : theme.textSecondary,
                  },
                ]}
              >
                V
              </ThemedText>
            </View>
            <ThemedText style={styles.metricLabel}>
              {t("DEVICE_CARD.VOLTAGE")}
            </ThemedText>
            <ThemedText style={styles.metricValue}>
              {outletState?.on ? `${voltageValue} ${voltageUnit}` : "--"}
            </ThemedText>
          </View>

          {/* Divider 1 */}
          <View style={styles.metricDivider} />

          {/* Column 2 (Center): Current */}
          <View style={styles.metricColumn}>
            <Lucide
              name="activity"
              size={26}
              color={outletState?.on ? theme.primary : theme.textSecondary}
              style={styles.metricIcon}
            />
            <ThemedText style={styles.metricLabel}>
              {t("DEVICE_CARD.CURRENT")}
            </ThemedText>
            <ThemedText style={styles.metricValue}>
              {outletState?.on ? `${currentValue} ${currentUnit}` : "--"}
            </ThemedText>
          </View>

          {/* Divider 2 */}
          <View style={styles.metricDivider} />

          {/* Column 3 (Left in Arabic): Power */}
          <View style={styles.metricColumn}>
            <Lucide
              name="zap"
              size={26}
              color={outletState?.on ? theme.primary : theme.textSecondary}
              style={styles.metricIcon}
            />
            <ThemedText style={styles.metricLabel}>
              {t("DEVICE_CARD.POWER")}
            </ThemedText>
            <ThemedText style={styles.metricValue}>
              {outletState?.on ? `${powerValue} ${powerUnit}` : "--"}
            </ThemedText>
          </View>
        </View>

        {/* 3. Action Buttons Row */}
        {/* Child 0 (Right in Arabic): Power Button (إيقاف الجهاز) */}
        {/* Child 1 (Left in Arabic): Details Button (تفاصيل إضافية) */}
        <View style={[styles.actionsRow, { flexDirection: rowDir }]}>
          {/* Power Button (Right side in Arabic mockup) */}
          <Pressable
            disabled={!isAssigned}
            onPress={handleToggle}
            style={({ pressed }) => [
              styles.powerButton,
              {
                flexDirection: rowDir,
                backgroundColor: !isAssigned
                  ? theme.backgroundSelected
                  : outletState?.on
                    ? "#FF4B60"
                    : "#10B981",
                opacity: !isAssigned ? 0.6 : pressed ? 0.85 : 1,
              },
            ]}
          >
            <Lucide
              name={outletState?.on ? "pause" : "power"}
              size={18}
              color={!isAssigned ? theme.textSecondary : "#FFFFFF"}
            />
            <ThemedText
              numberOfLines={1}
              style={[
                styles.powerButtonText,
                !isAssigned && {
                  color: theme.textSecondary,
                },
              ]}
            >
              {powerButtonText}
            </ThemedText>
          </Pressable>

          {/* Details Button (Left side in Arabic mockup) */}
          <Pressable
            onPress={handleNavigateToDetails}
            style={({ pressed }) => [
              styles.detailsButton,
              {
                flexDirection: rowDir,
                opacity: pressed ? 0.85 : 1,
              },
            ]}
          >
            <ThemedText numberOfLines={1} style={styles.detailsButtonText}>
              {detailsButtonText}
            </ThemedText>
            <Lucide
              name={isArabic ? "chevron-left" : "chevron-right"}
              size={18}
              color="#10B981"
            />
          </Pressable>
        </View>
      </Card>

      {/* Popover Menu */}
      <Popover {...popover} placement="bottom-end">
        <Popover.Item
          icon={<Lucide name="pencil" size={18} color={theme.text} />}
          onPress={() => {
            popover.onClose();
            if (device) {
              onEdit?.(device);
            }
          }}
        >
          {t("EDIT")}
        </Popover.Item>
        {outletState?.on && (
          <Popover.Item
            icon={<Lucide name="timer" size={18} color={theme.text} />}
            onPress={() => {
              popover.onClose();
              setTimerSheetVisible(true);
            }}
          >
            {t("SLEEP_TIMER.TITLE")}
          </Popover.Item>
        )}
        <Popover.Item
          destructive
          icon={<Lucide name="trash-2" size={18} color="#EF4444" />}
          onPress={() => {
            popover.onClose();
          }}
        >
          {t("DELETE")}
        </Popover.Item>
      </Popover>

      {/* Sleep Timer Bottom Sheet */}
      <DeviceTimerBottomSheet
        visible={timerSheetVisible}
        onClose={() => setTimerSheetVisible(false)}
        device={device}
      />
    </>
  );
}

/* ==========================================================================
   4. SKELETON COMPONENT (Mockup Loading View)
   ========================================================================== */

export interface DeviceCardSkeletonProps {
  animation?: SkeletonAnimation;
}

export function DeviceCardSkeleton({
  animation = "wave",
}: DeviceCardSkeletonProps) {
  const theme = useTheme();
  const styles = createStyles(theme);
  const { i18n } = useTranslation();
  const isArabic = i18n.language?.startsWith("ar") ?? true;
  const isRtl = isArabic;
  const rowDir = "row";

  return (
    <Card style={styles.skeletonCard}>
      {/* 1. Header Row: 48x48 icon square + two text lines */}
      <View style={[styles.skeletonHeaderRow, { flexDirection: rowDir }]}>
        <View style={[styles.skeletonTitleGroup, { flexDirection: rowDir }]}>
          <Skeleton
            animation={animation}
            variant="rounded"
            width={48}
            height={48}
            borderRadius={16}
          />
          <View
            style={[
              styles.skeletonTextContainer,
              { alignItems: isArabic ? "flex-end" : "flex-start" },
            ]}
          >
            <Skeleton
              animation={animation}
              variant="text"
              width={110}
              height={14}
              borderRadius={7}
            />
            <Skeleton
              animation={animation}
              variant="text"
              width={165}
              height={12}
              borderRadius={6}
              style={{ marginTop: 8 }}
            />
          </View>
        </View>
      </View>

      {/* 2. Metrics Box: 3 columns with circular skeleton & two text bars */}
      <View style={[styles.skeletonMetricsBox, { flexDirection: rowDir }]}>
        {/* Metric 1 */}
        <View style={styles.skeletonMetricColumn}>
          <Skeleton
            animation={animation}
            variant="circular"
            width={28}
            height={28}
          />
          <Skeleton
            animation={animation}
            variant="rounded"
            width={38}
            height={10}
            borderRadius={5}
            style={{ marginTop: 8 }}
          />
          <Skeleton
            animation={animation}
            variant="rounded"
            width={48}
            height={14}
            borderRadius={6}
            style={{ marginTop: 6 }}
          />
        </View>

        <View style={styles.skeletonMetricDivider} />

        {/* Metric 2 */}
        <View style={styles.skeletonMetricColumn}>
          <Skeleton
            animation={animation}
            variant="circular"
            width={28}
            height={28}
          />
          <Skeleton
            animation={animation}
            variant="rounded"
            width={38}
            height={10}
            borderRadius={5}
            style={{ marginTop: 8 }}
          />
          <Skeleton
            animation={animation}
            variant="rounded"
            width={48}
            height={14}
            borderRadius={6}
            style={{ marginTop: 6 }}
          />
        </View>

        <View style={styles.skeletonMetricDivider} />

        {/* Metric 3 */}
        <View style={styles.skeletonMetricColumn}>
          <Skeleton
            animation={animation}
            variant="circular"
            width={28}
            height={28}
          />
          <Skeleton
            animation={animation}
            variant="rounded"
            width={38}
            height={10}
            borderRadius={5}
            style={{ marginTop: 8 }}
          />
          <Skeleton
            animation={animation}
            variant="rounded"
            width={48}
            height={14}
            borderRadius={6}
            style={{ marginTop: 6 }}
          />
        </View>
      </View>

      {/* 3. Actions Row: Two side-by-side button pills */}
      <View style={[styles.skeletonActionsRow, { flexDirection: rowDir }]}>
        <Skeleton
          animation={animation}
          variant="rounded"
          height={48}
          borderRadius={16}
          style={{ flex: 1.25 }}
        />
        <Skeleton
          animation={animation}
          variant="rounded"
          height={48}
          borderRadius={16}
          style={{ flex: 1 }}
        />
      </View>
    </Card>
  );
}

/* ==========================================================================
   5. EMPTY COMPONENT (Small Component Empty State)
   ========================================================================== */

export interface DeviceCardEmptyProps {
  onAssign?: () => void;
}

export function DeviceCardEmpty({ onAssign }: DeviceCardEmptyProps) {
  const theme = useTheme();
  const styles = createStyles(theme);
  const { t } = useTranslation();

  return (
    <Card style={styles.emptyCard}>
      <Pressable
        onPress={onAssign}
        style={({ pressed }) => [
          styles.emptyCardContent,
          pressed && { opacity: 0.7 },
        ]}
      >
        <View style={styles.emptyIconCircle}>
          <Lucide name="plus" size={24} color={theme.primary} />
        </View>
        <ThemedText weight="700" style={styles.emptyCardTitle}>
          {t("DEVICE_CARD.EMPTY_TITLE")}
        </ThemedText>
        <ThemedText style={styles.emptyCardSubtitle}>
          {t("DEVICE_CARD.EMPTY_SUBTITLE")}
        </ThemedText>
      </Pressable>
    </Card>
  );
}

/* ==========================================================================
   6. STYLES (Dark Mode Aware via createStyles)
   ========================================================================== */

const createStyles = (theme: ReturnType<typeof useTheme>) =>
  StyleSheet.create({
    card: {
      padding: 16,
      gap: 16,
      borderRadius: 22,
      borderWidth: 1,
      backgroundColor: theme.cardBackground,
      borderColor: theme.cardBorder,
      ...Platform.select({
        ios: {
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.04,
          shadowRadius: 10,
        },
        android: {
          elevation: 2,
        },
      }),
    },
    headerRow: {
      alignItems: "center",
      justifyContent: "space-between",
    },
    titleGroup: {
      alignItems: "center",
      gap: 12,
      flex: 1,
    },
    iconWrapper: {
      position: "relative",
    },
    plugIconBox: {
      width: 48,
      height: 48,
      borderRadius: 16,
      alignItems: "center",
      justifyContent: "center",
    },
    cornerIndicatorDot: {
      position: "absolute",
      bottom: -1,
      right: -1,
      width: 14,
      height: 14,
      borderRadius: 7,
      borderWidth: 2.5,
    },
    titleTextContainer: {
      flex: 1,
      justifyContent: "center",
    },
    titleText: {
      color: theme.text,
      fontWeight: "800",
      fontSize: 16,
      lineHeight: 26,
    },
    subtitleText: {
      color: theme.textSecondary,
      fontSize: 12,
      marginTop: 2,
      lineHeight: 18,
      fontWeight: "500",
    },
    actionGroup: {
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
    },
    timerBadge: {
      alignItems: "center",
      gap: 4,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
      backgroundColor: theme.activeCardBackground,
      borderWidth: 1,
      borderColor: theme.activeCardBorder,
    },
    timerBadgeText: {
      fontSize: 11,
      fontWeight: "700",
      color: theme.primary,
      fontVariant: ["tabular-nums"],
    },
    menuButton: {
      padding: 6,
      borderRadius: 16,
      alignItems: "center",
      justifyContent: "center",
    },
    metricsBox: {
      borderRadius: 16,
      borderWidth: 1,
      paddingVertical: 14,
      paddingHorizontal: 8,
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: theme.backgroundSecondary,
      borderColor: theme.divider,
    },
    metricColumn: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
    },
    metricIcon: {
      marginBottom: 6,
    },
    circledV: {
      width: 26,
      height: 26,
      borderRadius: 13,
      borderWidth: 2,
      borderColor: "#10B981",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 6,
    },
    circledVText: {
      fontSize: 13,
      fontWeight: "800",
      color: "#10B981",
      lineHeight: 16,
      textAlign: "center",
      includeFontPadding: false,
    },
    metricLabel: {
      color: theme.textSecondary,
      fontSize: 12,
      marginBottom: 4,
      lineHeight: 17,
      textAlign: "center",
    },
    metricValue: {
      color: theme.text,
      fontWeight: "800",
      fontSize: 16,
      textAlign: "center",
    },
    metricDivider: {
      width: 1,
      height: "65%",
      alignSelf: "center",
      backgroundColor: theme.divider,
    },
    actionsRow: {
      alignItems: "center",
      gap: 8,
    },
    powerButton: {
      flex: 1.25,
      height: 48,
      borderRadius: 16,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 8,
      gap: 6,
    },
    powerButtonText: {
      color: "#FFFFFF",
      fontSize: 13,
      fontWeight: "700",
      textAlign: "center",
    },
    detailsButton: {
      flex: 1,
      height: 48,
      borderRadius: 16,
      borderWidth: 1.5,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 6,
      gap: 6,
      borderColor: theme.cardBorder,
      backgroundColor: theme.cardBackground,
    },
    detailsButtonText: {
      color: "#10B981",
      fontSize: 13,
      fontWeight: "700",
      textAlign: "center",
    },

    /* Skeleton Styles */
    skeletonCard: {
      padding: 16,
      gap: 16,
      borderRadius: 22,
      borderWidth: 1,
      backgroundColor: theme.cardBackground,
      borderColor: theme.cardBorder,
      ...Platform.select({
        ios: {
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.04,
          shadowRadius: 10,
        },
        android: {
          elevation: 2,
        },
      }),
    },
    skeletonHeaderRow: {
      alignItems: "center",
      justifyContent: "space-between",
    },
    skeletonTitleGroup: {
      alignItems: "center",
      gap: 12,
      flex: 1,
    },
    skeletonTextContainer: {
      flex: 1,
      justifyContent: "center",
    },
    skeletonMetricsBox: {
      borderRadius: 16,
      borderWidth: 1,
      paddingVertical: 14,
      paddingHorizontal: 8,
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: theme.backgroundSecondary,
      borderColor: theme.divider,
    },
    skeletonMetricColumn: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
    },
    skeletonMetricDivider: {
      width: 1,
      height: "65%",
      alignSelf: "center",
      backgroundColor: theme.divider,
    },
    skeletonActionsRow: {
      alignItems: "center",
      gap: 8,
    },

    /* Empty Card Styles */
    emptyCard: {
      padding: 24,
      borderRadius: 22,
      borderWidth: 1.5,
      borderStyle: "dashed",
      borderColor: theme.divider,
      backgroundColor: theme.cardBackground,
      alignItems: "center",
      justifyContent: "center",
    },
    emptyCardContent: {
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      width: "100%",
    },
    emptyIconCircle: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: theme.tintedIconBackground,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 4,
    },
    emptyCardTitle: {
      fontSize: 15,
      color: theme.text,
      textAlign: "center",
    },
    emptyCardSubtitle: {
      fontSize: 13,
      color: theme.textSecondary,
      textAlign: "center",
    },
  });

export default DeviceCard;
