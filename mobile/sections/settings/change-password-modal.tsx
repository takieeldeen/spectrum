import React, { useState, useEffect, useRef } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Pressable,
  Animated,
  Easing,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { useTranslation } from "react-i18next";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import Lucide from "@react-native-vector-icons/lucide";

import { useTheme } from "@/hooks/use-theme";
import ThemedText from "@/components/themed-text";
import { useSnackbar } from "@/components/ui/snackbar-provider";
import { useChangePasswordMutation } from "@/api/user";
import { getAppFont } from "@/constants/fonts";
import i18n from "@/i18n";

interface FormValues {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface ChangePasswordModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({
  visible,
  onClose,
  onSuccess,
}) => {
  const theme = useTheme();
  const styles = createStyles(theme);
  const { t } = useTranslation();
  const snackbar = useSnackbar();

  const [showModal, setShowModal] = useState(visible);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const changePasswordMutation = useChangePasswordMutation();

  const translateY = useRef(new Animated.Value(550)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  const formSchema = yup.object().shape({
    currentPassword: yup
      .string()
      .trim()
      .required(t("COMMON_VALIDATIONS.CURRENT_PASSWORD_REQUIRED")),
    newPassword: yup
      .string()
      .trim()
      .required(t("COMMON_VALIDATIONS.NEW_PASSWORD_REQUIRED"))
      .min(8, t("COMMON_VALIDATIONS.PASSWORD_MIN", { min: 8 })),
    confirmPassword: yup
      .string()
      .trim()
      .required(t("COMMON_VALIDATIONS.CONFIRM_PASSWORD_REQUIRED"))
      .oneOf(
        [yup.ref("newPassword")],
        t("COMMON_VALIDATIONS.PASSWORDS_DONT_MATCH"),
      ),
  });

  const defaultValues: FormValues = {
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  };

  const methods = useForm<FormValues>({
    resolver: yupResolver(formSchema),
    defaultValues,
  });

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = methods;

  useEffect(() => {
    if (visible) {
      reset(defaultValues);
      setShowCurrentPassword(false);
      setShowNewPassword(false);
      setShowConfirmPassword(false);
      translateY.setValue(550);
      backdropOpacity.setValue(0);
      setShowModal(true);
    } else if (showModal) {
      handleClose();
    }
  }, [visible]);

  const onModalShow = () => {
    Animated.parallel([
      Animated.timing(backdropOpacity, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.spring(translateY, {
        toValue: 0,
        damping: 24,
        mass: 0.9,
        stiffness: 220,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(backdropOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 550,
        duration: 220,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start(() => {
      setShowModal(false);
      reset(defaultValues);
      onClose();
    });
  };

  const onSubmit = handleSubmit(async (data: FormValues) => {
    try {
      await changePasswordMutation.mutateAsync({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });

      handleClose();
      snackbar.success(t("PROFILE.PASSWORD_CHANGED_SUCCESS"));
      onSuccess?.();
    } catch (error: any) {
      const errorMsg =
        error?.message &&
        t(`BE_ERROR.${error.message}`) !== `BE_ERROR.${error.message}`
          ? t(`BE_ERROR.${error.message}`)
          : error?.message || t("BE_ERROR.generic");
      snackbar.error(errorMsg);
    }
  });

  const isBusy = isSubmitting || changePasswordMutation.isPending;

  if (!showModal) {
    return null;
  }

  return (
    <Modal
      visible={showModal}
      transparent
      animationType="none"
      onRequestClose={handleClose}
      onShow={onModalShow}
      statusBarTranslucent
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.keyboardAvoid}
      >
        <View style={styles.container}>
          <Animated.View
            style={[styles.backdrop, { opacity: backdropOpacity }]}
          >
            <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />
          </Animated.View>

          <Animated.View
            style={[
              styles.sheet,
              {
                transform: [{ translateY }],
              },
            ]}
          >
            <View style={styles.handleContainer}>
              <View style={styles.handle} />
            </View>

            <View style={styles.header}>
              <View style={styles.headerTitles}>
                <ThemedText style={styles.title}>
                  {t("PROFILE.CHANGE_PASSWORD_TITLE")}
                </ThemedText>
                <ThemedText style={styles.subtitle}>
                  {t("PROFILE.CHANGE_PASSWORD_SUBTITLE")}
                </ThemedText>
              </View>

              <TouchableOpacity
                onPress={handleClose}
                style={styles.closeButton}
                activeOpacity={0.7}
              >
                <Lucide name="x" size={18} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
              keyboardShouldPersistTaps="handled"
            >
              {/* Current Password Field */}
              <View style={styles.fieldContainer}>
                <ThemedText style={styles.fieldLabel}>
                  {t("PROFILE.CURRENT_PASSWORD_LABEL")}
                </ThemedText>
                <Controller
                  control={control}
                  name="currentPassword"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <View style={styles.inputWrapper}>
                      <Lucide
                        name="lock"
                        size={18}
                        color={theme.textSecondary}
                        style={styles.inputIcon}
                      />
                      <TextInput
                        style={styles.textInput}
                        secureTextEntry={!showCurrentPassword}
                        placeholder={t("PROFILE.CURRENT_PASSWORD_PLACEHOLDER")}
                        placeholderTextColor={theme.textSecondary}
                        onBlur={onBlur}
                        onChangeText={onChange}
                        value={value}
                        autoCapitalize="none"
                      />
                      <TouchableOpacity
                        onPress={() => setShowCurrentPassword((prev) => !prev)}
                        style={styles.eyeButton}
                      >
                        <Lucide
                          name={showCurrentPassword ? "eye-off" : "eye"}
                          size={18}
                          color={theme.textSecondary}
                        />
                      </TouchableOpacity>
                    </View>
                  )}
                />
                {errors.currentPassword && (
                  <ThemedText style={styles.errorText}>
                    {errors.currentPassword.message}
                  </ThemedText>
                )}
              </View>

              {/* New Password Field */}
              <View style={styles.fieldContainer}>
                <ThemedText style={styles.fieldLabel}>
                  {t("PROFILE.NEW_PASSWORD_LABEL")}
                </ThemedText>
                <Controller
                  control={control}
                  name="newPassword"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <View style={styles.inputWrapper}>
                      <Lucide
                        name="key"
                        size={18}
                        color={theme.textSecondary}
                        style={styles.inputIcon}
                      />
                      <TextInput
                        style={styles.textInput}
                        secureTextEntry={!showNewPassword}
                        placeholder={t("PROFILE.NEW_PASSWORD_PLACEHOLDER")}
                        placeholderTextColor={theme.textSecondary}
                        onBlur={onBlur}
                        onChangeText={onChange}
                        value={value}
                        autoCapitalize="none"
                      />
                      <TouchableOpacity
                        onPress={() => setShowNewPassword((prev) => !prev)}
                        style={styles.eyeButton}
                      >
                        <Lucide
                          name={showNewPassword ? "eye-off" : "eye"}
                          size={18}
                          color={theme.textSecondary}
                        />
                      </TouchableOpacity>
                    </View>
                  )}
                />
                {errors.newPassword && (
                  <ThemedText style={styles.errorText}>
                    {errors.newPassword.message}
                  </ThemedText>
                )}
              </View>

              {/* Confirm Password Field */}
              <View style={styles.fieldContainer}>
                <ThemedText style={styles.fieldLabel}>
                  {t("PROFILE.CONFIRM_PASSWORD_LABEL")}
                </ThemedText>
                <Controller
                  control={control}
                  name="confirmPassword"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <View style={styles.inputWrapper}>
                      <Lucide
                        name="shield-check"
                        size={18}
                        color={theme.textSecondary}
                        style={styles.inputIcon}
                      />
                      <TextInput
                        style={styles.textInput}
                        secureTextEntry={!showConfirmPassword}
                        placeholder={t("PROFILE.CONFIRM_PASSWORD_PLACEHOLDER")}
                        placeholderTextColor={theme.textSecondary}
                        onBlur={onBlur}
                        onChangeText={onChange}
                        value={value}
                        autoCapitalize="none"
                      />
                      <TouchableOpacity
                        onPress={() => setShowConfirmPassword((prev) => !prev)}
                        style={styles.eyeButton}
                      >
                        <Lucide
                          name={showConfirmPassword ? "eye-off" : "eye"}
                          size={18}
                          color={theme.textSecondary}
                        />
                      </TouchableOpacity>
                    </View>
                  )}
                />
                {errors.confirmPassword && (
                  <ThemedText style={styles.errorText}>
                    {errors.confirmPassword.message}
                  </ThemedText>
                )}
              </View>

              {/* Action Buttons */}
              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={handleClose}
                  disabled={isBusy}
                >
                  <ThemedText style={styles.cancelButtonText}>
                    {t("CANCEL")}
                  </ThemedText>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.submitButton, isBusy && styles.disabledButton]}
                  onPress={onSubmit}
                  disabled={isBusy}
                  activeOpacity={0.8}
                >
                  {isBusy ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <ThemedText style={styles.submitButtonText}>
                      {t("PROFILE.UPDATE_PASSWORD_BUTTON")}
                    </ThemedText>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </Animated.View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const createStyles = (theme: ReturnType<typeof useTheme>) =>
  StyleSheet.create({
    keyboardAvoid: {
      flex: 1,
    },
    container: {
      flex: 1,
      justifyContent: "flex-end",
    },
    backdrop: {
      ...StyleSheet.absoluteFill,
      backgroundColor: theme.overlayBackground,
    },
    sheet: {
      backgroundColor: theme.cardBackground,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      maxHeight: "85%",
      borderWidth: 1,
      borderColor: theme.cardBorder,
      borderBottomWidth: 0,
    },
    handleContainer: {
      alignItems: "center",
      paddingTop: 10,
      paddingBottom: 4,
    },
    handle: {
      width: 40,
      height: 4,
      backgroundColor: theme.switchTrackOff,
      borderRadius: 2,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 20,
      paddingTop: 12,
      paddingBottom: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.divider,
    },
    headerTitles: {
      flex: 1,
      paddingRight: 12,
    },
    title: {
      fontSize: 18,
      fontWeight: "700",
      color: theme.text,
      marginBottom: 3,
    },
    subtitle: {
      fontSize: 13,
      color: theme.textSecondary,
    },
    closeButton: {
      width: 34,
      height: 34,
      borderRadius: 17,
      backgroundColor: theme.closeBtnBackground,
      alignItems: "center",
      justifyContent: "center",
    },
    scrollContent: {
      paddingHorizontal: 20,
      paddingTop: 18,
      paddingBottom: 32,
    },
    fieldContainer: {
      marginBottom: 16,
    },
    fieldLabel: {
      fontSize: 13,
      fontWeight: "600",
      color: theme.text,
      marginBottom: 8,
    },
    inputWrapper: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: theme.inputBackground,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.inputBorder,
      paddingHorizontal: 12,
      height: 50,
    },
    inputIcon: {
      marginRight: 8,
    },
    textInput: {
      flex: 1,
      fontSize: 14,
      color: theme.text,
      paddingVertical: 10,
      textAlign: i18n.language === "ar" ? "right" : "left",
      ...getAppFont(),
    },
    eyeButton: {
      padding: 6,
    },
    errorText: {
      fontSize: 12,
      color: theme.snackbarError,
      marginTop: 4,
      paddingHorizontal: 4,
    },
    buttonRow: {
      flexDirection: "row",
      gap: 12,
      marginTop: 10,
    },
    cancelButton: {
      flex: 1,
      height: 48,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.divider,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.backgroundElement,
    },
    cancelButtonText: {
      fontSize: 15,
      fontWeight: "600",
      color: theme.textSecondary,
    },
    submitButton: {
      flex: 1,
      height: 48,
      borderRadius: 12,
      backgroundColor: theme.primary,
      alignItems: "center",
      justifyContent: "center",
    },
    disabledButton: {
      opacity: 0.65,
    },
    submitButtonText: {
      fontSize: 15,
      fontWeight: "700",
      color: "#FFFFFF",
    },
  });

export default ChangePasswordModal;
