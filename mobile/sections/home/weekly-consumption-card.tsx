import React, { useState } from "react";
import {
  View,
  Pressable,
  I18nManager,
  StyleProp,
  ViewStyle,
  Platform,
} from "react-native";
import { useTheme } from "@/hooks/use-theme";
import ThemedText from "@/components/themed-text";
import { useGetWeekAnalytics } from "@/api";

export interface DayConsumption {
  id: string;
  dayName: string;
  value: number; // in kWh
  heightRatio: number; // 0 to 1
  isToday?: boolean;
}

const DEFAULT_WEEK_DATA: DayConsumption[] = [
  { id: "sat", dayName: "سبت", value: 0.32, heightRatio: 0.85 },
  { id: "sun", dayName: "أحد", value: 0.28, heightRatio: 0.72 },
  { id: "mon", dayName: "اثنين", value: 0.38, heightRatio: 0.98 },
  { id: "tue", dayName: "ثلاثاء", value: 0.25, heightRatio: 0.65 },
  {
    id: "wed",
    dayName: "أربعاء",
    value: 0.24,
    heightRatio: 0.62,
    isToday: true,
  },
  { id: "thu", dayName: "خميس", value: 0.02, heightRatio: 0.1 },
  { id: "fri", dayName: "جمعة", value: 0.02, heightRatio: 0.1 },
];

export interface WeeklyConsumptionCardProps {
  data?: DayConsumption[];
  title?: string;
  unit?: string;
  style?: StyleProp<ViewStyle>;
}

export const WeeklyConsumptionCard: React.FC<WeeklyConsumptionCardProps> = ({
  data = DEFAULT_WEEK_DATA,
  title = "استهلاك الأسبوع",
  unit = "كيلو واط . ساعة",
  style,
}) => {
  const { data: analytics } = useGetWeekAnalytics();
  console.log(analytics);
  const theme = useTheme();
  const isDark = theme.isDark;
  const isRtl = I18nManager.isRTL;

  // Selected day ID (defaults to the one marked as isToday, or "wed")
  const defaultSelected =
    data.find((d) => d.isToday)?.id ?? data[4]?.id ?? data[0]?.id;
  const [selectedDayId, setSelectedDayId] = useState<string>(defaultSelected);

  const MAX_BAR_HEIGHT = 100;
  const MIN_BAR_HEIGHT = 12;

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
      {/* 1. Header: Title (right in RTL) and Unit (left in RTL) */}
      <View
        style={{
          flexDirection: isRtl ? "row" : "row-reverse",
          justifyContent: "space-between",
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
        <ThemedText
          style={{
            fontSize: 13,
            fontWeight: "500",
            color: theme.textSecondary,
          }}
        >
          {unit}
        </ThemedText>
      </View>

      {/* 2. Bar Chart Section */}
      <View
        style={{
          flexDirection: isRtl ? "row" : "row-reverse",
          justifyContent: "space-between",
          alignItems: "flex-end",
          height: 140,
          paddingTop: 24, // Space for the top value label
        }}
      >
        {analytics?.data?.map((item) => {
          const isSelected = selectedDayId === item.id;
          const barHeight = Math.max(
            item.heightRatio * MAX_BAR_HEIGHT,
            MIN_BAR_HEIGHT,
          );

          // Bar colors based on state
          const barBgColor = isSelected
            ? theme.primaryDark
            : item.heightRatio <= 0.12
              ? isDark
                ? "rgba(255, 255, 255, 0.08)"
                : "#E5E7EB"
              : isDark
                ? "rgba(16, 185, 129, 0.35)"
                : "#C1EAD9";

          return (
            <Pressable
              key={item.id}
              onPress={() => setSelectedDayId(item.id)}
              style={{
                alignItems: "center",
                flex: 1,
                maxWidth: 42,
              }}
            >
              {/* Value indicator badge above bar */}
              <View
                style={{
                  height: 20,
                  justifyContent: "center",
                  marginBottom: 4,
                }}
              >
                {isSelected && (
                  <ThemedText
                    style={{
                      fontSize: 13,
                      fontWeight: "800",
                      color: theme.primaryDark,
                    }}
                  >
                    {item.value.toFixed(2)}
                  </ThemedText>
                )}
              </View>

              {/* The rounded vertical bar */}
              <View
                style={{
                  width: "82%",
                  maxWidth: 38,
                  height: barHeight,
                  borderRadius: 14,
                  backgroundColor: barBgColor,
                }}
              />

              {/* Day label below */}
              <ThemedText
                style={{
                  marginTop: 8,
                  fontSize: 13,
                  fontWeight: isSelected ? "800" : "600",
                  color: isSelected ? theme.primaryDark : theme.textSecondary,
                }}
              >
                {item.dayName}
              </ThemedText>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
};

export default WeeklyConsumptionCard;
