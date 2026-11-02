import React, { useMemo } from "react";
import {
  View,
  StyleSheet,
  I18nManager,
  Platform,
  ViewStyle,
} from "react-native";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/hooks/use-theme";
import ThemedText from "@/components/themed-text";
import Lucide from "@react-native-vector-icons/lucide";
import { useAuth } from "@/context/auth-context";
import { Fade } from "@/components/ui/fade";
import i18n from "@/i18n";

export interface StatsCardsProps {
  totalPower?: number;
  totalEnergy?: number;
  activeDevicesCount?: number;
  estimatedCost?: number;
  energyTrend?: string;
  costTrend?: string;
  isEmpty?: boolean;
}

/* ==========================================================================
   EMPTY STATE COMPONENT (For Stats Cards Section)
   ========================================================================== */

export interface StatsCardsEmptyViewProps {
  styles: ReturnType<typeof createStyles>;
  theme: ReturnType<typeof useTheme>;
  iconBg: string;
  iconColor: string;
}

export const StatsCardsEmptyView: React.FC<StatsCardsEmptyViewProps> = ({
  styles,
  iconBg,
  iconColor,
}) => {
  const { t } = useTranslation();

  return (
    <View style={styles.emptyCard}>
      <View style={[styles.emptyIconCircle, { backgroundColor: iconBg }]}>
        <Lucide name="activity" size={26} color={iconColor} />
      </View>
      <ThemedText weight="700" style={styles.emptyTitle}>
        {t("DASHBOARD.NO_STATS_YET")}
      </ThemedText>
      <ThemedText style={styles.emptySubtitle}>
        {t("DASHBOARD.NO_STATS_YET_HINT")}
      </ThemedText>
    </View>
  );
};

/* ==========================================================================
   MAIN STATS CARDS COMPONENT
   ========================================================================== */

export const StatsCards: React.FC<StatsCardsProps> = ({
  totalPower = 0,
  totalEnergy = 0,
  activeDevicesCount = 0,
  estimatedCost,
  energyTrend = "12%",
  costTrend = "8%",
  isEmpty: propIsEmpty,
}) => {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const { user } = useAuth();
  const isDark = theme.isDark;
  const isArabic = (i18n.language || "ar").startsWith("ar");
  const isRtl = I18nManager.isRTL || isArabic;

  const kwhRate = user?.kwhCost ?? 0.7;
  const calculatedCost =
    estimatedCost ?? Number(((totalEnergy ?? 0) * kwhRate).toFixed(2));

  // Determine empty state: zero across all metrics or prop override
  const isCardEmpty =
    propIsEmpty ??
    (activeDevicesCount === 0 &&
      (totalPower ?? 0) === 0 &&
      (totalEnergy ?? 0) === 0 &&
      (calculatedCost ?? 0) === 0);

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

  const rowDir = isArabic
    ? I18nManager.isRTL
      ? "row"
      : "row-reverse"
    : I18nManager.isRTL
      ? "row-reverse"
      : "row";

  const rowStyle: ViewStyle = {
    flexDirection: rowDir,
    gap: 12,
  };

  const cardInnerStyle: ViewStyle = {
    flexDirection: rowDir,
    justifyContent: "space-between",
    alignItems: "center",
    flex: 1,
  };

  const styles = useMemo(() => createStyles(theme, isRtl), [theme, isRtl]);

  return (
    <View style={styles.container}>
      {/* 1. Empty State View with Fade */}
      <Fade in={isCardEmpty} duration={250} unmountOnExit>
        <StatsCardsEmptyView
          styles={styles}
          theme={theme}
          iconBg={cardColors.power.iconBg}
          iconColor={cardColors.power.icon}
        />
      </Fade>

      {/* 2. Loaded 2x2 Grid with Fade */}
      <Fade in={!isCardEmpty} duration={250} unmountOnExit style={{ gap: 12 }}>
        {/* Top Row: Current Power & Total Consumption */}
        <View style={rowStyle}>
          {/* Current Power */}
          <View style={styles.card}>
            <View style={cardInnerStyle}>
              {/* Text side */}
              <View style={styles.textContainer}>
                <ThemedText style={styles.cardTitle}>
                  {t("DASHBOARD.CURRENT_POWER")}
                </ThemedText>
                <ThemedText style={styles.cardValue}>
                  {totalPower.toFixed(2)}
                </ThemedText>
                <ThemedText style={styles.cardUnit}>
                  {t("DASHBOARD.WATT")}
                </ThemedText>
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
                <ThemedText style={styles.cardTitle}>
                  {t("DASHBOARD.TOTAL_ENERGY")}
                </ThemedText>
                <ThemedText style={styles.cardValue}>
                  {totalEnergy.toFixed(2)}
                </ThemedText>
                <ThemedText style={styles.cardUnit}>
                  {t("DASHBOARD.KWH_UNIT")}
                </ThemedText>
              </View>

              {/* Icon side with trend badge */}
              <View style={styles.iconContainer}>
                <View
                  style={[
                    styles.iconCircle,
                    { backgroundColor: cardColors.energy.iconBg },
                  ]}
                >
                  <Lucide
                    name="leaf"
                    size={22}
                    color={cardColors.energy.icon}
                  />
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
                <ThemedText style={styles.cardTitle}>
                  {t("DASHBOARD.DEVICES_COUNT")}
                </ThemedText>
                <ThemedText style={styles.cardValue}>
                  {activeDevicesCount}
                </ThemedText>
                <ThemedText style={styles.cardUnit}>
                  {t("DASHBOARD.CONNECTED_DEVICES")}
                </ThemedText>
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
                  {t("DASHBOARD.ESTIMATED_COST")}
                </ThemedText>
                <ThemedText style={styles.cardValue}>
                  {calculatedCost.toFixed(2)}
                </ThemedText>
                <ThemedText style={styles.cardUnit}>
                  {t("DASHBOARD.COST_TODAY")}
                </ThemedText>
              </View>

              {/* Icon side with trend badge */}
              <View style={styles.iconContainer}>
                <View
                  style={[
                    styles.iconCircle,
                    { backgroundColor: cardColors.cost.iconBg },
                  ]}
                >
                  <Lucide name="coins" size={22} color={cardColors.cost.icon} />
                </View>
              </View>
            </View>
          </View>
        </View>
      </Fade>
    </View>
  );
};

export default StatsCards;

const createStyles = (
  theme: ReturnType<typeof useTheme>,
  isRtl: boolean = false,
) => {
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
      alignItems: i18n.language === "en" ? "flex-start" : "flex-end",
      justifyContent: "center",
      flex: 1,
    },
    cardTitle: {
      fontSize: 13,
      fontWeight: "600",
      color: theme.textSecondary,
      marginBottom: 3,
      textAlign: isRtl ? "right" : "left",
    },
    cardValue: {
      fontSize: 22,
      fontWeight: "800",
      color: theme.text,
      lineHeight: 28,
      textAlign: isRtl ? "right" : "left",
    },
    cardUnit: {
      fontSize: 11,
      fontWeight: "500",
      color: theme.textSecondary,
      marginTop: 2,
      textAlign: isRtl ? "right" : "left",
    },
    iconContainer: {
      alignItems: "center",
      justifyContent: "center",
      marginStart: i18n.language === "en" ? 8 : 0,
    },
    iconCircle: {
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: "center",
      justifyContent: "center",
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
    emptyCard: {
      width: "100%",
      minHeight: 160,
      borderRadius: 22,
      backgroundColor: isDark ? theme.backgroundElement : "#FFFFFF",
      borderWidth: 1,
      borderColor: isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.05)",
      paddingHorizontal: 20,
      paddingVertical: 24,
      alignItems: "center",
      justifyContent: "center",
      gap: 10,
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
    emptyIconCircle: {
      width: 56,
      height: 56,
      borderRadius: 28,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 2,
    },
    emptyTitle: {
      fontSize: 16,
      lineHeight: 22,
      color: theme.text,
      textAlign: "center",
    },
    emptySubtitle: {
      fontSize: 13,
      lineHeight: 19,
      color: theme.textSecondary,
      textAlign: "center",
      maxWidth: 290,
    },
  });
};
