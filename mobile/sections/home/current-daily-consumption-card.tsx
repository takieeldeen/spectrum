import { View, Text } from "react-native";
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
import { useTheme } from "@/hooks/use-theme";
import i18n from "@/i18n";
import { usePlugs } from "@/providers/plug.provider";

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

const CurrentDailyConsumptionCard = ({ data }: { data?: any }) => {
  const { liveData } = usePlugs();
  const theme = useTheme();
  const [graphWidth, setGraphWidth] = useState<number>(0);
  const [graphHeight, setGraphHeight] = useState<number>(0);

  // ------- Live cumulative energy from all outlets -------
  const totalCumulativeKwh = useMemo(() => {
    return Object.values(liveData ?? {}).flatMap((strip) =>
      Object.values(strip.outlets || {}),
    ).reduce((acc, outlet) => acc + (outlet.energy_kwh || 0), 0);
  }, [liveData]);

  // ------- Build 12-point array -------
  // dataArray from BE is sorted newest-first:
  //   [hour_now, hour_-1, ..., hour_-11]  (12 items)
  //
  // We want:
  //   [now_live, hour_now, hour_-1, ..., hour_-10]  (still 12 items)
  //
  // nowWh = (live cumulative) - (cumulativeKwh of the most-recent hourly metric)
  const chartData = useMemo(() => {
    const raw = Array.isArray(data) ? data : [];
    // Most recent historical record (index 0 = newest from BE)
    const latestMetric = raw[0];
    const lastCumulativeKwh: number = latestMetric?.cumulativeKwh ?? 0;

    const nowWh = Math.max(0, Math.round((totalCumulativeKwh - lastCumulativeKwh) * 1000));

    const nowPoint = { kwh: nowWh / 1000, isNow: true };

    // Keep only the 11 newest historical metrics (drop the oldest)
    const historical = raw.slice(0, 11);

    // Newest-first: [now, hr_0, hr_-1, ..., hr_-10]
    return [nowPoint, ...historical];
  }, [data, totalCumulativeKwh]);

  // ------- Labels (12 items, newest-first) -------
  const labels = useMemo(() => {
    const nowLabel = i18n.t("DASHBOARD.NOW");
    const formatHour = (h: number) => {
      const num = h % 12 || 12;
      const p = h >= 12 ? i18n.t("DASHBOARD.PM") : i18n.t("DASHBOARD.AM");
      return `${num} ${p}`;
    };
    const currentHour = new Date().getHours();
    // Index 0 = "now", index 1 = current hour, index 2 = current-1, ...
    return chartData.map((_, i) => {
      if (i === 0) return nowLabel;
      const targetHour = (currentHour - (i - 1) + 24) % 24;
      return formatHour(targetHour);
    });
  }, [chartData]);

  // ------- Localize order for RTL/LTR -------
  // For Arabic (RTL): newest on the right → keep newest-first order as-is
  //   displayed right-to-left: now is rightmost ✓
  // For English (LTR): reverse so oldest is on the left, now is rightmost ✓
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
  const availableHeight = Math.max(0, graphHeight - PADDING_TOP - PADDING_BOTTOM);
  const availableWidth = Math.max(0, graphWidth - PADDING_HORIZONTAL * 2);

  const relativeGeometry = localizedArray.map((dataPoint: any, index: number) => {
    const kwh = Math.max(0, dataPoint?.kwh || 0);
    const wh = Math.round(kwh * 1000);
    const ratio = MaximumWatt > 0 ? Math.min(1, Math.max(0, wh / MaximumWatt)) : 0;
    const divisor = Math.max(1, localizedArray.length - 1);
    const isNow = !!dataPoint?.isNow;
    return {
      x: PADDING_HORIZONTAL + (index / divisor) * availableWidth,
      y: PADDING_TOP + (1 - ratio) * availableHeight,
      wh,
      isNow,
    };
  });

  const pathD = getSmoothPath(relativeGeometry, baselineY, PADDING_TOP);
  const firstPt = relativeGeometry[0];
  const lastPt = relativeGeometry[relativeGeometry.length - 1];
  const areaD =
    pathD && firstPt && lastPt
      ? `${pathD} L ${lastPt.x.toFixed(1)} ${baselineY.toFixed(1)} L ${firstPt.x.toFixed(1)} ${baselineY.toFixed(1)} Z`
      : "";

  return (
    <View style={{ height: 150 }}>
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
              id="dailyConsumptionGradient"
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
            <Path d={areaD} fill="url(#dailyConsumptionGradient)" />
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
              opacity: label === i18n.t("DASHBOARD.NOW") ? 1 : 0.7,
              fontWeight: label === i18n.t("DASHBOARD.NOW") ? "700" : "400",
            }}
          >
            {label}
          </ThemedText>
        ))}
      </View>
    </View>
  );
};

export default CurrentDailyConsumptionCard;

