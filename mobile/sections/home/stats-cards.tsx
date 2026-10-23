import React, { useMemo } from "react";
import {
  View,
  StyleSheet,
  I18nManager,
  Platform,
  ViewStyle,
} from "react-native";
import { useTheme } from "@/hooks/use-theme";
import ThemedText from "@/components/themed-text";
import Lucide from "@react-native-vector-icons/lucide";

export interface StatsCardsProps {
  totalPower?: number;
  totalEnergy?: number;
  activeDevicesCount?: number;
  estimatedCost?: number;
  energyTrend?: string;
  costTrend?: string;
}

export const StatsCards: React.FC<StatsCardsProps> = ({
  totalPower = 0,
  totalEnergy = 0,
  activeDevicesCount = 0,
  estimatedCost,
  energyTrend = "12%",
  costTrend = "8%",
}) => {
  const theme = useTheme();
  const isDark = theme.isDark;
  const isRtl = I18nManager.isRTL;

  const calculatedCost =
    estimatedCost ?? Number(((totalEnergy ?? 0) * 0.68).toFixed(2));

  // Harmonious palette aligned with the dashboard's emerald / mint brand theme
  const cardColors = useMemo(
    () => ({
      // Current Power: Emerald / Teal
      power: {
        iconBg: isDark ? "rgba(10, 122, 85, 0.25)" : "#E6F4EE",
        icon: isDark ? "#34D399" : "#0A7A55",
      },
      // Total Energy: Brand Green
      energy: {
        iconBg: isDark ? "rgba(5, 150, 105, 0.22)" : "#EAF7F0",
        icon: isDark ? "#34D399" : "#059669",
        badgeBg: isDark ? "rgba(5, 150, 105, 0.22)" : "#E6F8EF",
        badgeText: isDark ? "#34D399" : "#059669",
      },
      // Devices Count: Soft Mint / Forest
      devices: {
        iconBg: isDark ? "rgba(19, 163, 117, 0.2)" : "#ECF8F3",
        bar: isDark ? "#6EE7B7" : "#0A7A55",
      },
      // Cost: Warm Amber / Gold complement
      cost: {
        iconBg: isDark ? "rgba(217, 119, 6, 0.2)" : "#FEF3C7",
        icon: isDark ? "#FBBF24" : "#D97706",
        badgeBg: isDark ? "rgba(217, 119, 6, 0.2)" : "#FEF3C7",
        badgeText: isDark ? "#FBBF24" : "#B45309",
      },
    }),
    [isDark],
  );

  const rowStyle: ViewStyle = {
    flexDirection: isRtl ? "row" : "row-reverse",
    gap: 12,
  };

  const cardInnerStyle: ViewStyle = {
    flexDirection: isRtl ? "row" : "row-reverse",
    justifyContent: "space-between",
    alignItems: "center",
    flex: 1,
  };

  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={styles.container}>
      {/* Top Row: Current Power & Total Consumption */}
      <View style={rowStyle}>
        {/* Current Power */}
        <View style={styles.card}>
          <View style={cardInnerStyle}>
            {/* Text side */}
            <View style={styles.textContainer}>
              <ThemedText style={styles.cardTitle}>القدرة الحالية</ThemedText>
              <ThemedText style={styles.cardValue}>
                {totalPower.toFixed(2)}
              </ThemedText>
              <ThemedText style={styles.cardUnit}>واط</ThemedText>
            </View>

            {/* Icon side */}
            <View style={styles.iconContainer}>
              <View
                style={[
                  styles.iconCircle,
                  { backgroundColor: cardColors.power.iconBg },
                ]}
              >
                <Lucide name="zap" size={22} color={cardColors.power.icon} />
              </View>
            </View>
          </View>
        </View>

        {/* Total Consumption */}
        <View style={styles.card}>
          <View style={cardInnerStyle}>
            {/* Text side */}
            <View style={styles.textContainer}>
              <ThemedText style={styles.cardTitle}>إجمالي الاستهلاك</ThemedText>
              <ThemedText style={styles.cardValue}>
                {totalEnergy.toFixed(2)}
              </ThemedText>
              <ThemedText style={styles.cardUnit}>كيلو واط . ساعة</ThemedText>
            </View>

            {/* Icon side with trend badge */}
            <View style={styles.iconContainer}>
              <View
                style={[
                  styles.iconCircle,
                  { backgroundColor: cardColors.energy.iconBg },
                ]}
              >
                <Lucide name="leaf" size={22} color={cardColors.energy.icon} />
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* Bottom Row: Connected Devices & Estimated Cost */}
      <View style={rowStyle}>
        {/* Device Count */}
        <View style={styles.card}>
          <View style={cardInnerStyle}>
            {/* Text side */}
            <View style={styles.textContainer}>
              <ThemedText style={styles.cardTitle}>عدد الأجهزة</ThemedText>
              <ThemedText style={styles.cardValue}>
                {activeDevicesCount}
              </ThemedText>
              <ThemedText style={styles.cardUnit}>أجهزة متصلة</ThemedText>
            </View>

            {/* Icon side: 3 Bar Chart indicator in theme brand colors */}
            <View style={styles.iconContainer}>
              <View
                style={[
                  styles.iconCircle,
                  { backgroundColor: cardColors.devices.iconBg },
                ]}
              >
                <View style={styles.barsIcon}>
                  <View
                    style={[
                      styles.bar,
                      {
                        height: 10,
                        backgroundColor: cardColors.devices.bar,
                        opacity: 0.6,
                      },
                    ]}
                  />
                  <View
                    style={[
                      styles.bar,
                      {
                        height: 15,
                        backgroundColor: cardColors.devices.bar,
                        opacity: 0.85,
                      },
                    ]}
                  />
                  <View
                    style={[
                      styles.bar,
                      {
                        height: 20,
                        backgroundColor: cardColors.devices.bar,
                      },
                    ]}
                  />
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Estimated Cost */}
        <View style={styles.card}>
          <View style={cardInnerStyle}>
            {/* Text side */}
            <View style={styles.textContainer}>
              <ThemedText style={styles.cardTitle}>
                التكلفة التقريبية
              </ThemedText>
              <ThemedText style={styles.cardValue}>
                {calculatedCost.toFixed(2)}
              </ThemedText>
              <ThemedText style={styles.cardUnit}>جنيه اليوم</ThemedText>
            </View>

            {/* Icon side with trend badge */}
            <View style={styles.iconContainer}>
              <View
                style={[
                  styles.iconCircle,
                  { backgroundColor: cardColors.energy.iconBg },
                ]}
              >
                <Lucide name="coins" size={22} color={cardColors.energy.icon} />
              </View>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
};

export default StatsCards;

const createStyles = (theme: ReturnType<typeof useTheme>) => {
  const isDark = theme.isDark;

  return StyleSheet.create({
    container: {
      gap: 12,
      width: "100%",
    },
    card: {
      flex: 1,
      minHeight: 118,
      borderRadius: 22,
      backgroundColor: isDark ? theme.backgroundElement : "#FFFFFF",
      borderWidth: 1,
      borderColor: isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.05)",
      paddingHorizontal: 16,
      paddingVertical: 14,
      justifyContent: "center",
      ...Platform.select({
        ios: {
          shadowColor: "#000000",
          shadowOffset: { width: 0, height: 3 },
          shadowOpacity: isDark ? 0.25 : 0.05,
          shadowRadius: 8,
        },
        android: {
          elevation: 2,
        },
      }),
    },
    textContainer: {
      alignItems: "flex-start",
      justifyContent: "center",
      flex: 1,
    },
    cardTitle: {
      fontSize: 13,
      fontWeight: "600",
      color: theme.textSecondary,
      textAlign: "right",
    },
    cardValue: {
      fontSize: 28,
      lineHeight: 34,
      fontWeight: "800",
      color: theme.text,
      marginVertical: 2,
      textAlign: "right",
    },
    cardUnit: {
      fontSize: 12,
      fontWeight: "500",
      color: theme.textSecondary,
      textAlign: "right",
    },
    iconContainer: {
      alignItems: "center",
      justifyContent: "center",
      minWidth: 46,
    },
    iconCircle: {
      width: 46,
      height: 46,
      borderRadius: 23,
      alignItems: "center",
      justifyContent: "center",
    },
    trendBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 3,
      paddingHorizontal: 7,
      paddingVertical: 2.5,
      borderRadius: 999,
      marginTop: 6,
    },
    trendText: {
      fontSize: 11,
      fontWeight: "700",
    },
    barsIcon: {
      flexDirection: "row",
      alignItems: "flex-end",
      gap: 3,
      height: 20,
    },
    bar: {
      width: 4,
      borderRadius: 2,
    },
  });
};
