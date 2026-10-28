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
}

export const CurrentConsumptionCard: React.FC<CurrentConsumptionCardProps> = ({
  totalPower: propTotalPower,
  activeDevicesCount: propActiveDevicesCount,
  period: propPeriod,
  onPeriodChange,
  style,
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
        {/* Live Badge */}
        <View style={styles.liveBadge}>
          <ThemedText style={styles.liveText}>{t("DASHBOARD.LIVE")}</ThemedText>
          <View style={styles.liveDot} />
        </View>

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

      {/* 2. Metrics Row: Connected devices count & Big power number */}
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

      {/* 3. Conditional Graph Views using Fade (no ternaries) */}
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

      {/* 4. Bottom Segmented Control Filter */}
      <PeriodSelector value={selectedPeriod} onChange={handlePeriodChange} />
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
      flexDirection: "row-reverse",
      justifyContent: "space-between",
      alignItems: "center",
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
      flexDirection: "row-reverse",
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
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "baseline",
    },
    connectedRow: {
      flexDirection: "row-reverse",
      alignItems: "center",
      gap: 6,
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
  });

export default CurrentConsumptionCard;
