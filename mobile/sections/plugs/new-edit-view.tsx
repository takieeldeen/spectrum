import React, { useState, useMemo } from "react";
import {
  View,
  TextInput,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useTranslation } from "react-i18next";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as Yup from "yup";
import { Lucide } from "@react-native-vector-icons/lucide";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useTheme } from "@/hooks/use-theme";
import { Button, Snackbar, Combobox } from "@/components/ui";
import {
  ConfirmationMessage,
  useConfirmationMessage,
} from "@/components/confirmation-message";
import { getAppFont } from "@/constants/fonts";
import { useCreatePlug, useUpdatePlug, useGetPlugById } from "@/api/plug";
import { useGetUnassignedDevices } from "@/api/device";
import { DUMMY_PLUGS } from "./views/list-view";

interface FormValues {
  name: string;
  arabicName?: string;
  serialNumber: string;
  SSID?: string;
  wifiPassword?: string;
  device1?: string;
  device2?: string;
  device3?: string;
  device4?: string;
}

export function PlugNewEditView() {
  const router = useRouter();
  const { plugId } = useLocalSearchParams<{ plugId?: string }>();
  const theme = useTheme();
  const { t, i18n } = useTranslation();
  const isArabic = i18n.language?.startsWith("ar") ?? false;

  // Fetch plug details if in edit mode
  const { data: fetchedPlug } = useGetPlugById(plugId);

  const existingPlug =
    fetchedPlug ||
    (plugId
      ? DUMMY_PLUGS.find((p) => p._id === plugId || p.id === plugId)
      : undefined);

  const isEdit = Boolean(existingPlug || plugId);

  // Success Snackbar state
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string }>({
    open: false,
    message: "",
  });

  const [showWifiPassword, setShowWifiPassword] = useState(false);

  // Error confirmation modal hook
  const { showConfirmation, confirmationProps } = useConfirmationMessage();

  // TanStack Query mutation hooks
  const createPlugMutation = useCreatePlug();
  const updatePlugMutation = useUpdatePlug();

  // Fetch unassigned devices from backend (same hook & endpoint as next-project)
  const { data: availableDevices = [], isLoading: isLoadingDevices } =
    useGetUnassignedDevices(
      plugId ||
        (existingPlug ? existingPlug._id || existingPlug.id : undefined),
    );

  // Localized Yup validation schema
  const validationSchema = Yup.object().shape({
    name: Yup.string()
      .trim()
      .required(
        t("COMMON_VALIDATIONS.REQUIRED_FIELD", { field: t("ENGLISH_NAME") }),
      ),
    arabicName: Yup.string().trim().nullable().optional(),
    serialNumber: Yup.string()
      .trim()
      .required(
        t("COMMON_VALIDATIONS.REQUIRED_FIELD", { field: t("SERIAL_NUMBER") }),
      ),
    SSID: Yup.string().trim().nullable().optional(),
    wifiPassword: Yup.string().nullable().optional(),
    device1: Yup.string().nullable().optional(),
    device2: Yup.string().nullable().optional(),
    device3: Yup.string().nullable().optional(),
    device4: Yup.string().nullable().optional(),
  });

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: yupResolver(validationSchema) as any,
    defaultValues: {
      name: existingPlug?.name || existingPlug?.nameEn || "",
      arabicName: existingPlug?.arabicName || existingPlug?.nameAr || "",
      serialNumber: existingPlug?.serialNumber || "",
      SSID: existingPlug?.SSID || "",
      wifiPassword: existingPlug?.wifiPassword || "",
      device1: "",
      device2: "",
      device3: "",
      device4: "",
    },
  });

  // Re-populate when fetchedPlug is loaded
  React.useEffect(() => {
    if (fetchedPlug) {
      reset({
        name: fetchedPlug.name || fetchedPlug.nameEn || "",
        arabicName: fetchedPlug.arabicName || fetchedPlug.nameAr || "",
        serialNumber: fetchedPlug.serialNumber || "",
        SSID: fetchedPlug.SSID || "",
        wifiPassword: fetchedPlug.wifiPassword || "",
        device1: "",
        device2: "",
        device3: "",
        device4: "",
      });
    }
  }, [fetchedPlug, reset]);

  const onSubmit = async (data: FormValues) => {
    try {
      if (isEdit && plugId) {
        await updatePlugMutation.mutateAsync({
          id: plugId,
          payload: {
            name: data.name.trim(),
            arabicName: data.arabicName?.trim() || undefined,
            serialNumber: data.serialNumber.trim(),
            SSID: data.SSID?.trim() || undefined,
            wifiPassword: data.wifiPassword || undefined,
            device1: data.device1 || undefined,
            device2: data.device2 || undefined,
            device3: data.device3 || undefined,
            device4: data.device4 || undefined,
          },
        });

        setSnackbar({
          open: true,
          message: isArabic
            ? "تم تحديث المشترك بنجاح"
            : "Plug was updated successfully",
        });

        setTimeout(() => {
          router.back();
        }, 1200);
      } else {
        const newPlug = await createPlugMutation.mutateAsync({
          name: data.name.trim(),
          arabicName: data.arabicName?.trim() || undefined,
          serialNumber: data.serialNumber.trim(),
          SSID: data.SSID?.trim() || undefined,
          wifiPassword: data.wifiPassword || undefined,
          device1: data.device1 || undefined,
          device2: data.device2 || undefined,
          device3: data.device3 || undefined,
          device4: data.device4 || undefined,
        });

        // Show success notistack/snackbar
        setSnackbar({
          open: true,
          message: t(
            "PLUG_CREATED_SUCCESSFULLY",
            "Plug was created successfully",
          ),
        });

        // Dismiss bottom sheet and proceed to activation immediately
        setTimeout(() => {
          router.replace({
            pathname: `/(tabs)/plugs/activate/${newPlug?._id}`,
            params: {
              autoStart: "true",
              serialNumber: data.serialNumber.trim(),
              ssid: data.SSID?.trim() || "",
              password: data.wifiPassword || "",
            },
          } as any);
        }, 800);
      }
    } catch (error: any) {
      // Show confirmation message with error without closing form
      showConfirmation({
        variant: "Error",
        title: t("ERROR_OCCURRED"),
        subtitle: error?.message || t("FAILED_TO_SAVE_PLUG"),
        confirmText: t("OK"),
      });
    }
  };

  const isBusy =
    isSubmitting ||
    createPlugMutation.isPending ||
    updatePlugMutation.isPending;

  return (
    <KeyboardAvoidingView
      style={styles.keyboardAvoid}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ThemedView
        style={[styles.container, { backgroundColor: theme.background }]}
      >
        {/* Notistack Success Toast */}
        <Snackbar
          open={snackbar.open}
          message={snackbar.message}
          variant="success"
          autoHideDuration={2500}
          onClose={() => setSnackbar({ open: false, message: "" })}
        />

        {/* Error Confirmation Dialog */}
        <ConfirmationMessage {...confirmationProps} />

        {/* Top Sheet Handle */}
        <View style={styles.handleContainer}>
          <View
            style={[
              styles.handleBar,
              {
                backgroundColor: theme.textSecondary
                  ? `${theme.textSecondary}40`
                  : "#D1D5DB",
              },
            ]}
          />
        </View>

        {/* Sheet Header */}
        <View style={styles.header}>
          <View style={styles.headerTitleWrapper}>
            <ThemedText
              style={[styles.title, getAppFont("700", i18n.language)]}
            >
              {isEdit ? t("EDIT_PLUG") : t("NEW_PLUG")}
            </ThemedText>
            <ThemedText
              style={[styles.subtitle, { color: theme.textSecondary }]}
            >
              {isEdit
                ? isArabic
                  ? "تعديل تفاصيل المشترك الذكي"
                  : "Update smart power strip settings"
                : isArabic
                  ? "إضافة مشترك طاقة ذكي جديد للنظام"
                  : "Add a new smart power strip to your network"}
            </ThemedText>
          </View>
          <TouchableOpacity
            style={[
              styles.closeButton,
              { backgroundColor: `${theme.textSecondary}18` },
            ]}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <Lucide name="x" size={20} color={theme.text} />
          </TouchableOpacity>
        </View>

        {/* Form Body */}
        <ScrollView
          style={styles.scrollArea}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          nestedScrollEnabled={true}
          bounces={false}
          overScrollMode="never"
        >
          {/* English Name Field */}
          <View style={styles.fieldGroup}>
            <ThemedText style={[styles.label, { color: theme.text }]}>
              {t("ENGLISH_NAME")}
            </ThemedText>
            <Controller
              control={control}
              name="name"
              render={({ field: { onChange, onBlur, value } }) => (
                <View
                  style={[
                    styles.inputWrapper,
                    {
                      backgroundColor: theme.backgroundElement || "#F3F4F6",
                      borderColor: errors.name
                        ? "#DC2626"
                        : `${theme.textSecondary}25`,
                    },
                  ]}
                >
                  <Lucide name="plug" size={18} color={theme.textSecondary} />
                  <TextInput
                    style={[
                      styles.input,
                      {
                        color: theme.text,
                        textAlign: isArabic ? "right" : "left",
                      },
                    ]}
                    placeholder={
                      isArabic
                        ? "مثال: Living Room Strip"
                        : "e.g. Living Room Strip"
                    }
                    placeholderTextColor={`${theme.textSecondary}80`}
                    value={value}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    autoCapitalize="words"
                    editable={!isBusy}
                  />
                </View>
              )}
            />
            {errors.name ? (
              <ThemedText style={styles.errorText}>
                {errors.name.message}
              </ThemedText>
            ) : null}
          </View>

          {/* Arabic Name Field */}
          <View style={styles.fieldGroup}>
            <ThemedText style={[styles.label, { color: theme.text }]}>
              {t("ARABIC_NAME")}
            </ThemedText>
            <Controller
              control={control}
              name="arabicName"
              render={({ field: { onChange, onBlur, value } }) => (
                <View
                  style={[
                    styles.inputWrapper,
                    {
                      backgroundColor: theme.backgroundElement || "#F3F4F6",
                      borderColor: errors.arabicName
                        ? "#DC2626"
                        : `${theme.textSecondary}25`,
                    },
                  ]}
                >
                  <Lucide name="type" size={18} color={theme.textSecondary} />
                  <TextInput
                    style={[
                      styles.input,
                      {
                        color: theme.text,
                        textAlign: isArabic ? "right" : "left",
                      },
                    ]}
                    placeholder={t("PLUG_NAME_PLACEHOLDER")}
                    placeholderTextColor={`${theme.textSecondary}80`}
                    value={value || ""}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    editable={!isBusy}
                  />
                </View>
              )}
            />
            {errors.arabicName ? (
              <ThemedText style={styles.errorText}>
                {errors.arabicName.message}
              </ThemedText>
            ) : null}
          </View>

          {/* Serial Number Field */}
          <View style={styles.fieldGroup}>
            <ThemedText style={[styles.label, { color: theme.text }]}>
              {t("SERIAL_NUMBER")}
            </ThemedText>
            <Controller
              control={control}
              name="serialNumber"
              render={({ field: { onChange, onBlur, value } }) => (
                <View
                  style={[
                    styles.inputWrapper,
                    {
                      backgroundColor: theme.backgroundElement || "#F3F4F6",
                      borderColor: errors.serialNumber
                        ? "#DC2626"
                        : `${theme.textSecondary}25`,
                    },
                  ]}
                >
                  <Lucide name="hash" size={18} color={theme.textSecondary} />
                  <TextInput
                    style={[
                      styles.input,
                      {
                        color: theme.text,
                        textAlign: isArabic ? "right" : "left",
                      },
                    ]}
                    placeholder="SPK-PLG-00123"
                    placeholderTextColor={`${theme.textSecondary}80`}
                    value={value}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    autoCapitalize="characters"
                    editable={!isBusy}
                  />
                </View>
              )}
            />
            {errors.serialNumber ? (
              <ThemedText style={styles.errorText}>
                {errors.serialNumber.message}
              </ThemedText>
            ) : (
              <ThemedText
                style={[styles.helperText, { color: theme.textSecondary }]}
              >
                {t("SERIAL_NUMBER_HELPER")}
              </ThemedText>
            )}
          </View>

          {/* Section Divider: Wi-Fi Settings */}
          <View style={styles.devicesSectionHeader}>
            <Lucide name="wifi" size={18} color={theme.primary} />
            <ThemedText style={[styles.sectionTitle, { color: theme.text }]}>
              {t("WIFI_CONFIG_TITLE")}
            </ThemedText>
          </View>

          {/* Wi-Fi SSID Field */}
          <View style={styles.fieldGroup}>
            <ThemedText style={[styles.label, { color: theme.text }]}>
              {t("WIFI_SSID_LABEL")}
            </ThemedText>
            <Controller
              control={control}
              name="SSID"
              render={({ field: { onChange, onBlur, value } }) => (
                <View
                  style={[
                    styles.inputWrapper,
                    {
                      backgroundColor: theme.backgroundElement || "#F3F4F6",
                      borderColor: `${theme.textSecondary}25`,
                    },
                  ]}
                >
                  <Lucide name="wifi" size={18} color={theme.textSecondary} />
                  <TextInput
                    style={[
                      styles.input,
                      {
                        color: theme.text,
                        textAlign: isArabic ? "right" : "left",
                      },
                    ]}
                    placeholder={t("WIFI_SSID_PLACEHOLDER")}
                    placeholderTextColor={`${theme.textSecondary}80`}
                    value={value || ""}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    editable={!isBusy}
                  />
                </View>
              )}
            />
          </View>

          {/* Wi-Fi Password Field */}
          <View style={styles.fieldGroup}>
            <ThemedText style={[styles.label, { color: theme.text }]}>
              {t("WIFI_PASSWORD_LABEL")}
            </ThemedText>
            <Controller
              control={control}
              name="wifiPassword"
              render={({ field: { onChange, onBlur, value } }) => (
                <View
                  style={[
                    styles.inputWrapper,
                    {
                      backgroundColor: theme.backgroundElement || "#F3F4F6",
                      borderColor: `${theme.textSecondary}25`,
                    },
                  ]}
                >
                  <Lucide name="lock" size={18} color={theme.textSecondary} />
                  <TextInput
                    style={[
                      styles.input,
                      {
                        color: theme.text,
                        textAlign: isArabic ? "right" : "left",
                      },
                    ]}
                    placeholder={t("PASSWORD")}
                    placeholderTextColor={`${theme.textSecondary}80`}
                    value={value || ""}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    secureTextEntry={!showWifiPassword}
                    editable={!isBusy}
                  />
                  <TouchableOpacity
                    onPress={() => setShowWifiPassword((p) => !p)}
                    hitSlop={8}
                    style={{ paddingHorizontal: 4 }}
                  >
                    <Lucide
                      name={showWifiPassword ? "eye-off" : "eye"}
                      size={18}
                      color={theme.textSecondary}
                    />
                  </TouchableOpacity>
                </View>
              )}
            />
          </View>

          {/* Section Divider */}
          <View style={styles.devicesSectionHeader}>
            <Lucide name="cpu" size={18} color={theme.primary} />
            <ThemedText style={[styles.sectionTitle, { color: theme.text }]}>
              {t("DEVICES", "Connected Devices")}
            </ThemedText>
          </View>

          {/* Device Comboboxes (4 outlets) using the Generic Combobox */}
          {([1, 2, 3, 4] as const).map((port) => (
            <Controller
              key={`device${port}`}
              control={control}
              name={`device${port}`}
              render={({ field: { onChange, value } }) => (
                <Combobox
                  label={t(`DEVICE_${port}`, `Device ${port}`)}
                  value={value}
                  onChange={onChange}
                  options={availableDevices}
                  getOptionValue={(device) => device._id}
                  getOptionLabel={(device) =>
                    isArabic
                      ? device.nameAr || device.nameEn
                      : device.nameEn || device.nameAr || ""
                  }
                  leadIcon="server"
                  placeholder={t("SELECT_DEVICE")}
                  searchPlaceholder={t("SEARCH_DEVICE")}
                  emptyLabel={t("UNASSIGNED")}
                  emptyResultsText={t("NO_DEVICES_MATCH")}
                  disabled={isBusy}
                />
              )}
            />
          ))}
        </ScrollView>

        {/* Footer Actions */}
        <View
          style={[
            styles.footer,
            {
              borderTopColor: `${theme.textSecondary}20`,
              backgroundColor: theme.background,
            },
          ]}
        >
          <Button
            variant="outlined"
            onPress={() => router.back()}
            disabled={isBusy}
            style={styles.cancelButton}
          >
            <ThemedText style={styles.cancelButtonText}>
              {t("CANCEL")}
            </ThemedText>
          </Button>

          <Button
            color="primary"
            onPress={handleSubmit(onSubmit)}
            disabled={isBusy}
            style={styles.submitButton}
          >
            <ThemedText style={styles.submitButtonText}>
              {isBusy ? "..." : t("SAVE")}
            </ThemedText>
          </Button>
        </View>
      </ThemedView>
    </KeyboardAvoidingView>
  );
}

export default PlugNewEditView;

const styles = StyleSheet.create({
  keyboardAvoid: {
    flex: 1,
    width: "100%",
  },
  container: {
    flex: 1,
    width: "100%",
    paddingTop: 8,
  },
  handleContainer: {
    alignItems: "center",
    paddingVertical: 8,
  },
  handleBar: {
    width: 44,
    height: 5,
    borderRadius: 3,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  headerTitleWrapper: {
    flex: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
  },
  subtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  closeButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 12,
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    gap: 16,
  },
  fieldGroup: {
    gap: 6,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 12,
    height: 48,
    gap: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    paddingVertical: 0,
  },
  helperText: {
    fontSize: 12,
    marginTop: 2,
    paddingHorizontal: 4,
  },
  errorText: {
    fontSize: 12,
    color: "#DC2626",
    marginTop: 2,
    paddingHorizontal: 4,
    fontWeight: "500",
  },
  devicesSectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 8,
    marginBottom: -4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
  },
  footer: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  cancelButton: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: "600",
  },
  submitButton: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  submitButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
  },
});
