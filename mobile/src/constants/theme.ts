/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import "@/global.css";

import { Platform } from "react-native";
export * from "./fonts";

export const Colors = {
  light: {
    text: "#000000",
    background: "#F6F6F6",
    backgroundElement: "#F0F0F3",
    backgroundSelected: "#E0E1E6",
    textSecondary: "#60646C",
    backgroundSecondary: "#f1eeeeff",
    socketInnerBackground: "#F3F4F6",
    primaryDark: "#0A7A55",
    primary: "#059669",
    primaryLight: "#13a375ff",
    primaryLighter: "#2aae84ff",
    cardBackground: "#FFFFFF",
    cardBorder: "#EEEEEE",
    tintedIconBackground: "#E6F7F0",
    divider: "#F0F0F2",
    switchTrackOff: "#E5E7EB",
    stepperBackground: "#F5F6F8",
    closeBtnBackground: "#F0F0F3",
    overlayBackground: "rgba(0, 0, 0, 0.5)",
    skeleton: "rgba(0, 0, 0, 0.08)",
    skeletonWave: "rgba(255, 255, 255, 0.5)",
    logoutText: "#C53030",
    logoutBorder: "#FECDD3",
    logoutBackground: "#FFFFFF",
    primaryText: "#0A7A55",
    activeCardBackground: "#EBF8F3",
    activeCardBorder: "#059669",
    snackbarSuccess: "#059669",
    snackbarSuccessBorder: "rgba(255, 255, 255, 0.28)",
    snackbarError: "#DC2626",
    snackbarErrorBorder: "rgba(255, 255, 255, 0.28)",
    snackbarWarning: "#D97706",
    snackbarWarningBorder: "rgba(255, 255, 255, 0.28)",
    snackbarInfo: "#2563EB",
    snackbarInfoBorder: "rgba(255, 255, 255, 0.28)",
    snackbarIconBg: "rgba(255, 255, 255, 0.22)",
    snackbarCloseBg: "rgba(255, 255, 255, 0.18)",
    snackbarText: "#FFFFFF",
    inputBackground: "#F9FAFB",
    inputBorder: "#E5E7EB",
  },
  dark: {
    text: "#ffffff",
    background: "#111E23",
    backgroundElement: "#18262F",
    backgroundSelected: "#2E3135",
    textSecondary: "#B0B4BA",
    primaryDark: "#0A7A55",
    primary: "#059669",
    primaryLight: "#13a375ff",
    primaryLighter: "#2aae84ff",
    backgroundSecondary: "#1C2E38",
    socketInnerBackground: "#111E23",
    cardBackground: "#18262F",
    cardBorder: "rgba(255, 255, 255, 0.08)",
    tintedIconBackground: "rgba(5, 150, 105, 0.18)",
    activeCardBackground: "rgba(16, 185, 129, 0.14)",
    activeCardBorder: "#059669",
    divider: "rgba(255, 255, 255, 0.08)",
    switchTrackOff: "#374151",
    stepperBackground: "#132128",
    closeBtnBackground: "#22333B",
    overlayBackground: "rgba(0, 0, 0, 0.7)",
    skeleton: "rgba(255, 255, 255, 0.12)",
    skeletonWave: "rgba(255, 255, 255, 0.08)",
    logoutText: "#F87171",
    logoutBorder: "rgba(248, 113, 113, 0.35)",
    logoutBackground: "#18262F",
    primaryText: "#34D399",
    snackbarSuccess: "#065F46",
    snackbarSuccessBorder: "rgba(52, 211, 153, 0.38)",
    snackbarError: "#991B1B",
    snackbarErrorBorder: "rgba(248, 113, 113, 0.38)",
    snackbarWarning: "#92400E",
    snackbarWarningBorder: "rgba(251, 191, 36, 0.38)",
    snackbarInfo: "#1E40AF",
    snackbarInfoBorder: "rgba(96, 165, 250, 0.38)",
    snackbarIconBg: "rgba(255, 255, 255, 0.16)",
    snackbarCloseBg: "rgba(255, 255, 255, 0.14)",
    snackbarText: "#FFFFFF",
    inputBackground: "#132128",
    inputBorder: "rgba(255, 255, 255, 0.12)",
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: "system-ui",
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: "ui-serif",
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: "ui-rounded",
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: "ui-monospace",
  },
  default: {
    sans: "normal",
    serif: "serif",
    rounded: "normal",
    mono: "monospace",
  },
  web: {
    sans: "var(--font-display)",
    serif: "var(--font-serif)",
    rounded: "var(--font-rounded)",
    mono: "var(--font-mono)",
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
