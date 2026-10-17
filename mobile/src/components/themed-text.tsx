import { Platform, StyleSheet, Text, type TextProps } from "react-native";
import { useTranslation } from "react-i18next";

import { Fonts, ThemeColor } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { getAppFont, FontWeightValue } from "@/constants/fonts";

export type ThemedTextProps = TextProps & {
  type?:
    | "default"
    | "title"
    | "small"
    | "smallBold"
    | "subtitle"
    | "link"
    | "linkPrimary"
    | "code";
  themeColor?: ThemeColor;
  weight?: FontWeightValue;
  fontSize?: number;
};

const BASE_WEIGHT_MAP: Record<string, FontWeightValue> = {
  small: "500",
  smallBold: "700",
  default: "500",
  title: "600",
  subtitle: "600",
  link: "400",
  linkPrimary: "400",
  code: "500",
};

export function ThemedText({
  style,
  type = "default",
  themeColor,
  weight,
  fontSize,
  ...rest
}: ThemedTextProps) {
  const theme = useTheme();
  const { i18n } = useTranslation();

  // Extract explicit weight, style weight, or type preset
  const flattened = (StyleSheet.flatten(style) || {}) as Record<string, any>;
  const targetWeight =
    weight ||
    (flattened.fontWeight as FontWeightValue) ||
    BASE_WEIGHT_MAP[type] ||
    "400";

  // In Arabic, dynamically select the exact Cairo font family file
  const fontStyle =
    type === "code" ? {} : getAppFont(targetWeight, i18n.language);

  return (
    <Text
      style={[
        { color: theme[themeColor ?? "text"] },
        type === "default" && styles.default,
        type === "title" && styles.title,
        type === "small" && styles.small,
        type === "smallBold" && styles.smallBold,
        type === "subtitle" && styles.subtitle,
        type === "link" && styles.link,
        type === "linkPrimary" && styles.linkPrimary,
        type === "code" && styles.code,
        style,
        fontSize !== undefined && { fontSize },
        fontStyle, // Applied to guarantee Android picks the true custom weight file
        { writingDirection: i18n.language?.startsWith("ar") ? "rtl" : "ltr" },
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  small: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "500",
  },
  smallBold: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "700",
  },
  default: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "500",
  },
  title: {
    fontSize: 48,
    fontWeight: "600",
    lineHeight: 52,
  },
  subtitle: {
    fontSize: 32,
    lineHeight: 44,
    fontWeight: "600",
  },
  link: {
    lineHeight: 30,
    fontSize: 14,
  },
  linkPrimary: {
    lineHeight: 30,
    fontSize: 14,
    color: "#3c87f7",
  },
  code: {
    fontFamily: Fonts.mono,
    fontWeight: Platform.select({ android: "700" }) ?? "500",
    fontSize: 12,
  },
});
export default ThemedText;
