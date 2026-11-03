import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Pressable,
  Platform,
  Animated,
  Easing,
  TextInput,
  KeyboardAvoidingView,
  I18nManager,
  ActivityIndicator,
} from "react-native";
import { useTranslation } from "react-i18next";
import { useForm, Controller } from "react-hook-form";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import { Lucide } from "@react-native-vector-icons/lucide";

import { useTheme } from "@/hooks/use-theme";
import ThemedText from "@/components/themed-text";
import { useSnackbar } from "@/components/ui/snackbar-provider";
import { Combobox } from "@/components/ui/combobox";
import { getAppFont } from "@/constants/fonts";
import { IDevice } from "@/types/device";
import { useCreateDevice, useUpdateDevice, useGetDevices } from "@/api/device";
import { useGetPlugs } from "@/api/plug";
import i18n from "@/i18n";

export interface DeviceNewEditBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  currentDevice?: IDevice | null;
  onSuccess?: () => void;
}

interface FormValues {
  name: string;
  plugPort?: string | null;
}

interface PlugPortOption {
  value: string; // `${plugId}::${portNumber}`
  label: string;
  subLabel?: string;
  plugId: string;
  port: number;
}

export function DeviceNewEditBottomSheet({
  visible,
  onClose,
  currentDevice,
  onSuccess,
}: DeviceNewEditBottomSheetProps) {
  const theme = useTheme();
  const styles = createStyles(theme);
  const snackbar = useSnackbar();
  const { t, i18n } = useTranslation();
  const isArabic = (i18n.language || "ar").startsWith("ar");
  const isRtl = I18nManager.isRTL || isArabic;
  const isEdit = Boolean(currentDevice?._id);

  const [showModal, setShowModal] = useState(visible);

  const translateY = useRef(new Animated.Value(550)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  // Mutations & Queries
  const createDeviceMutation = useCreateDevice();
  const updateDeviceMutation = useUpdateDevice();
  const { data: plugs } = useGetPlugs();
  const { data: allDevices } = useGetDevices();

  // Yup validation schema
  const formSchema = yup.object().shape({
    name: yup
      .string()
      .trim()
      .required(
        t("COMMON_VALIDATIONS.REQUIRED_FIELD", {
          field: t("DEVICE_FORM.DEVICE_NAME_LABEL"),
        }),
      ),
    plugPort: yup.string().nullable().optional(),
  });

  // Calculate current assigned plugPort string
  const currentPlugPortValue = useMemo(() => {
    if (!currentDevice?.plugId || !currentDevice?.plugPort) return "";
    const pId =
      typeof currentDevice.plugId === "object"
        ? currentDevice.plugId._id
        : currentDevice.plugId;
    return `${pId}::${currentDevice.plugPort}`;
  }, [currentDevice]);

  // Default values following standard pattern
  const defaultValues: FormValues = {
    name: isEdit && currentDevice ? currentDevice.name : "",
    plugPort: isEdit ? currentPlugPortValue : "",
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

  // Build autocomplete options for all plug ports
  const plugPortOptions = useMemo<PlugPortOption[]>(() => {
    if (!plugs || plugs.length === 0) return [];

    const options: PlugPortOption[] = [];

    plugs.forEach((plug) => {
      const pId = plug._id!;
      const plugName = plug.name;

      for (let port = 1; port <= 4; port++) {
        // Check if another device is currently using this socket
        const occupyingDevice = allDevices?.find((d) => {
          if (!d.plugId || d.plugPort !== port) return false;
          const assignedPlugId =
            typeof d.plugId === "object" ? d.plugId._id : d.plugId;
          return assignedPlugId === pId;
        });

        const isCurrentDeviceOnThisPort =
          currentDevice && occupyingDevice?._id === currentDevice._id;

        const subLabel = occupyingDevice
          ? isCurrentDeviceOnThisPort
            ? t("DEVICE_FORM.PORT_AVAILABLE") +
              ` (${t("DEVICE_FORM.EDIT_TITLE")})`
            : t("DEVICE_FORM.ALREADY_ASSIGNED_TO", {
                name: occupyingDevice.name,
              })
          : t("DEVICE_FORM.PORT_AVAILABLE");

        const outletLabel = t("DEVICE_CARD.OUTLET_NUMBER", { num: port });

        options.push({
          value: `${pId}::${port}`,
          plugId: pId,
          port,
          label: `${plugName} • ${outletLabel}`,
          subLabel,
        });
      }
    });

    return options;
  }, [plugs, allDevices, currentDevice, isArabic, t]);

  useEffect(() => {
    if (visible) {
      reset(defaultValues);
      translateY.setValue(550);
      backdropOpacity.setValue(0);
      setShowModal(true);
    } else if (showModal) {
      handleClose();
    }
  }, [visible, currentDevice, currentPlugPortValue]);

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
      reset({ name: "", plugPort: "" });
      onClose();
    });
  };

  const onSubmit = handleSubmit(async (data: FormValues) => {
    try {
      let plugId: string | null = null;
      let plugPort: number | null = null;

      if (data.plugPort && data.plugPort.includes("::")) {
        const parts = data.plugPort.split("::");
        plugId = parts[0] || null;
        plugPort = parts[1] ? parseInt(parts[1], 10) : null;
      }

      const payload = {
        name: data.name.trim(),
        plugId,
        plugPort,
      };

      if (isEdit && currentDevice?._id) {
        await updateDeviceMutation.mutateAsync({
          id: currentDevice._id,
          data: payload,
        });
        handleClose();
        snackbar.success(t("DEVICE_FORM.UPDATED_SUCCESS"));
        onSuccess?.();
      } else {
        await createDeviceMutation.mutateAsync(payload);
        handleClose();
        snackbar.success(t("DEVICE_FORM.CREATED_SUCCESS"));
        onSuccess?.();
      }
    } catch (error: any) {
      snackbar.error(error?.message || t("BE_ERROR.generic"));
    }
  });

  const isBusy =
    isSubmitting ||
    createDeviceMutation.isPending ||
    updateDeviceMutation.isPending;

  if (!showModal) {
    return null;
  }

  return (
    <Modal
      visible={showModal}
      transparent
      animationType="none"
      onShow={onModalShow}
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.modalOverlay}
      >
        {/* Animated Dim Backdrop */}
        <Animated.View
          style={[
            styles.backdrop,
            {
              opacity: backdropOpacity,
            },
          ]}
        >
          <Pressable style={styles.backdropPressable} onPress={handleClose} />
        </Animated.View>

        {/* Sliding Bottom Sheet Container */}
        <Animated.View
          style={[
            styles.sheetContainer,
            {
              transform: [{ translateY }],
            },
          ]}
        >
          {/* Drag Handle Indicator */}
          <View style={styles.handleContainer}>
            <View style={styles.handleBar} />
          </View>

          {/* Header Row */}
          <View
            style={[
              styles.header,
              { flexDirection: "row" },
            ]}
          >
            <ThemedText weight="700" style={styles.headerTitle}>
              {isEdit
                ? t("DEVICE_FORM.EDIT_TITLE")
                : t("DEVICE_FORM.NEW_TITLE")}
            </ThemedText>
            <TouchableOpacity
              onPress={handleClose}
              style={styles.closeButton}
              activeOpacity={0.7}
              hitSlop={10}
            >
              <Lucide name="x" size={20} color={theme.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Form Content */}
          <View style={styles.body}>
            {/* Field 1: Device Name */}
            <View style={styles.fieldGroup}>
              <ThemedText weight="600" style={[styles.label]}>
                {t("DEVICE_FORM.DEVICE_NAME_LABEL")}
              </ThemedText>

              <Controller
                control={control}
                name="name"
                render={({ field: { onChange, onBlur, value } }) => (
                  <View
                    style={[
                      styles.inputWrapper,
                      {
                        flexDirection: "row",
                        borderColor: errors.name ? "#EF4444" : theme.cardBorder,
                      },
                    ]}
                  >
                    <Lucide
                      name="cpu"
                      size={20}
                      color={theme.primary}
                      style={styles.inputIcon}
                    />
                    <TextInput
                      style={[
                        styles.input,
                        {
                          color: theme.text,
                          textAlign: isRtl ? "right" : "left",
                          ...getAppFont("500", i18n.language),
                        },
                      ]}
                      placeholder={t("DEVICE_FORM.DEVICE_NAME_PLACEHOLDER")}
                      placeholderTextColor={theme.textSecondary}
                      value={value}
                      onBlur={onBlur}
                      onChangeText={onChange}
                      autoCapitalize="words"
                      editable={!isBusy}
                      returnKeyType="next"
                    />
                  </View>
                )}
              />

              {errors.name ? (
                <ThemedText
                  style={[
                    styles.errorText,
                    { textAlign: isRtl ? "right" : "left" },
                  ]}
                >
                  {errors.name.message}
                </ThemedText>
              ) : null}
            </View>

            {/* Field 2: Optional Autocomplete to assign to Plug Port */}
            <View style={styles.fieldGroup}>
              <Controller
                control={control}
                name="plugPort"
                render={({ field: { onChange, value } }) => (
                  <Combobox<PlugPortOption>
                    label={t("DEVICE_FORM.ASSIGN_PLUG_LABEL")}
                    placeholder={t("DEVICE_FORM.ASSIGN_PLUG_PLACEHOLDER")}
                    searchPlaceholder={t("DEVICE_FORM.SEARCH_PLUG_PORT")}
                    value={value || null}
                    onChange={(val) => onChange(val || "")}
                    options={plugPortOptions}
                    getOptionValue={(opt) => opt.value}
                    getOptionLabel={(opt) => opt.label}
                    getOptionSubLabel={(opt) => opt.subLabel}
                    leadIcon="plug"
                    clearable
                    allowEmpty
                    emptyLabel={t("DEVICE_FORM.UNASSIGNED_OPTION")}
                    emptyResultsText={t("DEVICE_FORM.NO_PLUGS_AVAILABLE")}
                    disabled={isBusy}
                    containerStyle={{
                      width: "100%",
                      alignItems:
                        i18n.language === "ar" ? "flex-end" : "flex-start",
                    }}
                  />
                )}
              />
            </View>
          </View>

          {/* Action Buttons */}
          <View
            style={[
              styles.actionsRow,
              { flexDirection: "row" },
            ]}
          >
            {/* Cancel Button */}
            <TouchableOpacity
              style={[styles.actionBtn, styles.cancelBtn]}
              onPress={handleClose}
              disabled={isBusy}
              activeOpacity={0.7}
            >
              <ThemedText weight="600" style={styles.cancelBtnText}>
                {t("DEVICE_FORM.CANCEL")}
              </ThemedText>
            </TouchableOpacity>

            {/* Save / Submit Button */}
            <TouchableOpacity
              style={[
                styles.actionBtn,
                styles.saveBtn,
                isBusy && { opacity: 0.7 },
              ]}
              onPress={onSubmit}
              disabled={isBusy}
              activeOpacity={0.8}
            >
              {isBusy ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <ThemedText weight="700" style={styles.saveBtnText}>
                  {t("DEVICE_FORM.SAVE")}
                </ThemedText>
              )}
            </TouchableOpacity>
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const createStyles = (theme: ReturnType<typeof useTheme>) =>
  StyleSheet.create({
    modalOverlay: {
      flex: 1,
      justifyContent: "flex-end",
    },
    backdrop: {
      ...(StyleSheet.absoluteFill as any),
      backgroundColor: "rgba(0, 0, 0, 0.55)",
    },
    backdropPressable: {
      flex: 1,
    },
    sheetContainer: {
      backgroundColor: theme.background,
      borderTopLeftRadius: 28,
      borderTopRightRadius: 28,
      paddingHorizontal: 20,
      paddingTop: 12,
      paddingBottom: Platform.OS === "ios" ? 36 : 24,
      borderWidth: 1,
      borderColor: theme.cardBorder,
      shadowColor: "#000000",
      shadowOffset: { width: 0, height: -4 },
      shadowOpacity: 0.15,
      shadowRadius: 16,
      elevation: 20,
    },
    handleContainer: {
      alignItems: "center",
      paddingVertical: 4,
      marginBottom: 8,
    },
    handleBar: {
      width: 44,
      height: 4,
      borderRadius: 2,
      backgroundColor: theme.textSecondary,
      opacity: 0.35,
    },
    header: {
      alignItems: "center",
      justifyContent: "space-between",
      paddingBottom: 16,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.divider,
      marginBottom: 16,
    },
    headerTitle: {
      fontSize: 18,
      color: theme.text,
    },
    closeButton: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: theme.backgroundElement,
      alignItems: "center",
      justifyContent: "center",
    },
    body: {
      gap: 16,
      marginBottom: 24,
    },
    fieldGroup: {
      width: "100%",
      alignItems: i18n.language === "ar" ? "flex-end" : "flex-start",
    },
    label: {
      fontSize: 14,
      color: theme.text,
      marginBottom: 8,
    },
    inputWrapper: {
      alignItems: "center",
      height: 52,
      borderRadius: 14,
      backgroundColor: theme.backgroundElement,
      borderWidth: 1.5,
      paddingHorizontal: 14,
      gap: 10,
    },
    inputIcon: {
      opacity: 0.9,
    },
    input: {
      flex: 1,
      height: "100%",
      fontSize: 15,
    },
    errorText: {
      color: "#EF4444",
      fontSize: 12,
      marginTop: 6,
      paddingHorizontal: 4,
    },
    actionsRow: {
      gap: 12,
    },
    actionBtn: {
      flex: 1,
      height: 50,
      borderRadius: 14,
      alignItems: "center",
      justifyContent: "center",
    },
    cancelBtn: {
      backgroundColor: theme.backgroundElement,
      borderWidth: 1,
      borderColor: theme.cardBorder,
    },
    cancelBtnText: {
      color: theme.text,
      fontSize: 15,
    },
    saveBtn: {
      backgroundColor: theme.primary,
    },
    saveBtnText: {
      color: "#FFFFFF",
      fontSize: 15,
    },
  });

export default DeviceNewEditBottomSheet;
