import React, { useState, useEffect, useRef } from "react";
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  I18nManager,
  NativeSyntheticEvent,
  TextInputKeyPressEventData,
  ActivityIndicator,
  Pressable,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useDirectionStyle } from "@/i18n/layout-direction";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useTranslation } from "react-i18next";
import Lucide from "@react-native-vector-icons/lucide";

import { ThemedText } from "@/components/themed-text";
import { useTheme } from "@/hooks/use-theme";
import Logo from "@/components/logo";
import { useSnackbar } from "@/components/ui/snackbar-provider";
import { useCheckOTPMutation, useSendOTPMutation } from "@/api/auth";
import { Stepper } from "../components/stepper";

export function OtpPromptView() {
  const theme = useTheme();
  const styles = createStyles(theme);
  const router = useRouter();
  const params = useLocalSearchParams<{ email?: string }>();
  const { t, i18n } = useTranslation();
  const snackbar = useSnackbar();

  const isRtl = I18nManager.isRTL || (i18n.language || "ar").startsWith("ar");
  const directionStyle = useDirectionStyle();

  const [otpDigits, setOtpDigits] = useState<string[]>([
    "",
    "",
    "",
    "",
    "",
    "",
  ]);
  const [focusedIndex, setFocusedIndex] = useState<number>(0);
  const [timerSeconds, setTimerSeconds] = useState<number>(45);
  const [errorMessage, setErrorMessage] = useState<string>("");

  const { mutate: verifyOtp, isPending: isVerifying } = useCheckOTPMutation();
  const { mutate: resendOtp, isPending: isResending } = useSendOTPMutation();

  const inputRefs = useRef<Array<TextInput | null>>([]);

  // Auto-focus first input and open keyboard on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      inputRefs.current[0]?.focus();
    }, 150);
    return () => clearTimeout(timer);
  }, []);

  // Timer countdown
  useEffect(() => {
    if (timerSeconds <= 0) return;
    const interval = setInterval(() => {
      setTimerSeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [timerSeconds]);

  const handleResendCode = () => {
    if (timerSeconds > 0 || isResending) return;
    const cleanEmail = params.email?.trim() || "";
    if (!cleanEmail) return;

    resendOtp(
      { email: cleanEmail },
      {
        onSuccess: (res) => {
          setTimerSeconds(60);
          snackbar.success(
            t("FORGOT_PASSWORD.EMAIL_SENT_SUCCESS") || res.message,
          );
        },
        onError: (error: any) => {
          const rawMessage =
            error?.response?.data?.message || error?.message || "generic";
          const localized =
            t(`BE_ERROR.${rawMessage}` as any) !== `BE_ERROR.${rawMessage}`
              ? t(`BE_ERROR.${rawMessage}` as any)
              : rawMessage;
          snackbar.error(localized || t("BE_ERROR.generic"));
        },
      },
    );
  };

  const handleDigitChange = (value: string, index: number) => {
    setErrorMessage("");

    // Handle paste of multiple characters
    const cleanValue = value.replace(/[^0-9]/g, "");
    if (cleanValue.length > 1) {
      const newDigits = [...otpDigits];
      for (let i = 0; i < 6; i++) {
        newDigits[i] = cleanValue[i] || "";
      }
      setOtpDigits(newDigits);
      const nextFocus = Math.min(cleanValue.length, 5);
      inputRefs.current[nextFocus]?.focus();
      return;
    }

    const newDigits = [...otpDigits];
    newDigits[index] = cleanValue;
    setOtpDigits(newDigits);

    if (cleanValue && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (
    e: NativeSyntheticEvent<TextInputKeyPressEventData>,
    index: number,
  ) => {
    if (e.nativeEvent.key === "Backspace") {
      if (!otpDigits[index] && index > 0) {
        const newDigits = [...otpDigits];
        newDigits[index - 1] = "";
        setOtpDigits(newDigits);
        inputRefs.current[index - 1]?.focus();
      }
    }
  };

  const onSubmit = () => {
    const fullOtp = otpDigits.join("");
    if (fullOtp.length < 6) {
      setErrorMessage(t("FORGOT_PASSWORD.OTP_REQUIRED"));
      return;
    }

    const cleanEmail = params.email?.trim() || "";
    if (!cleanEmail) {
      snackbar.error(
        t("COMMON_VALIDATIONS.REQUIRED_FIELD", {
          field: t("FORGOT_PASSWORD.EMAIL_LABEL"),
        }),
      );
      return;
    }

    verifyOtp(
      { email: cleanEmail, otp: fullOtp },
      {
        onSuccess: (res) => {
          snackbar.success(
            t("BE_ERROR.OTP verified successfully") || res.message,
          );
          router.push({
            pathname: "/forget-password/new-password",
            params: {
              email: cleanEmail,
              otp: fullOtp,
            },
          });
        },
        onError: (error: any) => {
          const rawMessage =
            error?.response?.data?.message || error?.message || "Invalid OTP";
          const localized =
            t(`BE_ERROR.${rawMessage}` as any) !== `BE_ERROR.${rawMessage}`
              ? t(`BE_ERROR.${rawMessage}` as any)
              : rawMessage;
          setErrorMessage(localized);
          snackbar.error(localized);
        },
      },
    );
  };

  const formattedTimer = `00:${timerSeconds < 10 ? `0${timerSeconds}` : timerSeconds}`;

  return (
    <SafeAreaView style={[styles.safeArea, directionStyle]}>
      {/* Decorative Brand Circles in Background */}
      <View style={styles.bubbleTopRight} pointerEvents="none" />
      <View style={styles.bubbleTopLeft} pointerEvents="none" />
      <View style={styles.bubbleDot} pointerEvents="none" />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.keyboardAvoid}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header with Stacked Logo & Tagline */}
          <View style={styles.headerContainer}>
            <Logo
              variant="STACKED"
              size={82}
              textColor={theme.primaryText}
              textStyle={styles.logoTitle}
            />
            <ThemedText style={styles.tagline}>
              {t("LOGIN_PAGE.TAGLINE")}
            </ThemedText>
          </View>

          {/* Stepper with Step 2 Active */}
          <Stepper currentStep={2} />

          {/* Elevated Card */}
          <View style={styles.card}>
            {/* Card Title & Subtitle */}
            <ThemedText weight="800" style={styles.cardTitle}>
              {t("FORGOT_PASSWORD.OTP_VIEW_TITLE")}
            </ThemedText>
            <ThemedText style={styles.cardSubtitle}>
              {t("FORGOT_PASSWORD.OTP_VIEW_SUBTITLE")}
            </ThemedText>

            {/* Email Target */}
            <ThemedText weight="700" style={styles.emailTargetText}>
              {params.email || "name@example.com"}
            </ThemedText>

            {/* 6 OTP Boxes Container */}
            <View style={styles.otpBoxesRow}>
              {otpDigits.map((digit, index) => {
                const isFocused = focusedIndex === index;
                const hasValue = !!digit;
                return (
                  <Pressable
                    key={index}
                    onPress={() => {
                      inputRefs.current[index]?.focus();
                    }}
                    style={[
                      styles.otpBox,
                      isFocused && styles.otpBoxFocused,
                      hasValue && !isFocused && styles.otpBoxFilled,
                      !!errorMessage && styles.otpBoxError,
                    ]}
                  >
                    <TextInput
                      ref={(ref) => {
                        inputRefs.current[index] = ref;
                      }}
                      style={styles.otpInput}
                      value={digit}
                      onChangeText={(val) => handleDigitChange(val, index)}
                      onKeyPress={(e) => handleKeyPress(e, index)}
                      onFocus={() => setFocusedIndex(index)}
                      onBlur={() => {
                        setFocusedIndex((prev) => (prev === index ? -1 : prev));
                      }}
                      keyboardType="number-pad"
                      maxLength={1}
                      selectTextOnFocus
                      textAlign="center"
                      autoFocus={index === 0}
                    />
                  </Pressable>
                );
              })}
            </View>

            {/* Error Message */}
            {errorMessage ? (
              <ThemedText style={styles.errorText}>{errorMessage}</ThemedText>
            ) : null}

            {/* Resend Code Section */}
            <View style={styles.resendContainer}>
              <ThemedText style={styles.resendPrompt}>
                {t("FORGOT_PASSWORD.RESEND_PROMPT")}{" "}
              </ThemedText>
              <TouchableOpacity
                onPress={handleResendCode}
                disabled={timerSeconds > 0}
                activeOpacity={0.7}
              >
                <ThemedText
                  weight="700"
                  style={[
                    styles.resendAction,
                    timerSeconds > 0 && styles.resendDisabled,
                  ]}
                >
                  {t("FORGOT_PASSWORD.RESEND_CODE")}{" "}
                  {timerSeconds > 0 ? `(${formattedTimer})` : ""}
                </ThemedText>
              </TouchableOpacity>
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              activeOpacity={0.85}
              style={[styles.submitButton, isVerifying && { opacity: 0.8 }]}
              onPress={onSubmit}
              disabled={isVerifying}
            >
              {isVerifying ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <ThemedText weight="700" style={styles.submitButtonText}>
                    {t("FORGOT_PASSWORD.CONTINUE")}
                  </ThemedText>
                  <Lucide
                    name={isRtl ? "chevron-left" : "chevron-right"}
                    size={20}
                    color="#FFFFFF"
                  />
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* Change Email Footer Link */}
          <TouchableOpacity
            style={styles.changeEmailButton}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <ThemedText weight="700" style={styles.changeEmailText}>
              {t("FORGOT_PASSWORD.CHANGE_EMAIL")}
            </ThemedText>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const createStyles = (theme: ReturnType<typeof useTheme>) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: theme.background,
    },
    keyboardAvoid: {
      flex: 1,
    },
    scrollContent: {
      flexGrow: 1,
      paddingHorizontal: 24,
      paddingTop: 16,
      paddingBottom: 40,
      justifyContent: "center",
    },

    // ── Decorative Ambient Circles ──
    bubbleTopRight: {
      position: "absolute",
      top: -90,
      right: -80,
      width: 250,
      height: 250,
      borderRadius: 125,
      backgroundColor: theme.primary,
      opacity: 0.12,
    },
    bubbleTopLeft: {
      position: "absolute",
      top: 140,
      left: -90,
      width: 180,
      height: 180,
      borderRadius: 90,
      backgroundColor: theme.primary,
      opacity: 0.07,
    },
    bubbleDot: {
      position: "absolute",
      top: 190,
      right: 36,
      width: 50,
      height: 50,
      borderRadius: 25,
      backgroundColor: theme.primary,
      opacity: 0.09,
    },

    // ── Header ──
    headerContainer: {
      alignItems: "center",
      marginBottom: 20,
    },
    logoTitle: {
      fontSize: 34,
      fontWeight: "800",
      letterSpacing: -0.8,
      color: theme.primaryText,
    },
    tagline: {
      fontSize: 14,
      color: theme.textSecondary,
      fontWeight: "500",
      marginTop: 6,
      textAlign: "center",
    },

    // ── Floating Card ──
    card: {
      backgroundColor: theme.cardBackground,
      borderRadius: 32,
      paddingHorizontal: 20,
      paddingTop: 28,
      paddingBottom: 28,
      borderWidth: 1,
      borderColor: theme.cardBorder,
      ...Platform.select({
        ios: {
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.08,
          shadowRadius: 18,
        },
        android: {
          elevation: 4,
        },
      }),
    },
    cardTitle: {
      fontSize: 22,
      color: theme.text,
      marginBottom: 8,
      textAlign: "center",
      lineHeight: 32,
      paddingVertical: 2,
    },
    cardSubtitle: {
      fontSize: 14,
      color: theme.textSecondary,
      textAlign: "center",
      lineHeight: 22,
      marginBottom: 4,
      paddingHorizontal: 8,
    },
    emailTargetText: {
      fontSize: 14,
      color: theme.text,
      textAlign: "center",
      marginBottom: 24,
    },

    // ── OTP Boxes (Always Left-To-Right) ──
    otpBoxesRow: {
      direction: "ltr",
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 20,
      gap: 6,
    },
    otpBox: {
      flex: 1,
      height: 56,
      maxWidth: 48,
      borderRadius: 14,
      backgroundColor: theme.socketInnerBackground,
      borderWidth: 1.5,
      borderColor: theme.cardBorder,
      justifyContent: "center",
      alignItems: "center",
    },
    otpBoxFocused: {
      borderColor: theme.primary,
      backgroundColor: theme.socketInnerBackground,
    },
    otpBoxFilled: {
      borderColor: theme.cardBorder,
    },
    otpBoxError: {
      borderColor: "#DC2626",
    },
    otpInput: {
      width: "100%",
      height: "100%",
      fontSize: 20,
      fontWeight: "700",
      color: theme.text,
      padding: 0,
      textAlign: "center",
      writingDirection: "ltr",
    },
    errorText: {
      fontSize: 12,
      color: "#DC2626",
      textAlign: "center",
      marginBottom: 16,
    },

    // ── Resend Section ──
    resendContainer: {
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 24,
      flexWrap: "wrap",
    },
    resendPrompt: {
      fontSize: 13,
      color: theme.textSecondary,
    },
    resendAction: {
      fontSize: 13,
      color: theme.primaryText,
    },
    resendDisabled: {
      color: theme.primary,
      opacity: 0.9,
    },

    // ── Submit Button ──
    submitButton: {
      backgroundColor: theme.primary,
      borderRadius: 18,
      height: 52,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      ...Platform.select({
        ios: {
          shadowColor: theme.primary,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.25,
          shadowRadius: 8,
        },
        android: {
          elevation: 3,
        },
      }),
    },
    submitButtonText: {
      color: "#FFFFFF",
      fontSize: 16,
      letterSpacing: 0.2,
    },

    // ── Change Email Link ──
    changeEmailButton: {
      alignItems: "center",
      justifyContent: "center",
      marginTop: 24,
      paddingVertical: 8,
    },
    changeEmailText: {
      fontSize: 14,
      color: theme.primaryText,
    },
  });

export default OtpPromptView;
