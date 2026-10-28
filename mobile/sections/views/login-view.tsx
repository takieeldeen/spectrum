import React, { useState, useMemo, useRef } from "react";
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  I18nManager,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import Lucide from "@react-native-vector-icons/lucide";

import { ThemedText } from "@/components/themed-text";
import { useTheme } from "@/hooks/use-theme";
import { useLoginMutation } from "@/api/auth";
import { useAuth } from "@/context/auth-context";
import Logo from "@/components/logo";
import { useSnackbar } from "@/components/ui/snackbar-provider";

/* ==========================================================================
   1. FORM SCHEMA & TYPES
   ========================================================================== */

interface FormValues {
  email: string;
  password: string;
}

/* ==========================================================================
   2. COMPONENT
   ========================================================================== */

const LoginView = () => {
  const theme = useTheme();
  const styles = createStyles(theme);
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const { login } = useAuth();
  const loginMutation = useLoginMutation();
  const passwordInputRef = useRef<TextInput>(null);

  const isRtl = I18nManager.isRTL || (i18n.language || "ar").startsWith("ar");

  const [showPassword, setShowPassword] = useState(false);
  const snackbar = useSnackbar();

  // Localized Yup Schema
  const formSchema = useMemo(
    () =>
      yup.object().shape({
        email: yup
          .string()
          .trim()
          .required(
            t("COMMON_VALIDATIONS.REQUIRED_FIELD", {
              field: t("LOGIN_PAGE.EMAIL_LABEL"),
            }),
          )
          .email(t("COMMON_VALIDATIONS.EMAIL_INVALID")),
        password: yup
          .string()
          .required(
            t("COMMON_VALIDATIONS.REQUIRED_FIELD", {
              field: t("LOGIN_PAGE.PASSWORD_LABEL"),
            }),
          )
          .min(6, t("COMMON_VALIDATIONS.PASSWORD_MIN", { min: 6 })),
      }),
    [t],
  );

  const defaultValues: FormValues = {
    email: "",
    password: "",
  };

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: yupResolver(formSchema) as any,
    defaultValues,
  });

  // Submission handler with localized snackbar messages
  const onSubmit = async (values: FormValues) => {
    loginMutation.mutate(
      { email: values.email.trim(), password: values.password },
      {
        onSuccess: async (response) => {
          snackbar.success(t("LOGIN_PAGE.LOGIN_SUCCESS"));
          await login(response.data.accessToken, response.data.user);
          router.replace("/(tabs)");
        },
        onError: (err: any) => {
          const rawMsg =
            err?.response?.data?.message || err?.message || "wrong_credentials";
          const normalizedKey = String(rawMsg)
            .toLowerCase()
            .replace(/[\s-]/g, "_");
          const localizedMsg = i18n.exists(`BE_ERROR.${normalizedKey}`)
            ? t(`BE_ERROR.${normalizedKey}`)
            : t("BE_ERROR.wrong_credentials");

          snackbar.error(localizedMsg);
        },
      },
    );
  };

  const handleForgotPassword = () => {
    router.push("/forget-password");
  };

  const handleSignUp = () => {
    // Navigate or prompt registration
  };

  const isSubmitting = loginMutation.isPending;

  return (
    <SafeAreaView style={styles.safeArea}>
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
          {/* 1. Header with Stacked Logo & Tagline */}
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

          {/* 2. Elevated Login Card */}
          <View style={styles.card}>
            {/* Card Title */}
            <ThemedText weight="800" style={styles.cardTitle}>
              {t("LOGIN_PAGE.CARD_TITLE")}
            </ThemedText>

            {/* Email Field */}
            <View style={styles.fieldGroup}>
              <ThemedText weight="700" style={styles.fieldLabel}>
                {t("LOGIN_PAGE.EMAIL_LABEL")}
              </ThemedText>
              <Controller
                control={control}
                name="email"
                render={({ field: { onChange, onBlur, value } }) => (
                  <View
                    style={[
                      styles.inputWrapper,
                      isRtl && styles.inputWrapperRtl,
                      errors.email && styles.inputError,
                    ]}
                  >
                    <TextInput
                      style={[
                        styles.textInput,
                        { textAlign: isRtl ? "right" : "left" },
                      ]}
                      placeholder={t("LOGIN_PAGE.EMAIL_PLACEHOLDER")}
                      placeholderTextColor={theme.textSecondary}
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      autoCapitalize="none"
                      keyboardType="email-address"
                      autoCorrect={false}
                      returnKeyType="next"
                      blurOnSubmit={false}
                      onSubmitEditing={() => passwordInputRef.current?.focus()}
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

            {/* Password Field */}
            <View style={styles.fieldGroup}>
              <ThemedText weight="700" style={styles.fieldLabel}>
                {t("LOGIN_PAGE.PASSWORD_LABEL")}
              </ThemedText>
              <Controller
                control={control}
                name="password"
                render={({ field: { onChange, onBlur, value } }) => (
                  <View
                    style={[
                      styles.inputWrapper,
                      isRtl && styles.inputWrapperRtl,
                      errors.password && styles.inputError,
                    ]}
                  >
                    {/* Trailing Eye Toggle on Left in RTL, Right in LTR */}
                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={() => setShowPassword(!showPassword)}
                      style={styles.eyeToggleBtn}
                    >
                      <Lucide
                        name={showPassword ? "eye" : "eye-off"}
                        size={20}
                        color={theme.textSecondary}
                      />
                    </TouchableOpacity>

                    <TextInput
                      ref={passwordInputRef}
                      style={[
                        styles.textInput,
                        { textAlign: isRtl ? "right" : "left" },
                      ]}
                      placeholder={t("LOGIN_PAGE.PASSWORD_PLACEHOLDER")}
                      placeholderTextColor={theme.textSecondary}
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      secureTextEntry={!showPassword}
                      autoCapitalize="none"
                      autoCorrect={false}
                      returnKeyType="go"
                      onSubmitEditing={handleSubmit(onSubmit)}
                    />

                    {/* Leading Lock Icon on Right in RTL, Left in LTR */}
                    <View style={styles.fieldIconContainer}>
                      <Lucide name="lock" size={20} color={theme.primaryText} />
                    </View>
                  </View>
                )}
              />
              {errors.password?.message ? (
                <ThemedText style={styles.errorText}>
                  {errors.password.message}
                </ThemedText>
              ) : null}
            </View>

            {/* Forgot Password Link */}
            <View style={[styles.optionsRow, isRtl && styles.optionsRowRtl]}>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={handleForgotPassword}
              >
                <ThemedText weight="700" style={styles.forgotPasswordText}>
                  {t("LOGIN_PAGE.FORGOT_PASSWORD")}
                </ThemedText>
              </TouchableOpacity>
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={styles.submitButton}
              activeOpacity={0.8}
              onPress={handleSubmit(onSubmit)}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <ThemedText weight="800" style={styles.submitButtonText}>
                    {t("LOGIN_PAGE.SUBMIT_BUTTON")}
                  </ThemedText>
                  <Lucide
                    name={isRtl ? "chevron-left" : "chevron-right"}
                    size={22}
                    color="#FFFFFF"
                  />
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* 3. Footer Links */}
          <View style={styles.footerContainer}>
            <ThemedText style={styles.footerPrompt}>
              {t("LOGIN_PAGE.DONT_HAVE_ACCOUNT")}{" "}
            </ThemedText>
            <TouchableOpacity activeOpacity={0.7} onPress={handleSignUp}>
              <ThemedText weight="800" style={styles.footerLink}>
                {t("LOGIN_PAGE.CREATE_ACCOUNT")}
              </ThemedText>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

/* ==========================================================================
   3. STYLES
   ========================================================================== */

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
      paddingHorizontal: 18,
      paddingTop: 16,
      paddingBottom: 40,
      justifyContent: "center",
    },

    // ── Decorative Background Bubbles ──
    bubbleTopRight: {
      position: "absolute",
      top: -30,
      right: -30,
      width: 220,
      height: 220,
      borderRadius: 110,
      backgroundColor: theme.tintedIconBackground,
    },
    bubbleTopLeft: {
      position: "absolute",
      top: 140,
      left: -40,
      width: 100,
      height: 100,
      borderRadius: 50,
      backgroundColor: theme.tintedIconBackground,
    },
    bubbleDot: {
      position: "absolute",
      top: 155,
      left: 55,
      width: 12,
      height: 12,
      borderRadius: 6,
      backgroundColor: theme.tintedIconBackground,
    },

    // ── Header Area ──
    headerContainer: {
      alignItems: "center",
      marginBottom: 26,
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
      fontSize: 24,
      color: theme.text,
      marginBottom: 20,
      textAlign: "center",
      lineHeight: 32,
    },

    // ── Field Groups ──
    fieldGroup: {
      marginBottom: 16,
      alignItems: "flex-start",
    },
    fieldLabel: {
      fontSize: 13,
      color: theme.primaryText,
      marginBottom: 8,
      textAlign: "right",
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
    eyeToggleBtn: {
      padding: 4,
    },
    errorText: {
      fontSize: 12,
      color: "#DC2626",
      marginTop: 4,
      paddingHorizontal: 4,
      textAlign: "right",
    },

    // ── Options Row (Forgot Password) ──
    optionsRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "flex-end",
      marginTop: 6,
      marginBottom: 24,
    },
    optionsRowRtl: {
      justifyContent: "flex-start",
    },
    forgotPasswordText: {
      fontSize: 13,
      color: theme.primaryText,
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
      fontSize: 17,
      letterSpacing: 0.2,
    },

    // ── Footer Links ──
    footerContainer: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      marginTop: 28,
    },
    footerPrompt: {
      fontSize: 14,
      color: theme.textSecondary,
    },
    footerLink: {
      fontSize: 14,
      color: theme.primaryText,
    },
  });

export default LoginView;
