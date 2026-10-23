import React, { useCallback, useMemo } from "react";
import {
  View,
  I18nManager,
  StyleProp,
  ViewStyle,
  Platform,
} from "react-native";
import Svg, { Circle, G, Path } from "react-native-svg";
import { Lucide } from "@react-native-vector-icons/lucide";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  runOnJS,
} from "react-native-reanimated";
import { useTheme } from "@/hooks/use-theme";
import ThemedText from "@/components/themed-text";
import SafeComponentBoundary from "@/components/safe-boundary";
import { usePlugs } from "@/providers/plug.provider";
import { useGetDevices } from "@/api";

export interface FadeProps {
  in?: boolean;
  duration?: number;
  unmountOnExit?: boolean;
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
}

/**
 * Fade component inspired by MUI's Fade transition.
 * Fades children in/out based on the `in` prop without needing ternary operators.
 */
export const Fade: React.FC<FadeProps> = ({
  in: inProp = false,
  duration = 300,
  unmountOnExit = true,
  style,
  children,
}) => {
  const [mounted, setMounted] = React.useState(inProp);
  const opacity = useSharedValue(inProp ? 1 : 0);

  React.useEffect(() => {
    if (inProp) {
      setMounted(true);
      opacity.value = withTiming(1, {
        duration,
        easing: Easing.out(Easing.ease),
      });
    } else {
      opacity.value = withTiming(
        0,
        { duration, easing: Easing.in(Easing.ease) },
        (finished) => {
          if (finished && unmountOnExit) {
            runOnJS(setMounted)(false);
          }
        },
      );
    }
  }, [inProp, duration, unmountOnExit]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  if (unmountOnExit && !mounted && !inProp) {
    return null;
  }

  const isExiting = mounted && !inProp;

  return (
    <Animated.View
      pointerEvents={inProp ? "auto" : "none"}
      style={[
        style,
        animatedStyle,
        isExiting && {
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
        },
      ]}
    >
      {children}
    </Animated.View>
  );
};

const StarSparkle: React.FC<{
  size?: number;
  color?: string;
  style?: StyleProp<ViewStyle>;
}> = ({ size = 10, color = "#10B981", style }) => (
  <View style={style}>
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M12 0 Q12 12 0 12 Q12 12 12 24 Q12 12 24 12 Q12 12 12 0 Z"
        fill={color}
      />
    </Svg>
  </View>
);

export interface BreakdownEmptyStateProps {
  size: number;
  radius: number;
  center: number;
  strokeWidth: number;
}

export const BreakdownEmptyState: React.FC<BreakdownEmptyStateProps> = ({
  size,
  radius,
  center,
  strokeWidth,
}) => {
  const theme = useTheme();
  const isDark = theme.isDark;
  const isRtl = I18nManager.isRTL;

  return (
    <View
      style={{
        flexDirection: "row-reverse",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 16,
        paddingVertical: 4,
        width: "100%",
      }}
    >
      {/* Left: Empty State Message & Badge */}
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
        }}
      >
        {/* Green Circular Badge with Sparkles */}
        <View
          style={{
            width: 72,
            height: 72,
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
            marginBottom: 2,
          }}
        >
          {/* Center Circle */}
          <View
            style={{
              width: 58,
              height: 58,
              borderRadius: 29,
              backgroundColor: isDark ? "rgba(10, 122, 85, 0.22)" : "#E8FAF2",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Lucide name="plug" size={26} color="#0A7A55" />
          </View>

          {/* Sparkles around badge */}
          <StarSparkle
            size={14}
            color="#0A7A55"
            style={{ position: "absolute", top: 12, left: 2 }}
          />
          <StarSparkle
            size={10}
            color="#34D399"
            style={{ position: "absolute", top: 6, right: 14 }}
          />
          <StarSparkle
            size={8}
            color="#6EE7B7"
            style={{ position: "absolute", bottom: 12, left: 6 }}
          />
          <StarSparkle
            size={12}
            color="#10B981"
            style={{ position: "absolute", bottom: 14, right: 2 }}
          />
        </View>

        {/* Headline */}
        <ThemedText
          style={{
            fontSize: 16,
            fontWeight: "800",
            color: theme.text,
            textAlign: "center",
          }}
        >
          {isRtl ? "لا توجد أجهزة قيد التشغيل بعد" : "No devices running yet"}
        </ThemedText>

        {/* Subtitle */}
        <ThemedText
          style={{
            fontSize: 13,
            fontWeight: "500",
            color: theme.textSecondary,
            textAlign: "center",
            lineHeight: 19,
          }}
        >
          {isRtl
            ? "لكي يعمل هذا الرسم البياني،\nيرجى تشغيل بعض الأجهزة."
            : "To display this chart,\nplease turn on some devices."}
        </ThemedText>
      </View>
    </View>
  );
};

export interface BreakdownItem {
  id: string;
  name: string;
  percentage: number; // e.g. 91.5
  color: string;
}

const greenShades = [
  "#044E35", // Deep forest green (darkest)
  "#0A7A55", // Spectrum primary green (rich medium-dark)
  "#10B981", // Emerald green (vibrant)
  "#34D399", // Mint green (medium-light)
  "#86EFAC", // Light spring green (soft high-contrast)
];

const DEFAULT_BREAKDOWN: BreakdownItem[] = [
  {
    id: "1",
    name: "راديو البلكونة",
    percentage: 91.5,
    color: greenShades[0],
  },
  {
    id: "2",
    name: "الراوتر",
    percentage: 8.5,
    color: greenShades[1],
  },
];

export interface ConsumptionBreakdownCardProps {
  totalPower?: number;
  unit?: string;
  items?: BreakdownItem[];
  title?: string;
  style?: StyleProp<ViewStyle>;
}

export const ConsumptionBreakdownCard: React.FC<
  ConsumptionBreakdownCardProps
> = ({
  totalPower = 6.62,
  unit = "واط",
  items = DEFAULT_BREAKDOWN,
  title = "توزيع الاستهلاك",
  style,
}) => {
  const theme = useTheme();
  const isDark = theme.isDark;
  const isRtl = I18nManager.isRTL;

  // Donut chart dimensions
  const size = 138;
  const strokeWidth = 18;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;

  const { liveData } = usePlugs();
  const { data: devices } = useGetDevices();

  const allOutlets = useMemo(() => {
    if (!liveData) return [];
    return Object.entries(liveData).flatMap(([stripId, stripMetrics]) => {
      return ([1, 2, 3, 4] as const)
        .map((portNumber) => {
          const outletMetrics = stripMetrics?.outlets?.[
            `outlet${portNumber}`
          ] as any;
          const isSwitchedOn = Boolean(
            outletMetrics?.on === true || outletMetrics?.status === "on",
          );

          const correspondingDevice = devices?.find(
            (device) =>
              (device.plugId as any)?._id === stripId &&
              device.plugPort === portNumber,
          );
          const power = outletMetrics?.power_W ?? 0;
          return {
            strip: {
              _id: stripId,
              nameAr: "مخرج " + portNumber,
              nameEn: "Outlet " + portNumber,
            },
            portNumber,
            power,
            isOn: isSwitchedOn,
            device: correspondingDevice
              ? {
                  _id: correspondingDevice?._id,
                  nameAr: correspondingDevice?.nameAr,
                  nameEn: correspondingDevice?.nameEn,
                }
              : {
                  _id: `outlet${portNumber}`,
                  nameAr: "مخرج " + portNumber,
                  nameEn: "Outlet " + portNumber,
                },
          };
        })
        .filter((outlet) => outlet.isOn);
    });
  }, [liveData, devices]);

  const totalPowerConsumption = useMemo(() => {
    return allOutlets.reduce((acc, outlet) => acc + (outlet.power || 0), 0);
  }, [allOutlets]);

  // Max 4 items in legend. If > 4, top 3 items are kept and the rest are summed into "others (their total)"
  const finalData = useMemo(() => {
    if (!liveData || Object.keys(liveData).length === 0) {
      const sortedItems = [...items].sort(
        (a, b) => b.percentage - a.percentage,
      );
      return sortedItems.map((item, index) => ({
        id: item.id,
        strip: { _id: item.id, nameAr: item.name, nameEn: item.name },
        portNumber: index + 1,
        power: (item.percentage / 100) * totalPower,
        device: { _id: item.id, nameAr: item.name, nameEn: item.name },
        percentage: item.percentage.toFixed(1),
        color: greenShades[index % greenShades.length],
      }));
    }

    if (allOutlets.length === 0) {
      return [];
    }

    // Sort descending by power consumption initially
    const sorted = [...allOutlets].sort(
      (a, b) => (b.power || 0) - (a.power || 0),
    );

    const candidateOutlets = sorted;
    const othersLabel = isRtl ? "أخرى (المجموع)" : "others (their total)";

    type BreakdownOutletItem = {
      id: string;
      strip: { _id: string; nameAr: string; nameEn: string };
      portNumber: number;
      power: number;
      device: { _id: string; nameAr?: string; nameEn?: string };
      percentage: string;
      rawPct: number;
    };

    let rawList: BreakdownOutletItem[] = [];

    if (candidateOutlets.length <= 4) {
      rawList = candidateOutlets.map((outlet) => {
        const pct =
          totalPowerConsumption > 0
            ? ((outlet.power || 0) / totalPowerConsumption) * 100
            : 0;
        return {
          id: `${outlet.strip?._id}-${outlet?.portNumber}`,
          ...outlet,
          rawPct: pct,
          percentage: pct.toFixed(1),
        };
      });
    } else {
      // More than 4 items: Top 3 individual items + 1 aggregated "others" item
      const top3 = candidateOutlets.slice(0, 3);
      const remaining = candidateOutlets.slice(3);

      const top3Items = top3.map((outlet) => {
        const pct =
          totalPowerConsumption > 0
            ? ((outlet.power || 0) / totalPowerConsumption) * 100
            : 0;
        return {
          id: `${outlet.strip?._id}-${outlet?.portNumber}`,
          ...outlet,
          rawPct: pct,
          percentage: pct.toFixed(1),
        };
      });

      const othersPower = remaining.reduce((sum, o) => sum + (o.power || 0), 0);
      const othersPct =
        totalPowerConsumption > 0
          ? (othersPower / totalPowerConsumption) * 100
          : 0;

      const othersItem = {
        id: "others",
        strip: {
          _id: "others",
          nameAr: othersLabel,
          nameEn: "others (their total)",
        },
        portNumber: 0,
        power: othersPower,
        device: {
          _id: "others",
          nameAr: othersLabel,
          nameEn: "others (their total)",
        },
        rawPct: othersPct,
        percentage: othersPct.toFixed(1),
      };

      rawList = [...top3Items, othersItem];
    }

    // Sort descending by percentage
    const sortedByPercentage = rawList.sort((a, b) => b.rawPct - a.rawPct);

    // Assign colors in order of percentage rank
    return sortedByPercentage.map((item, index) => ({
      ...item,
      color: greenShades[index % greenShades.length],
    }));
  }, [allOutlets, totalPowerConsumption, items, totalPower, isRtl, liveData]);

  const displayTotalPower =
    allOutlets.length > 0
      ? totalPowerConsumption
      : liveData && Object.keys(liveData).length > 0
        ? 0
        : totalPower;

  const isEmpty = allOutlets.length === 0;

  return (
    <View
      style={[
        {
          width: "100%",
          borderRadius: 24,
          backgroundColor: isDark ? theme.backgroundElement : "#FFFFFF",
          padding: 20,
          gap: 16,
          ...Platform.select({
            ios: {
              shadowColor: "#000000",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: isDark ? 0.3 : 0.06,
              shadowRadius: 12,
            },
            android: {
              elevation: 2,
            },
          }),
        },
        style,
      ]}
    >
      {/* 1. Header: Title */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
        }}
      >
        <ThemedText
          style={{
            fontSize: 20,
            fontWeight: "800",
            color: theme.text,
          }}
        >
          {title}
        </ThemedText>
      </View>

      {/* 2. Content Row: Either Empty State (0 switched-on outlets) OR Active Breakdown using Fade */}
      <View style={{ width: "100%", position: "relative" }}>
        <Fade in={isEmpty} duration={300}>
          <BreakdownEmptyState
            size={size}
            radius={radius}
            center={center}
            strokeWidth={strokeWidth}
          />
        </Fade>

        <Fade in={!isEmpty} duration={300}>
          <View
            style={{
              flexDirection: "row-reverse",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 16,
              width: "100%",
            }}
          >
            {/* Left: Device Breakdown Legend (Max 4 items) */}
            <View
              style={{
                flex: 1,
                gap: 14,
                alignItems: "flex-start",
              }}
            >
              {finalData.map((outlet) => {
                const label = isRtl
                  ? outlet?.device?.nameAr || outlet?.device?.nameEn
                  : outlet?.device?.nameEn || outlet?.device?.nameAr;

                return (
                  <View
                    key={
                      outlet.id || `${outlet.strip?._id}-${outlet?.portNumber}`
                    }
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "center",
                      width: "100%",
                    }}
                  >
                    {/* Device label and color rounded square */}
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 8,
                        flex: 1,
                        justifyContent: "flex-start",
                      }}
                    >
                      <View
                        style={{
                          width: 12,
                          height: 12,
                          borderRadius: 4,
                          backgroundColor: outlet?.color,
                        }}
                      />
                      <ThemedText
                        style={{
                          fontSize: 14,
                          fontWeight: "700",
                          color: theme.text,
                        }}
                        numberOfLines={1}
                      >
                        {label}
                      </ThemedText>
                    </View>
                    {/* Percentage on the far left */}
                    <ThemedText
                      style={{
                        fontSize: 16,
                        fontWeight: "800",
                        color: theme.text,
                      }}
                    >
                      {outlet?.percentage}%
                    </ThemedText>
                  </View>
                );
              })}
            </View>

            {/* Right: Donut Chart with Center Readout */}
            <View style={{ width: size, height: size, position: "relative" }}>
              <SafeComponentBoundary>
                <Svg width={size} height={size}>
                  <G rotation="-90" origin={`${center}, ${center}`}>
                    {/* Background Track Circle */}
                    <Circle
                      cx={center}
                      cy={center}
                      r={radius}
                      stroke={isDark ? "rgba(255, 255, 255, 0.08)" : "#F1F5F9"}
                      strokeWidth={strokeWidth}
                      fill="none"
                    />

                    {/* Active Segments */}
                    {(() => {
                      let cumulative = 0;
                      return finalData.map((item) => {
                        const pct = parseFloat(item?.percentage) || 0;
                        if (pct <= 0) return null;
                        const strokeDasharray = `${(circumference * pct) / 100} ${circumference}`;
                        const strokeDashoffset = -(
                          (circumference * cumulative) /
                          100
                        );
                        cumulative += pct;

                        return (
                          <Circle
                            key={
                              item.id ||
                              `${item.strip?._id}-${item?.portNumber}`
                            }
                            cx={center}
                            cy={center}
                            r={radius}
                            stroke={item.color}
                            strokeWidth={strokeWidth}
                            strokeDasharray={strokeDasharray}
                            strokeDashoffset={strokeDashoffset}
                            fill="none"
                          />
                        );
                      });
                    })()}
                  </G>
                </Svg>
              </SafeComponentBoundary>

              {/* Center Text inside Donut */}
              <View
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <ThemedText
                  style={{
                    fontSize: 26,
                    fontWeight: "800",
                    color: theme.text,
                    lineHeight: 28,
                  }}
                >
                  {displayTotalPower.toFixed(2)}
                </ThemedText>
                <ThemedText
                  style={{
                    fontSize: 13,
                    fontWeight: "500",
                    color: theme.textSecondary,
                    marginTop: 2,
                  }}
                >
                  {unit}
                </ThemedText>
              </View>
            </View>
          </View>
        </Fade>
      </View>
    </View>
  );
};

export default ConsumptionBreakdownCard;
