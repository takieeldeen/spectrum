import React, { useEffect, useMemo, useRef } from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { Image } from "expo-image";
import Lucide from "@react-native-vector-icons/lucide";

import Page from "@/components/page";
import ThemedText from "@/components/themed-text";
import { Card, Stepper, RippleEffect, Button } from "@/components/ui";
import { useTheme } from "@/hooks/use-theme";
import { useActivateStrip } from "@/hooks/use-activate-strip";
import { useGetPlugById } from "@/api/plug";
import { usePlugs } from "@/providers/plug.provider";
import { useQueryClient } from "@tanstack/react-query";

const PlugActivationPage = () => {
  const theme = useTheme();
  const styles = createStyles(theme);
  const router = useRouter();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { socket, joinPlug } = usePlugs();

  const params = useLocalSearchParams<{
    plugId?: string;
    autoStart?: string;
    serialNumber?: string;
    ssid?: string;
    password?: string;
  }>();

  const { data: plugData } = useGetPlugById(params.plugId);

  const effectiveSerial =
    params.serialNumber || plugData?.serialNumber || "";
  const effectiveSsid =
    params.ssid || plugData?.SSID || "";
  const effectivePassword =
    params.password || plugData?.wifiPassword || "";
  const effectivePlugId = (params.plugId as string) || plugData?._id;

  const {
    currentStep,
    generalStep,
    generalStepIndex,
    isLoading: isActivating,
    isSuccess,
    isError,
    statusMessage,
    activate,
    retry,
    notifyVerified,
  } = useActivateStrip();

  const autoStartedRef = useRef(false);

  useEffect(() => {
    if (autoStartedRef.current) return;
    if (effectiveSerial && effectiveSsid) {
      autoStartedRef.current = true;
      activate({
        serialNumber: effectiveSerial,
        homeSsid: effectiveSsid,
        homePassword: effectivePassword,
        plugId: effectivePlugId,
      });
    }
  }, [
    effectiveSerial,
    effectiveSsid,
    effectivePassword,
    effectivePlugId,
    activate,
  ]);

  useEffect(() => {
    if (!effectivePlugId) return;
    joinPlug(effectivePlugId);
  }, [effectivePlugId, joinPlug]);

  useEffect(() => {
    if (!socket || !effectivePlugId) return;
    const onStripVerified = (payload: { plugId?: string; ipAddress?: string }) => {
      if (payload?.plugId === effectivePlugId) {
        console.log("⚡ [Activation Page] Received strip_verified via socket:", payload);
        notifyVerified(payload.ipAddress);
      }
    };
    socket.on("strip_verified", onStripVerified);
    return () => {
      socket.off("strip_verified", onStripVerified);
    };
  }, [socket, effectivePlugId, notifyVerified]);

  useEffect(() => {
    if (isSuccess) {
      queryClient.invalidateQueries({ queryKey: ["plugs"] });
    }
  }, [isSuccess, queryClient]);

  const activeVerticalStep = useMemo(() => {
    if (isSuccess) return 6;
    switch (currentStep) {
      case "IDLE":
      case "VALIDATING_PARAMS":
      case "REQUESTING_PERMISSIONS":
      case "SCANNING_STRIP_WIFI":
      case "HOTSPOT_NOT_FOUND":
        return 0;
      case "CONNECTING_STRIP_WIFI":
      case "RESOLVING_GATEWAY":
        return 1;
      case "SENDING_SERVER_IP":
      case "SERVER_IP_CONFIRMED":
        return 2;
      case "SENDING_WIFI_CREDENTIALS":
      case "WIFI_CREDENTIALS_CONFIRMED":
        return 3;
      case "DISCONNECTING_STRIP_WIFI":
      case "RECONNECTING_HOME_WIFI":
        return 4;
      case "VERIFYING_CONNECTION":
      case "SUCCESS":
        return 5;
      default:
        return 0;
    }
  }, [currentStep, isSuccess]);

  const horizontalSteps = useMemo(
    () => [
      { title: t("PLUG_ACTIVATION.STEP_PAIRING") },
      { title: t("PLUG_ACTIVATION.STEP_CONFIGURING") },
      { title: t("PLUG_ACTIVATION.STEP_VERIFYING") },
    ],
    [t],
  );

  const verticalSteps = useMemo(
    () => [
      {
        title: t("PLUG_ACTIVATION.STEP_HOTSPOT_LOOKUP"),
        description: t("PLUG_ACTIVATION.STEP_HOTSPOT_LOOKUP_DESC"),
      },
      {
        title: t("PLUG_ACTIVATION.STEP_CONNECTING_STRIP"),
        description: t("PLUG_ACTIVATION.STEP_CONNECTING_STRIP_DESC"),
      },
      {
        title: t("PLUG_ACTIVATION.STEP_SERVER_CONFIG"),
        description: t("PLUG_ACTIVATION.STEP_SERVER_CONFIG_DESC"),
      },
      {
        title: t("PLUG_ACTIVATION.STEP_WIFI_CONFIG"),
        description: t("PLUG_ACTIVATION.STEP_WIFI_CONFIG_DESC"),
      },
      {
        title: t("PLUG_ACTIVATION.STEP_HOME_NETWORK"),
        description: t("PLUG_ACTIVATION.STEP_HOME_NETWORK_DESC"),
      },
      {
        title: t("PLUG_ACTIVATION.STEP_STRIP_PAIRING"),
        description: t("PLUG_ACTIVATION.STEP_STRIP_PAIRING_DESC"),
      },
    ],
    [t],
  );

  const badgeText = useMemo(() => {
    if (isSuccess) return t("PLUG_ACTIVATION.STATUS_SUCCESS_BADGE");
    if (isError) return t("PLUG_ACTIVATION.STATUS_FAILED_BADGE");
    if (generalStep === "CONFIGURING")
      return t("PLUG_ACTIVATION.STEP_CONFIGURING");
    if (generalStep === "VERIFYING") return t("PLUG_ACTIVATION.STEP_VERIFYING");
    return t("PLUG_ACTIVATION.STEP_PAIRING");
  }, [isSuccess, isError, generalStep, t]);

  const heroIconName = useMemo(() => {
    if (isSuccess) return "check-circle";
    if (isError) return "alert-triangle";
    if (generalStep === "CONFIGURING") return "cpu";
    if (generalStep === "VERIFYING") return "cloud-upload";
    return "wifi";
  }, [isSuccess, isError, generalStep]);

  const heroIconColor = useMemo(() => {
    if (isSuccess) return theme.primary;
    if (isError) return theme.logoutText;
    return theme.primary;
  }, [isSuccess, isError, theme]);

  return (
    <Page edges={["bottom", "left", "right"]}>
      <ScrollView
        style={styles.page}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Top Header */}
        <View style={styles.headerRow}>
          <View style={styles.plugIconContainer}>
            <Lucide name="plug" color={theme.primary} size={30} />
          </View>
          <View style={styles.plugInfoCol}>
            <ThemedText style={styles.headerSubtext}>
              {t("PLUG_ACTIVATION.ACTIVATING_PLUG")}
            </ThemedText>
            <ThemedText style={styles.serialText}>
              {effectiveSerial || t("PLUG_ACTIVATION.UNKNOWN_SERIAL")}
            </ThemedText>
          </View>

          <View style={styles.statusBadge}>
            <ThemedText style={styles.statusBadgeText}>{badgeText}</ThemedText>
          </View>
        </View>

        {/* 3 Major Steps Horizontal Stepper */}
        <View style={styles.horizontalStepperWrapper}>
          <Stepper
            activeStep={Math.max(0, isSuccess ? 3 : generalStepIndex - 1)}
            steps={horizontalSteps}
          />
        </View>

        {/* Hero Visual Area with Strip Image and Ripple */}
        <View style={styles.heroContainer}>
          <View style={styles.rippleWrapper}>
            <RippleEffect
              size={isActivating ? 200 : 180}
              duration={isActivating ? 1600 : 2200}
            >
              <Lucide
                name={heroIconName as any}
                size={isActivating ? 100 : 90}
                color={heroIconColor}
              />
            </RippleEffect>
          </View>
          <Image
            source={require("@/assets/images/electric-strip.png")}
            contentFit="contain"
            style={styles.stripImage}
          />
        </View>

        {/* Card 1: Step Details */}
        <Card style={styles.detailsCard}>
          <View style={styles.cardHeader}>
            <Lucide name="receipt-text" size={20} color={theme.textSecondary} />
            <ThemedText style={styles.cardHeaderText}>
              {t("PLUG_ACTIVATION.STEP_DETAILS")}
            </ThemedText>
          </View>
          <View style={styles.detailsInner}>
            <View style={styles.detailsRow}>
              <ThemedText style={styles.detailsLabel}>
                {t("PLUG_ACTIVATION.NETWORK_NAME")}
              </ThemedText>
              <ThemedText style={styles.detailsValue}>
                {effectiveSsid || t("PLUG_ACTIVATION.DETERMINING_WIFI")}
              </ThemedText>
            </View>
            <View style={styles.detailsRow}>
              <ThemedText style={styles.detailsLabel}>
                {t("PLUG_ACTIVATION.NETWORK_PASSWORD")}
              </ThemedText>
              <ThemedText style={styles.detailsValue}>
                {effectivePassword
                  ? "••••••••"
                  : t("PLUG_ACTIVATION.NO_PASSWORD")}
              </ThemedText>
            </View>
          </View>
        </Card>

        {/* Card 2: Vertical Stepper */}
        <Card style={styles.verticalStepperCard}>
          <Stepper
            orientation="vertical"
            activeStep={activeVerticalStep}
            steps={verticalSteps}
          />
        </Card>

        {/* Status Message Banner */}
        {statusMessage ? (
          <View style={styles.statusMessageBanner}>
            <ThemedText style={styles.statusMessageText}>
              {statusMessage}
            </ThemedText>
          </View>
        ) : null}

        {/* Action Buttons */}
        {isError && (
          <View style={styles.actionSection}>
            <Button
              variant="contained"
              color="primary"
              fullWidth
              onPress={() => retry()}
            >
              {t("PLUG_ACTIVATION.RETRY")}
            </Button>
          </View>
        )}

        {isSuccess && (
          <View style={styles.actionSection}>
            <Button
              variant="contained"
              color="primary"
              fullWidth
              onPress={() => router.replace("/(tabs)/plugs" as any)}
            >
              {t("PLUG_ACTIVATION.COMPLETE_AND_GO_TO_PLUGS")}
            </Button>
          </View>
        )}

        {!isActivating && !isSuccess && !isError && (
          <View style={styles.actionSection}>
            <Button
              variant="contained"
              color="primary"
              fullWidth
              onPress={() => {
                if (effectiveSerial && effectiveSsid) {
                  activate({
                    serialNumber: effectiveSerial,
                    homeSsid: effectiveSsid,
                    homePassword: effectivePassword,
                    plugId: (params.plugId as string) || plugData?._id,
                  });
                }
              }}
            >
              {t("PLUG_ACTIVATION.START_ACTIVATION")}
            </Button>
          </View>
        )}
      </ScrollView>
    </Page>
  );
};

const createStyles = (theme: ReturnType<typeof useTheme>) =>
  StyleSheet.create({
    page: {
      flex: 1,
      padding: 12,
      backgroundColor: theme.background,
    },
    contentContainer: {
      paddingBottom: 48,
    },
    headerRow: {
      flexDirection: "row",
      gap: 12,
      alignItems: "center",
      marginBottom: 8,
    },
    plugIconContainer: {
      height: 56,
      width: 56,
      backgroundColor: theme.backgroundSecondary,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 28,
    },
    plugInfoCol: {
      flex: 1,
    },
    headerSubtext: {
      fontSize: 14,
      color: theme.textSecondary,
    },
    serialText: {
      fontSize: 16,
      fontWeight: "800",
      color: theme.text,
    },
    statusBadge: {
      backgroundColor: theme.tintedIconBackground,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 24,
    },
    statusBadgeText: {
      fontSize: 12,
      fontWeight: "800",
      color: theme.primary,
    },
    horizontalStepperWrapper: {
      paddingVertical: 24,
    },
    heroContainer: {
      width: "100%",
      position: "relative",
      alignItems: "center",
      justifyContent: "center",
      paddingTop: 16,
      paddingBottom: 64,
      marginBottom: 16,
    },
    rippleWrapper: {
      alignItems: "center",
      justifyContent: "center",
    },
    stripImage: {
      width: "92%",
      aspectRatio: 2048 / 600,
      position: "absolute",
      zIndex: 1,
      bottom: 0,
    },
    detailsCard: {
      padding: 12,
      gap: 12,
      marginBottom: 12,
      backgroundColor: theme.cardBackground,
      borderColor: theme.cardBorder,
    },
    cardHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    cardHeaderText: {
      color: theme.textSecondary,
      fontSize: 14,
      fontWeight: "600",
    },
    detailsInner: {
      backgroundColor: theme.backgroundSecondary,
      borderRadius: 12,
      flexDirection: "column",
    },
    detailsRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      padding: 12,
      alignItems: "center",
    },
    detailsLabel: {
      color: theme.textSecondary,
      fontSize: 14,
    },
    detailsValue: {
      fontWeight: "800",
      color: theme.text,
      fontSize: 14,
    },
    verticalStepperCard: {
      padding: 12,
      gap: 12,
      marginBottom: 16,
      backgroundColor: theme.cardBackground,
      borderColor: theme.cardBorder,
    },
    statusMessageBanner: {
      padding: 12,
      borderRadius: 12,
      backgroundColor: theme.tintedIconBackground,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 16,
    },
    statusMessageText: {
      fontSize: 13,
      fontWeight: "600",
      color: theme.primary,
      textAlign: "center",
    },
    actionSection: {
      marginTop: 8,
      marginBottom: 24,
    },
  });

export default PlugActivationPage;
