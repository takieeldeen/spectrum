import React, { useState, useMemo } from "react";
import {
  View,
  TextInput,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Modal,
  Pressable,
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
import { useGetWifiList, useCreateWifi } from "@/api/wifi";

interface FormValues {
  name: string;
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
  const styles = createStyles(theme);
  const { t, i18n } = useTranslation();
  const isArabic = i18n.language?.startsWith("ar") ?? false;

  // Fetch plug details if in edit mode
  const { data: fetchedPlug } = useGetPlugById(plugId);
  const existingPlug = fetchedPlug;
  const isEdit = Boolean(existingPlug || plugId);

  // Success Snackbar state
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string }>({
    open: false,
    message: "",
  });

  // Error confirmation modal hook
  const { showConfirmation, confirmationProps } = useConfirmationMessage();

  // TanStack Query mutations
  const createPlugMutation = useCreatePlug();
  const updatePlugMutation = useUpdatePlug();
  const createWifiMutation = useCreateWifi();

  // Fetch saved Wi-Fi networks (rule: don't rename data to plural of entity name)
  const { data: wifiList = [], isLoading: isLoadingWifi } = useGetWifiList();
  console.log(wifiList, "WIFI LIST");
  // Add Wi-Fi modal state
  const [isWifiModalOpen, setIsWifiModalOpen] = useState(false);
  const [newWifiSsid, setNewWifiSsid] = useState("");
  const [newWifiPassword, setNewWifiPassword] = useState("");
  const [showNewWifiPassword, setShowNewWifiPassword] = useState(false);
  const [wifiModalError, setWifiModalError] = useState("");
  const [isSavingWifi, setIsSavingWifi] = useState(false);

  // Fetch unassigned devices from backend
  const { data: availableDevices = [], isLoading: isLoadingDevices } =
    useGetUnassignedDevices(
      plugId || (existingPlug ? existingPlug._id : undefined),
    );

  // State tracking assigned devices across outlets for dynamic filtering WITHOUT useEffect
  const [selectedDevices, setSelectedDevices] = useState<
    Record<number, string>
  >({
    1: existingPlug?.device1 || "",
    2: existingPlug?.device2 || "",
    3: existingPlug?.device3 || "",
    4: existingPlug?.device4 || "",
  });

  // Localized Yup validation schema
  const validationSchema = Yup.object().shape({
    name: Yup.string()
      .trim()
      .required(
        t("COMMON_VALIDATIONS.REQUIRED_FIELD", { field: t("PLUG_NAME") }),
      ),
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

  const defaultValues = useMemo<FormValues>(
    () => ({
      name: isEdit ? existingPlug?.name || existingPlug?.nameEn || "" : "",
      serialNumber: isEdit ? existingPlug?.serialNumber || "" : "",
      SSID: isEdit ? existingPlug?.SSID || "" : "",
      wifiPassword: isEdit ? existingPlug?.wifiPassword || "" : "",
      device1: isEdit ? existingPlug?.device1 || "" : "",
      device2: isEdit ? existingPlug?.device2 || "" : "",
      device3: isEdit ? existingPlug?.device3 || "" : "",
      device4: isEdit ? existingPlug?.device4 || "" : "",
    }),
    [existingPlug, isEdit],
  );

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: yupResolver(validationSchema) as any,
    defaultValues,
  });

  // Re-populate when fetchedPlug is loaded in edit mode per form rule
  React.useEffect(() => {
    if (fetchedPlug) {
      const populatedValues: FormValues = {
        name: fetchedPlug.name || fetchedPlug.nameEn || "",
        serialNumber: fetchedPlug.serialNumber || "",
        SSID: fetchedPlug.SSID || "",
        wifiPassword: fetchedPlug.wifiPassword || "",
        device1: fetchedPlug.device1 || "",
        device2: fetchedPlug.device2 || "",
        device3: fetchedPlug.device3 || "",
        device4: fetchedPlug.device4 || "",
      };
      reset(populatedValues);
      setSelectedDevices({
        1: fetchedPlug.device1 || "",
        2: fetchedPlug.device2 || "",
        3: fetchedPlug.device3 || "",
        4: fetchedPlug.device4 || "",
      });
    }
  }, [fetchedPlug, reset]);

  // Handler for device selection change on an outlet port (NO useEffect used)
  const handleOutletDeviceChange = (
    port: number,
    selectedId: string | undefined,
    fieldOnChange: (val: string | undefined) => void,
  ) => {
    fieldOnChange(selectedId);
    setSelectedDevices((prev) => ({
      ...prev,
      [port]: selectedId || "",
    }));
  };

  // Filter available devices for a given port so other outlets' selected devices are excluded
  const getFilteredDevicesForPort = (port: number) => {
    const otherSelectedIds = Object.entries(selectedDevices)
      .filter(([p]) => Number(p) !== port)
      .map(([_, id]) => id)
      .filter(Boolean);
    return availableDevices.filter(
      (device) => !otherSelectedIds.includes(device._id),
    );
  };

  // Handler to save new Wi-Fi credentials from dialog
  const handleSaveNewWifi = async () => {
    if (!newWifiSsid.trim()) {
      setWifiModalError(
        t("COMMON_VALIDATIONS.REQUIRED_FIELD", { field: t("SSID_NAME") }),
      );
      return;
    }
    if (!newWifiPassword) {
      setWifiModalError(
        t("COMMON_VALIDATIONS.REQUIRED_FIELD", { field: t("SSID_PASSWORD") }),
      );
      return;
    }

    try {
      setIsSavingWifi(true);
      setWifiModalError("");

      const created = await createWifiMutation.mutateAsync({
        ssid: newWifiSsid.trim(),
        password: newWifiPassword,
      });

      // Automatically select the new Wi-Fi network in the form
      setValue("SSID", created.ssid);
      setValue("wifiPassword", newWifiPassword);

      setIsWifiModalOpen(false);
      setNewWifiSsid("");
      setNewWifiPassword("");

      setSnackbar({
        open: true,
        message: t("WIFI_ADDED_SUCCESS"),
      });
    } catch (err: any) {
      setWifiModalError(err?.message || "Failed to save Wi-Fi network");
    } finally {
      setIsSavingWifi(false);
    }
  };

  const onSubmit = async (data: FormValues) => {
    try {
      if (isEdit && plugId) {
        await updatePlugMutation.mutateAsync({
          id: plugId,
          payload: {
            name: data.name.trim(),
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
          message: t("PLUG_UPDATED_SUCCESSFULLY"),
        });

        setTimeout(() => {
          router.back();
        }, 1200);
      } else {
        const newPlug = await createPlugMutation.mutateAsync({
          name: data.name.trim(),
          serialNumber: data.serialNumber.trim(),
          SSID: data.SSID?.trim() || undefined,
          wifiPassword: data.wifiPassword || undefined,
          device1: data.device1 || undefined,
          device2: data.device2 || undefined,
          device3: data.device3 || undefined,
          device4: data.device4 || undefined,
        });

        setSnackbar({
          open: true,
          message: t(
            "PLUG_CREATED_SUCCESSFULLY",
            "Plug was created successfully",
          ),
        });

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
          <View style={styles.handleBar} />
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
              {isEdit ? t("EDIT_PLUG_SUBTITLE") : t("NEW_PLUG_SUBTITLE")}
            </ThemedText>
          </View>
          <TouchableOpacity
            style={styles.closeButton}
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
          {/* Plug Name Field */}
          <View style={styles.fieldGroup}>
            <ThemedText style={[styles.label, { color: theme.text }]}>
              {t("PLUG_NAME")}
            </ThemedText>
            <Controller
              control={control}
              name="name"
              render={({ field: { onChange, onBlur, value } }) => (
                <View
                  style={[
                    styles.inputWrapper,
                    {
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
                    placeholder={t("PLUG_NAME_PLACEHOLDER")}
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

          {/* Section Header: Wi-Fi Configuration */}
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionHeaderTitleGroup}>
              <Lucide name="wifi" size={18} color={theme.primary} />
              <ThemedText style={[styles.sectionTitle, { color: theme.text }]}>
                {t("WIFI_CONFIG_TITLE")}
              </ThemedText>
            </View>

            <TouchableOpacity
              style={styles.addWifiHeaderBtn}
              onPress={() => {
                setWifiModalError("");
                setIsWifiModalOpen(true);
              }}
              activeOpacity={0.7}
            >
              <Lucide name="plus" size={15} color={theme.primary} />
              <ThemedText
                style={[styles.addWifiHeaderText, { color: theme.primary }]}
              >
                {t("ADD_WIFI_NETWORK")}
              </ThemedText>
            </TouchableOpacity>
          </View>

          {/* Wi-Fi Autocomplete Combobox */}
          <Controller
            control={control}
            name="SSID"
            render={({ field: { onChange, value } }) => (
              <View style={styles.fieldGroup}>
                <Combobox
                  label={t("WIFI_SSID_LABEL")}
                  value={value}
                  onChange={(val) => {
                    onChange(val);
                    const selected = wifiList.find((wifi) => wifi.ssid === val);
                    if (selected?.password) {
                      setValue("wifiPassword", selected.password);
                    }
                  }}
                  options={wifiList}
                  getOptionValue={(wifi) => wifi.ssid}
                  getOptionLabel={(wifi) => wifi.ssid}
                  leadIcon="wifi"
                  placeholder={t("SELECT_WIFI")}
                  searchPlaceholder={t("SEARCH_WIFI")}
                  emptyLabel={t("NO_WIFI_MATCH")}
                  emptyResultsText={t("NO_WIFI_MATCH")}
                  disabled={isBusy || isLoadingWifi}
                />

                {wifiList.length === 0 && (
                  <View style={styles.emptyWifiPrompt}>
                    <ThemedText
                      style={[
                        styles.emptyWifiPromptText,
                        { color: theme.textSecondary },
                      ]}
                    >
                      {t("NO_WIFI_MATCH")}
                    </ThemedText>
                    <TouchableOpacity
                      style={styles.addWifiCtaButton}
                      onPress={() => {
                        setWifiModalError("");
                        setIsWifiModalOpen(true);
                      }}
                      activeOpacity={0.8}
                    >
                      <Lucide name="plus-circle" size={16} color="#FFFFFF" />
                      <ThemedText style={styles.addWifiCtaText}>
                        {t("ADD_WIFI_NETWORK")}
                      </ThemedText>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            )}
          />

          {/* Section Header: Connected Devices */}
          <View style={styles.devicesSectionHeader}>
            <Lucide name="cpu" size={18} color={theme.primary} />
            <ThemedText style={[styles.sectionTitle, { color: theme.text }]}>
              {t("DEVICES", "Connected Devices")}
            </ThemedText>
          </View>

          {/* Device Comboboxes (4 outlets) with dynamic filtering via onChange */}
          {([1, 2, 3, 4] as const).map((port) => (
            <Controller
              key={`device${port}`}
              control={control}
              name={`device${port}`}
              render={({ field: { onChange, value } }) => (
                <Combobox
                  label={t(`DEVICE_${port}`, `Device ${port}`)}
                  value={value}
                  onChange={(newVal) =>
                    handleOutletDeviceChange(port, newVal, onChange)
                  }
                  options={getFilteredDevicesForPort(port)}
                  getOptionValue={(device) => device._id}
                  getOptionLabel={(device) => device.name || ""}
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
        <View style={styles.footer}>
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

        {/* Add Wi-Fi Network Dialog Modal */}
        <Modal
          visible={isWifiModalOpen}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setIsWifiModalOpen(false)}
        >
          <Pressable
            style={styles.modalOverlay}
            onPress={() => setIsWifiModalOpen(false)}
          >
            <Pressable
              style={styles.modalCard}
              onPress={(e) => e.stopPropagation()}
            >
              <View style={styles.modalHeader}>
                <View style={styles.modalHeaderIconContainer}>
                  <Lucide name="wifi" size={20} color={theme.primary} />
                </View>
                <View style={styles.modalHeaderTextGroup}>
                  <ThemedText style={styles.modalTitle}>
                    {t("ADD_WIFI_TITLE")}
                  </ThemedText>
                  <ThemedText
                    style={[
                      styles.modalSubtitle,
                      { color: theme.textSecondary },
                    ]}
                  >
                    {t("ADD_WIFI_SUBTITLE")}
                  </ThemedText>
                </View>
                <TouchableOpacity
                  onPress={() => setIsWifiModalOpen(false)}
                  style={styles.modalCloseBtn}
                  hitSlop={8}
                >
                  <Lucide name="x" size={18} color={theme.textSecondary} />
                </TouchableOpacity>
              </View>

              {wifiModalError ? (
                <View style={styles.modalErrorContainer}>
                  <ThemedText style={styles.modalErrorText}>
                    {wifiModalError}
                  </ThemedText>
                </View>
              ) : null}

              {/* SSID Input */}
              <View style={styles.modalFieldGroup}>
                <ThemedText style={[styles.label, { color: theme.text }]}>
                  {t("SSID_NAME")}
                </ThemedText>
                <View style={styles.inputWrapper}>
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
                    value={newWifiSsid}
                    onChangeText={setNewWifiSsid}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>
              </View>

              {/* Password Input */}
              <View style={styles.modalFieldGroup}>
                <ThemedText style={[styles.label, { color: theme.text }]}>
                  {t("SSID_PASSWORD")}
                </ThemedText>
                <View style={styles.inputWrapper}>
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
                    value={newWifiPassword}
                    onChangeText={setNewWifiPassword}
                    secureTextEntry={!showNewWifiPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  <TouchableOpacity
                    onPress={() => setShowNewWifiPassword((prev) => !prev)}
                    hitSlop={8}
                  >
                    <Lucide
                      name={showNewWifiPassword ? "eye-off" : "eye"}
                      size={18}
                      color={theme.textSecondary}
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Modal Buttons */}
              <View style={styles.modalActions}>
                <Button
                  variant="outlined"
                  onPress={() => setIsWifiModalOpen(false)}
                  disabled={isSavingWifi}
                  style={styles.modalCancelBtn}
                >
                  <ThemedText style={styles.cancelButtonText}>
                    {t("CANCEL")}
                  </ThemedText>
                </Button>

                <Button
                  color="primary"
                  onPress={handleSaveNewWifi}
                  disabled={isSavingWifi}
                  style={styles.modalSaveBtn}
                >
                  <ThemedText style={styles.submitButtonText}>
                    {isSavingWifi ? "..." : t("SAVE")}
                  </ThemedText>
                </Button>
              </View>
            </Pressable>
          </Pressable>
        </Modal>
      </ThemedView>
    </KeyboardAvoidingView>
  );
}

const createStyles = (theme: ReturnType<typeof useTheme>) =>
  StyleSheet.create({
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
      backgroundColor: theme.textSecondary
        ? `${theme.textSecondary}40`
        : "#D1D5DB",
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
      backgroundColor: `${theme.textSecondary}18`,
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
      backgroundColor: theme.backgroundElement || "#F3F4F6",
      borderColor: `${theme.textSecondary}25`,
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
    sectionHeaderRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginTop: 10,
      marginBottom: 2,
    },
    sectionHeaderTitleGroup: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    addWifiHeaderBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      paddingVertical: 4,
      paddingHorizontal: 8,
      borderRadius: 8,
      backgroundColor: `${theme.primary}15`,
    },
    addWifiHeaderText: {
      fontSize: 13,
      fontWeight: "600",
    },
    emptyWifiPrompt: {
      alignItems: "center",
      justifyContent: "center",
      padding: 16,
      borderRadius: 12,
      borderWidth: 1,
      borderStyle: "dashed",
      borderColor: `${theme.textSecondary}40`,
      backgroundColor: `${theme.textSecondary}08`,
      gap: 10,
      marginTop: 6,
    },
    emptyWifiPromptText: {
      fontSize: 13,
    },
    addWifiCtaButton: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 10,
      backgroundColor: theme.primary,
    },
    addWifiCtaText: {
      color: "#FFFFFF",
      fontSize: 13,
      fontWeight: "600",
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
      borderTopColor: `${theme.textSecondary}20`,
      backgroundColor: theme.background,
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
    // Modal Dialog Styles
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.55)",
      justifyContent: "center",
      alignItems: "center",
      padding: 20,
    },
    modalCard: {
      width: "100%",
      maxWidth: 420,
      backgroundColor: theme.background,
      borderRadius: 20,
      padding: 20,
      gap: 16,
      borderWidth: 1,
      borderColor: `${theme.textSecondary}25`,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.25,
      shadowRadius: 16,
      elevation: 8,
    },
    modalHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    modalHeaderIconContainer: {
      width: 40,
      height: 40,
      borderRadius: 12,
      backgroundColor: `${theme.primary}18`,
      alignItems: "center",
      justifyContent: "center",
    },
    modalHeaderTextGroup: {
      flex: 1,
    },
    modalTitle: {
      fontSize: 17,
      fontWeight: "700",
    },
    modalSubtitle: {
      fontSize: 12,
      marginTop: 2,
    },
    modalCloseBtn: {
      padding: 4,
    },
    modalErrorContainer: {
      backgroundColor: "#FEF2F2",
      borderRadius: 8,
      padding: 10,
    },
    modalErrorText: {
      color: "#DC2626",
      fontSize: 13,
      fontWeight: "500",
    },
    modalFieldGroup: {
      gap: 6,
    },
    modalActions: {
      flexDirection: "row",
      gap: 10,
      marginTop: 8,
    },
    modalCancelBtn: {
      flex: 1,
      height: 44,
      borderRadius: 12,
    },
    modalSaveBtn: {
      flex: 1,
      height: 44,
      borderRadius: 12,
    },
  });

export default PlugNewEditView;
