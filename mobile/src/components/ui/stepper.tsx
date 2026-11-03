import React, { useState, useMemo } from "react";
import {
  View,
  Pressable,
  StyleSheet,
  StyleProp,
  ViewStyle,
  TextStyle,
  I18nManager,
} from "react-native";
import { Lucide } from "@react-native-vector-icons/lucide";

import { ThemedText } from "@/components/themed-text";
import { useTheme } from "@/hooks/use-theme";
import i18n from "@/i18n";

/* ==========================================================================
   1. TYPES & PROPS
   ========================================================================== */

export interface StepItem {
  /**
   * Primary title of the step (displayed below the circle in horizontal orientation)
   */
  title: string;

  /**
   * Optional secondary subtitle / description
   */
  description?: string;

  /**
   * Optional custom Lucide icon name (e.g. 'wifi', 'send', 'check')
   */
  icon?: React.ComponentProps<typeof Lucide>["name"] | string;

  /**
   * Optional custom badge / icon element to render inside the circle
   */
  customIcon?: React.ReactNode;

  /**
   * If true, this step cannot be pressed
   */
  disabled?: boolean;

  /**
   * If true, displays the step in an error state
   */
  error?: boolean;
}

export interface DashedLineProps {
  /**
   * Line dash color
   * @default '#CBD5E1'
   */
  color?: string;

  /**
   * Thickness of the dashed line
   * @default 2
   */
  thickness?: number;

  /**
   * Length of each dash segment
   * @default 6
   */
  dashLength?: number;

  /**
   * Space between consecutive dash segments
   * @default 5
   */
  dashGap?: number;

  /**
   * Orientation of the dashed line
   * @default 'horizontal'
   */
  orientation?: "horizontal" | "vertical";

  /**
   * Explicit length of the line in pixels if pre-calculated
   */
  length?: number;

  style?: StyleProp<ViewStyle>;
}

export interface StepperProps {
  /**
   * Steps configuration. Can be an array of strings or StepItem objects.
   */
  steps: (StepItem | string)[];

  /**
   * Zero-based index of the currently active step (e.g. 0 for first step).
   * @default 0
   */
  activeStep?: number;

  /**
   * Callback fired when a step is tapped
   */
  onStepPress?: (stepIndex: number) => void;

  /**
   * Diameter of each circular step indicator
   * @default 36
   */
  circleSize?: number;

  /**
   * Gap between the circle edge and the dashed connector line
   * @default 6
   */
  connectorGap?: number;

  /**
   * Thickness of the dashed connector line
   * @default 2
   */
  connectorThickness?: number;

  /**
   * Length of each dash segment in the connector
   * @default 6
   */
  dashLength?: number;

  /**
   * Gap between dashes in the connector
   * @default 5
   */
  dashGap?: number;

  /**
   * Background color of the active step circle
   * Defaults to theme.primary (#059669)
   */
  activeColor?: string;

  /**
   * Text / icon color of the active step circle
   * @default '#FFFFFF'
   */
  activeTextColor?: string;

  /**
   * Background color of completed step circles
   * Defaults to activeColor
   */
  completedColor?: string;

  /**
   * Text / icon color of completed step circles
   * @default '#FFFFFF'
   */
  completedTextColor?: string;

  /**
   * Background color of upcoming / inactive step circles
   */
  inactiveColor?: string;

  /**
   * Text color of upcoming / inactive step circles
   */
  inactiveTextColor?: string;

  /**
   * Color of the dashed connector line
   */
  connectorColor?: string;

  /**
   * Optional color for connector lines preceding completed steps
   */
  completedConnectorColor?: string;

  /**
   * Whether completed steps show a checkmark icon instead of the step index number
   * @default false
   */
  showCheckmarkOnCompleted?: boolean;

  /**
   * Error color for steps with error = true
   * @default '#EF4444'
   */
  errorColor?: string;

  /**
   * Stepper layout direction.
   * - 'ltr': Always left-to-right (1 on left, 2 middle, 3 right, like the design mockup)
   * - 'rtl': Right-to-left
   * - 'auto': Follows system / I18nManager
   * @default 'ltr'
   */
  direction?: "ltr" | "rtl" | "auto";

  /**
   * Stepper layout orientation
   * @default 'horizontal'
   */
  orientation?: "horizontal" | "vertical";

  /**
   * Optional custom style for the outer container
   */
  style?: StyleProp<ViewStyle>;

  /**
   * Optional custom style for step titles
   */
  titleStyle?: StyleProp<TextStyle>;

  /**
   * Optional custom style for step descriptions
   */
  descriptionStyle?: StyleProp<TextStyle>;

  /**
   * If true, allows pressing any step regardless of whether preceding steps are completed
   * @default false
   */
  nonLinear?: boolean;
}

/* ==========================================================================
   2. DASHED LINE COMPONENT
   ========================================================================== */

export function DashedLine({
  color = "#CBD5E1",
  thickness = 2,
  dashLength = 6,
  dashGap = 5,
  orientation = "horizontal",
  length,
  style,
}: DashedLineProps) {
  const [measuredSize, setMeasuredSize] = useState(0);

  const isHorizontal = orientation === "horizontal";
  const size = length !== undefined && length > 0 ? length : measuredSize;

  const dashTotal = dashLength + dashGap;
  const numDashes =
    size > 0 ? Math.max(1, Math.floor((size + dashGap) / dashTotal)) : 0;

  return (
    <View
      onLayout={(e) => {
        if (length === undefined || length <= 0) {
          const measured = isHorizontal
            ? e.nativeEvent.layout.width
            : e.nativeEvent.layout.height;
          if (measured > 0 && Math.abs(measured - measuredSize) > 1) {
            setMeasuredSize(measured);
          }
        }
      }}
      style={[
        isHorizontal
          ? {
              height: thickness,
              width: length ?? "100%",
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              overflow: "hidden",
            }
          : {
              width: thickness,
              height: length ?? "100%",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "space-between",
              overflow: "hidden",
            },
        style,
      ]}
    >
      {numDashes > 0
        ? Array.from({ length: numDashes }).map((_, index) => (
            <View
              key={index}
              style={
                isHorizontal
                  ? {
                      width: dashLength,
                      height: thickness,
                      backgroundColor: color,
                      borderRadius: thickness > 1 ? thickness / 2 : 0,
                    }
                  : {
                      width: thickness,
                      height: dashLength,
                      backgroundColor: color,
                      borderRadius: thickness > 1 ? thickness / 2 : 0,
                    }
              }
            />
          ))
        : null}
    </View>
  );
}

/* ==========================================================================
   3. STEPPER COMPONENT
   ========================================================================== */

export function Stepper({
  steps,
  activeStep = 0,
  onStepPress,
  circleSize = 36,
  connectorGap = 6,
  connectorThickness = 2,
  dashLength = 6,
  dashGap = 5,
  activeColor,
  activeTextColor = "#FFFFFF",
  completedColor,
  completedTextColor = "#FFFFFF",
  inactiveColor,
  inactiveTextColor,
  connectorColor,
  completedConnectorColor,
  showCheckmarkOnCompleted = false,
  errorColor = "#EF4444",
  direction = "ltr",
  orientation = "horizontal",
  style,
  titleStyle,
  descriptionStyle,
  nonLinear = false,
}: StepperProps) {
  const theme = useTheme();
  const isDark = theme.isDark;
  const [containerWidth, setContainerWidth] = useState(0);

  // Normalize steps to StepItem format
  const normalizedSteps: StepItem[] = useMemo(() => {
    return steps.map((item) =>
      typeof item === "string" ? { title: item } : item
    );
  }, [steps]);

  // Determine direction
  const isArabic = (i18n.language || "ar").startsWith("ar");
  const isRTL =
    direction === "rtl" ||
    (direction === "auto" && (I18nManager.isRTL || isArabic));

  // Colors resolution
  const resolvedActiveColor = activeColor ?? theme.primary;
  const resolvedCompletedColor = completedColor ?? resolvedActiveColor;
  const resolvedInactiveColor =
    inactiveColor ?? (isDark ? "#2A2D32" : "#E2E8F0");
  const resolvedInactiveTextColor =
    inactiveTextColor ?? (isDark ? "#8A8F98" : "#94A3B8");
  const resolvedConnectorColor =
    connectorColor ?? (isDark ? "#33373E" : "#CBD5E1");
  const resolvedCompletedConnectorColor =
    completedConnectorColor ?? resolvedConnectorColor;

  const totalSteps = normalizedSteps.length;

  /* ------------------------------------------------------------------------
     A. HORIZONTAL STEPPER
     ------------------------------------------------------------------------ */
  if (orientation === "horizontal") {
    const columnWidth =
      containerWidth > 0 && totalSteps > 0 ? containerWidth / totalSteps : 0;
    const connectorWidth = Math.max(
      0,
      columnWidth - circleSize - connectorGap * 2
    );

    return (
      <View
        onLayout={(e) => {
          const w = e.nativeEvent.layout.width;
          if (w > 0 && Math.abs(w - containerWidth) > 1) {
            setContainerWidth(w);
          }
        }}
        style={[
          styles.container,
          { flexDirection: "row" },
          style,
        ]}
      >
        {normalizedSteps.map((step, index) => {
          const isActive = index === activeStep;
          const isCompleted = index < activeStep;
          const isPending = index > activeStep;
          const isLast = index === totalSteps - 1;
          const hasError = !!step.error;

          // Step circle styling
          let circleBgColor = resolvedInactiveColor;
          let circleTextColor = resolvedInactiveTextColor;

          if (hasError) {
            circleBgColor = `${errorColor}20`;
            circleTextColor = errorColor;
          } else if (isActive) {
            circleBgColor = resolvedActiveColor;
            circleTextColor = activeTextColor;
          } else if (isCompleted) {
            circleBgColor = resolvedCompletedColor;
            circleTextColor = completedTextColor;
          }

          // Connector color
          const isConnectorCompleted = index < activeStep;
          const curConnectorColor = isConnectorCompleted
            ? resolvedCompletedConnectorColor
            : resolvedConnectorColor;

          // Press handler
          const canPress =
            Boolean(onStepPress) &&
            !step.disabled &&
            (nonLinear || isCompleted || isActive);

          const handlePress = () => {
            if (canPress && onStepPress) {
              onStepPress(index);
            }
          };

          return (
            <View key={index} style={styles.stepColumn}>
              {/* Top Row with Circle & Dashed Connector to Next Step */}
              <View
                onLayout={(e) => {
                  const w = e.nativeEvent.layout.width;
                  if (w > 0 && containerWidth === 0) {
                    setContainerWidth(w * totalSteps);
                  }
                }}
                style={[
                  styles.circleContainer,
                  { height: circleSize },
                ]}
              >
                {/* Dashed connector starting from right of this circle to next circle */}
                {!isLast && (
                  <View
                    style={[
                      styles.connectorAbsoluteWrapper,
                      {
                        top: (circleSize - connectorThickness) / 2,
                        height: connectorThickness,
                        width: connectorWidth > 0 ? connectorWidth : undefined,
                        [isRTL ? "right" : "left"]: "50%",
                        [isRTL ? "marginRight" : "marginLeft"]:
                          circleSize / 2 + connectorGap,
                      },
                    ]}
                  >
                    <DashedLine
                      color={curConnectorColor}
                      thickness={connectorThickness}
                      dashLength={dashLength}
                      dashGap={dashGap}
                      orientation="horizontal"
                      length={connectorWidth > 0 ? connectorWidth : undefined}
                    />
                  </View>
                )}

                {/* Circular Step Badge */}
                <Pressable
                  onPress={handlePress}
                  disabled={!canPress}
                  style={({ pressed }) => [
                    styles.circle,
                    {
                      width: circleSize,
                      height: circleSize,
                      borderRadius: circleSize / 2,
                      backgroundColor: circleBgColor,
                      opacity: pressed && canPress ? 0.8 : 1,
                    },
                    hasError && { borderWidth: 1.5, borderColor: errorColor },
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={`${step.title}, Step ${index + 1} of ${totalSteps}`}
                  accessibilityState={{
                    selected: isActive,
                    disabled: !canPress,
                  }}
                >
                  {step.customIcon ? (
                    step.customIcon
                  ) : hasError ? (
                    <Lucide name="alert-circle" size={circleSize * 0.5} color={errorColor} />
                  ) : isCompleted && showCheckmarkOnCompleted ? (
                    <Lucide
                      name="check"
                      size={circleSize * 0.5}
                      color={completedTextColor}
                    />
                  ) : step.icon ? (
                    <Lucide
                      name={step.icon as any}
                      size={circleSize * 0.48}
                      color={circleTextColor}
                    />
                  ) : (
                    <ThemedText
                      style={[
                        styles.circleNumber,
                        {
                          color: circleTextColor,
                          fontSize: Math.round(circleSize * 0.42),
                          fontWeight: isActive ? "700" : "600",
                        },
                      ]}
                    >
                      {index + 1}
                    </ThemedText>
                  )}
                </Pressable>
              </View>

              {/* Step Label / Title & Subtitle Below Circle */}
              <Pressable
                onPress={handlePress}
                disabled={!canPress}
                style={styles.labelContainer}
              >
                <ThemedText
                  style={[
                    styles.title,
                    {
                      color: isActive
                        ? theme.text
                        : isCompleted
                        ? theme.text
                        : resolvedInactiveTextColor,
                      fontWeight: isActive ? "700" : isCompleted ? "600" : "500",
                    },
                    titleStyle,
                  ]}
                  numberOfLines={2}
                >
                  {step.title}
                </ThemedText>

                {step.description ? (
                  <ThemedText
                    style={[
                      styles.description,
                      { color: theme.textSecondary },
                      descriptionStyle,
                    ]}
                    numberOfLines={2}
                  >
                    {step.description}
                  </ThemedText>
                ) : null}
              </Pressable>
            </View>
          );
        })}
      </View>
    );
  }

  /* ------------------------------------------------------------------------
     B. VERTICAL STEPPER
     ------------------------------------------------------------------------ */
  return (
    <View style={[styles.verticalContainer, style]}>
      {normalizedSteps.map((step, index) => {
        const isActive = index === activeStep;
        const isCompleted = index < activeStep;
        const isLast = index === totalSteps - 1;
        const hasError = !!step.error;

        let circleBgColor = resolvedInactiveColor;
        let circleTextColor = resolvedInactiveTextColor;

        if (hasError) {
          circleBgColor = `${errorColor}20`;
          circleTextColor = errorColor;
        } else if (isActive) {
          circleBgColor = resolvedActiveColor;
          circleTextColor = activeTextColor;
        } else if (isCompleted) {
          circleBgColor = resolvedCompletedColor;
          circleTextColor = completedTextColor;
        }

        const isConnectorCompleted = index < activeStep;
        const curConnectorColor = isConnectorCompleted
          ? resolvedCompletedConnectorColor
          : resolvedConnectorColor;

        const canPress =
          Boolean(onStepPress) &&
          !step.disabled &&
          (nonLinear || isCompleted || isActive);

        const handlePress = () => {
          if (canPress && onStepPress) {
            onStepPress(index);
          }
        };

        return (
          <View
            key={index}
            style={[
              styles.verticalStepRow,
              { flexDirection: "row" },
            ]}
          >
            {/* Left Track with Circle and Vertical Dashed Connector */}
            <View style={[styles.verticalIndicatorColumn, { width: circleSize }]}>
              <Pressable
                onPress={handlePress}
                disabled={!canPress}
                style={({ pressed }) => [
                  styles.circle,
                  {
                    width: circleSize,
                    height: circleSize,
                    borderRadius: circleSize / 2,
                    backgroundColor: circleBgColor,
                    opacity: pressed && canPress ? 0.8 : 1,
                  },
                  hasError && { borderWidth: 1.5, borderColor: errorColor },
                ]}
              >
                {step.customIcon ? (
                  step.customIcon
                ) : hasError ? (
                  <Lucide name="alert-circle" size={circleSize * 0.5} color={errorColor} />
                ) : isCompleted && showCheckmarkOnCompleted ? (
                  <Lucide
                    name="check"
                    size={circleSize * 0.5}
                    color={completedTextColor}
                  />
                ) : step.icon ? (
                  <Lucide
                    name={step.icon as any}
                    size={circleSize * 0.48}
                    color={circleTextColor}
                  />
                ) : (
                  <ThemedText
                    style={[
                      styles.circleNumber,
                      {
                        color: circleTextColor,
                        fontSize: Math.round(circleSize * 0.42),
                        fontWeight: isActive ? "700" : "600",
                      },
                    ]}
                  >
                    {index + 1}
                  </ThemedText>
                )}
              </Pressable>

              {!isLast && (
                <View
                  style={[
                    styles.verticalConnectorWrapper,
                    {
                      marginTop: connectorGap,
                      marginBottom: connectorGap,
                    },
                  ]}
                >
                  <DashedLine
                    color={curConnectorColor}
                    thickness={connectorThickness}
                    dashLength={dashLength}
                    dashGap={dashGap}
                    orientation="vertical"
                    style={{ flex: 1 }}
                  />
                </View>
              )}
            </View>

            {/* Right Content / Labels */}
            <Pressable
              onPress={handlePress}
              disabled={!canPress}
              style={[
                styles.verticalContent,
                {
                  [isRTL ? "marginRight" : "marginLeft"]: 14,
                  paddingBottom: isLast ? 4 : 24,
                },
              ]}
            >
              <ThemedText
                style={[
                  styles.verticalTitle,
                  {
                    color: isActive
                      ? theme.text
                      : isCompleted
                      ? theme.text
                      : resolvedInactiveTextColor,
                    fontWeight: isActive ? "700" : isCompleted ? "600" : "500",
                    textAlign: isRTL ? "right" : "left",
                  },
                  titleStyle,
                ]}
              >
                {step.title}
              </ThemedText>
              {step.description ? (
                <ThemedText
                  style={[
                    styles.verticalDescription,
                    {
                      color: theme.textSecondary,
                      textAlign: isRTL ? "right" : "left",
                    },
                    descriptionStyle,
                  ]}
                >
                  {step.description}
                </ThemedText>
              ) : null}
            </Pressable>
          </View>
        );
      })}
    </View>
  );
}

export default Stepper;

/* ==========================================================================
   4. STYLES
   ========================================================================== */

const styles = StyleSheet.create({
  container: {
    width: "100%",
    alignItems: "flex-start",
    justifyContent: "space-between",
    paddingVertical: 12,
  },
  stepColumn: {
    flex: 1,
    alignItems: "center",
  },
  circleContainer: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  connectorAbsoluteWrapper: {
    position: "absolute",
    justifyContent: "center",
    zIndex: 0,
  },
  circle: {
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
  },
  circleNumber: {
    textAlign: "center",
    includeFontPadding: false,
  },
  labelContainer: {
    marginTop: 8,
    alignItems: "center",
    paddingHorizontal: 4,
    maxWidth: "100%",
  },
  title: {
    fontSize: 12,
    textAlign: "center",
    lineHeight: 16,
  },
  description: {
    fontSize: 10,
    textAlign: "center",
    marginTop: 2,
    lineHeight: 14,
  },

  /* Vertical styles */
  verticalContainer: {
    width: "100%",
    paddingVertical: 8,
  },
  verticalStepRow: {
    width: "100%",
    alignItems: "flex-start",
  },
  verticalIndicatorColumn: {
    alignItems: "center",
  },
  verticalConnectorWrapper: {
    flex: 1,
    minHeight: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  verticalContent: {
    flex: 1,
    justifyContent: "flex-start",
  },
  verticalTitle: {
    fontSize: 14,
    lineHeight: 18,
  },
  verticalDescription: {
    fontSize: 12,
    marginTop: 3,
    lineHeight: 16,
  },
});
