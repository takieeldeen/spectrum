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
import { useRegisterMutation } from "@/api/auth";
import { getAppFont } from "@/constants/fonts";
import i18n from "@/i18n";

/* ==========================================================================
   1. FORM SCHEMA & TYPES
   ========================================================================== */

interface RegisterFormValues {
  name: string;
  email: string;
  phone: string;
  password: string;
  passwordConfirmation: string;
}

/* ==========================================================================
   2. COMPONENT
   ========================================================================== */

export const RegisterView = () => {
  const theme = useTheme();
  const styles = createStyles(theme);
  const router = useRouter();
  const { t } = useTranslation();
  const directionStyle = useDirectionStyle();
  const snackbar = useSnackbar();

  const registerMutation = useRegisterMutation();

  const emailInputRef = useRef<TextInput>(null);
  const phoneInputRef = useRef<TextInput>(null);
  const passwordInputRef = useRef<TextInput>(null);
  const confirmPasswordInputRef = useRef<TextInput>(null);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Form validation schema
  const formSchema = useMemo(
    () =>
      yup.object().shape({
        name: yup
          .string()
          .trim()
          .required(
            t("COMMON_VALIDATIONS.REQUIRED_FIELD", {
              field: t("SIGN_UP_PAGE.FULL_NAME_LABEL"),
            }),
          ),
        email: yup
          .string()
          .trim()
          .required(
            t("COMMON_VALIDATIONS.REQUIRED_FIELD", {
              field: t("SIGN_UP_PAGE.EMAIL_LABEL"),
            }),
          )
          .email(t("COMMON_VALIDATIONS.EMAIL_INVALID")),
        phone: yup
          .string()
          .trim()
          .required(
            t("COMMON_VALIDATIONS.REQUIRED_FIELD", {
              field: t("SIGN_UP_PAGE.PHONE_LABEL"),
            }),
          ),
        password: yup
          .string()
          .required(
            t("COMMON_VALIDATIONS.REQUIRED_FIELD", {
              field: t("SIGN_UP_PAGE.PASSWORD_LABEL"),
            }),
          )
          .min(6, t("COMMON_VALIDATIONS.PASSWORD_MIN", { min: 6 })),
        passwordConfirmation: yup
          .string()
          .required(
            t("COMMON_VALIDATIONS.REQUIRED_FIELD", {
              field: t("SIGN_UP_PAGE.CONFIRM_PASSWORD_LABEL"),
            }),
          )
          .oneOf(
            [yup.ref("password")],
            t("COMMON_VALIDATIONS.PASSWORDS_DONT_MATCH"),
          ),
      }),
    [t],
  );

  const defaultValues: RegisterFormValues = {
    name: "",
    email: "",
    phone: "",
    password: "",
    passwordConfirmation: "",
  };

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: yupResolver(formSchema) as any,
    defaultValues,
  });

  const onSubmit = (values: RegisterFormValues) => {
    registerMutation.mutate(
      {
        name: values.name.trim(),
        email: values.email.trim(),
        phoneNumber: values.phone.trim(),
        password: values.password,
        passwordConfirmation: values.passwordConfirmation,
      },
      {
        onSuccess: (response) => {
          snackbar.success(
            t("SIGN_UP_PAGE.SUCCESS_MESSAGE") || response.message,
          );
          router.replace({
            pathname: "/verify-email",
            params: { email: values.email.trim() },
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

  const isSubmitting = registerMutation.isPending;

  return (
    <SafeAreaView style={[styles.safeArea, directionStyle]}>
      {/* Decorative Brand Circles in Background */}
      <View style={styles.bubbleTopRight} pointerEvents="none" />
      <View style={styles.bubbleTopLeft} pointerEvents="none" />
      <View style={styles.bubbleDot} pointerEvents="none" />

      {/* Top Bar with Back Button */}
      <View style={styles.topBar}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          activeOpacity={0.7}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Lucide name="arrow-left" size={22} color={theme.primaryText} />
        </TouchableOpacity>
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
          {/* Header with Logo & Title */}
          <View style={styles.headerContainer}>
            <Logo
              variant="STACKED"
              size={72}
              textColor={theme.primaryText}
              textStyle={styles.logoTitle}
            />
            <ThemedText weight="800" style={styles.title}>
              {t("SIGN_UP_PAGE.TITLE")}
            </ThemedText>
            <ThemedText style={styles.subtitle}>
              {t("SIGN_UP_PAGE.SUBTITLE")}
            </ThemedText>
          </View>

          {/* Form Card */}
          <View style={styles.card}>
            {/* 1. Full Name Field */}
            <View style={styles.fieldGroup}>
              <ThemedText weight="700" style={styles.fieldLabel}>
                {t("SIGN_UP_PAGE.FULL_NAME_LABEL")}
              </ThemedText>
              <Controller
                control={control}
                name="name"
                render={({ field: { onChange, onBlur, value } }) => (
                  <View
                    style={[
                      styles.inputWrapper,
                      errors.name && styles.inputError,
                    ]}
                  >
                    <View style={styles.fieldIconContainer}>
                      <Lucide name="user" size={20} color={theme.primaryText} />
                    </View>
                    <TextInput
                      style={styles.textInput}
                      placeholder={t("SIGN_UP_PAGE.FULL_NAME_PLACEHOLDER")}
                      placeholderTextColor={theme.textSecondary}
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      autoCapitalize="words"
                      autoCorrect={false}
                      returnKeyType="next"
                      blurOnSubmit={false}
                      onSubmitEditing={() => emailInputRef.current?.focus()}
                    />
                  </View>
                )}
              />
              {errors.name?.message ? (
                <ThemedText style={styles.errorText}>
                  {errors.name.message}
                </ThemedText>
              ) : null}
            </View>

            {/* 2. Email Field */}
            <View style={styles.fieldGroup}>
              <ThemedText weight="700" style={styles.fieldLabel}>
                {t("SIGN_UP_PAGE.EMAIL_LABEL")}
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
                    <View style={styles.fieldIconContainer}>
                      <Lucide name="mail" size={20} color={theme.primaryText} />
                    </View>
                    <TextInput
                      ref={emailInputRef}
                      style={styles.textInput}
                      placeholder={t("SIGN_UP_PAGE.EMAIL_PLACEHOLDER")}
                      placeholderTextColor={theme.textSecondary}
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      autoCapitalize="none"
                      keyboardType="email-address"
                      autoCorrect={false}
                      returnKeyType="next"
                      blurOnSubmit={false}
                      onSubmitEditing={() => phoneInputRef.current?.focus()}
                    />
                  </View>
                )}
              />
              {errors.email?.message ? (
                <ThemedText style={styles.errorText}>
                  {errors.email.message}
                </ThemedText>
              ) : null}
            </View>

            {/* 3. Phone Field */}
            <View style={styles.fieldGroup}>
              <ThemedText weight="700" style={styles.fieldLabel}>
                {t("SIGN_UP_PAGE.PHONE_LABEL")}
              </ThemedText>
              <Controller
                control={control}
                name="phone"
                render={({ field: { onChange, onBlur, value } }) => (
                  <View
                    style={[
                      styles.inputWrapper,
                      errors.phone && styles.inputError,
                    ]}
                  >
                    <View style={styles.fieldIconContainer}>
                      <Lucide
                        name="phone"
                        size={20}
                        color={theme.primaryText}
                      />
                    </View>
                    <TextInput
                      ref={phoneInputRef}
                      style={styles.textInput}
                      placeholder={t("SIGN_UP_PAGE.PHONE_PLACEHOLDER")}
                      placeholderTextColor={theme.textSecondary}
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      keyboardType="phone-pad"
                      autoCorrect={false}
                      returnKeyType="next"
                      blurOnSubmit={false}
                      onSubmitEditing={() => passwordInputRef.current?.focus()}
                    />
                  </View>
                )}
              />
              {errors.phone?.message ? (
                <ThemedText style={styles.errorText}>
                  {errors.phone.message}
                </ThemedText>
              ) : null}
            </View>

            {/* 4. Password Field */}
            <View style={styles.fieldGroup}>
              <ThemedText weight="700" style={styles.fieldLabel}>
                {t("SIGN_UP_PAGE.PASSWORD_LABEL")}
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
                    <View style={styles.fieldIconContainer}>
                      <Lucide name="lock" size={20} color={theme.primaryText} />
                    </View>
                    <TextInput
                      ref={passwordInputRef}
                      style={styles.textInput}
                      placeholder={t("SIGN_UP_PAGE.PASSWORD_PLACEHOLDER")}
                      placeholderTextColor={theme.textSecondary}
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      secureTextEntry={!showPassword}
                      autoCapitalize="none"
                      autoCorrect={false}
                      returnKeyType="next"
                      blurOnSubmit={false}
                      onSubmitEditing={() =>
                        confirmPasswordInputRef.current?.focus()
                      }
                    />
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
                  </View>
                )}
              />
              {errors.password?.message ? (
                <ThemedText style={styles.errorText}>
                  {errors.password.message}
                </ThemedText>
              ) : null}
            </View>

            {/* 5. Password Confirmation Field */}
            <View style={styles.fieldGroup}>
              <ThemedText weight="700" style={styles.fieldLabel}>
                {t("SIGN_UP_PAGE.CONFIRM_PASSWORD_LABEL")}
              </ThemedText>
              <Controller
                control={control}
                name="passwordConfirmation"
                render={({ field: { onChange, onBlur, value } }) => (
                  <View
                    style={[
                      styles.inputWrapper,
                      errors.passwordConfirmation && styles.inputError,
                    ]}
                  >
                    <View style={styles.fieldIconContainer}>
                      <Lucide
                        name="shield-check"
                        size={20}
                        color={theme.primaryText}
                      />
                    </View>
                    <TextInput
                      ref={confirmPasswordInputRef}
                      style={styles.textInput}
                      placeholder={t(
                        "SIGN_UP_PAGE.CONFIRM_PASSWORD_PLACEHOLDER",
                      )}
                      placeholderTextColor={theme.textSecondary}
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      secureTextEntry={!showConfirmPassword}
                      autoCapitalize="none"
                      autoCorrect={false}
                      returnKeyType="go"
                      onSubmitEditing={handleSubmit(onSubmit)}
                    />
                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      style={styles.eyeToggleBtn}
                    >
                      <Lucide
                        name={showConfirmPassword ? "eye" : "eye-off"}
                        size={20}
                        color={theme.textSecondary}
                      />
                    </TouchableOpacity>
                  </View>
                )}
              />
              {errors.passwordConfirmation?.message ? (
                <ThemedText style={styles.errorText}>
                  {errors.passwordConfirmation.message}
                </ThemedText>
              ) : null}
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              activeOpacity={0.85}
              style={[
                styles.submitButton,
                isSubmitting && styles.submitButtonDisabled,
              ]}
              onPress={handleSubmit(onSubmit)}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <View style={styles.submitButtonContent}>
                  <ThemedText weight="800" style={styles.submitButtonText}>
                    {t("SIGN_UP_PAGE.SUBMIT_BUTTON")}
                  </ThemedText>
                  <Lucide name="user-plus" size={20} color="#FFFFFF" />
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* Footer Link to Login */}
          <View style={styles.footerContainer}>
            <ThemedText style={styles.footerPrompt}>
              {t("SIGN_UP_PAGE.ALREADY_HAVE_ACCOUNT")}{" "}
            </ThemedText>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => router.push("/login")}
            >
              <ThemedText weight="800" style={styles.footerLink}>
                {t("SIGN_UP_PAGE.SIGN_IN")}
              </ThemedText>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default RegisterView;

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
    topBar: {
      paddingHorizontal: 20,
      paddingTop: 8,
      paddingBottom: 4,
    },
    backButton: {
      width: 42,
      height: 42,
      borderRadius: 14,
      backgroundColor: theme.socketInnerBackground,
      alignItems: "center",
      justifyContent: "center",
    },
    scrollContent: {
      flexGrow: 1,
      paddingHorizontal: 20,
      paddingTop: 10,
      paddingBottom: 40,
    },

    // ── Decorative Background Bubbles ──
    bubbleTopRight: {
      position: "absolute",
      top: -40,
      right: -40,
      width: 220,
      height: 220,
      borderRadius: 110,
      backgroundColor: theme.tintedIconBackground,
    },
    bubbleTopLeft: {
      position: "absolute",
      top: 160,
      left: -50,
      width: 120,
      height: 120,
      borderRadius: 60,
      backgroundColor: theme.tintedIconBackground,
    },
    bubbleDot: {
      position: "absolute",
      top: 180,
      right: 40,
      width: 14,
      height: 14,
      borderRadius: 7,
      backgroundColor: theme.tintedIconBackground,
    },

    // ── Header Area ──
    headerContainer: {
      alignItems: "center",
      marginBottom: 24,
    },
    logoTitle: {
      fontSize: 30,
      fontWeight: "800",
      letterSpacing: -0.6,
      color: theme.primaryText,
    },
    title: {
      fontSize: 26,
      color: theme.text,
      marginTop: 12,
      textAlign: "center",
    },
    subtitle: {
      fontSize: 14,
      color: theme.textSecondary,
      fontWeight: "500",
      marginTop: 6,
      textAlign: "center",
      paddingHorizontal: 16,
    },

    // ── Card ──
    card: {
      backgroundColor: theme.cardBackground,
      borderRadius: 28,
      paddingHorizontal: 20,
      paddingTop: 24,
      paddingBottom: 24,
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

    // ── Field Groups ──
    fieldGroup: {
      marginBottom: 16,
    },
    fieldLabel: {
      fontSize: 13,
      color: theme.primaryText,
      marginBottom: 8,
    },
    inputWrapper: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: theme.socketInnerBackground,
      borderRadius: 16,
      height: 52,
      paddingHorizontal: 14,
      borderWidth: 1.5,
      borderColor: "transparent",
      gap: 10,
    },
    inputError: {
      borderColor: "#DC2626",
    },
    fieldIconContainer: {
      width: 24,
      alignItems: "center",
      justifyContent: "center",
    },
    textInput: {
      flex: 1,
      height: "100%",
      fontSize: 15,
      color: theme.text,
      textAlign: i18n.language === "ar" ? "right" : "left",
      ...getAppFont(),
    },
    eyeToggleBtn: {
      padding: 6,
    },
    errorText: {
      fontSize: 12,
      color: "#DC2626",
      marginTop: 5,
      paddingHorizontal: 4,
    },

    // ── Submit Button ──
    submitButton: {
      backgroundColor: theme.primary,
      height: 54,
      borderRadius: 18,
      alignItems: "center",
      justifyContent: "center",
      marginTop: 12,
      shadowColor: theme.primary,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.3,
      shadowRadius: 12,
      elevation: 4,
    },
    submitButtonDisabled: {
      opacity: 0.75,
    },
    submitButtonContent: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
    },
    submitButtonText: {
      color: "#FFFFFF",
      fontSize: 16,
      letterSpacing: 0.2,
    },

    // ── Footer ──
    footerContainer: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      marginTop: 24,
    },
    footerPrompt: {
      fontSize: 14,
      color: theme.textSecondary,
    },
    footerLink: {
      fontSize: 14,
      color: theme.primary,
    },
  });
