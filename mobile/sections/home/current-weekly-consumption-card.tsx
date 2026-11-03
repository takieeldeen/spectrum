import { View } from "react-native";
import React, { useMemo, useState } from "react";
import ThemedText from "@/components/themed-text";
import Svg, {
  Line,
  Path,
  Circle,
  Text as SvgText,
  Defs,
  LinearGradient,
  Stop,
} from "react-native-svg";
import { Lucide } from "@react-native-vector-icons/lucide";

import { useTheme } from "@/hooks/use-theme";
import i18n from "@/i18n";
import { usePlugs } from "@/providers/plug.provider";
import { Fade } from "@/components/ui/fade";

function getSmoothPath(
  points: { x: number; y: number }[],
  baselineY: number,
  paddingTop = 18,
): string {
  if (!points || points.length === 0) return "";
  if (points.length === 1)
    return `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;

  const n = points.length;
  const dx: number[] = [];
  const dy: number[] = [];
  const delta: number[] = [];
  const m: number[] = [];

  for (let i = 0; i < n - 1; i++) {
    const dX = points[i + 1].x - points[i].x;
    const dY = points[i + 1].y - points[i].y;
    dx.push(dX);
    dy.push(dY);
    delta.push(dX === 0 ? 0 : dY / dX);
  }

  m.push(delta[0]);
  for (let i = 1; i < n - 1; i++) {
    // If slope changes direction or flattens, tangent must be flat (prevents overshoot/undershoot)
    if (delta[i - 1] * delta[i] <= 0) {
      m.push(0);
    } else {
      m.push((delta[i - 1] + delta[i]) / 2);
    }
  }
  m.push(delta[n - 2]);

  // Fritsch-Carlson monotonicity check to strictly preserve bounds
  for (let i = 0; i < n - 1; i++) {
    if (delta[i] === 0) {
      m[i] = 0;
      m[i + 1] = 0;
    } else {
      const alpha = m[i] / delta[i];
      const beta = m[i + 1] / delta[i];
      const dist = alpha * alpha + beta * beta;
      if (dist > 9) {
        const tau = 3 / Math.sqrt(dist);
        m[i] = tau * alpha * delta[i];
        m[i + 1] = tau * beta * delta[i];
      }
    }
  }

  let d = `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;
  for (let i = 0; i < n - 1; i++) {
    const p1 = points[i];
    const p2 = points[i + 1];
    const h = dx[i];

    let cp1x = p1.x + h / 3;
    let cp1y = p1.y + (m[i] * h) / 3;
    let cp2x = p2.x - h / 3;
    let cp2y = p2.y - (m[i + 1] * h) / 3;

    // Strict boundary clamping: never go below baseline (under 0) or above paddingTop
    cp1y = Math.min(baselineY, Math.max(paddingTop, cp1y));
    cp2y = Math.min(baselineY, Math.max(paddingTop, cp2y));

    d += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
  }

  return d;
}

/* ==========================================================================
   EMPTY STATE COMPONENT (For Current Weekly Graph)
   ========================================================================== */

export interface CurrentWeeklyEmptyViewProps {
  theme: ReturnType<typeof useTheme>;
}

export const CurrentWeeklyEmptyView: React.FC<
  CurrentWeeklyEmptyViewProps
> = () => {
  return (
    <View
      style={{
        height: 150,
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        paddingHorizontal: 16,
      }}
    >
      <View
        style={{
          width: 44,
          height: 44,
          borderRadius: 22,
          backgroundColor: "rgba(255, 255, 255, 0.16)",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 2,
        }}
      >
        <Lucide name="bar-chart-2" size={20} color="#FFFFFF" />
      </View>
      <ThemedText
        weight="700"
        style={{
          fontSize: 14,
          color: "#FFFFFF",
          textAlign: "center",
        }}
      >
        {i18n.t("DASHBOARD.NO_WEEKLY_DATA")}
      </ThemedText>
      <ThemedText
        style={{
          fontSize: 12,
          color: "rgba(255, 255, 255, 0.75)",
          textAlign: "center",
          maxWidth: 260,
          lineHeight: 16,
        }}
      >
        {i18n.t("DASHBOARD.NO_WEEKLY_DATA_HINT")}
      </ThemedText>
    </View>
  );
};

/* ==========================================================================
   MAIN CURRENT WEEKLY CONSUMPTION COMPONENT
   ========================================================================== */

const CurrentWeeklyConsumption = ({ data }: { data?: any }) => {
  const { liveData } = usePlugs();
  const theme = useTheme();
  const [graphWidth, setGraphWidth] = useState<number>(0);
  const [graphHeight, setGraphHeight] = useState<number>(0);

  // ------- Raw data array -------
  const raw = useMemo(() => {
    const d = data?.data ?? data;
    return Array.isArray(d) ? d : [];
  }, [data]);

  // ------- Empty check (empty array or all empty objects) -------
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

  // ------- Live cumulative energy from all outlets -------
  const totalCumulativeKwh = useMemo(() => {
    return Object.values(liveData ?? {})
      .flatMap((strip) => Object.values(strip.outlets || {}))
      .reduce((acc, outlet) => acc + (outlet.energy_kwh || 0), 0);
  }, [liveData]);

  // ------- Build 7-point array (today + 6 days before) -------
  const chartData = useMemo(() => {
    if (isEmpty) return [];

    const latestMetric = raw[0];
    const lastCumulativeKwh: number = latestMetric?.cumulativeKwh ?? 0;
    const nowWh = Math.max(
      0,
      Math.round((totalCumulativeKwh - lastCumulativeKwh) * 1000),
    );

    const nowPoint = { kwh: nowWh / 1000, isNow: true };

    // Keep the 6 newest historical metrics (drop the oldest to keep exactly 7 points)
    const historical = raw.slice(0, 6);

    // Newest-first: [now, day_0, day_-1, ..., day_-5]
    return [nowPoint, ...historical];
  }, [raw, isEmpty, totalCumulativeKwh]);

  // ------- Labels (7 items, newest-first: today + 6 days before) -------
  const labels = useMemo(() => {
    if (isEmpty) return [];

    const nowLabel = i18n.t("DASHBOARD.NOW");
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
      return i18n.t(dayKeys[d.getDay()]);
    };

    // Index 0 = "now" (today), index 1 = 1 day ago, index 2 = 2 days ago, ..., index 6 = 6 days ago
    return chartData.map((_, i) => {
      if (i === 0) return nowLabel;
      return getOffsetDay(i);
    });
  }, [chartData, isEmpty]);

  // ------- Localize order for RTL/LTR -------
  const localizedArray = useMemo(() => {
    return i18n.language === "ar" ? chartData : [...chartData].reverse();
  }, [chartData]);

  const localizedLabels = useMemo(() => {
    return [...labels].reverse();
  }, [labels]);

  // ------- Chart geometry -------
  const MaximumWatt = Math.max(
    ...localizedArray.map((item: any) => Math.max(0, (item?.kwh || 0) * 1000)),
    1,
  );
  const PADDING_TOP = 18;
  const PADDING_BOTTOM = 10;
  const PADDING_HORIZONTAL = 8;

  const baselineY = graphHeight - PADDING_BOTTOM;
  const availableHeight = Math.max(
    0,
    graphHeight - PADDING_TOP - PADDING_BOTTOM,
  );
  const availableWidth = Math.max(0, graphWidth - PADDING_HORIZONTAL * 2);

  const relativeGeometry = localizedArray.map(
    (dataPoint: any, index: number) => {
      const kwh = Math.max(0, dataPoint?.kwh || 0);
      const wh = Math.round(kwh * 1000);
      const ratio =
        MaximumWatt > 0 ? Math.min(1, Math.max(0, wh / MaximumWatt)) : 0;
      const divisor = Math.max(1, localizedArray.length - 1);
      const isNow = !!dataPoint?.isNow;
      return {
        x: PADDING_HORIZONTAL + (index / divisor) * availableWidth,
        y: PADDING_TOP + (1 - ratio) * availableHeight,
        wh,
        isNow,
      };
    },
  );

  const pathD = getSmoothPath(relativeGeometry, baselineY, PADDING_TOP);
  const firstPt = relativeGeometry[0];
  const lastPt = relativeGeometry[relativeGeometry.length - 1];
  const areaD =
    pathD && firstPt && lastPt
      ? `${pathD} L ${lastPt.x.toFixed(1)} ${baselineY.toFixed(1)} L ${firstPt.x.toFixed(1)} ${baselineY.toFixed(1)} Z`
      : "";

  return (
    <View style={{ height: 150 }}>
      {/* 1. Empty State View with Fade */}
      <Fade in={isEmpty} duration={250} unmountOnExit>
        <CurrentWeeklyEmptyView theme={theme} />
      </Fade>

      {/* 2. Loaded Graph with Fade */}
      <Fade in={!isEmpty} duration={250} unmountOnExit style={{ flex: 1 }}>
        <View
          style={{ flex: 1 }}
          onLayout={(e) => {
            const { width, height } = e.nativeEvent.layout;
            setGraphWidth(width);
            setGraphHeight(height);
          }}
        >
          <Svg height={graphHeight} width={graphWidth}>
            <Defs>
              <LinearGradient
                id="weeklyConsumptionGradient"
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.28" />
                <Stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.02" />
              </LinearGradient>
            </Defs>
            {areaD ? (
              <Path d={areaD} fill="url(#weeklyConsumptionGradient)" />
            ) : null}
            <Line
              x1={0}
              x2={graphWidth}
              y1={baselineY}
              y2={baselineY}
              stroke="#ffffff30"
              strokeWidth="1.5"
            />
            {pathD ? (
              <Path d={pathD} fill="none" stroke="white" strokeWidth={2} />
            ) : null}
            {relativeGeometry.map(
              (
                point: { x: number; y: number; wh: number; isNow: boolean },
                index: number,
              ) => (
                <React.Fragment key={`point-${index}`}>
                  <Circle
                    cx={point.x}
                    cy={point.y}
                    r={point.isNow ? 5 : 3.5}
                    fill={point.isNow ? "#ffffff50" : "#ffffff20"}
                    stroke={point.isNow ? "#ffffffb0" : "#ffffff20"}
                    strokeWidth={point.isNow ? 2 : 1.5}
                  />
                  <SvgText
                    x={point.x}
                    y={point.y - 8}
                    fill="white"
                    fontSize="9"
                    textAnchor="middle"
                  >
                    {point.wh}
                  </SvgText>
                </React.Fragment>
              ),
            )}
          </Svg>
        </View>
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            paddingHorizontal: PADDING_HORIZONTAL,
          }}
        >
          {localizedLabels.map((label, i) => (
            <ThemedText
              key={`label-${i}`}
              style={{
                fontSize: 9,
                color: "#FFFFFF",
                opacity: label === i18n.t("DASHBOARD.NOW") ? 1 : 0.7,
                fontWeight: label === i18n.t("DASHBOARD.NOW") ? "700" : "400",
              }}
            >
              {label}
            </ThemedText>
          ))}
        </View>
      </Fade>
    </View>
  );
};

export default CurrentWeeklyConsumption;
