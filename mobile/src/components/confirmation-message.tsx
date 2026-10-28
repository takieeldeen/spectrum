import React, { useState, useCallback } from "react";
import {
  Modal,
  View,
  Pressable,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  Platform,
} from "react-native";
import { ThemedText } from "@/components/themed-text";
import { useTheme } from "@/hooks/use-theme";

export type ConfirmationVariant = "Warning" | "Error" | "Success" | "Info";

export interface ConfirmationMessageProps {
  visible?: boolean;
  variant?: ConfirmationVariant;
  title?: string;
  subtitle?: string;
  confirmText?: string;
  cancelText?: string;
  icon?: React.ReactNode;
  loading?: boolean;
  onConfirm?: () => void;
  onClose?: () => void;
  inline?: boolean;
}

const VARIANT_CONFIG: Record<
  ConfirmationVariant,
  {
    primaryColor: string;
    bgColor: string;
    iconSymbol: string;
    defaultTitle: string;
  }
> = {
  Error: {
    primaryColor: "#DC2626",
    bgColor: "rgba(239, 68, 68, 0.12)",
    iconSymbol: "✕",
    defaultTitle: "Error",
  },
  Warning: {
    primaryColor: "#D97706",
    bgColor: "rgba(245, 158, 11, 0.14)",
    iconSymbol: "!",
    defaultTitle: "Warning",
  },
  Success: {
    primaryColor: "#059669",
    bgColor: "rgba(16, 185, 129, 0.14)",
    iconSymbol: "✓",
    defaultTitle: "Success",
  },
  Info: {
    primaryColor: "#2563EB",
    bgColor: "rgba(37, 99, 235, 0.14)",
    iconSymbol: "i",
    defaultTitle: "Information",
  },
};

export function ConfirmationMessage({
  visible = true,
  variant = "Error",
  title,
  subtitle,
  confirmText = "OK",
  cancelText,
  icon,
  loading = false,
  onConfirm,
  onClose,
  inline = false,
}: ConfirmationMessageProps) {
  const theme = useTheme();
  const styles = createStyles(theme);
  const config = VARIANT_CONFIG[variant] || VARIANT_CONFIG.Error;
  const displayTitle = title ?? config.defaultTitle;

  const handleConfirm = () => {
    if (onConfirm) onConfirm();
    if (!loading && onClose) onClose();
  };

  const handleCancel = () => {
    if (onClose) onClose();
  };

  // ── Inline Banner Mode ──
  if (inline) {
    if (!visible) return null;
    return (
      <View
        style={[
          styles.inlineContainer,
          {
            backgroundColor: config.bgColor,
            borderColor: config.primaryColor,
          },
        ]}
      >
        <View
          style={[styles.inlineIconBadge, { backgroundColor: config.primaryColor }]}
        >
          {icon ? (
            icon
          ) : (
            <ThemedText style={styles.inlineIconSymbol}>
              {config.iconSymbol}
            </ThemedText>
          )}
        </View>
        <View style={styles.inlineContent}>
          {displayTitle ? (
            <ThemedText
              style={[styles.inlineTitle, { color: config.primaryColor }]}
            >
              {displayTitle}
            </ThemedText>
          ) : null}
          {subtitle ? (
            <ThemedText style={styles.inlineSubtitle}>{subtitle}</ThemedText>
          ) : null}
        </View>
        {onClose ? (
          <Pressable onPress={onClose} hitSlop={8} style={styles.inlineCloseButton}>
            <ThemedText style={{ color: config.primaryColor, fontSize: 16 }}>
              ✕
            </ThemedText>
          </Pressable>
        ) : null}
      </View>
    );
  }

  // ── Modal Dialog Mode ──
  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={onClose}
          pointerEvents="box-none"
        />

        <View style={styles.modalCard}>
          {/* Icon Badge */}
          <View
            style={[
              styles.iconBadge,
              {
                backgroundColor: config.bgColor,
                borderColor: config.primaryColor,
              },
            ]}
          >
            {icon ? (
              icon
            ) : (
              <ThemedText
                style={[
                  styles.iconSymbol,
                  {
                    color: config.primaryColor,
                    fontFamily: config.iconSymbol === "i" ? "serif" : undefined,
                  },
                ]}
              >
                {config.iconSymbol}
              </ThemedText>
            )}
          </View>

          {/* Title */}
          {displayTitle ? (
            <ThemedText style={styles.modalTitle}>{displayTitle}</ThemedText>
          ) : null}

          {/* Subtitle / Description */}
          {subtitle ? (
            <ThemedText style={styles.modalSubtitle}>{subtitle}</ThemedText>
          ) : null}

          {/* Action Buttons */}
          <View style={styles.actionsContainer}>
            {cancelText ? (
              <Pressable
                style={[styles.actionButton, styles.cancelButton]}
                onPress={handleCancel}
                disabled={loading}
              >
                <ThemedText style={styles.cancelButtonText} numberOfLines={1}>
                  {cancelText}
                </ThemedText>
              </Pressable>
            ) : null}

            <Pressable
              style={[
                styles.actionButton,
                styles.confirmButton,
                { backgroundColor: config.primaryColor },
              ]}
              onPress={handleConfirm}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <ThemedText style={styles.confirmButtonText} numberOfLines={1}>
                  {confirmText}
                </ThemedText>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

/**
 * Convenient React hook to trigger confirmation / error / warning messages easily
 */
export function useConfirmationMessage() {
  const [state, setState] = useState<{
    visible: boolean;
    variant: ConfirmationVariant;
    title?: string;
    subtitle?: string;
    confirmText?: string;
    cancelText?: string;
    icon?: React.ReactNode;
    loading?: boolean;
    onConfirm?: () => void;
  }>({
    visible: false,
    variant: "Error",
  });

  const showConfirmation = useCallback(
    (options: {
      variant?: ConfirmationVariant;
      title?: string;
      subtitle?: string;
      confirmText?: string;
      cancelText?: string;
      icon?: React.ReactNode;
      loading?: boolean;
      onConfirm?: () => void;
    }) => {
      setState({
        visible: true,
        variant: options.variant ?? "Error",
        title: options.title,
        subtitle: options.subtitle,
        confirmText: options.confirmText ?? "OK",
        cancelText: options.cancelText,
        icon: options.icon,
        loading: options.loading,
        onConfirm: options.onConfirm,
      });
    },
    [],
  );

  const hideConfirmation = useCallback(() => {
    setState((prev) => ({ ...prev, visible: false }));
  }, []);

  return {
    showConfirmation,
    hideConfirmation,
    confirmationProps: {
      ...state,
      onClose: hideConfirmation,
    },
  };
}

const { width } = Dimensions.get("window");

const createStyles = (theme: ReturnType<typeof useTheme>) =>
  StyleSheet.create({
    modalOverlay: {
      flex: 1,
      backgroundColor: theme.overlayBackground,
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: 24,
    },
    modalCard: {
      width: Math.min(width - 48, 360),
      backgroundColor: theme.cardBackground,
      borderRadius: 24,
      paddingTop: 28,
      paddingBottom: 22,
      paddingHorizontal: 22,
      alignItems: "center",
      borderWidth: 1,
      borderColor: theme.cardBorder,
      ...Platform.select({
        ios: {
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 10 },
          shadowOpacity: 0.18,
          shadowRadius: 20,
        },
        android: {
          elevation: 8,
        },
      }),
    },
    iconBadge: {
      width: 64,
      height: 64,
      borderRadius: 32,
      borderWidth: 2,
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 16,
    },
    iconSymbol: {
      fontSize: 30,
      fontWeight: "bold",
      lineHeight: 34,
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: "700",
      color: theme.text,
      textAlign: "center",
      marginBottom: 8,
    },
    modalSubtitle: {
      fontSize: 15,
      color: theme.textSecondary,
      textAlign: "center",
      lineHeight: 22,
      marginBottom: 24,
      paddingHorizontal: 6,
    },
    actionsContainer: {
      flexDirection: "row",
      gap: 12,
      width: "100%",
    },
    actionButton: {
      flex: 1,
      height: 48,
      borderRadius: 14,
      justifyContent: "center",
      alignItems: "center",
    },
    confirmButton: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.12,
      shadowRadius: 6,
      elevation: 2,
    },
    confirmButtonText: {
      color: "#FFFFFF",
      fontSize: 16,
      fontWeight: "600",
    },
    cancelButton: {
      backgroundColor: theme.backgroundElement,
    },
    cancelButtonText: {
      color: theme.text,
      fontSize: 16,
      fontWeight: "600",
    },

    // ── Inline Banner Styles ──
    inlineContainer: {
      flexDirection: "row",
      alignItems: "center",
      borderWidth: 1,
      borderRadius: 14,
      padding: 12,
      marginVertical: 10,
      gap: 12,
    },
    inlineIconBadge: {
      width: 26,
      height: 26,
      borderRadius: 13,
      justifyContent: "center",
      alignItems: "center",
    },
    inlineIconSymbol: {
      color: "#FFFFFF",
      fontSize: 14,
      fontWeight: "bold",
    },
    inlineContent: {
      flex: 1,
    },
    inlineTitle: {
      fontSize: 14,
      fontWeight: "700",
      marginBottom: 2,
    },
    inlineSubtitle: {
      fontSize: 13,
      color: theme.textSecondary,
      lineHeight: 18,
    },
    inlineCloseButton: {
      padding: 4,
    },
  });

export default ConfirmationMessage;
