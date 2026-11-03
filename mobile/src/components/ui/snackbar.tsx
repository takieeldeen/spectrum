import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  Dimensions,
  Platform,
  I18nManager,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withDelay,
  interpolate,
  runOnJS,
} from "react-native-reanimated";
import { useTranslation } from "react-i18next";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Lucide from "@react-native-vector-icons/lucide";

import { useTheme } from "@/hooks/use-theme";
import { getAppFont } from "@/constants/fonts";
import { useDirectionStyle } from "@/i18n/layout-direction";

/* ==========================================================================
   1. TYPES & CONFIG
   ========================================================================== */

export type SnackbarVariant = "success" | "error" | "warning" | "info";

export interface SnackbarProps {
  open: boolean;
  message: string;
  variant?: SnackbarVariant;
  autoHideDuration?: number;
  onClose?: () => void;
  position?: "top" | "bottom";
}

const CIRCLE_SIZE = 52;

const VARIANT_ICONS: Record<
  SnackbarVariant,
  "check-circle-2" | "alert-circle" | "alert-triangle" | "info"
> = {
  success: "check-circle-2",
  error: "alert-circle",
  warning: "alert-triangle",
  info: "info",
};

/* ==========================================================================
   2. COMPONENT
   ========================================================================== */

export function Snackbar({
  open,
  message,
  variant = "success",
  autoHideDuration = 3000,
  onClose,
  position = "top",
}: SnackbarProps) {
  const theme = useTheme();
  const styles = createStyles(theme);
  const { i18n } = useTranslation();
  const insets = useSafeAreaInsets();

  // Arabic and RTL detection
  const containsArabic = /[\u0600-\u06FF]/.test(message || "");
  const isArabic =
    containsArabic || (i18n.language || "ar").toLowerCase().startsWith("ar");
  const isRtl = isArabic;
  const fontStyle = getAppFont("600", isArabic ? "ar" : "en");
  const directionStyle = useDirectionStyle();

  // In React Native:
  // When native I18nManager.isRTL is active, 'row' natively starts from the right.
  // When native I18nManager.isRTL is false, 'row-reverse' starts from the right.
  // This guarantees:
  // In RTL: Icon & Text are on the RIGHT, Close button is on the LEFT.
  // In LTR: Icon & Text are on the LEFT, Close button is on the RIGHT.
  const flexDir = "row";

  const [mounted, setMounted] = useState(open);

  const screenWidth = Dimensions.get("window").width;
  const targetWidth = Math.min(screenWidth - 32, 420);

  // Animation shared values
  const scale = useSharedValue(open ? 1 : 0);
  const opacity = useSharedValue(open ? 1 : 0);
  const widthProgress = useSharedValue(open ? 1 : 0);
  const contentOpacity = useSharedValue(open ? 1 : 0);

  // Auto-hide timer
  useEffect(() => {
    if (!open) return;
    if (autoHideDuration > 0) {
      const timer = setTimeout(() => {
        onClose?.();
      }, autoHideDuration);
      return () => clearTimeout(timer);
    }
  }, [open, autoHideDuration, onClose]);

  // Circle pop-in from middle, then spring widening into pill
  useEffect(() => {
    if (open) {
      setMounted(true);

      // Reset values for a clean animation
      scale.value = 0;
      opacity.value = 0;
      widthProgress.value = 0;
      contentOpacity.value = 0;

      // 1. Pop circle into view from the middle with spring bounce
      scale.value = withSpring(1, {
        damping: 12,
        stiffness: 180,
        mass: 0.8,
      });
      opacity.value = withTiming(1, { duration: 120 });

      // 2. Spring expand width from circle to full pill after circle pops in
      widthProgress.value = withDelay(
        140,
        withSpring(1, {
          damping: 14,
          stiffness: 110,
          mass: 0.9,
        }),
      );

      // 3. Smoothly fade in content as width expands
      contentOpacity.value = withDelay(180, withTiming(1, { duration: 220 }));
    } else if (mounted) {
      // Exit animation: fade text, collapse to circle, pop away
      contentOpacity.value = withTiming(0, { duration: 100 });
      widthProgress.value = withDelay(40, withTiming(0, { duration: 180 }));
      scale.value = withDelay(180, withTiming(0.3, { duration: 160 }));
      opacity.value = withDelay(
        180,
        withTiming(0, { duration: 160 }, (finished) => {
          if (finished) {
            runOnJS(setMounted)(false);
          }
        }),
      );
    }
  }, [open]);

  const animatedContainerStyle = useAnimatedStyle(() => {
    const currentWidth = interpolate(
      widthProgress.value,
      [0, 1],
      [CIRCLE_SIZE, targetWidth],
    );

    return {
      width: currentWidth,
      height: CIRCLE_SIZE,
      borderRadius: CIRCLE_SIZE / 2,
      opacity: opacity.value,
      transform: [{ scale: scale.value }],
    };
  });

  const contentAnimatedStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
  }));

  if (!mounted) return null;

  const iconName = VARIANT_ICONS[variant] || VARIANT_ICONS.success;
  const isTop = position === "top";

  // Deeper vertical offsets:
  // Top: pushed down to generously clear Dynamic Island / status bar
  // Bottom: pushed up to float well above the bottom navigation tabs and home bar
  const topOffset = Math.max(insets.top + 28, Platform.OS === "ios" ? 76 : 36);
  const bottomOffset = Math.max(
    insets.bottom + 95,
    Platform.OS === "ios" ? 115 : 95,
  );

  const containerVariantStyle =
    variant === "error"
      ? styles.container_error
      : variant === "warning"
        ? styles.container_warning
        : variant === "info"
          ? styles.container_info
          : styles.container_success;

  return (
    <View
      pointerEvents="box-none"
      style={[
        styles.overlay,
        isTop ? { top: topOffset } : { bottom: bottomOffset },
      ]}
    >
      <Animated.View
        style={[
          styles.container,
          containerVariantStyle,
          { flexDirection: flexDir },
          directionStyle,
          animatedContainerStyle,
        ]}
      >
        {/* Icon badge (on right in RTL, on left in LTR) */}
        <View style={styles.iconBadge}>
          <Lucide name={iconName} size={20} color={theme.snackbarText} />
        </View>

        {/* Spring widening text and close action */}
        <Animated.View
          style={[
            styles.contentRow,
            { flexDirection: flexDir },
            contentAnimatedStyle,
          ]}
        >
          <Text
            style={[styles.message, fontStyle, { textAlign: "left" }]}
            numberOfLines={2}
          >
            {message}
          </Text>

          {onClose ? (
            <Pressable
              hitSlop={10}
              onPress={onClose}
              style={({ pressed }) => [
                styles.closeBtn,
                pressed && styles.pressed,
              ]}
            >
              <Lucide name="x" size={14} color={theme.snackbarText} />
            </Pressable>
          ) : null}
        </Animated.View>
      </Animated.View>
    </View>
  );
}

/* ==========================================================================
   3. STYLES
   ========================================================================== */

const createStyles = (theme: ReturnType<typeof useTheme>) =>
  StyleSheet.create({
    overlay: {
      position: "absolute",
      left: 0,
      right: 0,
      zIndex: 99999,
      alignItems: "center",
      justifyContent: "center",
    },
    container: {
      minHeight: CIRCLE_SIZE,
      alignItems: "center",
      paddingHorizontal: 8,
      overflow: "hidden",
      borderWidth: 1.5,
      ...Platform.select({
        ios: {
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.28,
          shadowRadius: 12,
        },
        android: {
          elevation: 8,
        },
        default: {
          boxShadow: "0 6px 20px rgba(0, 0, 0, 0.22)",
        },
      }),
    },
    container_success: {
      backgroundColor: theme.snackbarSuccess,
      borderColor: theme.snackbarSuccessBorder,
    },
    container_error: {
      backgroundColor: theme.snackbarError,
      borderColor: theme.snackbarErrorBorder,
    },
    container_warning: {
      backgroundColor: theme.snackbarWarning,
      borderColor: theme.snackbarWarningBorder,
    },
    container_info: {
      backgroundColor: theme.snackbarInfo,
      borderColor: theme.snackbarInfoBorder,
    },
    iconBadge: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: theme.snackbarIconBg,
      alignItems: "center",
      justifyContent: "center",
    },
    contentRow: {
      flex: 1,
      minWidth: 0,
      alignItems: "center",
      paddingHorizontal: 8,
      gap: 10,
      overflow: "hidden",
    },
    message: {
      flex: 1,
      color: theme.snackbarText,
      fontSize: 14,
      lineHeight: 20,
    },
    closeBtn: {
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: theme.snackbarCloseBg,
      alignItems: "center",
      justifyContent: "center",
    },
    pressed: {
      opacity: 0.6,
    },
  });

export default Snackbar;
