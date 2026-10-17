import React, { useEffect } from "react";
import { StyleSheet, View, Text, Pressable } from "react-native";
import Animated, {
  FadeInUp,
  FadeOutUp,
  FadeInDown,
  FadeOutDown,
} from "react-native-reanimated";
import { Lucide } from "@react-native-vector-icons/lucide";

export type SnackbarVariant = "success" | "error" | "warning" | "info";

export interface SnackbarProps {
  open: boolean;
  message: string;
  variant?: SnackbarVariant;
  autoHideDuration?: number;
  onClose?: () => void;
  position?: "top" | "bottom";
}

const VARIANT_CONFIG: Record<
  SnackbarVariant,
  { bg: string; icon: "check-circle-2" | "alert-circle" | "alert-triangle" | "info" }
> = {
  success: { bg: "#059669", icon: "check-circle-2" },
  error: { bg: "#DC2626", icon: "alert-circle" },
  warning: { bg: "#D97706", icon: "alert-triangle" },
  info: { bg: "#2563EB", icon: "info" },
};

export function Snackbar({
  open,
  message,
  variant = "success",
  autoHideDuration = 3000,
  onClose,
  position = "top",
}: SnackbarProps) {
  useEffect(() => {
    if (!open) return;
    if (autoHideDuration > 0) {
      const timer = setTimeout(() => {
        onClose?.();
      }, autoHideDuration);
      return () => clearTimeout(timer);
    }
  }, [open, autoHideDuration, onClose]);

  if (!open) return null;

  const config = VARIANT_CONFIG[variant] || VARIANT_CONFIG.success;
  const isTop = position === "top";

  return (
    <View
      pointerEvents="box-none"
      style={[
        styles.overlay,
        isTop ? styles.positionTop : styles.positionBottom,
      ]}
    >
      <Animated.View
        entering={isTop ? FadeInUp.springify().damping(18) : FadeInDown.springify().damping(18)}
        exiting={isTop ? FadeOutUp.duration(200) : FadeOutDown.duration(200)}
        style={[styles.container, { backgroundColor: config.bg }]}
      >
        <Lucide name={config.icon} size={20} color="#FFFFFF" />
        <Text style={styles.message} numberOfLines={3}>
          {message}
        </Text>
        {onClose ? (
          <Pressable
            hitSlop={8}
            onPress={onClose}
            style={({ pressed }) => [styles.closeBtn, pressed && styles.pressed]}
          >
            <Lucide name="x" size={16} color="#FFFFFF" />
          </Pressable>
        ) : null}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    left: 16,
    right: 16,
    zIndex: 99999,
    alignItems: "center",
  },
  positionTop: {
    top: 20,
  },
  positionBottom: {
    bottom: 24,
  },
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 14,
    width: "100%",
    maxWidth: 420,
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  message: {
    flex: 1,
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 20,
  },
  closeBtn: {
    padding: 2,
    opacity: 0.85,
  },
  pressed: {
    opacity: 0.5,
  },
});
