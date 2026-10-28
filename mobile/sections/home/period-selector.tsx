import React, { useRef, useEffect, useState } from "react";
import {
  View,
  Pressable,
  LayoutChangeEvent,
  Platform,
  StyleProp,
  ViewStyle,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useTheme } from "@/hooks/use-theme";
import ThemedText from "@/components/themed-text";

import { useTranslation } from "react-i18next";

export type PeriodType = "day" | "month" | "week";

export interface PeriodOption {
  id: PeriodType;
  label: string;
}

export interface PeriodSelectorProps {
  value?: PeriodType;
  defaultValue?: PeriodType;
  onChange?: (period: PeriodType) => void;
  options?: PeriodOption[];
  style?: StyleProp<ViewStyle>;
}

export const PeriodSelector: React.FC<PeriodSelectorProps> = ({
  value,
  defaultValue = "day",
  onChange,
  options,
  style,
}) => {
  const { t } = useTranslation();
  const defaultPeriods = React.useMemo<PeriodOption[]>(
    () => [
      { id: "month", label: t("DASHBOARD.PERIOD_MONTH") },
      { id: "day", label: t("DASHBOARD.PERIOD_DAY") },
    ],
    [t],
  );
  const resolvedOptions = options ?? defaultPeriods;

  const [internalValue, setInternalValue] = useState<PeriodType>(
    value ?? defaultValue,
  );
  const selectedPeriod = value ?? internalValue;

  const [trackWidth, setTrackWidth] = useState(0);
  const theme = useTheme();

  const translateX = useSharedValue(0);
  const opacity = useSharedValue(0);
  const hasInitialized = useRef(false);

  const segmentCount = resolvedOptions.length;

  useEffect(() => {
    if (trackWidth > 0) {
      const segWidth = trackWidth / segmentCount;
      const targetIndex = Math.max(
        0,
        resolvedOptions.findIndex((o) => o.id === selectedPeriod),
      );
      const targetX = targetIndex * segWidth;

      if (!hasInitialized.current) {
        translateX.value = targetX;
        opacity.value = withTiming(1, { duration: 150 });
        hasInitialized.current = true;
      } else {
        translateX.value = withSpring(targetX, {
          damping: 18,
          stiffness: 180,
          mass: 0.8,
        });
      }
    }
  }, [selectedPeriod, trackWidth, segmentCount]);

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
    opacity: opacity.value,
  }));

  const handleSelect = (id: PeriodType) => {
    if (value === undefined) {
      setInternalValue(id);
    }
    onChange?.(id);
  };

  return (
    <View
      onLayout={(e: LayoutChangeEvent) => {
        const width = e.nativeEvent.layout.width;
        const inner = width - 8;
        if (inner > 0 && Math.abs(inner - trackWidth) > 1) {
          setTrackWidth(inner);
        }
      }}
      style={[
        {
          backgroundColor: "rgba(0, 0, 0, 0.25)",
          height: 46,
          borderRadius: 14,
          padding: 4,
          justifyContent: "center",
          position: "relative",
          direction: "ltr",
        },
        style,
      ]}
    >
      {/* Sliding white pill indicator underneath */}
      {trackWidth > 0 && (
        <Animated.View
          pointerEvents="none"
          style={[
            {
              position: "absolute",
              top: 4,
              bottom: 4,
              left: 4,
              width: trackWidth / segmentCount,
              borderRadius: 10,
              backgroundColor: "#FFFFFF",
              ...Platform.select({
                ios: {
                  shadowColor: "#000000",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.15,
                  shadowRadius: 4,
                },
                android: {
                  elevation: 2,
                },
              }),
            },
            indicatorStyle,
          ]}
        />
      )}

      {/* Interactive buttons on top */}
      <View
        style={{
          flexDirection: "row",
          direction: "ltr",
          height: "100%",
          alignItems: "center",
        }}
      >
        {resolvedOptions.map((item) => {
          const isSelected = selectedPeriod === item.id;
          return (
            <Pressable
              key={item.id}
              onPress={() => handleSelect(item.id)}
              style={{
                flex: 1,
                height: "100%",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <ThemedText
                style={{
                  color: isSelected ? theme.primaryDark : "#FFFFFF",
                  fontWeight: "700",
                  fontSize: 14,
                }}
              >
                {item.label}
              </ThemedText>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
};

export default PeriodSelector;
