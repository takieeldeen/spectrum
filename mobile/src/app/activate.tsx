import React, { useEffect, useRef } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useDirectionStyle } from "@/i18n/layout-direction";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useTranslation } from "react-i18next";
import Lucide from "@react-native-vector-icons/lucide";

import { ThemedText } from "@/components/themed-text";
import { useTheme } from "@/hooks/use-theme";
import Logo from "@/components/logo";
import { Fade } from "@/components/ui/fade";
import { useSnackbar } from "@/components/ui/snackbar-provider";
import { useAuth } from "@/context/auth-context";
import {
  useActivateWithTokenMutation,
  useResendActivationMutation,
} from "@/api/auth";

export default function ActivateScreen() {
  const theme = useTheme();
  const styles = createStyles(theme);
  const router = useRouter();
  const params = useLocalSearchParams<{ token?: string; email?: string }>();
  const { t } = useTranslation();
  const snackbar = useSnackbar();
  const directionStyle = useDirectionStyle();
  const { login } = useAuth();

  const token = params.token?.trim() || "";
  const email = params.email?.trim() || "";

  const {
    mutate: activateWithToken,
    isPending,
    isSuccess,
    isError,
    data,
  } = useActivateWithTokenMutation();

  const { mutate: resendActivation, isPending: isResending } =
    useResendActivationMutation();

  const triggeredTokenRef = useRef<string | null>(null);

  useEffect(() => {
    if (token && triggeredTokenRef.current !== token) {
      triggeredTokenRef.current = token;
      activateWithToken(
        { token },
        {
          onSuccess: async (res) => {
            snackbar.success(t("ACCOUNT_ACTIVATION.SUCCESS") || res.message);
            if (res.data?.accessToken && res.data?.user) {
              await login(res.data.accessToken, res.data.user);
            }
          },
          onError: (err: any) => {
            const rawMsg =
              err?.response?.data?.message || err?.message || "generic";
            const localized =
              t(`BE_ERROR.${rawMsg}` as any) !== `BE_ERROR.${rawMsg}`
                ? t(`BE_ERROR.${rawMsg}` as any)
                : rawMsg;
            snackbar.error(localized || t("BE_ERROR.generic"));
          },
        },
      );
    }
  }, [token, activateWithToken, login, snackbar, t]);

  const handleResend = () => {
    if (!email) {
      snackbar.error(t("ACCOUNT_ACTIVATION.RESEND_ERROR"));
      router.replace("/login");
      return;
    }

    resendActivation(
      { email },
      {
        onSuccess: (res) => {
          snackbar.success(
            t("ACCOUNT_ACTIVATION.RESEND_SUCCESS") || res.message,
          );
        },
        onError: (err: any) => {
          const rawMsg =
            err?.response?.data?.message || err?.message || "generic";
          const localized =
            t(`BE_ERROR.${rawMsg}` as any) !== `BE_ERROR.${rawMsg}`
              ? t(`BE_ERROR.${rawMsg}` as any)
              : rawMsg;
          snackbar.error(localized || t("ACCOUNT_ACTIVATION.RESEND_ERROR"));
        },
      },
    );
  };

  const handleContinue = () => {
    if (data?.data?.accessToken) {
      router.replace("/(tabs)");
    } else {
      router.replace("/login");
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, directionStyle]}>
      <View style={styles.bubbleTopRight} pointerEvents="none" />
      <View style={styles.bubbleTopLeft} pointerEvents="none" />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerContainer}>
          <Logo size={60} />
        </View>

        {/* 1. Loading State */}
        <Fade in={isPending || (!token && !isSuccess && !isError)}>
          <View style={styles.card}>
            <View style={styles.iconCircleLoading}>
              <ActivityIndicator size="large" color={theme.primaryText} />
            </View>
            <ThemedText weight="700" style={styles.stateTitle}>
              {t("ACCOUNT_ACTIVATION.LOADING_TITLE_PREFIX")}{" "}
              <ThemedText weight="700" style={styles.highlightText}>
                {t("ACCOUNT_ACTIVATION.LOADING_TITLE_HIGHLIGHT")}
              </ThemedText>
            </ThemedText>
            <ThemedText style={styles.stateSubtitle}>
              {t("ACCOUNT_ACTIVATION.LOADING_SUBTITLE")}
            </ThemedText>
          </View>
        </Fade>

        {/* 2. Success State */}
        <Fade in={isSuccess}>
          <View style={styles.card}>
            <View style={styles.iconCircleSuccess}>
              <Lucide name="check-circle" size={44} color="#10B981" />
            </View>
            <ThemedText weight="700" style={styles.stateTitle}>
              {t("ACCOUNT_ACTIVATION.TITLE_PREFIX")}{" "}
              <ThemedText weight="700" style={styles.highlightTextSuccess}>
                {t("ACCOUNT_ACTIVATION.TITLE_HIGHLIGHT")}
              </ThemedText>
            </ThemedText>
            <ThemedText style={styles.stateSubtitle}>
              {t("ACCOUNT_ACTIVATION.SUBTITLE")}
            </ThemedText>
            <TouchableOpacity
              activeOpacity={0.85}
              style={styles.primaryButton}
              onPress={handleContinue}
            >
              <ThemedText weight="700" style={styles.buttonText}>
                {t("ACCOUNT_ACTIVATION.GO_TO_SIGN_IN")}
              </ThemedText>
            </TouchableOpacity>
          </View>
        </Fade>

        {/* 3. Failure State */}
        <Fade in={isError || (!token && !isPending)}>
          <View style={styles.card}>
            <View style={styles.iconCircleError}>
              <Lucide name="alert-triangle" size={44} color="#EF4444" />
            </View>
            <ThemedText weight="700" style={styles.stateTitle}>
              {t("ACCOUNT_ACTIVATION.FAILURE_TITLE_PREFIX")}{" "}
              <ThemedText weight="700" style={styles.highlightTextError}>
                {t("ACCOUNT_ACTIVATION.FAILURE_TITLE_HIGHLIGHT")}
              </ThemedText>
            </ThemedText>
            <ThemedText style={styles.stateSubtitle}>
              {t("ACCOUNT_ACTIVATION.FAILURE_SUBTITLE")}
            </ThemedText>

            {email ? (
              <TouchableOpacity
                activeOpacity={0.85}
                style={[styles.primaryButton, isResending && { opacity: 0.7 }]}
                onPress={handleResend}
                disabled={isResending}
              >
                {isResending ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <ThemedText weight="700" style={styles.buttonText}>
                    {t("ACCOUNT_ACTIVATION.RESEND_ACTIVATION_LINK")}
                  </ThemedText>
                )}
              </TouchableOpacity>
            ) : null}

            <TouchableOpacity
              activeOpacity={0.7}
              style={styles.secondaryButton}
              onPress={() => router.replace("/login")}
            >
              <ThemedText weight="700" style={styles.secondaryButtonText}>
                {t("ACCOUNT_ACTIVATION.GO_TO_SIGN_IN")}
              </ThemedText>
            </TouchableOpacity>
          </View>
        </Fade>
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (theme: ReturnType<typeof useTheme>) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: theme.background,
    },
    scrollContent: {
      flexGrow: 1,
      paddingHorizontal: 24,
      paddingVertical: 32,
      justifyContent: "center",
    },

    // ── Ambient Background Circles ──
    bubbleTopRight: {
      position: "absolute",
      top: -80,
      right: -70,
      width: 240,
      height: 240,
      borderRadius: 120,
      backgroundColor: theme.primary,
      opacity: 0.12,
    },
    bubbleTopLeft: {
      position: "absolute",
      top: 120,
      left: -80,
      width: 170,
      height: 170,
      borderRadius: 85,
      backgroundColor: theme.primary,
      opacity: 0.08,
    },

    headerContainer: {
      alignItems: "center",
      marginBottom: 28,
    },

    card: {
      backgroundColor: theme.cardBackground,
      borderRadius: 24,
      padding: 28,
      borderWidth: 1,
      borderColor: theme.cardBorder,
      alignItems: "center",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.08,
      shadowRadius: 14,
      elevation: 3,
    },

    iconCircleLoading: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: theme.socketInnerBackground,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 20,
      borderWidth: 1,
      borderColor: theme.cardBorder,
    },
    iconCircleSuccess: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: "rgba(16, 185, 129, 0.12)",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 20,
      borderWidth: 1.5,
      borderColor: "rgba(16, 185, 129, 0.3)",
    },
    iconCircleError: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: "rgba(239, 68, 68, 0.12)",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 20,
      borderWidth: 1.5,
      borderColor: "rgba(239, 68, 68, 0.3)",
    },

    stateTitle: {
      fontSize: 22,
      lineHeight: 32,
      color: theme.text,
      textAlign: "center",
      marginBottom: 10,
      paddingVertical: 2,
    },
    highlightText: {
      color: theme.primaryText,
    },
    highlightTextSuccess: {
      color: "#10B981",
    },
    highlightTextError: {
      color: "#EF4444",
    },
    stateSubtitle: {
      fontSize: 14,
      color: theme.textSecondary,
      textAlign: "center",
      lineHeight: 22,
      marginBottom: 24,
      paddingHorizontal: 10,
    },

    primaryButton: {
      width: "100%",
      backgroundColor: theme.primary,
      borderRadius: 16,
      height: 52,
      alignItems: "center",
      justifyContent: "center",
      shadowColor: theme.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.25,
      shadowRadius: 8,
      elevation: 3,
    },
    buttonText: {
      color: "#FFFFFF",
      fontSize: 16,
    },
    secondaryButton: {
      marginTop: 14,
      padding: 10,
      alignItems: "center",
    },
    secondaryButtonText: {
      color: theme.primaryText,
      fontSize: 14,
    },
  });
