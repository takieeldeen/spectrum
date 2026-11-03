import React, { useMemo } from "react";
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  I18nManager,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useDirectionStyle } from "@/i18n/layout-direction";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import Lucide from "@react-native-vector-icons/lucide";

import { ThemedText } from "@/components/themed-text";
import { useTheme } from "@/hooks/use-theme";
import Logo from "@/components/logo";
import { useSnackbar } from "@/components/ui/snackbar-provider";
import { useForgetPasswordMutation } from "@/api/auth";
import { Stepper } from "../components/stepper";

interface FormValues {
  email: string;
}

export function EmailPromptView() {
  const theme = useTheme();
  const styles = createStyles(theme);
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const snackbar = useSnackbar();
  const { mutate: sendForgetPassword, isPending } = useForgetPasswordMutation();

  const isRtl = I18nManager.isRTL || (i18n.language || "ar").startsWith("ar");
  const directionStyle = useDirectionStyle();

  const formSchema = useMemo(
    () =>
      yup.object().shape({
        email: yup
          .string()
          .trim()
          .required(
            t("COMMON_VALIDATIONS.REQUIRED_FIELD", {
              field: t("FORGOT_PASSWORD.EMAIL_LABEL"),
            }),
          )
          .email(t("COMMON_VALIDATIONS.EMAIL_INVALID")),
      }),
    [t],
  );

  const defaultValues: FormValues = {
    email: "",
  };

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: yupResolver(formSchema) as any,
    defaultValues,
  });

  const onSubmit = (values: FormValues) => {
    const cleanEmail = values.email.trim();
    sendForgetPassword(
      { email: cleanEmail },
      {
        onSuccess: (response) => {
          snackbar.success(
            t("FORGOT_PASSWORD.EMAIL_SENT_SUCCESS") ||
              response?.message ||
              t("FORGOT_PASSWORD.RESET_SUCCESS"),
          );
          router.push({
            pathname: "/forget-password/otp",
            params: { email: cleanEmail },
          });
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

          {/* Progress Stepper */}
          <Stepper currentStep={1} />

          {/* Elevated Card */}
          <View style={styles.card}>
            {/* Card Title & Subtitle */}
            <ThemedText weight="800" style={styles.cardTitle}>
              {t("FORGOT_PASSWORD.EMAIL_VIEW_TITLE")}
            </ThemedText>
            <ThemedText style={styles.cardSubtitle}>
              {t("FORGOT_PASSWORD.EMAIL_VIEW_SUBTITLE")}
            </ThemedText>

            {/* Email Field */}
            <View style={styles.fieldGroup}>
              <ThemedText weight="700" style={styles.fieldLabel}>
                {t("FORGOT_PASSWORD.EMAIL_LABEL")}
              </ThemedText>
              <Controller
                control={control}
                name="email"
                render={({ field: { onChange, onBlur, value } }) => (
                  <View
                    style={[
                      styles.inputWrapper,
                      errors.email && styles.inputError,
                    ]}
                  >
                    <TextInput
                      style={[
                        styles.textInput,
                        { textAlign: isRtl ? "right" : "left" },
                      ]}
                      placeholder={t("FORGOT_PASSWORD.EMAIL_PLACEHOLDER")}
                      placeholderTextColor={theme.textSecondary}
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      autoCapitalize="none"
                      keyboardType="email-address"
                      autoCorrect={false}
                      returnKeyType="done"
                      onSubmitEditing={handleSubmit(onSubmit)}
                    />
                    <View style={styles.fieldIconContainer}>
                      <Lucide name="mail" size={20} color={theme.primaryText} />
                    </View>
                  </View>
                )}
              />
              {errors.email?.message ? (
                <ThemedText style={styles.errorText}>
                  {errors.email.message}
                </ThemedText>
              ) : null}
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              activeOpacity={0.85}
              style={[
                styles.submitButton,
                isPending && styles.submitButtonDisabled,
              ]}
              onPress={handleSubmit(onSubmit)}
              disabled={isPending}
            >
              {isPending ? (
                <>
                  <ActivityIndicator size="small" color="#FFFFFF" />
                  <ThemedText weight="700" style={styles.submitButtonText}>
                    {t("FORGOT_PASSWORD.SENDING")}
                  </ThemedText>
                </>
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
      paddingHorizontal: 22,
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
      marginBottom: 10,
      textAlign: "center",
      lineHeight: 30,
    },
    cardSubtitle: {
      fontSize: 14,
      color: theme.textSecondary,
      textAlign: "center",
      lineHeight: 22,
      marginBottom: 24,
      paddingHorizontal: 8,
    },

    // ── Field Groups ──
    fieldGroup: {
      marginBottom: 22,
      alignItems: "stretch",
    },
    fieldLabel: {
      fontSize: 13,
      color: theme.primaryText,
      marginBottom: 8,
      textAlign: "left",
    },
    inputWrapper: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: theme.socketInnerBackground,
      borderRadius: 18,
      height: 54,
      paddingHorizontal: 16,
      borderWidth: 1.5,
      borderColor: "transparent",
      gap: 10,
    },
    inputWrapperRtl: {
      flexDirection: "row-reverse",
    },
    inputError: {
      borderColor: "#DC2626",
    },
    textInput: {
      flex: 1,
      fontSize: 14,
      color: theme.text,
      paddingVertical: 0,
    },
    fieldIconContainer: {
      width: 28,
      alignItems: "center",
      justifyContent: "center",
    },
    errorText: {
      fontSize: 12,
      color: "#DC2626",
      marginTop: 6,
      paddingHorizontal: 4,
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
    submitButtonDisabled: {
      opacity: 0.65,
    },
    submitButtonText: {
      color: "#FFFFFF",
      fontSize: 16,
      letterSpacing: 0.2,
    },
  });

export default EmailPromptView;
