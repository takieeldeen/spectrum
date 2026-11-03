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
  Linking,
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
import { useLoginMutation } from "@/api/auth";
import { useAuth } from "@/context/auth-context";
import Logo from "@/components/logo";
import { useSnackbar } from "@/components/ui/snackbar-provider";
import { ConfirmationMessage } from "@/components/confirmation-message";
import { LanguageCombobox } from "@/components/language-combobox";

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
  const directionStyle = useDirectionStyle();

  const [showPassword, setShowPassword] = useState(false);
  const [pendingEmail, setPendingEmail] = useState("");
  const [showInactiveModal, setShowInactiveModal] = useState(false);
  const [showSuspendedModal, setShowSuspendedModal] = useState(false);
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

  // Submission handler with localized snackbar messages and account status dialogs
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
          const resData = err?.response?.data;
          const errorCode = resData?.code;
          const rawMsg =
            resData?.message || err?.message || "wrong_credentials";

          // 1. Account Inactive / Pending Activation
          if (
            errorCode === "ACCOUNT_INACTIVE" ||
            String(rawMsg).includes("Account is not activated")
          ) {
            const targetEmail = resData?.data?.email || values.email.trim();
            setPendingEmail(targetEmail);
            setShowInactiveModal(true);
            return;
          }

          // 2. Account Suspended
          if (
            errorCode === "ACCOUNT_SUSPENDED" ||
            String(rawMsg).includes("Account is suspended")
          ) {
            setShowSuspendedModal(true);
            return;
          }

          // 3. Fallback to standard localized error snackbar
          const normalizedKey = String(rawMsg)
            .toLowerCase()
            .replace(/[\s-]/g, "_");
          const localizedMsg = i18n.exists(`BE_ERROR.${normalizedKey}`)
            ? t(`BE_ERROR.${normalizedKey}`)
            : i18n.exists(`BE_ERROR.${rawMsg}`)
              ? t(`BE_ERROR.${rawMsg}`)
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
    router.push("/register");
  };

  const isSubmitting = loginMutation.isPending;

  return (
    <SafeAreaView style={[styles.safeArea, directionStyle]}>
      {/* Decorative Brand Circles in Background */}
      <View style={styles.bubbleTopRight} pointerEvents="none" />
      <View style={styles.bubbleTopLeft} pointerEvents="none" />
      <View style={styles.bubbleDot} pointerEvents="none" />

      {/* Top Bar with Language Combobox */}
      <View style={styles.topBar}>
        <LanguageCombobox />
      </View>

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

      {/* Account Inactive Modal */}
      <ConfirmationMessage
        visible={showInactiveModal}
        variant="Info"
        title={t("LOGIN_PAGE.ACCOUNT_NOT_ACTIVATED_TITLE")}
        subtitle={t("LOGIN_PAGE.ACCOUNT_NOT_ACTIVATED_DESC")}
        confirmText={t("LOGIN_PAGE.VERIFY_NOW")}
        cancelText={t("LOGIN_PAGE.CANCEL")}
        onConfirm={() => {
          setShowInactiveModal(false);
          router.push({
            pathname: "/verify-email",
            params: { email: pendingEmail },
          });
        }}
        onClose={() => setShowInactiveModal(false)}
      />

      {/* Account Suspended Modal */}
      <ConfirmationMessage
        visible={showSuspendedModal}
        variant="Error"
        title={t("LOGIN_PAGE.ACCOUNT_SUSPENDED_TITLE")}
        subtitle={t("LOGIN_PAGE.ACCOUNT_SUSPENDED_DESC")}
        confirmText={t("LOGIN_PAGE.CONTACT_SUPPORT")}
        cancelText={t("LOGIN_PAGE.CANCEL")}
        onConfirm={() => {
          setShowSuspendedModal(false);
          Linking.openURL("mailto:support@spectrum.com").catch(() => {});
        }}
        onClose={() => setShowSuspendedModal(false)}
      />
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
      paddingTop: 8,
      paddingBottom: 40,
      justifyContent: "center",
    },

    // ── Top Bar (Language Selector) ──
    topBar: {
      flexDirection: "row",
      justifyContent: "flex-end",
      paddingHorizontal: 18,
      paddingTop: 6,
      paddingBottom: 2,
      zIndex: 10,
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

      // textAlign: "right",
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
