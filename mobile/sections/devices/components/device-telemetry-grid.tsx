import React from "react";
import { View, StyleSheet, I18nManager } from "react-native";
import { useTranslation } from "react-i18next";
import { Lucide } from "@react-native-vector-icons/lucide";

import { useTheme } from "@/hooks/use-theme";
import ThemedText from "@/components/themed-text";

export interface DeviceTelemetryGridProps {
  powerW?: number;
  voltage?: number;
  currentA?: number;
  temperatureC?: number;
  isOn?: boolean;
  isAssigned?: boolean;
}

export function DeviceTelemetryGrid({
  powerW = 0,
  voltage = 0,
  currentA = 0,
  temperatureC = 0,
  isOn = false,
  isAssigned = false,
}: DeviceTelemetryGridProps) {
  const theme = useTheme();
  const styles = createStyles(theme);
  const { t, i18n } = useTranslation();
  const isArabic = (i18n.language || "ar").startsWith("ar");
  const isRtl = I18nManager.isRTL || isArabic;

  const showValues = isAssigned && isOn;

  const metrics = [
    {
      id: "power",
      label: t("DEVICE_DETAILS.METRIC_POWER"),
      value: showValues ? `${powerW.toFixed(1)} ${t("DEVICE_CARD.UNIT_WATT")}` : "--",
      icon: "zap" as const,
      color: theme.primary,
      accentBg: theme.isDark ? "rgba(16, 185, 129, 0.12)" : "#E8FAF4",
    },
    {
      id: "voltage",
      label: t("DEVICE_DETAILS.METRIC_VOLTAGE"),
      value: showValues ? `${voltage.toFixed(0)} ${t("DEVICE_CARD.UNIT_VOLT")}` : "--",
      customIcon: (
        <View style={styles.circledVIcon}>
          <ThemedText style={styles.circledVText}>V</ThemedText>
        </View>
      ),
      color: "#3B82F6",
      accentBg: theme.isDark ? "rgba(59, 130, 246, 0.12)" : "#EFF6FF",
    },
    {
      id: "current",
      label: t("DEVICE_DETAILS.METRIC_CURRENT"),
      value: showValues ? `${currentA.toFixed(2)} ${t("DEVICE_CARD.UNIT_AMPERE")}` : "--",
      icon: "activity" as const,
      color: "#F59E0B",
      accentBg: theme.isDark ? "rgba(245, 158, 11, 0.12)" : "#FEF3C7",
    },
    {
      id: "temp",
      label: t("DEVICE_DETAILS.METRIC_TEMP"),
      value: showValues ? `${temperatureC.toFixed(0)}°` : "--",
      icon: "thermometer" as const,
      color: "#EF4444",
      accentBg: theme.isDark ? "rgba(239, 68, 68, 0.12)" : "#FEE2E2",
    },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.sectionHeader}>
        <Lucide name="gauge" size={20} color={theme.primary} />
        <ThemedText style={styles.sectionTitle}>
          {t("DEVICE_DETAILS.TELEMETRY_TITLE")}
        </ThemedText>
      </View>

      <View style={styles.grid}>
        {metrics.map((m) => (
          <View key={m.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={[styles.iconCircle, { backgroundColor: m.accentBg }]}>
                {m.customIcon ? (
                  m.customIcon
                ) : (
                  <Lucide name={m.icon!} size={18} color={m.color} />
                )}
              </View>
              <ThemedText numberOfLines={1} style={styles.metricLabel}>
                {m.label}
              </ThemedText>
            </View>

            <ThemedText numberOfLines={1} style={styles.metricValue}>
              {m.value}
            </ThemedText>
          </View>
        ))}
      </View>
    </View>
  );
}

const createStyles = (theme: ReturnType<typeof useTheme>) =>
  StyleSheet.create({
    container: {
      gap: 12,
    },
    sectionHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      paddingHorizontal: 4,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: "700",
      color: theme.text,
    },
    grid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 12,
    },
    card: {
      flex: 1,
      minWidth: "46%",
      backgroundColor: theme.cardBackground,
      borderRadius: 18,
      padding: 16,
      borderWidth: 1,
      borderColor: theme.divider,
      gap: 12,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.04,
      shadowRadius: 6,
      elevation: 1,
    },
    cardHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
    iconCircle: {
      width: 36,
      height: 36,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
    },
    circledVIcon: {
      width: 20,
      height: 20,
      borderRadius: 10,
      borderWidth: 1.5,
      borderColor: "#3B82F6",
      alignItems: "center",
      justifyContent: "center",
    },
    circledVText: {
      fontSize: 11,
      fontWeight: "800",
      color: "#3B82F6",
      lineHeight: 13,
      textAlign: "center",
    },
    metricLabel: {
      fontSize: 13,
      color: theme.textSecondary,
      flex: 1,
    },
    metricValue: {
      fontSize: 18,
      fontWeight: "800",
      color: theme.text,
    },
  });

export default DeviceTelemetryGrid;
