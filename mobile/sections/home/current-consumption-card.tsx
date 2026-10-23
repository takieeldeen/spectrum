import React, { useState, useMemo } from "react";
import {
  View,
  StyleProp,
  ViewStyle,
  LayoutChangeEvent,
  I18nManager,
} from "react-native";
import Svg, {
  Path,
  Defs,
  LinearGradient,
  Stop,
  Circle,
  Line,
} from "react-native-svg";
import Lucide from "@react-native-vector-icons/lucide";
import { useTheme } from "@/hooks/use-theme";
import ThemedText from "@/components/themed-text";
import { usePlugs } from "@/providers/plug.provider";
import PeriodSelector, { PeriodType } from "./period-selector";
import SafeComponentBoundary from "@/components/safe-boundary";
import { useGetDayAnalytics, useGetWeekAnalytics } from "@/api";
import { IAnalyticsDayPoint } from "@/types/analytics";
import i18n from "@/i18n";

export interface CurrentConsumptionCardProps {
  totalPower?: number;
  activeDevicesCount?: number;
  period?: PeriodType;
  onPeriodChange?: (period: PeriodType) => void;
  style?: StyleProp<ViewStyle>;
}

export const getXLabels = (
  period: PeriodType = "day",
  last12Points?: IAnalyticsDayPoint[],
): string[] => {
  const now = new Date();
  const isAr = (i18n.language || "ar").startsWith("ar");
  const nowLabel = isAr ? "الآن" : "Now";

  const formatHour = (h: number) => {
    const num = h % 12 || 12;
    const p = isAr ? (h >= 12 ? "م" : "ص") : h >= 12 ? "PM" : "AM";
    return `${num} ${p}`;
  };

  if (period === "day") {
    if (last12Points && last12Points.length > 0) {
      return last12Points.map((p) => p.label);
    }
    const currentHour = now.getHours();
    return Array.from({ length: 12 }).map((_, i) => {
      if (i === 0) return nowLabel;
      const targetHour = (currentHour - i + 24) % 24;
      return formatHour(targetHour);
    });
  }

  if (period === "week") {
    const dayNames = isAr
      ? [
          "الأحد",
          "الاثنين",
          "الثلاثاء",
          "الأربعاء",
          "الخميس",
          "الجمعة",
          "السبت",
        ]
      : ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    const getOffsetDay = (daysAgo: number) => {
      const d = new Date(now);
      d.setDate(d.getDate() - daysAgo);
      return dayNames[d.getDay()];
    };

    return [nowLabel, getOffsetDay(2), getOffsetDay(4), getOffsetDay(6)];
  }

  if (period === "month") {
    const getOffsetDate = (daysAgo: number) => {
      const d = new Date(now);
      d.setDate(d.getDate() - daysAgo);
      return `${d.getDate()}/${d.getMonth() + 1}`;
    };

    return [nowLabel, getOffsetDate(9), getOffsetDate(18), getOffsetDate(28)];
  }

  return [nowLabel, "11 م", "10 م", "9 م"];
};

export const CurrentConsumptionCard: React.FC<CurrentConsumptionCardProps> = ({
  totalPower: propTotalPower,
  activeDevicesCount: propActiveDevicesCount,
  period: propPeriod,
  onPeriodChange,
  style,
}) => {
  const { data: dayAnalytics } = useGetDayAnalytics();
  const { data: weekAnalytics } = useGetWeekAnalytics();
  const theme = useTheme();
  const { liveData } = usePlugs();

  const [internalPeriod, setInternalPeriod] = useState<PeriodType>("day");
  const selectedPeriod = propPeriod ?? internalPeriod;
  const [graphWidth, setGraphWidth] = useState(0);

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

  const graphHeight = 78;

  // Extract the last 12 hours of hourly points starting from now going backwards
  const last12Points = useMemo(() => {
    const rawPoints = dayAnalytics?.points;
    const currentHour = new Date().getHours();
    const isAr = (i18n.language || "ar").startsWith("ar");
    const nowLabel = isAr ? "الآن" : "Now";

    const formatHour = (h: number) => {
      const num = h % 12 || 12;
      const p = isAr ? (h >= 12 ? "م" : "ص") : h >= 12 ? "PM" : "AM";
      return `${num} ${p}`;
    };

    const result: IAnalyticsDayPoint[] = [];
    for (let i = 0; i < 12; i++) {
      const targetHour = (currentHour - i + 24) % 24;
      const rawPt = rawPoints?.find((p) => p.hour === targetHour);
      const isNow = i === 0;

      result.push({
        hour: targetHour,
        label: isNow ? nowLabel : formatHour(targetHour),
        avgWatts: isNow && totalPower > 0 ? totalPower : rawPt?.avgWatts || 0,
        maxWatts: rawPt?.maxWatts || 0,
        kwh: rawPt?.kwh || 0,
        cost: rawPt?.cost || 0,
      });
    }

    return result;
  }, [dayAnalytics?.points, totalPower]);

  // Map points to power values in Watts, ending with live totalPower
  const pointValues = useMemo(() => {
    if (
      selectedPeriod === "week" &&
      weekAnalytics?.data &&
      weekAnalytics.data.length > 0
    ) {
      return weekAnalytics.data.map((d, idx) => {
        if (idx === 0 && totalPower > 0) {
          return totalPower;
        }
        return d.avgWatts || 0;
      });
    }

    return last12Points.map((pt) => pt.avgWatts || 0);
  }, [selectedPeriod, weekAnalytics?.data, last12Points, totalPower]);

  // Compute dynamic smooth spline path and area coordinates
  // Compute dynamic smooth spline path, area coordinates, and X-axis baseline
  const chartGeometry = useMemo(() => {
    const paddingLeft = 4;
    const paddingRight = 10;
    const paddingTop = 12;
    const paddingBottom = 10;
    const baselineY = graphHeight - paddingBottom;

    if (graphWidth <= 0 || pointValues.length === 0) {
      return { linePath: "", areaPath: "", endX: 0, endY: 0, baselineY };
    }

    const availableWidth = Math.max(
      graphWidth - paddingLeft - paddingRight,
      20,
    );
    const availableHeight = baselineY - paddingTop;
    const isRtl = I18nManager.isRTL;

    const rawMax = Math.max(...pointValues, totalPower);
    const rawMin = Math.min(...pointValues);
    const diff = rawMax - rawMin;

    // In RTL, idx = 0 (NOW) is on the RIGHT, idx = 11 (11h ago) is on the LEFT
    const pts = pointValues.map((val, idx) => {
      const ratio = idx / (pointValues.length - 1);
      const x = isRtl
        ? graphWidth - paddingRight - ratio * availableWidth
        : paddingLeft + ratio * availableWidth;

      // Base dynamic shape: elegant curve rising towards the live point (ratio = 0)
      const dynamicShape =
        0.90 - 0.52 * ratio + 0.10 * Math.sin(ratio * Math.PI * 1.5);

      let normalized: number;

      if (rawMax <= 0.001) {
        // Idle ambient state: gentle amplified curve so it never looks like a flat line
        normalized = dynamicShape * 0.75;
      } else {
        // Real data scaling
        const blend =
          diff > 0.01 ? Math.min(1, diff / (rawMax * 0.45)) : 0;
        const realRatio =
          diff > 0.001 ? Math.max(0, Math.min(1, (val - rawMin) / diff)) : 0.5;

        // When data variance is low, dynamicShape prevents a flat horizontal line
        // When data variance is high, real telemetry variations drive the curve
        normalized =
          blend * (0.32 + 0.68 * realRatio) + (1 - blend) * dynamicShape;
      }

      const clampedNorm = Math.max(0.12, Math.min(1, normalized));
      const y = baselineY - clampedNorm * availableHeight;

      return { x, y };
    });

    // Sort ascending by x (left to right) to draw SVG path cleanly
    const sortedPts = [...pts].sort((a, b) => a.x - b.x);

    let linePath = `M ${sortedPts[0].x.toFixed(1)} ${sortedPts[0].y.toFixed(1)}`;
    const tension = 0.22;

    for (let i = 0; i < sortedPts.length - 1; i++) {
      const p0 = sortedPts[i === 0 ? 0 : i - 1];
      const p1 = sortedPts[i];
      const p2 = sortedPts[i + 1];
      const p3 =
        sortedPts[i + 2 >= sortedPts.length ? sortedPts.length - 1 : i + 2];

      const cp1x = p1.x + (p2.x - p0.x) * tension;
      const cp1y = p1.y + (p2.y - p0.y) * tension;
      const cp2x = p2.x - (p3.x - p1.x) * tension;
      const cp2y = p2.y - (p3.y - p1.y) * tension;

      linePath += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
    }

    const firstPt = sortedPts[0];
    const lastPt = sortedPts[sortedPts.length - 1];
    const areaPath = `${linePath} L ${lastPt.x.toFixed(1)} ${baselineY.toFixed(1)} L ${firstPt.x.toFixed(1)} ${baselineY.toFixed(1)} Z`;

    return {
      linePath,
      areaPath,
      endX: pts[0].x, // Live endpoint (NOW)
      endY: pts[0].y,
      baselineY,
    };
  }, [graphWidth, graphHeight, pointValues, totalPower]);

  const { linePath, areaPath, endX, endY, baselineY } = chartGeometry;

  // Labels for X-axis dynamically computed based on selected period and live point
  const labels = useMemo(() => {
    return getXLabels(selectedPeriod, last12Points);
  }, [selectedPeriod, last12Points]);

  return (
    <View
      style={[
        {
          width: "100%",
          borderRadius: 24,
          backgroundColor: theme.primaryDark,
          padding: 16,
          gap: 16,
        },
        style,
      ]}
    >
      {/* 1. Top Header Row: Live badge (left) & Title with Icon (right) */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        {/* Left: "مباشر" Live Badge */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: "rgba(255, 255, 255, 0.18)",
            paddingHorizontal: 12,
            paddingVertical: 5,
            borderRadius: 999,
            gap: 6,
          }}
        >
          <ThemedText
            style={{ color: "white", fontSize: 13, fontWeight: "700" }}
          >
            مباشر
          </ThemedText>
          <View
            style={{
              width: 7,
              height: 7,
              borderRadius: 3.5,
              backgroundColor: "#34D399",
            }}
          />
        </View>

        {/* Right: "القدرة الحالية" + Zap Icon in squircle */}
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <ThemedText
            style={{ fontSize: 17, color: "white", fontWeight: "700" }}
          >
            القدرة الحالية
          </ThemedText>
          <View
            style={{
              backgroundColor: "rgba(255, 255, 255, 0.18)",
              height: 42,
              width: 42,
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 13,
            }}
          >
            <Lucide name="zap" size={24} color="white" />
          </View>
        </View>
      </View>

      {/* 2. Metrics Row: Connected devices count (left) & Big power number (right) */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "baseline",
        }}
      >
        {/* Left: Connected devices */}
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <ThemedText
            style={{ color: "white", fontSize: 14, fontWeight: "600" }}
          >
            {activeCount} أجهزة متصلة
          </ThemedText>
          <Lucide name="plug" size={20} color="white" />
        </View>

        {/* Right: Value + Unit */}
        <View style={{ flexDirection: "row", alignItems: "baseline", gap: 8 }}>
          <ThemedText
            style={{
              fontSize: 22,
              color: "white",
              fontWeight: "700",
            }}
          >
            واط
          </ThemedText>
          <ThemedText
            style={{
              fontSize: 52,
              lineHeight: 52,
              fontWeight: "800",
              color: "white",
            }}
          >
            {totalPower.toFixed(2)}
          </ThemedText>
        </View>
      </View>

      {/* 3. The Curved Graph Section */}
      <View
        onLayout={(e: LayoutChangeEvent) => {
          const w = e.nativeEvent.layout.width;
          if (w > 0 && Math.abs(w - graphWidth) > 1) {
            setGraphWidth(w);
          }
        }}
        style={{ width: "100%", marginTop: 4 }}
      >
        <SafeComponentBoundary>
          {graphWidth > 0 && (
            <Svg width={graphWidth} height={graphHeight}>
              <Defs>
                <LinearGradient id="graphGradient" x1="0" y1="0" x2="0" y2="1">
                  <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.28" />
                  <Stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.02" />
                </LinearGradient>
              </Defs>

              {/* Grey Faded X-Axis Line */}
              <Line
                x1={0}
                y1={baselineY}
                x2={graphWidth}
                y2={baselineY}
                stroke="rgba(255, 255, 255, 0.28)"
                strokeWidth={1.2}
              />

              {/* Shaded Area Fill */}
              <Path d={areaPath} fill="url(#graphGradient)" />

              {/* White Spline Curve */}
              <Path
                d={linePath}
                stroke="#FFFFFF"
                strokeWidth={3.5}
                strokeLinecap="round"
                fill="none"
              />

              {/* Live Endpoint Circle Marker */}
              <Circle
                cx={endX}
                cy={endY}
                r={6.5}
                stroke="#FFFFFF"
                strokeWidth={3}
                fill={theme.primaryDark}
              />
            </Svg>
          )}
        </SafeComponentBoundary>

        {/* X-Axis Time Labels */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            marginTop: 8,
            paddingHorizontal: 2,
          }}
        >
          {labels.map((lbl, idx) => (
            <ThemedText
              key={idx}
              numberOfLines={1}
              style={{
                color: "rgba(255, 255, 255, 0.85)",
                fontSize: labels.length > 6 ? 9.5 : 13,
                fontWeight: "600",
                textAlign: "center",
                flex: labels.length > 6 ? 1 : undefined,
              }}
            >
              {lbl}
            </ThemedText>
          ))}
        </View>
      </View>

      {/* 4. Bottom Segmented Control Filter */}
      <PeriodSelector value={selectedPeriod} onChange={handlePeriodChange} />
    </View>
  );
};

export default CurrentConsumptionCard;
