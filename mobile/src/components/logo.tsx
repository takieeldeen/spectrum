import React from "react";
import {
  StyleSheet,
  View,
  StyleProp,
  ViewStyle,
  TextStyle,
  ViewProps,
} from "react-native";
import { Image, ImageProps, ImageStyle } from "expo-image";

import LOGO_IMAGE from "@/assets/images/spectrum-mini-logo.svg";
import { ThemedText, ThemedTextProps } from "@/components/themed-text";
import { useTheme } from "@/hooks/use-theme";

/* ==========================================================================
   1. TYPES & PROPS
   ========================================================================== */

export type LogoVariant =
  | "STACKED"
  | "HORIZONTAL"
  | "MINI"
  | "stacked"
  | "horizontal"
  | "mini";

export type LogoSize = "small" | "medium" | "large" | number;

export interface LogoProps extends ViewProps {
  /**
   * Layout presentation:
   * - `HORIZONTAL`: Icon on the left + "spectrum" text on the right (default)
   * - `STACKED`: Icon on top + "spectrum" text underneath
   * - `MINI`: Just the icon
   * @default "HORIZONTAL"
   */
  variant?: LogoVariant;

  /**
   * Preset size ("small" | "medium" | "large") or custom pixel size (number)
   * that scales the icon, text size, and gap proportionately.
   * @default "medium"
   */
  size?: LogoSize;

  /**
   * Brand text string.
   * @default "spectrum"
   */
  title?: string;

  /**
   * Custom color override for the text. Defaults to theme `text`.
   */
  textColor?: string;

  /**
   * Custom gap between the icon and text in px.
   */
  gap?: number;

  /**
   * Custom style for the root container (alias for `style`).
   */
  containerStyle?: StyleProp<ViewStyle>;

  /**
   * Custom style for the logo image.
   */
  imageStyle?: StyleProp<ImageStyle>;

  /**
   * Custom style for the logo text.
   */
  textStyle?: StyleProp<TextStyle>;

  /**
   * Custom props forwarded to the `expo-image` Image component.
   */
  imageProps?: Partial<ImageProps>;

  /**
   * Custom props forwarded to the `ThemedText` component.
   */
  textProps?: Partial<ThemedTextProps>;
}

/* ==========================================================================
   2. SIZE PRESETS & HELPERS
   ========================================================================== */

const SIZE_PRESETS = {
  small: { imageSize: 28, fontSize: 18, gap: 8 },
  medium: { imageSize: 40, fontSize: 26, gap: 10 },
  large: { imageSize: 56, fontSize: 34, gap: 12 },
} as const;

function resolveDimensions(size: LogoSize = "medium") {
  if (typeof size === "number") {
    return {
      imageSize: size,
      fontSize: Math.round(size * 0.65),
      gap: Math.round(size * 0.25),
    };
  }
  return SIZE_PRESETS[size] ?? SIZE_PRESETS.medium;
}

/* ==========================================================================
   3. COMPONENT
   ========================================================================== */

export const Logo: React.FC<LogoProps> = ({
  variant = "HORIZONTAL",
  size = "medium",
  title = "spectrum",
  textColor,
  gap,
  style,
  containerStyle,
  imageStyle,
  textStyle,
  imageProps,
  textProps,
  ...rest
}) => {
  const theme = useTheme();
  const styles = createStyles(theme);

  const normalizedVariant = (variant || "HORIZONTAL").toUpperCase() as
    | "STACKED"
    | "HORIZONTAL"
    | "MINI";

  const {
    imageSize,
    fontSize: defaultFontSize,
    gap: defaultGap,
  } = resolveDimensions(size);

  const resolvedGap = gap ?? defaultGap;

  const imageElement = (
    <Image
      source={LOGO_IMAGE}
      contentFit="contain"
      {...imageProps}
      style={[
        {
          width: imageSize,
          height: imageSize,
        },
        styles.image,
        imageStyle,
        imageProps?.style,
      ]}
    />
  );

  // 1. MINI (Icon only)
  if (normalizedVariant === "MINI") {
    return (
      <View
        style={[styles.miniContainer, containerStyle, style]}
        accessibilityRole="image"
        accessibilityLabel={title}
        {...rest}
      >
        {imageElement}
      </View>
    );
  }

  const textElement = (
    <ThemedText
      weight="800"
      style={[
        styles.text,
        {
          fontSize: defaultFontSize,
          color: textColor || theme.text,
          lineHeight: defaultFontSize - 20,
        },
        textStyle,
      ]}
      {...textProps}
    >
      {title}
    </ThemedText>
  );

  // 2. STYLED STACKED (Icon above, text below)
  if (normalizedVariant === "STACKED") {
    return (
      <View
        style={[
          styles.stackedContainer,
          { gap: resolvedGap },
          containerStyle,
          style,
        ]}
        accessibilityRole="header"
        accessibilityLabel={title}
        {...rest}
      >
        {imageElement}
        {textElement}
      </View>
    );
  }

  // 3. HORIZONTAL (Icon on left, text on right)
  return (
    <View
      style={[
        styles.horizontalContainer,
        { gap: resolvedGap },
        containerStyle,
        style,
      ]}
      accessibilityRole="header"
      accessibilityLabel={title}
      {...rest}
    >
      {imageElement}
      {textElement}
    </View>
  );
};

/* ==========================================================================
   4. STYLES
   ========================================================================== */

const createStyles = (theme: ReturnType<typeof useTheme>) =>
  StyleSheet.create({
    horizontalContainer: {
      flexDirection: "row",
      alignItems: "center",
    },
    stackedContainer: {
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
    },
    miniContainer: {
      alignItems: "center",
      justifyContent: "center",
    },
    image: {
      // Keeps icon aspect ratio 1:1 without extra overflow
    },
    text: {
      color: theme.text,
      letterSpacing: -0.6,
      includeFontPadding: false,
    },
  });

export default Logo;
