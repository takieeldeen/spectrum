import React from "react";
import {
  View,
  StyleSheet,
  ViewProps,
  ViewStyle,
  StyleProp,
  TextStyle,
} from "react-native";
import { useTranslation } from "react-i18next";

import { ThemedText } from "@/components/themed-text";
import { useTheme } from "@/hooks/use-theme";
import { Spacing } from "@/constants/theme";

/* ==========================================================================
   1. TYPES & PROPS
   ========================================================================== */

export type DividerOrientation = "horizontal" | "vertical";
export type DividerVariant = "fullWidth" | "inset" | "middle";
export type DividerTextAlign = "center" | "left" | "right" | "start" | "end";

export interface DividerProps extends ViewProps {
  /**
   * The component orientation.
   * @default 'horizontal'
   */
  orientation?: DividerOrientation;

  /**
   * The variant to use:
   * - `fullWidth`: extends across the full container.
   * - `inset`: offsets from the start margin (great for avatar lists).
   * - `middle`: centers with margins on both ends.
   * @default 'fullWidth'
   */
  variant?: DividerVariant;

  /**
   * If true, enables `alignSelf: 'stretch'` to adapt to parent flex row/column height.
   * Essential when using `orientation="vertical"` inside a row container.
   * @default false
   */
  flexItem?: boolean;

  /**
   * Line thickness in density-independent pixels.
   * @default StyleSheet.hairlineWidth
   */
  thickness?: number;

  /**
   * Custom line color. Defaults to theme-aware divider color.
   */
  color?: string;

  /**
   * Inset distance used when `variant="inset"`.
   * Automatically respects RTL start alignment.
   * @default 72
   */
  insetMargin?: number;

  /**
   * If true, renders a softer, lighter divider with reduced opacity.
   * @default false
   */
  light?: boolean;

  /**
   * Alignment of children text or element inside horizontal divider.
   * @default 'center'
   */
  textAlign?: DividerTextAlign;

  /**
   * Optional custom typography styles for text children.
   */
  textStyle?: StyleProp<TextStyle>;

  /**
   * Optional subheader text, chip, or badge inside the divider.
   */
  children?: React.ReactNode;
}

/* ==========================================================================
   2. COMPONENT
   ========================================================================== */

export function Divider({
  orientation = "horizontal",
  variant = "fullWidth",
  flexItem = false,
  thickness = StyleSheet.hairlineWidth,
  color,
  insetMargin = 72,
  light = false,
  textAlign = "center",
  textStyle,
  style,
  children,
  ...rest
}: DividerProps) {
  const theme = useTheme();
  const { i18n } = useTranslation();
  const isArabic = i18n.language?.startsWith("ar") ?? false;
  const isDark = theme.background === "#000000";

  // Theme-aware default divider color
  const defaultColor = color ?? (isDark ? "rgba(255, 255, 255, 0.12)" : "rgba(0, 0, 0, 0.08)");
  const dividerColor = light ? `${defaultColor}80` : defaultColor;

  const isVertical = orientation === "vertical";

  /* ------------------------------------------------------------------------
     A. DIVIDER WITH CHILDREN (e.g. <Divider>OR</Divider>)
     ------------------------------------------------------------------------ */
  if (children && !isVertical) {
    const isStart =
      textAlign === "start" ||
      (textAlign === "left" && !isArabic) ||
      (textAlign === "right" && isArabic);

    const isEnd =
      textAlign === "end" ||
      (textAlign === "right" && !isArabic) ||
      (textAlign === "left" && isArabic);

    const leftFlex = isStart ? 0.15 : 1;
    const rightFlex = isEnd ? 0.15 : 1;

    return (
      <View
        style={[
          styles.textDividerContainer,
          { direction: isArabic ? "rtl" : "ltr" },
          style,
        ]}
        {...rest}
      >
        <View
          style={[
            styles.line,
            {
              backgroundColor: dividerColor,
              height: thickness,
              flex: leftFlex,
            },
          ]}
        />

        <View style={styles.textWrapper}>
          {typeof children === "string" ? (
            <ThemedText
              type="small"
              themeColor="textSecondary"
              style={[styles.textLabel, textStyle]}
            >
              {children}
            </ThemedText>
          ) : (
            children
          )}
        </View>

        <View
          style={[
            styles.line,
            {
              backgroundColor: dividerColor,
              height: thickness,
              flex: rightFlex,
            },
          ]}
        />
      </View>
    );
  }

  /* ------------------------------------------------------------------------
     B. STANDARD HORIZONTAL / VERTICAL LINE
     ------------------------------------------------------------------------ */
  const computedStyle: ViewStyle = isVertical
    ? {
        width: thickness,
        backgroundColor: dividerColor,
        ...(flexItem
          ? { alignSelf: "stretch" }
          : { height: "100%" }),
        ...(variant === "middle" && { marginVertical: Spacing.two }),
        ...(variant === "inset" && {
          [isArabic ? "marginBottom" : "marginTop"]: insetMargin,
        }),
      }
    : {
        height: thickness,
        width: "100%",
        backgroundColor: dividerColor,
        ...(flexItem && { alignSelf: "stretch" }),
        ...(variant === "middle" && { marginHorizontal: Spacing.three }),
        ...(variant === "inset" && {
          [isArabic ? "marginRight" : "marginLeft"]: insetMargin,
        }),
      };

  return <View style={[computedStyle, style]} {...rest} />;
}

export default Divider;

/* ==========================================================================
   3. STYLES
   ========================================================================== */

const styles = StyleSheet.create({
  textDividerContainer: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    marginVertical: Spacing.two,
  },
  line: {
    minWidth: 16,
  },
  textWrapper: {
    paddingHorizontal: Spacing.two,
  },
  textLabel: {
    fontSize: 12,
    fontWeight: "500",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
});
