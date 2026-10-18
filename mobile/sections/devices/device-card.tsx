import React, { useState } from "react";
import { View, Pressable, StyleSheet } from "react-native";
import { useTranslation } from "react-i18next";
import { Lucide } from "@react-native-vector-icons/lucide";

import { ThemedText } from "@/components/themed-text";
import { useTheme } from "@/hooks/use-theme";
import { Button, Card, Divider, Popover, usePopover } from "@/components/ui";

export interface DeviceStrip {
  _id: string;
  nameAr: string;
  nameEn: string;
}

export interface DeviceItem {
  _id: string;
  nameAr: string;
  nameEn: string;
  strip?: DeviceStrip;
  plugPort?: number;
  voltage?: number | string;
  current?: number | string;
  power?: number | string;
  isOn?: boolean;
  isOnline?: boolean;
  connected?: boolean;
}

export interface DeviceCardProps {
  /** The device object passed as `device` or `devices` */
  device?: DeviceItem;
  devices?: DeviceItem;
  onEdit?: (device: DeviceItem) => void;
  onDelete?: (device: DeviceItem) => void;
  onTogglePower?: (device: DeviceItem) => void;
  onMoreDetails?: (device: DeviceItem) => void;
}

export function DeviceCard({
  device,
  devices,
  onEdit,
  onDelete,
  onTogglePower,
  onMoreDetails,
}: DeviceCardProps) {
  // Support both `device` and `devices` prop naming seamlessly
  const currentDevice = devices ?? device;

  const theme = useTheme();
  const { t, i18n } = useTranslation();
  const isArabic = i18n.language?.startsWith("ar") ?? false;
  const isDark = theme.isDark;

  const popover = usePopover();

  // Local power state fallback
  const [internalIsOn, setInternalIsOn] = useState(currentDevice?.isOn ?? true);
  const isOn = currentDevice?.isOn !== undefined ? currentDevice.isOn : internalIsOn;

  if (!currentDevice) {
    return null;
  }

  // Localized strings
  const deviceName = isArabic
    ? currentDevice.nameAr || currentDevice.nameEn
    : currentDevice.nameEn || currentDevice.nameAr;

  const stripName = currentDevice.strip
    ? isArabic
      ? currentDevice.strip.nameAr || currentDevice.strip.nameEn
      : currentDevice.strip.nameEn || currentDevice.strip.nameAr
    : "";

  const portText = currentDevice.plugPort
    ? isArabic
      ? `مخرج ${currentDevice.plugPort}`
      : `Outlet ${currentDevice.plugPort}`
    : isArabic
    ? "مخرج ١"
    : "Outlet 1";

  const subtitle = stripName ? `${stripName} - ${portText}` : portText;

  const voltageValue = currentDevice.voltage ?? 220;
  const currentValue = currentDevice.current ?? 0.12;
  const powerValue = currentDevice.power ?? 27;

  const voltageUnit = isArabic ? "فولت" : "V";
  const currentUnit = isArabic ? "أمبير" : "A";
  const powerUnit = isArabic ? "واط" : "W";

  const isConnected = currentDevice.connected ?? currentDevice.isOnline ?? true;

  const handleToggle = () => {
    setInternalIsOn(!isOn);
    onTogglePower?.(currentDevice);
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
        {/* Header Row: Plug Icon + Titles + Connected Indicator + 3-dots Menu Button */}
        <View style={styles.headerRow}>
          <View style={styles.titleGroup}>
            <View style={styles.iconWrapper}>
              <View
                style={[
                  styles.iconCircle,
                  { backgroundColor: `${theme.primary}20` },
                ]}
              >
                <Lucide name="plug" size={24} color={theme.primary} />
              </View>
              {/* Badge dot on the avatar icon */}
              <View
                style={[
                  styles.iconStatusDot,
                  {
                    backgroundColor: isConnected ? "#10B981" : "#9CA3AF",
                    borderColor: isDark ? theme.backgroundElement : "#FFFFFF",
                  },
                ]}
              />
            </View>

            <View style={styles.titleTextContainer}>
              <ThemedText style={styles.titleText} type="default">
                {deviceName}
              </ThemedText>
              <ThemedText style={{ color: theme.textSecondary, fontSize: 13 }}>
                {subtitle}
              </ThemedText>
            </View>
          </View>

          <View style={styles.actionGroup}>
            {/* Connected Status Pill */}
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
                {isConnected
                  ? isArabic
                    ? "متصل"
                    : "Connected"
                  : isArabic
                  ? "غير متصل"
                  : "Offline"}
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
                size={20}
                color={theme.textSecondary}
              />
            </Pressable>
          </View>
        </View>

        {/* Real-time Metrics Panel */}
        <View
          style={[
            styles.metricsBox,
            {
              backgroundColor: isDark ? theme.backgroundSelected : "#F4F6F8",
            },
          ]}
        >
          {/* Voltage */}
          <View style={styles.metricItem}>
            <Lucide name="plug" color={theme.primary} size={32} />
            <View>
              <ThemedText style={styles.metricLabel}>
                {isArabic ? "فرق الجهد" : "Voltage"}
              </ThemedText>
              <ThemedText style={styles.metricValue}>
                {`${voltageValue} ${voltageUnit}`}
              </ThemedText>
            </View>
          </View>

          <Divider />

          {/* Current */}
          <View style={styles.metricItem}>
            <Lucide name="activity" color={theme.primary} size={32} />
            <View>
              <ThemedText style={styles.metricLabel}>
                {isArabic ? "شدة التيار" : "Current"}
              </ThemedText>
              <ThemedText style={styles.metricValue}>
                {`${currentValue} ${currentUnit}`}
              </ThemedText>
            </View>
          </View>

          <Divider />

          {/* Power */}
          <View style={styles.metricItem}>
            <Lucide name="zap" color={theme.primary} size={32} />
            <View>
              <ThemedText style={styles.metricLabel}>
                {isArabic ? "الاستهلاك الآن" : "Power"}
              </ThemedText>
              <ThemedText style={styles.metricValue}>
                {`${powerValue} ${powerUnit}`}
              </ThemedText>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <Button
          fullWidth
          size="large"
          color={isOn ? "error" : "primary"}
          variant={isOn ? "contained" : "outlined"}
          endIcon={
            <Lucide
              name={isOn ? "pause" : "play"}
              color={isOn ? "#FFFFFF" : theme.primary}
              size={18}
            />
          }
          onPress={handleToggle}
        >
          {isOn
            ? isArabic
              ? "إيقاف الجهاز"
              : "Pause Device"
            : isArabic
            ? "تشغيل الجهاز"
            : "Turn On"}
        </Button>

        <Button
          fullWidth
          size="large"
          color="primary"
          variant="outlined"
          onPress={() => onMoreDetails?.(currentDevice)}
        >
          {isArabic ? "تفاصيل إضافية" : "More Details"}
        </Button>
      </Card>

      {/* Popover Menu */}
      <Popover {...popover} placement="bottom-end">
        <Popover.Item
          icon={<Lucide name="pencil" size={18} color={theme.text} />}
          onPress={() => {
            popover.onClose();
            onEdit?.(currentDevice);
          }}
        >
          {isArabic ? "تعديل" : "Edit"}
        </Popover.Item>
        <Popover.Item
          destructive
          icon={<Lucide name="trash-2" size={18} color="#EF4444" />}
          onPress={() => {
            popover.onClose();
            onDelete?.(currentDevice);
          }}
        >
          {isArabic ? "حذف" : "Delete"}
        </Popover.Item>
      </Popover>
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    minHeight: 160,
    padding: 20,
    gap: 14,
    borderRadius: 18,
    borderWidth: 1,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  titleGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  iconWrapper: {
    position: "relative",
  },
  iconCircle: {
    height: 48,
    width: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  iconStatusDot: {
    position: "absolute",
    bottom: -1,
    right: -1,
    width: 13,
    height: 13,
    borderRadius: 7,
    borderWidth: 2,
  },
  titleTextContainer: {
    flex: 1,
    flexDirection: "column",
    alignItems: "flex-start",
  },
  titleText: {
    fontWeight: "700",
    fontSize: 20,
  },
  actionGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
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
  menuButton: {
    padding: 8,
    borderRadius: 20,
  },
  metricsBox: {
    borderRadius: 14,
    padding: 12,
    gap: 12,
  },
  metricItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  metricLabel: {
    fontSize: 13,
  },
  metricValue: {
    fontWeight: "700",
    fontSize: 17,
  },
});

export default DeviceCard;
