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
import { usePairWithStrip } from "@/hooks/use-pair-with-strip";
import { useGetPlugById } from "@/api/plug";
import { DEFAULT_SERVER_HOST } from "@/constants/api";
import { getAppFont } from "@/constants/fonts";

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
  const isDark = theme.background === "#000000";

  // Fetch plug info from backend if plugId is present
  const { data: plugData, isLoading: isLoadingPlug } = useGetPlugById(
    params.plugId
  );

  // Form Inputs initialized with route params if navigated from creation
  const [serialNumber, setSerialNumber] = useState<string>(
    params.serialNumber || ""
  );
  const [wifiSsid, setWifiSsid] = useState<string>(params.ssid || "");
  const [wifiPassword, setWifiPassword] = useState<string>(
    params.password || ""
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

  // Hook 2: Exclusively for pairing, querying status on demand, and controlling outlets
  const {
    isConnected: isPaired,
    connectedStripIp,
    outletStates,
    telemetry,
    toggleOutlet,
    requestStatus,
  } = usePairWithStrip({
    autoStart: isSuccess,
    targetStripIp: activatedStripIp,
  });

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

  const stepMeta = [
    {
      title: "الاتصال بشبكة المشترك Wi-Fi",
      subtitle: "نقوم الآن بتغيير شبكة الـ Wi-Fi لديك إلى نقطة البث الخاصة بالمشترك",
      icon: "wifi",
    },
    {
      title: "إرسال بيانات الشبكة إلى الجهاز",
      subtitle: "جاري برمجة المشترك ببيانات شبكة المنزل عبر بروتوكول TCP",
      icon: "cloud-upload",
    },
    {
      title: "الاتصال بالمشترك والتحقق",
      subtitle: "جاري انتظار اتصال المشترك بشبكة المنزل والتحقق من الاستجابة",
      icon: "settings",
    },
  ];

  const currentMeta = stepMeta[Math.min(stepIndex - 1, stepMeta.length - 1)];

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
                name={(currentMeta.icon as any) || "wifi"}
                size={isActivating ? 110 : 90}
                color={
                  isError
                    ? "#EF4444"
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
            {stepIndex}. {currentMeta.title}
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
            {statusMessage || currentMeta.subtitle}
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
                الرقم التسلسلي للمشترك (Serial Number)
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
                  placeholder="2CFDB3C1DE06"
                  placeholderTextColor={isDark ? "#6B7280" : "#9CA3AF"}
                  autoCapitalize="characters"
                  style={[styles.input, { color: theme.text }]}
                />
              </View>
            </View>

            {/* Wi-Fi SSID Row */}
            <View style={{ gap: 6 }}>
              <ThemedText style={styles.label}>
                اسم شبكة Wi-Fi المنزلية (2.4GHz)
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
                  placeholder="اسم شبكة Wi-Fi"
                  placeholderTextColor={isDark ? "#6B7280" : "#9CA3AF"}
                  style={[styles.input, { color: theme.text }]}
                />
              </View>
            </View>

            {/* Wi-Fi Password Row */}
            <View style={{ gap: 6 }}>
              <ThemedText style={styles.label}>
                كلمة مرور شبكة الـ Wi-Fi
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
                  placeholder="كلمة المرور"
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
                تأكد من توصيل المشترك بالكهرباء وضغط الزر الرئيسي لـ 5 ثوانٍ حتى
                يومض المؤشر باللون الأزرق.
              </ThemedText>
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
                <ThemedText style={styles.infoLabel}>شبكة Wi-Fi</ThemedText>
              </View>
              <View style={styles.valueGroup}>
                <ThemedText style={styles.infoValue}>
                  {wifiSsid || "جاري التحديد..."}
                </ThemedText>
                {stepIndex > 1 ? (
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
                <ThemedText style={styles.infoLabel}>كلمة المرور</ThemedText>
              </View>
              <View style={styles.valueGroup}>
                <ThemedText style={styles.passwordDots}>
                  {wifiPassword ? "••••••••••" : "بدون كلمة مرور"}
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
                ) : stepIndex === 2 ? (
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
                {statusMessage || "جاري تهيئة المشترك..."}
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
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <Lucide name="alert-triangle" size={24} color="#EF4444" />
              <ThemedText
                style={{
                  fontSize: 16,
                  fontWeight: "700",
                  color: "#EF4444",
                }}
              >
                تعذر إكمال التفعيل
              </ThemedText>
            </View>

            <ThemedText
              style={{
                fontSize: 14,
                lineHeight: 22,
                color: isDark ? "#FCA5A5" : "#991B1B",
              }}
            >
              {error?.message || "حدث خطأ أثناء الاتصال بالمشترك."}
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
                تعديل البيانات
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
                إعادة المحاولة
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
                  تم تفعيل المشترك بنجاح!
                </ThemedText>
              </View>

              {(activatedStripIp || connectedStripIp) && (
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
                    IP: {activatedStripIp || connectedStripIp}
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
              تم تثبيت المشترك على شبكة المنزل بنجاح وتم ربطه بحسابك. يمكنك
              الآن اختبار تشغيل وإيقاف المنافذ مباشرة أدناه:
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
                  اضغط لاختبار المنافذ:
                </ThemedText>
                {telemetry.voltage > 0 && (
                  <ThemedText
                    style={{
                      fontSize: 12,
                      fontWeight: "700",
                      color: theme.primary,
                    }}
                  >
                    {telemetry.voltage}V • {telemetry.watts}W
                  </ThemedText>
                )}
              </View>

              <View style={{ flexDirection: "row", gap: 8 }}>
                {[1, 2, 3, 4].map((outletNum) => (
                  <TouchableOpacity
                    key={outletNum}
                    onPress={() => toggleOutlet(outletNum)}
                    activeOpacity={0.7}
                    style={{
                      flex: 1,
                      paddingVertical: 12,
                      alignItems: "center",
                      borderRadius: 10,
                      backgroundColor: outletStates[outletNum]
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
                        color: outletStates[outletNum]
                          ? "#FFFFFF"
                          : theme.textSecondary,
                      }}
                    >
                      مخرج {outletNum}
                    </ThemedText>
                    <ThemedText
                      style={{
                        fontSize: 10,
                        fontWeight: "600",
                        marginTop: 2,
                        color: outletStates[outletNum]
                          ? "rgba(255,255,255,0.8)"
                          : theme.textSecondary,
                      }}
                    >
                      {outletStates[outletNum] ? "مفعل" : "معطل"}
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
            بدء التفعيل والربط
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
            إتمام والانتقال إلى قائمة المشتركات
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
          {isSuccess ? "إغلاق" : "إلغاء"}
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
