import React, { useState, useMemo } from "react";
import { View, StyleSheet, StyleProp, ViewStyle } from "react-native";
import Lucide from "@react-native-vector-icons/lucide";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/hooks/use-theme";
import ThemedText from "@/components/themed-text";
import { usePlugs } from "@/providers/plug.provider";
import PeriodSelector, { PeriodType } from "./period-selector";
import { useGetDayAnalytics, useGetMonthAnalytics } from "@/api";
import { Fade } from "@/components/ui/fade";
import CurrentDailyConsumptionCard from "./current-daily-consumption-card";
import CurrentMonthlyConsumption from "./current-monthly-consumption-card";
import i18n from "@/i18n";

export interface CurrentConsumptionCardProps {
  totalPower?: number;
  activeDevicesCount?: number;
  period?: PeriodType;
  onPeriodChange?: (period: PeriodType) => void;
  style?: StyleProp<ViewStyle>;
  isEmpty?: boolean;
}

/* ==========================================================================
   EMPTY STATE COMPONENT (For Top Current Consumption Card)
   ========================================================================== */

export interface CurrentConsumptionEmptyViewProps {
  styles: ReturnType<typeof createStyles>;
  theme: ReturnType<typeof useTheme>;
}

export const CurrentConsumptionEmptyView: React.FC<
  CurrentConsumptionEmptyViewProps
> = ({ styles }) => {
  const { t } = useTranslation();

  return (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconCircle}>
        <Lucide name="zap-off" size={28} color="#FFFFFF" />
      </View>
      <ThemedText weight="700" style={styles.emptyTitle}>
        {t("DASHBOARD.NO_POWER_DATA")}
      </ThemedText>
      <ThemedText style={styles.emptySubtitle}>
        {t("DASHBOARD.NO_POWER_DATA_HINT")}
      </ThemedText>
    </View>
  );
};

/* ==========================================================================
   MAIN CURRENT CONSUMPTION CARD
   ========================================================================== */

export const CurrentConsumptionCard: React.FC<CurrentConsumptionCardProps> = ({
  totalPower: propTotalPower,
  activeDevicesCount: propActiveDevicesCount,
  period: propPeriod,
  onPeriodChange,
  style,
  isEmpty: propIsEmpty,
}) => {
  const { t } = useTranslation();
  const { data: dayAnalytics } = useGetDayAnalytics();
  const { data: monthAnalytics } = useGetMonthAnalytics();
  const theme = useTheme();
  const { liveData } = usePlugs();

  const [internalPeriod, setInternalPeriod] = useState<PeriodType>("day");
  const selectedPeriod = propPeriod ?? internalPeriod;

  // Derive all outlets across all connected strips
  const allOutlets = useMemo(() => {
    return Object.values(liveData ?? {}).flatMap((strip) =>
      Object.values(strip.outlets || {}),
    );
  }, [liveData]);

  const activeOutlets = useMemo(() => {
    return allOutlets.filter((outlet) => outlet.on);
  }, [allOutlets]);

  const totalPower =
    propTotalPower ??
    allOutlets.reduce((acc, outlet) => acc + (outlet.power_W || 0), 0);

  const activeCount = propActiveDevicesCount ?? activeOutlets.length;

  // Empty check: no outlets configured / empty prop override
  const hasNoOutlets = allOutlets.length === 0;
  const isCardEmpty =
    propIsEmpty ??
    (hasNoOutlets &&
      (propTotalPower === undefined || propTotalPower === 0) &&
      (propActiveDevicesCount === undefined || propActiveDevicesCount === 0));

  const handlePeriodChange = (newPeriod: PeriodType) => {
    if (propPeriod === undefined) {
      setInternalPeriod(newPeriod);
    }
    onPeriodChange?.(newPeriod);
  };

  const styles = createStyles(theme);

  return (
    <View style={[styles.card, style]}>
      {/* 1. Top Header Row: Live badge & Title with Icon */}
      <View style={styles.headerRow}>
        {/* Live Badge (Visible when not empty) */}
        <Fade in={!isCardEmpty} duration={200} unmountOnExit>
          <View style={styles.liveBadge}>
            <ThemedText style={styles.liveText}>
              {t("DASHBOARD.LIVE")}
            </ThemedText>
            <View style={styles.liveDot} />
          </View>
        </Fade>

        {/* Title + Zap Icon */}
        <View style={styles.titleContainer}>
          <ThemedText style={styles.titleText}>
            {t("DASHBOARD.CURRENT_POWER")}
          </ThemedText>
          <View style={styles.iconWrapper}>
            <Lucide name="zap" size={24} color="white" />
          </View>
        </View>
      </View>

      {/* 2. Empty State View */}
      <Fade in={isCardEmpty} duration={250} unmountOnExit>
        <CurrentConsumptionEmptyView styles={styles} theme={theme} />
      </Fade>

      {/* 3. Loaded Metrics, Graph & Segmented Control */}
      <Fade in={!isCardEmpty} duration={250} unmountOnExit style={{ gap: 16 }}>
        {/* Metrics Row: Connected devices count & Big power number */}
        <View style={styles.metricsRow}>
          {/* Connected devices */}
          <View style={styles.connectedRow}>
            <ThemedText style={styles.connectedText}>
              {t("DASHBOARD.CONNECTED_DEVICES_COUNT", { count: activeCount })}
            </ThemedText>
            <Lucide name="plug" size={20} color="white" />
          </View>

          {/* Value + Unit */}
          <View style={styles.powerRow}>
            <ThemedText style={styles.wattUnitText}>
              {t("DASHBOARD.WATT")}
            </ThemedText>
            <ThemedText style={styles.powerValueText}>
              {totalPower.toFixed(2)}
            </ThemedText>
          </View>
        </View>

        {/* Conditional Graph Views using Fade (no ternaries) */}
        <View style={styles.graphContainer}>
          <Fade
            in={selectedPeriod === "day"}
            unmountOnExit
            immediateExit
            duration={250}
          >
            <CurrentDailyConsumptionCard data={dayAnalytics} />
          </Fade>
          <Fade
            in={selectedPeriod === "month"}
            unmountOnExit
            immediateExit
            duration={250}
          >
            <CurrentMonthlyConsumption data={monthAnalytics} />
          </Fade>
        </View>

        {/* Bottom Segmented Control Filter */}
        <PeriodSelector value={selectedPeriod} onChange={handlePeriodChange} />
      </Fade>
    </View>
  );
};

const createStyles = (theme: ReturnType<typeof useTheme>) =>
  StyleSheet.create({
    card: {
      width: "100%",
      borderRadius: 24,
      backgroundColor: theme.primaryDark,
      padding: 16,
      gap: 16,
    },
    headerRow: {
      flexDirection: i18n.language === "ar" ? "row" : "row-reverse",
      justifyContent: "space-between",
      alignItems: "center",
      minHeight: 42,
    },
    liveBadge: {
      flexDirection: "row-reverse",
      alignItems: "center",
      backgroundColor: "rgba(255, 255, 255, 0.18)",
      paddingHorizontal: 12,
      paddingVertical: 5,
      borderRadius: 999,
      gap: 6,
    },
    liveText: {
      color: "white",
      fontSize: 13,
      fontWeight: "700",
    },
    liveDot: {
      width: 7,
      height: 7,
      borderRadius: 3.5,
      backgroundColor: "#34D399",
    },
    titleContainer: {
      flexDirection: i18n.language === "ar" ? "row" : "row-reverse",
      alignItems: "center",
      gap: 10,
    },
    titleText: {
      fontSize: 17,
      color: "white",
      fontWeight: "700",
    },
    iconWrapper: {
      backgroundColor: "rgba(255, 255, 255, 0.18)",
      height: 42,
      width: 42,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 13,
    },
    metricsRow: {
      flexDirection: "column",
      justifyContent: "space-between",
      alignItems: "baseline",
    },
    connectedRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      alignSelf: "flex-end",
    },
    connectedText: {
      color: "white",
      fontSize: 14,
      fontWeight: "600",
    },
    powerRow: {
      flexDirection: i18n.language === "en" ? "row-reverse" : "row",
      alignItems: "baseline",
      gap: 8,
    },
    wattUnitText: {
      fontSize: 22,
      color: "white",
      fontWeight: "700",
    },
    powerValueText: {
      fontSize: 52,
      lineHeight: 52,
      fontWeight: "800",
      color: "white",
    },
    graphContainer: {
      width: "100%",
      minHeight: 150,
      marginTop: 4,
    },
    emptyContainer: {
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 28,
      gap: 10,
    },
    emptyIconCircle: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: "rgba(255, 255, 255, 0.16)",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 4,
    },
    emptyTitle: {
      fontSize: 18,
      lineHeight: 24,
      color: "#FFFFFF",
      textAlign: "center",
    },
    emptySubtitle: {
      fontSize: 13,
      lineHeight: 19,
      color: "rgba(255, 255, 255, 0.8)",
      textAlign: "center",
      maxWidth: 290,
    },
  });

export default CurrentConsumptionCard;
