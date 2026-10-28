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
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import Lucide from "@react-native-vector-icons/lucide";

import { useTheme } from "@/hooks/use-theme";
import ThemedText from "@/components/themed-text";
import { useAuth } from "@/context/auth-context";
import { useSnackbar } from "@/components/ui/snackbar-provider";
import { useUpdateProfileMutation, useUploadAvatarMutation } from "@/api/user";
import ChangePasswordModal from "./change-password-modal";
import i18n from "@/i18n";
import { getAppFont } from "@/constants/fonts";

interface FormValues {
  name: string;
  email: string;
  phoneNumber: string;
  imageUrl?: string;
}

export interface ProfileEditModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const DEFAULT_AVATAR = "https://mockmind-api.uifaces.co/content/human/215.jpg";

const ProfileEditModal: React.FC<ProfileEditModalProps> = ({
  visible,
  onClose,
  onSuccess,
}) => {
  const theme = useTheme();
  const styles = createStyles(theme);
  const { t } = useTranslation();
  const { user, updateUser } = useAuth();
  const snackbar = useSnackbar();

  const [showModal, setShowModal] = useState(visible);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  const updateProfileMutation = useUpdateProfileMutation();
  const uploadAvatarMutation = useUploadAvatarMutation();

  const translateY = useRef(new Animated.Value(550)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  const isEdit = !!user;

  const formSchema = yup.object().shape({
    name: yup
      .string()
      .trim()
      .required(
        t("COMMON_VALIDATIONS.REQUIRED_FIELD", {
          field: t("PROFILE.NAME_LABEL"),
        }),
      ),
    email: yup
      .string()
      .trim()
      .required(
        t("COMMON_VALIDATIONS.REQUIRED_FIELD", {
          field: t("PROFILE.EMAIL_LABEL"),
        }),
      )
      .email(t("COMMON_VALIDATIONS.EMAIL_INVALID")),
    phoneNumber: yup.string().trim().optional().default(""),
    imageUrl: yup.string().optional().default(""),
  });

  const defaultValues: FormValues = {
    name: isEdit ? user?.name || "" : "",
    email: isEdit ? user?.email || "" : "",
    phoneNumber: isEdit ? user?.phoneNumber || "" : "",
    imageUrl: isEdit ? user?.imageUrl || "" : "",
  };

  const methods = useForm<FormValues>({
    resolver: yupResolver(formSchema) as any,
    defaultValues,
  });

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = methods;

  const watchedImageUrl = watch("imageUrl");

  useEffect(() => {
    reset(defaultValues);
  }, [user, visible]);

  useEffect(() => {
    if (visible) {
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
      onClose();
    });
  };

  const handlePickImage = async () => {
    try {
      const permissionResult =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        snackbar.warning("Permission to access media library is required");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const pickedAsset = result.assets[0];
        setIsUploadingAvatar(true);

        const uploadedUrl = await uploadAvatarMutation.mutateAsync({
          imageUri: pickedAsset.uri,
          base64: pickedAsset.base64,
          userId: user?._id,
        });

        setValue("imageUrl", uploadedUrl, { shouldValidate: true });
        snackbar.success(t("PROFILE.AVATAR_UPDATED_SUCCESS"));
      }
    } catch (err: any) {
      snackbar.error(err?.message || "Failed to upload avatar image");
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const onSubmit = handleSubmit(async (data: FormValues) => {
    try {
      const updatedUser = await updateProfileMutation.mutateAsync({
        name: data.name,
        email: data.email,
        phoneNumber: data.phoneNumber ? data.phoneNumber.trim() : null,
        imageUrl: data.imageUrl || null,
      });

      updateUser(updatedUser);
      handleClose();
      snackbar.success(t("PROFILE.PROFILE_UPDATED_SUCCESS"));
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

  const isBusy =
    isSubmitting || updateProfileMutation.isPending || isUploadingAvatar;

  if (!showModal) {
    return null;
  }

  const currentDisplayAvatar =
    watchedImageUrl || user?.imageUrl || DEFAULT_AVATAR;

  return (
    <>
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
              <Pressable
                style={StyleSheet.absoluteFill}
                onPress={handleClose}
              />
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
                    {t("PROFILE.EDIT_PROFILE")}
                  </ThemedText>
                  <ThemedText style={styles.subtitle}>
                    {t("PROFILE.EDIT_PROFILE_SUBTITLE")}
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
                {/* Avatar Picker Section */}
                <View style={styles.avatarSection}>
                  <TouchableOpacity
                    onPress={handlePickImage}
                    style={styles.avatarWrapper}
                    disabled={isBusy}
                    activeOpacity={0.8}
                  >
                    <Image
                      source={{ uri: currentDisplayAvatar }}
                      style={styles.avatarImage}
                    />
                    {isUploadingAvatar ? (
                      <View style={styles.avatarOverlay}>
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      </View>
                    ) : (
                      <View style={styles.cameraBadge}>
                        <Lucide name="camera" size={15} color="#FFFFFF" />
                      </View>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={handlePickImage}
                    disabled={isBusy}
                    style={styles.changePhotoBtn}
                  >
                    <ThemedText style={styles.changePhotoText}>
                      {isUploadingAvatar
                        ? t("PROFILE.UPLOADING_PHOTO")
                        : t("PROFILE.CHANGE_PHOTO")}
                    </ThemedText>
                  </TouchableOpacity>
                </View>

                {/* Name Field */}
                <View style={styles.fieldContainer}>
                  <ThemedText style={styles.fieldLabel}>
                    {t("PROFILE.NAME_LABEL")}
                  </ThemedText>
                  <Controller
                    control={control}
                    name="name"
                    render={({ field: { onChange, onBlur, value } }) => (
                      <View style={styles.inputWrapper}>
                        <Lucide
                          name="user"
                          size={18}
                          color={theme.textSecondary}
                          style={styles.inputIcon}
                        />
                        <TextInput
                          style={styles.textInput}
                          placeholder={t("PROFILE.NAME_PLACEHOLDER")}
                          placeholderTextColor={theme.textSecondary}
                          onBlur={onBlur}
                          onChangeText={onChange}
                          value={value}
                        />
                      </View>
                    )}
                  />
                  {errors.name && (
                    <ThemedText style={styles.errorText}>
                      {errors.name.message}
                    </ThemedText>
                  )}
                </View>

                {/* Email Field */}
                <View style={styles.fieldContainer}>
                  <ThemedText style={styles.fieldLabel}>
                    {t("PROFILE.EMAIL_LABEL")}
                  </ThemedText>
                  <Controller
                    control={control}
                    name="email"
                    render={({ field: { onChange, onBlur, value } }) => (
                      <View style={styles.inputWrapper}>
                        <Lucide
                          name="mail"
                          size={18}
                          color={theme.textSecondary}
                          style={styles.inputIcon}
                        />
                        <TextInput
                          style={styles.textInput}
                          placeholder={t("PROFILE.EMAIL_PLACEHOLDER")}
                          placeholderTextColor={theme.textSecondary}
                          keyboardType="email-address"
                          autoCapitalize="none"
                          onBlur={onBlur}
                          onChangeText={onChange}
                          value={value}
                        />
                      </View>
                    )}
                  />
                  {errors.email && (
                    <ThemedText style={styles.errorText}>
                      {errors.email.message}
                    </ThemedText>
                  )}
                </View>

                {/* Phone Number Field */}
                <View style={styles.fieldContainer}>
                  <ThemedText style={styles.fieldLabel}>
                    {t("PROFILE.PHONE_LABEL")}
                  </ThemedText>
                  <Controller
                    control={control}
                    name="phoneNumber"
                    render={({ field: { onChange, onBlur, value } }) => (
                      <View style={styles.inputWrapper}>
                        <Lucide
                          name="phone"
                          size={18}
                          color={theme.textSecondary}
                          style={styles.inputIcon}
                        />
                        <TextInput
                          style={styles.textInput}
                          placeholder={t("PROFILE.PHONE_PLACEHOLDER")}
                          placeholderTextColor={theme.textSecondary}
                          keyboardType="phone-pad"
                          onBlur={onBlur}
                          onChangeText={onChange}
                          value={value}
                        />
                      </View>
                    )}
                  />
                  {errors.phoneNumber && (
                    <ThemedText style={styles.errorText}>
                      {errors.phoneNumber.message}
                    </ThemedText>
                  )}
                </View>

                {/* Change Password Trigger Button */}
                <TouchableOpacity
                  style={styles.changePasswordButton}
                  onPress={() => setShowChangePasswordModal(true)}
                  activeOpacity={0.7}
                >
                  <View style={styles.changePasswordLeft}>
                    <View style={styles.changePasswordIconWrapper}>
                      <Lucide name="lock" size={18} color={theme.primary} />
                    </View>
                    <ThemedText style={styles.changePasswordButtonText}>
                      {t("PROFILE.CHANGE_PASSWORD_BUTTON")}
                    </ThemedText>
                  </View>
                  <Lucide
                    name="chevron-right"
                    size={18}
                    color={theme.textSecondary}
                  />
                </TouchableOpacity>

                {/* Form Action Buttons */}
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
                    style={[
                      styles.submitButton,
                      isBusy && styles.disabledButton,
                    ]}
                    onPress={onSubmit}
                    disabled={isBusy}
                    activeOpacity={0.8}
                  >
                    {isBusy ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <ThemedText style={styles.submitButtonText}>
                        {t("PROFILE.SAVE_CHANGES")}
                      </ThemedText>
                    )}
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </Animated.View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Change Password Modal */}
      <ChangePasswordModal
        visible={showChangePasswordModal}
        onClose={() => setShowChangePasswordModal(false)}
      />
    </>
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
      maxHeight: "90%",
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
      paddingTop: 16,
      paddingBottom: 32,
    },
    avatarSection: {
      alignItems: "center",
      marginBottom: 20,
    },
    avatarWrapper: {
      position: "relative",
      width: 88,
      height: 88,
      borderRadius: 44,
      overflow: "hidden",
      backgroundColor: theme.backgroundElement,
      borderWidth: 2,
      borderColor: theme.primary,
    },
    avatarImage: {
      width: "100%",
      height: "100%",
    },
    avatarOverlay: {
      ...StyleSheet.absoluteFill,
      backgroundColor: "rgba(0,0,0,0.45)",
      alignItems: "center",
      justifyContent: "center",
    },
    cameraBadge: {
      position: "absolute",
      bottom: 0,
      left: 0,
      right: 0,
      height: 26,
      backgroundColor: "rgba(0,0,0,0.6)",
      alignItems: "center",
      justifyContent: "center",
    },
    changePhotoBtn: {
      marginTop: 8,
      paddingVertical: 4,
      paddingHorizontal: 12,
    },
    changePhotoText: {
      fontSize: 13,
      fontWeight: "600",
      color: theme.primaryText,
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
    errorText: {
      fontSize: 12,
      color: theme.snackbarError,
      marginTop: 4,
      paddingHorizontal: 4,
    },
    changePasswordButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: theme.backgroundElement,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.cardBorder,
      paddingVertical: 12,
      paddingHorizontal: 14,
      marginTop: 4,
      marginBottom: 20,
    },
    changePasswordLeft: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
    changePasswordIconWrapper: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: theme.tintedIconBackground,
      alignItems: "center",
      justifyContent: "center",
    },
    changePasswordButtonText: {
      fontSize: 14,
      fontWeight: "600",
      color: theme.text,
    },
    buttonRow: {
      flexDirection: "row",
      gap: 12,
      marginTop: 4,
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

export default ProfileEditModal;
