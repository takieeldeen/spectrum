import React, { useMemo, useState } from "react";
import {
  View,
  Pressable,
  StyleProp,
  ViewStyle,
  Platform,
  StyleSheet,
} from "react-native";
import { useTranslation } from "react-i18next";
import Animated, { useAnimatedStyle } from "react-native-reanimated";
import { Lucide } from "@react-native-vector-icons/lucide";

import { useTheme } from "@/hooks/use-theme";
import ThemedText from "@/components/themed-text";
import { useGetWeekAnalytics } from "@/api";
import { usePlugs } from "@/providers/plug.provider";
import { Fade } from "@/components/ui/fade";
import i18n from "@/i18n";

export interface DayConsumption {
  id: string;
  label: string;
  value: number; // in Watt.hour
  percentage: number; // 0 to 1
  isToday?: boolean;
}

export interface WeeklyConsumptionCardProps {
  data?: any;
  title?: string;
  unit?: string;
  style?: StyleProp<ViewStyle>;
}

/* ==========================================================================
   EMPTY STATE COMPONENT (For Weekly Consumption)
   ========================================================================== */

export interface WeeklyConsumptionEmptyViewProps {
  styles: ReturnType<typeof createStyles>;
  theme: ReturnType<typeof useTheme>;
}

export const WeeklyConsumptionEmptyView: React.FC<
  WeeklyConsumptionEmptyViewProps
> = ({ styles, theme }) => {
  const { t } = useTranslation();

  return (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconBadge}>
        <Lucide name="bar-chart-2" size={24} color={theme.primary} />
      </View>
      <ThemedText weight="700" style={styles.emptyTitle}>
        {t("DASHBOARD.NO_WEEKLY_DATA")}
      </ThemedText>
      <ThemedText style={styles.emptySubtitle}>
        {t("DASHBOARD.NO_WEEKLY_DATA_HINT")}
      </ThemedText>
    </View>
  );
};

/* ==========================================================================
   MAIN WEEKLY CONSUMPTION CARD
   ========================================================================== */

export const WeeklyConsumptionCard: React.FC<WeeklyConsumptionCardProps> = ({
  data: propData,
  title,
  unit,
  style,
}) => {
  const { t } = useTranslation();
  const cardTitle = title ?? t("DASHBOARD.WEEKLY_CONSUMPTION");
  const cardUnit = unit ?? t("DASHBOARD.WATT_HOUR_UNIT");
  const { data: weekAnalytics } = useGetWeekAnalytics();
  const { liveData } = usePlugs();
  const theme = useTheme();
  const styles = createStyles(theme);

  const [selectedDayId, setSelectedDayId] = useState<string>("today");

  // Resolve raw data array from propData or API hook
  const raw = useMemo(() => {
    const source = propData !== undefined ? propData : weekAnalytics;
    const d = source?.data ?? source;
    return Array.isArray(d) ? d : [];
  }, [propData, weekAnalytics]);

  // Check if the received array is empty or contains only empty objects
  const isEmpty = useMemo(() => {
    if (raw.length === 0) return true;
    return raw.every((item: any) => {
      if (!item || typeof item !== "object") return true;
      const keys = Object.keys(item);
      if (keys.length === 0) return true;
      const isZeroPlaceholder =
        typeof item._id === "string" && item._id.startsWith("zeroObject");
      const hasZeroConsumption =
        Number(item.kwh ?? 0) === 0 && Number(item.cumulativeKwh ?? 0) === 0;
      return (
        keys.length === 0 ||
        (isZeroPlaceholder && hasZeroConsumption) ||
        keys.every(
          (k) => item[k] === 0 || item[k] === undefined || item[k] === null,
        )
      );
    });
  }, [raw]);

  // Sum live energy across all outlets
  const totalCumulativeKwh = useMemo(() => {
    return Object.values(liveData ?? {})
      .flatMap((strip) => Object.values(strip.outlets || {}))
      .reduce((acc, outlet) => acc + (outlet.energy_kwh || 0), 0);
  }, [liveData]);

  // Build 7 items in Watt.hour: 6 historical days + live Today
  const FINAL_ANALYTICS = useMemo(() => {
    if (isEmpty) return [];

    const latestMetric = raw[0];
    const lastCumulativeKwh: number = latestMetric?.cumulativeKwh ?? 0;
    const liveTodayWh = Math.max(
      0,
      totalCumulativeKwh > 0 && lastCumulativeKwh > 0
        ? Math.round((totalCumulativeKwh - lastCumulativeKwh) * 1000)
        : Math.round((latestMetric?.kwh ?? 0) * 1000),
    );

    const todayItem = {
      id: "today",
      value: liveTodayWh,
      isToday: true,
      label: t("DASHBOARD.TODAY"),
      daysAgo: 0,
    };

    const dayKeys = [
      "DASHBOARD.DAYS.SUN",
      "DASHBOARD.DAYS.MON",
      "DASHBOARD.DAYS.TUE",
      "DASHBOARD.DAYS.WED",
      "DASHBOARD.DAYS.THU",
      "DASHBOARD.DAYS.FRI",
      "DASHBOARD.DAYS.SAT",
    ];

    const getOffsetDay = (daysAgo: number) => {
      const d = new Date();
      d.setDate(d.getDate() - daysAgo);
      return t(dayKeys[d.getDay()]);
    };

    // 6 historical days (counting back from 1 day ago to 6 days ago in Watt.hour)
    const pastDays = Array.from({ length: 6 }, (_, i) => {
      const daysAgo = i + 1;
      const metric = raw[i];
      const valWh = Math.round((metric?.kwh ?? 0) * 1000);
      return {
        id: `day-${daysAgo}`,
        value: valWh,
        isToday: false,
        label: getOffsetDay(daysAgo),
        daysAgo,
      };
    });

    // Newest first: [today, 1d ago, ..., 6d ago]
    const newestFirst = [todayItem, ...pastDays];

    // Oldest to newest: [6d ago, ..., today]
    // In LTR: 6d ago on left, today on right
    // In RTL: row layout orders from right-to-left -> 6d ago on right, today on left
    const ordered = [...newestFirst].reverse();

    const maxValue = Math.max(...ordered.map((d) => d.value), 0.01);

    return ordered.map((day) => ({
      ...day,
      percentage: Math.min(1, Math.max(0, day.value / maxValue)),
    }));
  }, [raw, isEmpty, totalCumulativeKwh, t]);

  return (
    <View style={[styles.card, style]}>
      {/* 1. Header: Title and Unit */}
      <View style={styles.headerRow}>
        <ThemedText style={styles.title}>{cardTitle}</ThemedText>
        <Fade in={!isEmpty} duration={200} unmountOnExit>
          <ThemedText style={styles.unit}>{cardUnit}</ThemedText>
        </Fade>
      </View>

      {/* 2. Empty State View with Fade */}
      <Fade in={isEmpty} duration={250} unmountOnExit>
        <WeeklyConsumptionEmptyView styles={styles} theme={theme} />
      </Fade>

      {/* 3. Bar Chart Section with Fade */}
      <Fade
        in={!isEmpty}
        duration={250}
        unmountOnExit
        style={styles.chartContainer}
      >
        {FINAL_ANALYTICS.map((day) => (
          <DayBar
            key={day.id}
            day={day}
            isSelected={selectedDayId === day.id}
            onSelect={(id) => setSelectedDayId(id)}
          />
        ))}
      </Fade>
    </View>
  );
};

function DayBar({
  day,
  isSelected,
  onSelect,
}: {
  day: DayConsumption;
  isSelected: boolean;
  onSelect: (id: string) => void;
}) {
  const theme = useTheme();
  const pct = Number.isFinite(day?.percentage) ? day.percentage : 0;

  const animatedStyle = useAnimatedStyle(
    () => ({
      height: pct < 0.12 ? "12%" : `${Math.min(100, Math.round(pct * 100))}%`,
      borderRadius: 14,
      backgroundColor: isSelected
        ? theme.primaryDark
        : pct <= 0.12
          ? theme.switchTrackOff
          : theme.activeCardBackground,
    }),
    [isSelected, pct, theme],
  );

  return (
    <View style={{ height: "100%", flex: 1, gap: 6, alignItems: "center" }}>
      <View style={{ height: 24 }}>
        <Fade in={isSelected}>
          <ThemedText
            style={{
              fontSize: 13,
              fontWeight: "800",
              color: theme.primaryDark,
            }}
          >
            {day.value}
          </ThemedText>
        </Fade>
      </View>
      <Pressable
        style={{
          height: "100%",
          width: "100%",
          justifyContent: "flex-end",
        }}
        onPress={() => onSelect(day.id)}
      >
        <Animated.View style={[animatedStyle]} />
      </Pressable>
      <ThemedText
        style={{
          fontSize: 12,
          fontWeight: isSelected || day.isToday ? "800" : "400",
          color: isSelected ? theme.primaryDark : theme.text,
        }}
        numberOfLines={1}
      >
        {day.label}
      </ThemedText>
    </View>
  );
}

const createStyles = (theme: ReturnType<typeof useTheme>) =>
  StyleSheet.create({
    card: {
      width: "100%",
      minHeight: 280,
      borderRadius: 24,
      backgroundColor: theme.cardBackground,
      padding: 20,
      gap: 16,
      borderWidth: 1,
      borderColor: theme.cardBorder,
      ...Platform.select({
        ios: {
          shadowColor: "#000000",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: theme.isDark ? 0.2 : 0.04,
          shadowRadius: 12,
        },
        android: {
          elevation: 2,
        },
      }),
    },
    headerRow: {
      flexDirection: i18n.language === "ar" ? "row-reverse" : "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    title: {
      fontSize: 20,
      fontWeight: "800",
      color: theme.text,
      lineHeight: 27,
    },
    unit: {
      fontSize: 13,
      fontWeight: "500",
      color: theme.textSecondary,
    },
    chartContainer: {
      flexDirection: i18n.language === "en" ? "row" : "row-reverse",
      justifyContent: "space-between",
      alignItems: "flex-end",
      height: 160,
      gap: 12,
      paddingTop: 16,
    },
    emptyContainer: {
      height: 180,
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 12,
      gap: 8,
    },
    emptyIconBadge: {
      width: 52,
      height: 52,
      borderRadius: 26,
      backgroundColor: theme.tintedIconBackground,
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
      lineHeight: 18,
      color: theme.textSecondary,
      textAlign: "center",
      maxWidth: 280,
    },
  });

export default WeeklyConsumptionCard;
