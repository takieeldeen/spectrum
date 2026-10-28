import React, { useState, useMemo } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  I18nManager,
} from "react-native";
import Svg, {
  Path,
  Defs,
  LinearGradient as SvgLinearGradient,
  Stop,
  Circle,
  Line,
} from "react-native-svg";
import { useTranslation } from "react-i18next";
import { Lucide } from "@react-native-vector-icons/lucide";

import { useTheme } from "@/hooks/use-theme";
import ThemedText from "@/components/themed-text";

export interface DevicePowerChartProps {
  currentPowerW?: number;
  totalEnergyKwh?: number;
  runtimeMinutes?: number;
}

type Timeframe = "day" | "week" | "month";

export function DevicePowerChart({
  currentPowerW = 0,
  totalEnergyKwh = 1.28,
  runtimeMinutes = 245,
}: DevicePowerChartProps) {
  const theme = useTheme();
  const styles = createStyles(theme);
  const { t, i18n } = useTranslation();
  const isArabic = (i18n.language || "ar").startsWith("ar");
  const isRtl = I18nManager.isRTL || isArabic;

  const [timeframe, setTimeframe] = useState<Timeframe>("day");

  // Mock data curves matching timeframe
  const dataset = useMemo(() => {
    switch (timeframe) {
      case "week":
        return [45, 60, 52, 85, 120, 95, currentPowerW || 70];
      case "month":
        return [30, 45, 70, 65, 80, 110, 95, 130, 105, currentPowerW || 85];
      case "day":
      default:
        return [15, 25, 40, 35, 65, 80, 50, 90, 75, currentPowerW || 60];
    }
  }, [timeframe, currentPowerW]);

  const peakPower = Math.max(...dataset, 100);

  // SVG Chart Geometry
  const screenWidth = Dimensions.get("window").width;
  const chartWidth = Math.max(screenWidth - 72, 280);
  const chartHeight = 140;
  const paddingX = 10;
  const paddingY = 16;
  const innerW = chartWidth - paddingX * 2;
  const innerH = chartHeight - paddingY * 2;

  const maxVal = Math.max(...dataset, 1);
  const minVal = 0;

  const points = useMemo(() => {
    const step = innerW / (dataset.length - 1);
    return dataset.map((val, idx) => {
      const x = paddingX + idx * step;
      const normalized = (val - minVal) / (maxVal - minVal);
      const y = paddingY + innerH - normalized * innerH;
      return { x, y, val };
    });
  }, [dataset, innerW, innerH, maxVal, minVal]);

  // Generate smooth cubic Bezier path
  const { linePath, areaPath } = useMemo(() => {
    if (points.length === 0) return { linePath: "", areaPath: "" };
    let d = `M ${points[0].x} ${points[0].y}`;

    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i === 0 ? 0 : i - 1];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = points[i + 2 < points.length ? i + 2 : i + 1];

      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;

      d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
    }

    const last = points[points.length - 1];
    const first = points[0];
    const fillD = `${d} L ${last.x} ${chartHeight} L ${first.x} ${chartHeight} Z`;

    return { linePath: d, areaPath: fillD };
  }, [points, chartHeight]);

  const lastPoint = points[points.length - 1];

  const formatRuntime = (mins: number) => {
    const hrs = Math.floor(mins / 60);
    const m = mins % 60;
    if (hrs === 0) return `${m} ${t("DEVICE_DETAILS.MINUTES_UNIT")}`;
    return `${hrs} ${t("DEVICE_DETAILS.HOURS_UNIT")} ${m} ${t("DEVICE_DETAILS.MINUTES_UNIT")}`;
  };

  return (
    <View style={styles.container}>
      {/* Header with Title and Timeframe Selector */}
      <View style={styles.headerRow}>
        <View style={styles.titleGroup}>
          <Lucide name="trending-up" size={20} color={theme.primary} />
          <ThemedText style={styles.sectionTitle}>
            {t("DEVICE_DETAILS.POWER_CURVE_TITLE")}
          </ThemedText>
        </View>

        {/* Timeframe Pills */}
        <View style={styles.timeframeContainer}>
          {(["day", "week", "month"] as Timeframe[]).map((tf) => {
            const isSelected = timeframe === tf;
            return (
              <TouchableOpacity
                key={tf}
                onPress={() => setTimeframe(tf)}
                style={[
                  styles.timeframeButton,
                  isSelected && styles.timeframeButtonActive,
                ]}
                activeOpacity={0.7}
              >
                <ThemedText
                  style={[
                    styles.timeframeText,
                    isSelected && styles.timeframeTextActive,
                  ]}
                >
                  {tf === "day"
                    ? t("DEVICE_DETAILS.TIMEFRAME_DAY")
                    : tf === "week"
                      ? t("DEVICE_DETAILS.TIMEFRAME_WEEK")
                      : t("DEVICE_DETAILS.TIMEFRAME_MONTH")}
                </ThemedText>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* SVG Chart Card */}
      <View style={styles.chartCard}>
        <Svg width={chartWidth} height={chartHeight}>
          <Defs>
            <SvgLinearGradient id="powerGrad" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor={theme.primary} stopOpacity="0.45" />
              <Stop offset="80%" stopColor={theme.primary} stopOpacity="0.04" />
              <Stop offset="100%" stopColor={theme.primary} stopOpacity="0" />
            </SvgLinearGradient>
          </Defs>

          {/* Background Grid Guidelines */}
          <Line
            x1={paddingX}
            y1={paddingY + innerH * 0.33}
            x2={chartWidth - paddingX}
            y2={paddingY + innerH * 0.33}
            stroke={theme.divider}
            strokeDasharray="4, 4"
            strokeWidth="1"
          />
          <Line
            x1={paddingX}
            y1={paddingY + innerH * 0.66}
            x2={chartWidth - paddingX}
            y2={paddingY + innerH * 0.66}
            stroke={theme.divider}
            strokeDasharray="4, 4"
            strokeWidth="1"
          />

          {/* Area Fill */}
          <Path d={areaPath} fill="url(#powerGrad)" />

          {/* Smooth Stroke Line */}
          <Path
            d={linePath}
            fill="none"
            stroke={theme.primary}
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Pulsing Dot at Last Data Point */}
          {lastPoint && (
            <>
              <Circle
                cx={lastPoint.x}
                cy={lastPoint.y}
                r="6"
                fill={theme.primary}
                opacity="0.3"
              />
              <Circle
                cx={lastPoint.x}
                cy={lastPoint.y}
                r="3.5"
                fill="#FFFFFF"
                stroke={theme.primary}
                strokeWidth="2"
              />
            </>
          )}
        </Svg>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statCol}>
            <ThemedText style={styles.statLabel}>
              {t("DEVICE_DETAILS.ENERGY_CONSUMED")}
            </ThemedText>
            <ThemedText style={styles.statValue}>
              {totalEnergyKwh.toFixed(2)} kWh
            </ThemedText>
          </View>

          <View style={styles.statDivider} />

          <View style={styles.statCol}>
            <ThemedText style={styles.statLabel}>
              {t("DEVICE_DETAILS.PEAK_POWER")}
            </ThemedText>
            <ThemedText style={styles.statValue}>
              {peakPower.toFixed(0)} {t("DEVICE_CARD.UNIT_WATT")}
            </ThemedText>
          </View>

          <View style={styles.statDivider} />

          <View style={styles.statCol}>
            <ThemedText style={styles.statLabel}>
              {t("DEVICE_DETAILS.ACTIVE_RUNTIME")}
            </ThemedText>
            <ThemedText style={styles.statValue}>
              {formatRuntime(runtimeMinutes)}
            </ThemedText>
          </View>
        </View>
      </View>
    </View>
  );
}

const createStyles = (theme: ReturnType<typeof useTheme>) =>
  StyleSheet.create({
    container: {
      gap: 12,
    },
    headerRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 4,
    },
    titleGroup: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: "700",
      color: theme.text,
    },
    timeframeContainer: {
      flexDirection: "row",
      backgroundColor: theme.backgroundSecondary,
      borderRadius: 12,
      padding: 3,
      gap: 2,
    },
    timeframeButton: {
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 9,
    },
    timeframeButtonActive: {
      backgroundColor: theme.cardBackground,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.08,
      shadowRadius: 2,
      elevation: 2,
    },
    timeframeText: {
      fontSize: 12,
      fontWeight: "600",
      color: theme.textSecondary,
    },
    timeframeTextActive: {
      color: theme.primary,
      fontWeight: "700",
    },
    chartCard: {
      backgroundColor: theme.cardBackground,
      borderRadius: 20,
      padding: 16,
      borderWidth: 1,
      borderColor: theme.divider,
      alignItems: "center",
      gap: 16,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.04,
      shadowRadius: 6,
      elevation: 1,
    },
    statsRow: {
      flexDirection: "row",
      alignItems: "center",
      width: "100%",
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: theme.divider,
      justifyContent: "space-between",
    },
    statCol: {
      flex: 1,
      alignItems: "center",
      gap: 3,
    },
    statLabel: {
      fontSize: 11,
      color: theme.textSecondary,
    },
    statValue: {
      fontSize: 14,
      fontWeight: "800",
      color: theme.text,
    },
    statDivider: {
      width: 1,
      height: 24,
      backgroundColor: theme.divider,
    },
  });

export default DevicePowerChart;
