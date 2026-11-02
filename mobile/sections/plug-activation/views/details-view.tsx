import React, { useState, useEffect } from "react";
import {
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Platform,
  StyleSheet,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Image } from "expo-image";
import Lucide from "@react-native-vector-icons/lucide";
import { useTheme } from "@/hooks/use-theme";
import { RippleEffect, Button, Snackbar } from "@/components/ui";
import ThemedText from "@/components/themed-text";
import ActivationStepper from "../activation-stepper";
import { useActivateStrip } from "@/hooks/use-activate-strip";
import { useGetPlugById, useTogglePlugOutlet } from "@/api/plug";
import { DEFAULT_SERVER_HOST } from "@/constants/api";
import { getAppFont } from "@/constants/fonts";
import { useTranslation } from "react-i18next";

interface PlugActivationDetailsViewProps {
  onCancel?: () => void;
}

const PlugActivationDetailsView = ({
  onCancel,
}: PlugActivationDetailsViewProps) => {
  const theme = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{
    plugId?: string;
    autoStart?: string;
    serialNumber?: string;
    ssid?: string;
    password?: string;
  }>();
  const isDark = theme.isDark;
  const { t, i18n } = useTranslation();

  // Fetch plug info from backend if plugId is present
  const { data: plugData, isLoading: isLoadingPlug } = useGetPlugById(
    params.plugId,
  );

  // Form Inputs initialized with route params if navigated from creation
  const [serialNumber, setSerialNumber] = useState<string>(
    params.serialNumber || "",
  );
  const [wifiSsid, setWifiSsid] = useState<string>(params.ssid || "");
  const [wifiPassword, setWifiPassword] = useState<string>(
    params.password || "",
  );
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const autoStartedRef = React.useRef(false);

  // Hook 1: Exclusively for activating / reactivating a new or reset strip
  const {
    currentStep,
    stepIndex,
    isLoading: isActivating,
    isSuccess,
    isError,
    error,
    statusMessage,
    activatedStripIp,
    detectedSsid,
    detectedPhoneIp,
    activate,
    retry,
    cancel,
    reset,
  } = useActivateStrip();

  // Test outlet state & toggle mutation for post-activation test
  const [testOutletStates, setTestOutletStates] = useState<
    Record<number, boolean>
  >({
    1: false,
    2: false,
    3: false,
    4: false,
  });
  const toggleMutation = useTogglePlugOutlet();

  const handleToggleTestOutlet = async (outletNum: number) => {
    const next = !testOutletStates[outletNum];
    setTestOutletStates((prev) => ({ ...prev, [outletNum]: next }));
    const pId = params.plugId || plugData?._id;
    if (pId) {
      try {
        await toggleMutation.mutateAsync({
          plugId: pId,
          outlet: outletNum,
          state: next ? "on" : "off",
        });
      } catch (err) {
        console.warn("Toggle test failed:", err);
      }
    }
  };

  // Populate initial values once detected or loaded from backend via useGetPlugById
  useEffect(() => {
    if (plugData) {
      if (plugData.serialNumber && !serialNumber) {
        setSerialNumber(plugData.serialNumber);
      }
      if (plugData.SSID && !wifiSsid) {
        setWifiSsid(plugData.SSID);
      }
      if (plugData.wifiPassword && !wifiPassword) {
        setWifiPassword(plugData.wifiPassword);
      }
    }
  }, [plugData, serialNumber, wifiSsid, wifiPassword]);

  useEffect(() => {
    if (detectedSsid && !wifiSsid && !plugData?.SSID && !params.ssid) {
      setWifiSsid(detectedSsid);
    }
  }, [detectedSsid, wifiSsid, plugData?.SSID, params.ssid]);

  // Auto-start activation if navigated with autoStart=true or credentials are ready
  useEffect(() => {
    const effectiveSerial =
      serialNumber || params.serialNumber || plugData?.serialNumber || "";
    const effectiveSsid =
      wifiSsid || params.ssid || plugData?.SSID || detectedSsid || "";
    const effectivePass =
      wifiPassword || params.password || plugData?.wifiPassword || "";

    const shouldAutoStart =
      params.autoStart === "true" ||
      Boolean(params.serialNumber && params.ssid) ||
      Boolean(plugData?.serialNumber && plugData?.SSID);

    if (
      shouldAutoStart &&
      !autoStartedRef.current &&
      currentStep === "IDLE" &&
      effectiveSerial.trim() &&
      effectiveSsid.trim()
    ) {
      autoStartedRef.current = true;
      activate({
        serialNumber: effectiveSerial.trim(),
        homeSsid: effectiveSsid.trim(),
        homePassword: effectivePass.trim(),
        serverIp: DEFAULT_SERVER_HOST,
        plugId: params.plugId,
      });
    }
  }, [
    params.autoStart,
    params.serialNumber,
    params.ssid,
    params.password,
    params.plugId,
    plugData,
    serialNumber,
    wifiSsid,
    wifiPassword,
    currentStep,
    detectedSsid,
    detectedPhoneIp,
    activate,
  ]);

  const handleCancel = () => {
    cancel();
    if (onCancel) {
      onCancel();
    } else if (router.canGoBack()) {
      router.back();
    }
  };

  const handleStartActivation = async () => {
    if (!serialNumber.trim()) return;
    if (!wifiSsid.trim()) return;

    await activate({
      serialNumber: serialNumber.trim(),
      homeSsid: wifiSsid.trim(),
      homePassword: wifiPassword.trim(),
      serverIp: DEFAULT_SERVER_HOST,
      plugId: params.plugId,
    });
  };

  const isHotspotNotFound = currentStep === "HOTSPOT_NOT_FOUND";

  const stepMeta = [
    {
      title: t("PLUG_ACTIVATION.STEP_SCAN_TITLE"),
      subtitle: t("PLUG_ACTIVATION.STEP_SCAN_SUBTITLE"),
      icon: "radar",
    },
    {
      title: t("PLUG_ACTIVATION.STEP_CONNECT_TITLE"),
      subtitle: t("PLUG_ACTIVATION.STEP_CONNECT_SUBTITLE"),
      icon: "wifi",
    },
    {
      title: t("PLUG_ACTIVATION.STEP_SEND_TITLE"),
      subtitle: t("PLUG_ACTIVATION.STEP_SEND_SUBTITLE"),
      icon: "cloud-upload",
    },
    {
      title: t("PLUG_ACTIVATION.STEP_VERIFY_TITLE"),
      subtitle: t("PLUG_ACTIVATION.STEP_VERIFY_SUBTITLE"),
      icon: "settings",
    },
  ];

  const currentMeta = isHotspotNotFound
    ? {
        title: t("PLUG_ACTIVATION.NOT_FOUND_TITLE"),
        subtitle: t("PLUG_ACTIVATION.NOT_FOUND_SUBTITLE"),
        icon: "wifi-off",
      }
    : stepMeta[Math.min(stepIndex - 1, stepMeta.length - 1)];

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.background }}
      contentContainerStyle={{
        flexGrow: 1,
        justifyContent: "space-between",
        paddingBottom: 24,
      }}
      keyboardShouldPersistTaps="handled"
    >
      <View>
        {/* Stepper Header */}
        <ActivationStepper currentStep={stepIndex} />

        {/* Hero Visual Area */}
        <View
          style={{
            width: "100%",
            position: "relative",
            alignItems: "center",
            justifyContent: "center",
            paddingTop: 16,
            paddingBottom: 64,
          }}
        >
          <View
            style={{
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <RippleEffect
              size={isActivating ? 220 : 180}
              duration={isActivating ? 1400 : 2200}
            >
              <Lucide
                name={(currentMeta?.icon as any) || "wifi"}
                size={isActivating ? 110 : 90}
                color={
                  isError
                    ? "#EF4444"
                    : isHotspotNotFound
                      ? "#F59E0B"
                      : isSuccess
                        ? "#10B981"
                        : theme.primary
                }
              />
            </RippleEffect>
          </View>
          <Image
            source={require("@/assets/images/electric-strip.png")}
            contentFit="contain"
            style={{
              width: "92%",
              aspectRatio: 2048 / 600,
              position: "absolute",
              zIndex: 1,
              bottom: 0,
            }}
          />
        </View>

        {/* Step Title & Subtitle */}
        <View style={{ alignItems: "center", paddingHorizontal: 20 }}>
          <ThemedText type="smallBold" style={{ fontSize: 20, lineHeight: 28 }}>
            {stepIndex}. {currentMeta?.title}
          </ThemedText>
          <ThemedText
            style={{
              color: theme.textSecondary,
              textAlign: "center",
              maxWidth: "85%",
              lineHeight: 22,
              marginTop: 4,
            }}
          >
            {isHotspotNotFound
              ? t("PLUG_ACTIVATION.NOT_FOUND_SUBTITLE")
              : currentStep === "SCANNING_STRIP_WIFI"
                ? t("PLUG_ACTIVATION.SCANNING_FOR_STRIP", {
                    name: `TONLY_TAP_${(serialNumber || "").slice(-7)}`,
                  })
                : statusMessage || currentMeta?.subtitle}
          </ThemedText>
        </View>

        {/* ── CARD VARIANT 1: IDLE / FORM INPUT ── */}
        {currentStep === "IDLE" && (
          <View
            style={[
              styles.card,
              {
                backgroundColor: isDark ? "#1C1E22" : "#FFFFFF",
                borderColor: isDark ? "#2E3135" : "#E5E7EB",
              },
            ]}
          >
            {/* Serial Number Row */}
            <View style={{ gap: 6 }}>
              <ThemedText style={styles.label}>
                {t("PLUG_ACTIVATION.SERIAL_NUMBER_LABEL")}
              </ThemedText>
              <View
                style={[
                  styles.inputContainer,
                  {
                    backgroundColor: isDark ? "#141619" : "#F9FAFB",
                    borderColor: isDark ? "#2E3135" : "#E5E7EB",
                  },
                ]}
              >
                <Lucide name="hash" size={18} color={theme.textSecondary} />
                <TextInput
                  value={serialNumber}
                  onChangeText={setSerialNumber}
                  placeholder={t("PLUG_ACTIVATION.SERIAL_NUMBER_PLACEHOLDER")}
                  placeholderTextColor={isDark ? "#6B7280" : "#9CA3AF"}
                  autoCapitalize="characters"
                  style={[styles.input, { color: theme.text }]}
                />
              </View>
            </View>

            {/* Wi-Fi SSID Row */}
            <View style={{ gap: 6 }}>
              <ThemedText style={styles.label}>
                {t("PLUG_ACTIVATION.WIFI_SSID_LABEL")}
              </ThemedText>
              <View
                style={[
                  styles.inputContainer,
                  {
                    backgroundColor: isDark ? "#141619" : "#F9FAFB",
                    borderColor: isDark ? "#2E3135" : "#E5E7EB",
                  },
                ]}
              >
                <Lucide name="wifi" size={18} color={theme.primary} />
                <TextInput
                  value={wifiSsid}
                  onChangeText={setWifiSsid}
                  placeholder={t("PLUG_ACTIVATION.WIFI_SSID_PLACEHOLDER")}
                  placeholderTextColor={isDark ? "#6B7280" : "#9CA3AF"}
                  style={[styles.input, { color: theme.text }]}
                />
              </View>
            </View>

            {/* Wi-Fi Password Row */}
            <View style={{ gap: 6 }}>
              <ThemedText style={styles.label}>
                {t("PLUG_ACTIVATION.WIFI_PASSWORD_LABEL")}
              </ThemedText>
              <View
                style={[
                  styles.inputContainer,
                  {
                    backgroundColor: isDark ? "#141619" : "#F9FAFB",
                    borderColor: isDark ? "#2E3135" : "#E5E7EB",
                  },
                ]}
              >
                <Lucide name="lock" size={18} color={theme.primary} />
                <TextInput
                  value={wifiPassword}
                  onChangeText={setWifiPassword}
                  placeholder={t("PLUG_ACTIVATION.WIFI_PASSWORD_PLACEHOLDER")}
                  secureTextEntry={!showPassword}
                  placeholderTextColor={isDark ? "#6B7280" : "#9CA3AF"}
                  style={[styles.input, { color: theme.text }]}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword((p) => !p)}
                  hitSlop={8}
                >
                  <Lucide
                    name={showPassword ? "eye-off" : "eye"}
                    size={18}
                    color={theme.textSecondary}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Info Hint */}
            <View style={styles.hintBox}>
              <Lucide name="info" size={16} color="#3B82F6" />
              <ThemedText style={styles.hintText}>
                {t("PLUG_ACTIVATION.SETUP_HINT")}
              </ThemedText>
            </View>
          </View>
        )}

        {/* ── CARD VARIANT: HOTSPOT NOT FOUND / PAIRING MODE INSTRUCTIONS ── */}
        {isHotspotNotFound && (
          <View
            style={[
              styles.card,
              {
                backgroundColor: isDark ? "#291F0D" : "#FFFBEB",
                borderColor: isDark ? "#78350F" : "#FDE68A",
              },
            ]}
          >
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 10 }}
            >
              <View
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 19,
                  backgroundColor: isDark ? "#451A03" : "#FEF3C7",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Lucide name="wifi-off" size={20} color="#D97706" />
              </View>
              <View style={{ flex: 1 }}>
                <ThemedText
                  style={{
                    fontSize: 16,
                    fontWeight: "700",
                    color: isDark ? "#FBBF24" : "#B45309",
                  }}
                >
                  {t("PLUG_ACTIVATION.PAIRING_MODE_TITLE")}
                </ThemedText>
                <ThemedText
                  style={{
                    fontSize: 12,
                    color: isDark ? "#FCD34D" : "#92400E",
                    marginTop: 2,
                  }}
                >
                  {t("PLUG_ACTIVATION.NOT_FOUND_SUBTITLE")}
                </ThemedText>
              </View>
            </View>

            {/* Instruction Message Box */}
            <View
              style={[
                styles.hintBox,
                {
                  backgroundColor: isDark ? "#38240D" : "#FEF3C7",
                  borderColor: isDark ? "#92400E" : "#FCD34D",
                  borderWidth: 1,
                  gap: 12,
                  padding: 14,
                },
              ]}
            >
              <Lucide
                name="radio"
                size={22}
                color="#D97706"
                style={{ marginTop: 2 }}
              />
              <View style={{ flex: 1, gap: 6 }}>
                <ThemedText
                  style={{
                    fontSize: 14,
                    fontWeight: "600",
                    lineHeight: 22,
                    color: isDark ? "#FEF3C7" : "#78350F",
                  }}
                >
                  {t("PLUG_ACTIVATION.PAIRING_MODE_INSTRUCTION")}
                </ThemedText>
                <View style={{ gap: 4, marginTop: 4 }}>
                  <ThemedText
                    style={{
                      fontSize: 12,
                      color: isDark ? "#FCD34D" : "#92400E",
                    }}
                  >
                    1. {t("PLUG_ACTIVATION.STEP_1_INSTRUCTION")}
                  </ThemedText>
                  <ThemedText
                    style={{
                      fontSize: 12,
                      color: isDark ? "#FCD34D" : "#92400E",
                    }}
                  >
                    2. {t("PLUG_ACTIVATION.STEP_2_INSTRUCTION")}
                  </ThemedText>
                  <ThemedText
                    style={{
                      fontSize: 12,
                      color: isDark ? "#FCD34D" : "#92400E",
                    }}
                  >
                    3. {t("PLUG_ACTIVATION.STEP_3_INSTRUCTION")}
                  </ThemedText>
                </View>
              </View>
            </View>

            {/* Action Buttons */}
            <View style={{ flexDirection: "row", gap: 10, marginTop: 4 }}>
              <Button
                variant="outlined"
                color="inherit"
                onPress={reset}
                style={{ flex: 1, minHeight: 46 }}
              >
                {t("PLUG_ACTIVATION.EDIT_DETAILS")}
              </Button>
              <Button
                variant="contained"
                onPress={retry}
                style={{
                  flex: 1,
                  minHeight: 46,
                  backgroundColor: theme.primary,
                }}
              >
                {t("PLUG_ACTIVATION.RETRY")}
              </Button>
            </View>
          </View>
        )}

        {/* ── CARD VARIANT 2: IN-PROGRESS / ACTIVATING ── */}
        {isActivating && (
          <View
            style={[
              styles.card,
              {
                backgroundColor: isDark ? "#1C1E22" : "#FFFFFF",
                borderColor: isDark ? "#2E3135" : "#E5E7EB",
              },
            ]}
          >
            {/* Wi-Fi Network Info Row */}
            <View style={styles.infoRow}>
              <View style={styles.iconLabelGroup}>
                <Lucide name="wifi" size={20} color={theme.primary} />
                <ThemedText style={styles.infoLabel}>
                  {t("PLUG_ACTIVATION.WIFI_INFO_LABEL")}
                </ThemedText>
              </View>
              <View style={styles.valueGroup}>
                <ThemedText style={styles.infoValue}>
                  {wifiSsid || t("PLUG_ACTIVATION.DETERMINING_WIFI")}
                </ThemedText>
                {stepIndex > 2 ? (
                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: theme.primary },
                    ]}
                  >
                    <Lucide name="check" size={12} color="#FFFFFF" />
                  </View>
                ) : (
                  <ActivityIndicator size="small" color={theme.primary} />
                )}
              </View>
            </View>

            {/* Password Info Row */}
            <View style={styles.infoRow}>
              <View style={styles.iconLabelGroup}>
                <Lucide name="lock" size={20} color={theme.primary} />
                <ThemedText style={styles.infoLabel}>
                  {t("PLUG_ACTIVATION.PASSWORD_INFO_LABEL")}
                </ThemedText>
              </View>
              <View style={styles.valueGroup}>
                <ThemedText style={styles.passwordDots}>
                  {wifiPassword
                    ? "••••••••••"
                    : t("PLUG_ACTIVATION.NO_PASSWORD")}
                </ThemedText>
                {stepIndex > 3 ? (
                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: theme.primary },
                    ]}
                  >
                    <Lucide name="check" size={12} color="#FFFFFF" />
                  </View>
                ) : stepIndex === 3 ? (
                  <ActivityIndicator size="small" color={theme.primary} />
                ) : (
                  <Lucide name="clock" size={16} color={theme.textSecondary} />
                )}
              </View>
            </View>

            {/* Live Progress Banner */}
            <View
              style={[
                styles.progressBanner,
                {
                  backgroundColor: isDark
                    ? "rgba(5, 150, 105, 0.15)"
                    : "#E8F8F5",
                  borderColor: isDark
                    ? "rgba(5, 150, 105, 0.3)"
                    : "rgba(5, 150, 105, 0.15)",
                },
              ]}
            >
              <ThemedText
                style={{
                  fontSize: 14,
                  fontWeight: "600",
                  color: theme.primary,
                }}
              >
                {statusMessage || t("PLUG_ACTIVATION.CONFIGURING_PLUG")}
              </ThemedText>
              <ActivityIndicator size="small" color={theme.primary} />
            </View>
          </View>
        )}

        {/* ── CARD VARIANT 3: ERROR STATE ── */}
        {isError && (
          <View
            style={[
              styles.card,
              {
                backgroundColor: isDark ? "#2A1818" : "#FEF2F2",
                borderColor: isDark ? "#7F1D1D" : "#FCA5A5",
              },
            ]}
          >
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 10 }}
            >
              <Lucide name="alert-triangle" size={24} color="#EF4444" />
              <ThemedText
                style={{
                  fontSize: 16,
                  fontWeight: "700",
                  color: "#EF4444",
                }}
              >
                {t("PLUG_ACTIVATION.ACTIVATION_FAILED_TITLE")}
              </ThemedText>
            </View>

            <ThemedText
              style={{
                fontSize: 14,
                lineHeight: 22,
                color: isDark ? "#FCA5A5" : "#991B1B",
              }}
            >
              {error?.message || t("PLUG_ACTIVATION.ACTIVATION_FAILED_DEFAULT")}
            </ThemedText>

            {error?.recoveryHint && (
              <View
                style={[
                  styles.hintBox,
                  {
                    backgroundColor: isDark ? "#381E1E" : "#FEE2E2",
                    borderColor: isDark ? "#5C2626" : "#FECACA",
                  },
                ]}
              >
                <Lucide name="lightbulb" size={16} color="#B91C1C" />
                <ThemedText
                  style={[
                    styles.hintText,
                    { color: isDark ? "#F87171" : "#7F1D1D" },
                  ]}
                >
                  {error.recoveryHint}
                </ThemedText>
              </View>
            )}

            <View style={{ flexDirection: "row", gap: 10, marginTop: 6 }}>
              <Button
                variant="outlined"
                color="inherit"
                onPress={reset}
                style={{ flex: 1, minHeight: 46 }}
              >
                {t("PLUG_ACTIVATION.EDIT_DETAILS")}
              </Button>
              <Button
                variant="contained"
                onPress={retry}
                style={{
                  flex: 1,
                  minHeight: 46,
                  backgroundColor: theme.primary,
                }}
              >
                {t("PLUG_ACTIVATION.TRY_AGAIN")}
              </Button>
            </View>
          </View>
        )}

        {/* ── CARD VARIANT 4: SUCCESS STATE ── */}
        {isSuccess && (
          <View
            style={[
              styles.card,
              {
                backgroundColor: isDark ? "#122A1E" : "#F0FDF4",
                borderColor: isDark ? "#14532D" : "#BBF7D0",
              },
            ]}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 10 }}
              >
                <View
                  style={[
                    styles.statusBadge,
                    {
                      width: 28,
                      height: 28,
                      borderRadius: 14,
                      backgroundColor: "#10B981",
                    },
                  ]}
                >
                  <Lucide name="check" size={16} color="#FFFFFF" />
                </View>
                <ThemedText
                  style={{
                    fontSize: 16,
                    fontWeight: "700",
                    color: isDark ? "#34D399" : "#166534",
                  }}
                >
                  {t("PLUG_ACTIVATION.ACTIVATION_SUCCESS_TITLE")}
                </ThemedText>
              </View>

              {activatedStripIp && (
                <View
                  style={{
                    paddingHorizontal: 8,
                    paddingVertical: 4,
                    borderRadius: 6,
                    backgroundColor: isDark ? "#166534" : "#DCFCE7",
                  }}
                >
                  <ThemedText
                    style={{
                      fontSize: 12,
                      fontWeight: "700",
                      color: isDark ? "#A7F3D0" : "#15803D",
                    }}
                  >
                    {activatedStripIp.includes(".")
                      ? `IP: ${activatedStripIp}`
                      : t("PLUG_ACTIVATION.CONNECTED_CLOUD")}
                  </ThemedText>
                </View>
              )}
            </View>

            {/* Quick Status / Telemetry */}
            <ThemedText
              style={{
                fontSize: 13,
                color: isDark ? "#A7F3D0" : "#166534",
                lineHeight: 20,
              }}
            >
              {t("PLUG_ACTIVATION.ACTIVATION_SUCCESS_DESC")}
            </ThemedText>

            {/* Live Outlet Buttons Preview */}
            <View style={{ gap: 8, marginTop: 4 }}>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <ThemedText
                  style={{
                    fontSize: 13,
                    fontWeight: "600",
                    color: isDark ? "#D1FAE5" : "#065F46",
                  }}
                >
                  {t("PLUG_ACTIVATION.TEST_OUTLETS_LABEL")}
                </ThemedText>
              </View>

              <View style={{ flexDirection: "row", gap: 8 }}>
                {[1, 2, 3, 4].map((outletNum) => (
                  <TouchableOpacity
                    key={outletNum}
                    onPress={() => handleToggleTestOutlet(outletNum)}
                    activeOpacity={0.7}
                    style={{
                      flex: 1,
                      paddingVertical: 12,
                      alignItems: "center",
                      borderRadius: 10,
                      backgroundColor: testOutletStates[outletNum]
                        ? theme.primary
                        : isDark
                          ? "#1F382B"
                          : "#E2E8F0",
                    }}
                  >
                    <ThemedText
                      style={{
                        fontSize: 12,
                        fontWeight: "700",
                        color: testOutletStates[outletNum]
                          ? "#FFFFFF"
                          : theme.textSecondary,
                      }}
                    >
                      {t("PLUG_ACTIVATION.OUTLET_N", { num: outletNum })}
                    </ThemedText>
                    <ThemedText
                      style={{
                        fontSize: 10,
                        fontWeight: "600",
                        marginTop: 2,
                        color: testOutletStates[outletNum]
                          ? "rgba(255,255,255,0.8)"
                          : theme.textSecondary,
                      }}
                    >
                      {testOutletStates[outletNum]
                        ? t("PLUG_ACTIVATION.OUTLET_ACTIVE")
                        : t("PLUG_ACTIVATION.OUTLET_INACTIVE")}
                    </ThemedText>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        )}
      </View>

      {/* ── BOTTOM ACTION BUTTONS ── */}
      <View
        style={{
          paddingHorizontal: 16,
          paddingTop: 24,
          gap: 12,
        }}
      >
        {currentStep === "IDLE" && (
          <Button
            variant="contained"
            fullWidth
            borderRadius={9999}
            onPress={handleStartActivation}
            disabled={!serialNumber.trim() || !wifiSsid.trim()}
            style={{
              minHeight: 52,
              backgroundColor: theme.primary,
            }}
            textStyle={{
              fontSize: 16,
              fontWeight: "700",
              color: "#FFFFFF",
            }}
          >
            {t("PLUG_ACTIVATION.START_ACTIVATION")}
          </Button>
        )}

        {isHotspotNotFound && (
          <Button
            variant="contained"
            fullWidth
            borderRadius={9999}
            onPress={retry}
            style={{
              minHeight: 52,
              backgroundColor: theme.primary,
            }}
            textStyle={{
              fontSize: 16,
              fontWeight: "700",
              color: "#FFFFFF",
            }}
          >
            {t("PLUG_ACTIVATION.RETRY")}
          </Button>
        )}

        {isSuccess && (
          <Button
            variant="contained"
            fullWidth
            borderRadius={9999}
            onPress={() => router.replace("/(tabs)/plugs")}
            style={{
              minHeight: 52,
              backgroundColor: theme.primary,
            }}
            textStyle={{
              fontSize: 16,
              fontWeight: "700",
              color: "#FFFFFF",
            }}
          >
            {t("PLUG_ACTIVATION.COMPLETE_AND_GO_TO_PLUGS")}
          </Button>
        )}

        {/* Cancel Button */}
        <Button
          variant="outlined"
          color="inherit"
          fullWidth
          borderRadius={9999}
          onPress={handleCancel}
          style={{
            minHeight: 52,
            borderWidth: 1,
            borderColor: isDark ? "#2E3135" : "#E2E8F0",
            backgroundColor: isDark ? "#1C1E22" : "#FFFFFF",
          }}
          textStyle={{
            fontSize: 16,
            fontWeight: "600",
            color: theme.textSecondary,
          }}
        >
          {isSuccess ? t("PLUG_ACTIVATION.CLOSE") : t("PLUG_ACTIVATION.CANCEL")}
        </Button>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  card: {
    marginTop: 20,
    marginHorizontal: 16,
    paddingVertical: 18,
    paddingHorizontal: 18,
    borderRadius: 16,
    borderWidth: 1,
    gap: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
    gap: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    paddingVertical: 0,
  },
  hintBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    padding: 10,
    borderRadius: 10,
    backgroundColor: "rgba(59, 130, 246, 0.08)",
  },
  hintText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
    color: "#2563EB",
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  iconLabelGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  infoLabel: {
    fontSize: 15,
    fontWeight: "500",
    color: "#6B7280",
  },
  valueGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  infoValue: {
    fontSize: 15,
    fontWeight: "700",
  },
  passwordDots: {
    fontSize: 16,
    letterSpacing: 2,
    fontWeight: "700",
  },
  statusBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  progressBanner: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
});

export default PlugActivationDetailsView;
