import React, { useState } from "react";
import {
  View,
  Pressable,
  StyleSheet,
  I18nManager,
  Platform,
} from "react-native";
import { useTranslation } from "react-i18next";
import { Lucide } from "@react-native-vector-icons/lucide";

import { ThemedText } from "@/components/themed-text";
import { useTheme } from "@/hooks/use-theme";
import { Card, Popover, usePopover } from "@/components/ui";
import { IDevice } from "@/types/device";
import { useControlStrip } from "@/hooks/use-control-strip";

export interface DeviceStrip {
  _id: string;
  nameAr: string;
  nameEn: string;
  outletsCount?: number;
  totalOutlets?: number;
}

export interface DeviceCardProps {
  /** The device object passed as `device` or `devices` */
  device?: IDevice;
  // onEdit?: (device: DeviceItem) => void;
  // onDelete?: (device: DeviceItem) => void;
  // onTogglePower?: (device: DeviceItem) => void;
  // onMoreDetails?: (device: DeviceItem) => void;
}

export function DeviceCard({
  device,
  // onEdit,
  // onDelete,
  // onTogglePower,
  // onMoreDetails,
}: DeviceCardProps) {
  const theme = useTheme();
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
  const outletState = stripState?.[`outlet${device?.plugPort}` as "outlet1"];
  const outletLiveData =
    liveData?.outlets?.[`outlet${device?.plugPort}` as "outlet1"];

  const isRtl = I18nManager.isRTL;
  const manualRtl = !isRtl && isArabic;
  const rowDir = manualRtl ? "row-reverse" : "row";

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

  // Localized strings
  const deviceName = isArabic ? device?.nameAr : device?.nameEn;
  const stripName = isArabic ? device?.nameAr : device?.nameEn;

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
  return (
    <>
      <Card
        style={[
          styles.card,
          {
            backgroundColor: isDark ? theme.backgroundElement : "#FFFFFF",
            borderColor: isDark ? theme.backgroundSelected : "rgba(0,0,0,0.06)",
          },
        ]}
      >
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

          {/* Left Group: Popover 3-dots Menu Button */}
          <View style={[styles.actionGroup, { flexDirection: rowDir }]}>
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
        <View
          style={[
            styles.metricsBox,
            {
              flexDirection: rowDir,
              backgroundColor: isDark ? "rgba(255, 255, 255, 0.04)" : "#F8FAFC",
              borderColor: isDark
                ? "rgba(255, 255, 255, 0.06)"
                : "rgba(0, 0, 0, 0.03)",
            },
          ]}
        >
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
            <ThemedText
              style={[
                styles.metricLabel,
                { color: isDark ? theme.textSecondary : "#6B7280" },
              ]}
            >
              {t("DEVICE_CARD.VOLTAGE")}
            </ThemedText>
            <ThemedText
              style={[
                styles.metricValue,
                { color: isDark ? theme.text : "#111827" },
              ]}
            >
              {outletState?.on ? `${voltageValue} ${voltageUnit}` : "--"}
            </ThemedText>
          </View>

          {/* Divider 1 */}
          <View
            style={[
              styles.metricDivider,
              {
                backgroundColor: isDark
                  ? "rgba(255, 255, 255, 0.08)"
                  : "#E5E7EB",
              },
            ]}
          />

          {/* Column 2 (Center): Current */}
          <View style={styles.metricColumn}>
            <Lucide
              name="activity"
              size={26}
              color={outletState?.on ? theme.primary : theme.textSecondary}
              style={styles.metricIcon}
            />
            <ThemedText
              style={[
                styles.metricLabel,
                { color: isDark ? theme.textSecondary : "#6B7280" },
              ]}
            >
              {t("DEVICE_CARD.CURRENT")}
            </ThemedText>
            <ThemedText
              style={[
                styles.metricValue,
                { color: isDark ? theme.text : "#111827" },
              ]}
            >
              {outletState?.on ? `${currentValue} ${currentUnit}` : "--"}
            </ThemedText>
          </View>

          {/* Divider 2 */}
          <View
            style={[
              styles.metricDivider,
              {
                backgroundColor: isDark
                  ? "rgba(255, 255, 255, 0.08)"
                  : "#E5E7EB",
              },
            ]}
          />

          {/* Column 3 (Left in Arabic): Power */}
          <View style={styles.metricColumn}>
            <Lucide
              name="zap"
              size={26}
              color={outletState?.on ? theme.primary : theme.textSecondary}
              style={styles.metricIcon}
            />
            <ThemedText
              style={[
                styles.metricLabel,
                { color: isDark ? theme.textSecondary : "#6B7280" },
              ]}
            >
              {t("DEVICE_CARD.POWER")}
            </ThemedText>
            <ThemedText
              style={[
                styles.metricValue,
                { color: isDark ? theme.text : "#111827" },
              ]}
            >
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
                  ? isDark
                    ? "rgba(156, 163, 175, 0.2)"
                    : "#E2E8F0"
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
              color={!isAssigned ? (isDark ? "#9CA3AF" : "#64748B") : "#FFFFFF"}
            />
            <ThemedText
              numberOfLines={1}
              style={[
                styles.powerButtonText,
                !isAssigned && {
                  color: isDark ? "#9CA3AF" : "#64748B",
                },
              ]}
            >
              {powerButtonText}
            </ThemedText>
          </Pressable>

          {/* Details Button (Left side in Arabic mockup) */}
          <Pressable
            // onPress={() => onMoreDetails?.(currentDevice)}
            style={({ pressed }) => [
              styles.detailsButton,
              {
                flexDirection: rowDir,
                borderColor: isDark ? "rgba(255, 255, 255, 0.12)" : "#E5E7EB",
                backgroundColor: isDark ? theme.backgroundElement : "#FFFFFF",
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
            // onEdit?.(currentDevice);
          }}
        >
          {t("EDIT")}
        </Popover.Item>
        <Popover.Item
          destructive
          icon={<Lucide name="trash-2" size={18} color="#EF4444" />}
          onPress={() => {
            popover.onClose();
            // onDelete?.(currentDevice);
          }}
        >
          {t("DELETE")}
        </Popover.Item>
      </Popover>
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
    gap: 16,
    borderRadius: 22,
    borderWidth: 1,
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
    fontWeight: "800",
    fontSize: 16,
    lineHeight: 26,
  },
  subtitleText: {
    fontSize: 12,
    marginTop: 2,
    lineHeight: 18,
    fontWeight: "500",
  },
  actionGroup: {
    alignItems: "center",
    justifyContent: "center",
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
    fontSize: 12,
    marginBottom: 4,
    lineHeight: 17,
    textAlign: "center",
  },
  metricValue: {
    // lineHeight: 20,
    fontWeight: "800",
    fontSize: 16,
    textAlign: "center",
  },
  metricDivider: {
    width: 1,
    height: "65%",
    alignSelf: "center",
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
  },
  detailsButtonText: {
    color: "#10B981",
    fontSize: 13,
    fontWeight: "700",
    textAlign: "center",
  },
});

export default DeviceCard;
