import React from "react";
import {
  Pressable,
  PressableProps,
  StyleSheet,
  View,
  ViewStyle,
  TextStyle,
  StyleProp,
  Platform,
  ActivityIndicator,
} from "react-native";
import { useTranslation } from "react-i18next";

import { ThemedText } from "@/components/themed-text";
import { useTheme } from "@/hooks/use-theme";
import { Spacing } from "@/constants/theme";

/* ==========================================================================
   1. TYPES & PROPS
   ========================================================================== */

export type ButtonVariant =
  | "contained"
  | "outlined"
  | "text"
  | "soft"
  | "plain"
  | "link";
export type ButtonColor =
  | "primary"
  | "secondary"
  | "error"
  | "warning"
  | "info"
  | "success"
  | "inherit";
export type ButtonSize = "small" | "medium" | "large";

export interface ButtonProps extends Omit<PressableProps, "style" | "children"> {
  /**
   * Button variant:
   * - `contained`: solid filled background with elevation.
   * - `outlined`: transparent background with border.
   * - `text`: transparent background without border, just colored text.
   * - `soft`: subtle translucent background (20% alpha) with colored text.
   * - `plain` / `link`: alias for text button.
   * @default 'contained'
   */
  variant?: ButtonVariant;

  /**
   * Color theme palette.
   * @default 'primary'
   */
  color?: ButtonColor;

  /**
   * Button size.
   * @default 'medium'
   */
  size?: ButtonSize;

  /**
   * Element placed before the button text (RTL-aware).
   */
  startIcon?: React.ReactNode;

  /**
   * Element placed after the button text (RTL-aware).
   */
  endIcon?: React.ReactNode;

  /**
   * If true, the button takes 100% of the parent container's width.
   * @default false
   */
  fullWidth?: boolean;

  /**
   * If true, displays a loading spinner and disables interaction.
   * @default false
   */
  loading?: boolean;

  /**
   * Custom loading indicator component.
   */
  loadingIndicator?: React.ReactNode;

  /**
   * Position of the loading indicator.
   * @default 'center'
   */
  loadingPosition?: "center" | "start" | "end";

  /**
   * Button corner radius.
   * @default 12
   */
  borderRadius?: number;

  /**
   * Custom style applied to the button container.
   */
  style?: StyleProp<ViewStyle>;

  /**
   * Custom style applied to the text label.
   */
  textStyle?: StyleProp<TextStyle>;

  /**
   * Button label or nested elements.
   */
  children?: React.ReactNode;
}

/* ==========================================================================
   2. PALETTE MAPPING
   ========================================================================== */

const PALETTE: Record<ButtonColor, string> = {
  primary: "#059669",
  secondary: "#60646C",
  error: "#EF4444",
  warning: "#F59E0B",
  info: "#3B82F6",
  success: "#10B981",
  inherit: "#000000",
};

/* ==========================================================================
   3. BUTTON COMPONENT
   ========================================================================== */

export function Button({
  variant = "contained",
  color = "primary",
  size = "medium",
  startIcon,
  endIcon,
  fullWidth = false,
  loading = false,
  loadingIndicator,
  loadingPosition = "center",
  borderRadius = 12,
  disabled = false,
  style,
  textStyle,
  children,
  ...rest
}: ButtonProps) {
  const theme = useTheme();
  const { i18n } = useTranslation();
  const isArabic = i18n.language?.startsWith("ar") ?? false;
  const isDark = theme.isDark;

  const isDisabled = disabled || loading;

  // Resolve base palette color
  let baseColor = PALETTE[color] || theme.primary;
  if (color === "primary") baseColor = theme.primary;
  if (color === "inherit") baseColor = theme.text;
  if (color === "secondary") baseColor = theme.textSecondary;

  /* ------------------------------------------------------------------------
     A. SIZES MAPPING
     ------------------------------------------------------------------------ */
  const sizeStyles: { container: ViewStyle; fontSize: number; iconGap: number } =
    size === "small"
      ? {
          container: {
            minHeight: 34,
            paddingHorizontal: Spacing.two + 2,
            paddingVertical: Spacing.one,
          },
          fontSize: 13,
          iconGap: 6,
        }
      : size === "large"
      ? {
          container: {
            minHeight: 48,
            paddingHorizontal: Spacing.four,
            paddingVertical: Spacing.two,
          },
          fontSize: 16,
          iconGap: 10,
        }
      : {
          // medium
          container: {
            minHeight: 40,
            paddingHorizontal: Spacing.three,
            paddingVertical: Spacing.one + 2,
          },
          fontSize: 14,
          iconGap: 8,
        };

  /* ------------------------------------------------------------------------
     B. VARIANT STYLES & COLORS
     ------------------------------------------------------------------------ */
  let containerStyle: ViewStyle = {};
  let contentColor = baseColor;
  let rippleColor = `${baseColor}25`;

  switch (variant) {
    case "contained":
      containerStyle = {
        backgroundColor: baseColor,
        ...Platform.select({
          ios: {
            shadowColor: baseColor,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: isDark ? 0 : 0.25,
            shadowRadius: 4,
          },
          android: {
            elevation: isDark ? 0 : 2,
          },
        }),
      };
      contentColor = "#FFFFFF";
      rippleColor = "rgba(255, 255, 255, 0.3)";
      break;

    case "outlined":
      containerStyle = {
        backgroundColor: "transparent",
        borderWidth: 1.5,
        borderColor: baseColor,
      };
      contentColor = baseColor;
      break;

    case "soft":
      containerStyle = {
        backgroundColor: `${baseColor}20`,
      };
      contentColor = baseColor;
      break;

    case "text":
    case "plain":
    case "link":
    default:
      containerStyle = {
        backgroundColor: "transparent",
        borderWidth: 0,
        borderColor: "transparent",
        elevation: 0,
        shadowOpacity: 0,
        minHeight: 0,
        paddingHorizontal: size === "small" ? 4 : size === "large" ? 10 : 8,
        paddingVertical: size === "small" ? 2 : 4,
      };
      contentColor = baseColor;
      rippleColor = `${baseColor}18`;
      break;
  }

  const isTextVariant =
    variant === "text" || variant === "plain" || variant === "link";

  const spinner = loadingIndicator ?? (
    <ActivityIndicator
      size="small"
      color={contentColor}
      style={{ marginHorizontal: 4 }}
    />
  );

  return (
    <Pressable
      disabled={isDisabled}
      android_ripple={{
        color: rippleColor,
        borderless: isTextVariant,
      }}
      style={({ pressed }) => [
        styles.root,
        sizeStyles.container,
        containerStyle,
        {
          borderRadius,
          flexDirection: "row",
        },
        fullWidth && styles.fullWidth,
        isDisabled && styles.disabled,
        pressed &&
          Platform.OS === "ios" &&
          !isDisabled && { opacity: isTextVariant ? 0.6 : 0.75 },
        style,
      ]}
      {...rest}
    >
      {/* 1. Start Icon or Loading at start */}
      {loading && loadingPosition === "start" ? (
        spinner
      ) : startIcon ? (
        <View style={{ marginEnd: sizeStyles.iconGap }}>{startIcon}</View>
      ) : null}

      {/* 2. Main Content or Loading at center */}
      {loading && loadingPosition === "center" ? (
        spinner
      ) : typeof children === "string" ? (
        <ThemedText
          weight="600"
          numberOfLines={1}
          style={[
            styles.label,
            {
              color: contentColor,
              fontSize: sizeStyles.fontSize,
            },
            textStyle,
          ]}
        >
          {children}
        </ThemedText>
      ) : (
        children
      )}

      {/* 3. End Icon or Loading at end */}
      {loading && loadingPosition === "end" ? (
        spinner
      ) : endIcon ? (
        <View style={{ marginStart: sizeStyles.iconGap }}>{endIcon}</View>
      ) : null}
    </Pressable>
  );
}

export default Button;

/* ==========================================================================
   4. STYLES
   ========================================================================== */

const styles = StyleSheet.create({
  root: {
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "flex-start",
    overflow: "hidden",
  },
  fullWidth: {
    width: "100%",
    alignSelf: "stretch",
  },
  label: {
    textAlign: "center",
    letterSpacing: 0.2,
    flexShrink: 1,
  },
  disabled: {
    opacity: 0.45,
  },
});
