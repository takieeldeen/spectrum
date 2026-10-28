import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  Modal,
  Platform,
  Animated as RNAnimated,
  Easing as RNEasing,
  I18nManager,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useTranslation } from "react-i18next";
import { Lucide } from "@react-native-vector-icons/lucide";

import { useTheme } from "@/hooks/use-theme";
import ThemedText from "@/components/themed-text";
import { useSnackbar } from "@/components/ui/snackbar-provider";
import { Button } from "@/components/ui/button";
import { IDevice } from "@/types/device";
import { useSetDeviceTimer, useCancelDeviceTimer } from "@/api/device";

export const ALLOWED_TIMER_DURATIONS = [
  { mins: 1, labelKey: "SLEEP_TIMER.MIN_1_TEST", isTest: true },
  { mins: 15, labelKey: "SLEEP_TIMER.MIN_15" },
  { mins: 30, labelKey: "SLEEP_TIMER.MIN_30" },
  { mins: 60, labelKey: "SLEEP_TIMER.HOUR_1" },
  { mins: 120, labelKey: "SLEEP_TIMER.HOUR_2" },
  { mins: 240, labelKey: "SLEEP_TIMER.HOUR_4" },
  { mins: 480, labelKey: "SLEEP_TIMER.HOUR_8" },
] as const;

export function useTimerCountdown(timerClosesAt?: string | null) {
  const [remainingMs, setRemainingMs] = useState<number>(0);

  useEffect(() => {
    if (!timerClosesAt) {
      setRemainingMs(0);
      return;
    }

    const update = () => {
      const diff = new Date(timerClosesAt).getTime() - Date.now();
      setRemainingMs(Math.max(0, diff));
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [timerClosesAt]);

  const totalSeconds = Math.floor(remainingMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const pad = (n: number) => String(n).padStart(2, "0");
  const formatted =
    hours > 0
      ? `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`
      : `${pad(minutes)}:${pad(seconds)}`;

  return {
    remainingMs,
    isActive: !!timerClosesAt && remainingMs > 0,
    formatted,
    hours,
    minutes,
    seconds,
  };
}

export interface DeviceTimerBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  device?: IDevice | null;
  onSuccess?: () => void;
}

export function DeviceTimerBottomSheet({
  visible,
  onClose,
  device,
  onSuccess,
}: DeviceTimerBottomSheetProps) {
  const theme = useTheme();
  const styles = createStyles(theme);
  const snackbar = useSnackbar();
  const { t, i18n } = useTranslation();
  const isArabic = (i18n.language || "ar").startsWith("ar");
  const isRtl = I18nManager.isRTL || isArabic;

  const [showModal, setShowModal] = useState(visible);
  const [selectedDuration, setSelectedDuration] = useState<number | null>(null);

  const translateY = useRef(new RNAnimated.Value(600)).current;
  const backdropOpacity = useRef(new RNAnimated.Value(0)).current;

  const setTimerMutation = useSetDeviceTimer();
  const cancelTimerMutation = useCancelDeviceTimer();

  const { isActive: hasActiveTimer, formatted: countdownFormatted } =
    useTimerCountdown(device?.timerClosesAt);

  // Sync state with visibility prop
  useEffect(() => {
    if (visible) {
      setShowModal(true);
      setSelectedDuration(null);
    } else {
      handleClose();
    }
  }, [visible]);

  // Entrance & Exit Animations
  const onModalShow = () => {
    RNAnimated.parallel([
      RNAnimated.timing(backdropOpacity, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
        easing: RNEasing.out(RNEasing.cubic),
      }),
      RNAnimated.spring(translateY, {
        toValue: 0,
        damping: 24,
        mass: 0.9,
        stiffness: 180,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleClose = () => {
    RNAnimated.parallel([
      RNAnimated.timing(backdropOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
        easing: RNEasing.in(RNEasing.cubic),
      }),
      RNAnimated.timing(translateY, {
        toValue: 600,
        duration: 220,
        useNativeDriver: true,
        easing: RNEasing.in(RNEasing.cubic),
      }),
    ]).start(() => {
      setShowModal(false);
      setSelectedDuration(null);
      onClose();
    });
  };

  const handleSetTimer = async () => {
    if (!device?._id || !selectedDuration) return;

    try {
      await setTimerMutation.mutateAsync({
        id: device._id,
        durationMins: selectedDuration,
      });
      snackbar.success(t("SLEEP_TIMER.TIMER_SET_SUCCESS"));
      onSuccess?.();
      handleClose();
    } catch (err: any) {
      snackbar.error(
        err?.response?.data?.message || t("SLEEP_TIMER.TIMER_ERROR"),
      );
    }
  };

  const handleCancelTimer = () => {
    if (!device?._id) return;

    Alert.alert(
      t("SLEEP_TIMER.CANCEL_TIMER"),
      t("SLEEP_TIMER.CANCEL_CONFIRM"),
      [
        {
          text: t("CANCEL"),
          style: "cancel",
        },
        {
          text: t("SLEEP_TIMER.CANCEL_TIMER"),
          style: "destructive",
          onPress: async () => {
            try {
              await cancelTimerMutation.mutateAsync(device._id);
              snackbar.success(t("SLEEP_TIMER.TIMER_CANCELLED"));
              onSuccess?.();
              handleClose();
            } catch (err: any) {
              snackbar.error(
                err?.response?.data?.message || t("SLEEP_TIMER.TIMER_ERROR"),
              );
            }
          },
        },
      ],
    );
  };

  const isBusy = setTimerMutation.isPending || cancelTimerMutation.isPending;

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
      <View style={styles.modalOverlay}>
        {/* Animated Dim Backdrop */}
        <RNAnimated.View
          style={[
            styles.backdrop,
            {
              opacity: backdropOpacity,
            },
          ]}
        >
          <Pressable style={styles.backdropPressable} onPress={handleClose} />
        </RNAnimated.View>

        {/* Sliding Bottom Sheet Container */}
        <RNAnimated.View
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
          <View style={[styles.header, { flexDirection: "row" }]}>
            <View style={[styles.headerLeft, { flexDirection: "row" }]}>
              <View style={styles.headerIconBox}>
                <Lucide name="timer" size={22} color={theme.primary} />
              </View>
              <View style={styles.headerTitleGroup}>
                <ThemedText weight="700" style={styles.headerTitle}>
                  {t("SLEEP_TIMER.TITLE")}
                </ThemedText>
                <ThemedText style={styles.headerSubtitle} numberOfLines={1}>
                  {device?.name || t("SLEEP_TIMER.SUBTITLE")}
                </ThemedText>
              </View>
            </View>

            <TouchableOpacity
              onPress={handleClose}
              style={styles.closeButton}
              activeOpacity={0.7}
              hitSlop={10}
            >
              <Lucide name="x" size={20} color={theme.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Body Content */}
          <View style={styles.body}>
            {/* Active Timer Status Card */}
            {hasActiveTimer && (
              <View style={styles.activeTimerCard}>
                <View
                  style={[
                    styles.activeTimerRow,
                    { flexDirection: isRtl ? "row-reverse" : "row" },
                  ]}
                >
                  <View style={styles.activeTimerIconBox}>
                    <Lucide name="hourglass" size={22} color={theme.primary} />
                  </View>
                  <View style={styles.activeTimerInfo}>
                    <ThemedText style={styles.activeTimerLabel}>
                      {t("SLEEP_TIMER.TURNS_OFF_IN")}
                    </ThemedText>
                    <ThemedText style={styles.countdownValue}>
                      {countdownFormatted}
                    </ThemedText>
                  </View>
                  <TouchableOpacity
                    onPress={handleCancelTimer}
                    disabled={isBusy}
                    style={styles.cancelActiveTimerButton}
                    activeOpacity={0.8}
                  >
                    {cancelTimerMutation.isPending ? (
                      <ActivityIndicator
                        size="small"
                        color={theme.logoutText}
                      />
                    ) : (
                      <>
                        <Lucide
                          name="x-circle"
                          size={16}
                          color={theme.logoutText}
                        />
                        <ThemedText style={styles.cancelActiveTimerText}>
                          {t("SLEEP_TIMER.CANCEL_TIMER")}
                        </ThemedText>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Presets Section Title */}
            <View
              style={[
                styles.sectionHeaderRow,
                { flexDirection: isRtl ? "row-reverse" : "row" },
              ]}
            >
              <Lucide name="clock" size={16} color={theme.textSecondary} />
              <ThemedText style={styles.sectionTitle}>
                {hasActiveTimer
                  ? t("SLEEP_TIMER.SET_TIMER")
                  : t("SLEEP_TIMER.SELECT_DURATION")}
              </ThemedText>
            </View>

            {/* Testing-Only Option (1 Minute) */}
            <TouchableOpacity
              onPress={() => setSelectedDuration(1)}
              activeOpacity={0.7}
              style={[
                styles.testOptionCard,
                selectedDuration === 1 && styles.testOptionCardSelected,
                { flexDirection: isRtl ? "row-reverse" : "row" },
              ]}
            >
              <View
                style={[
                  styles.testBadge,
                  { flexDirection: isRtl ? "row-reverse" : "row" },
                ]}
              >
                <Lucide name="flask-conical" size={14} color={theme.primary} />
                <ThemedText style={styles.testBadgeText}>
                  {t("SLEEP_TIMER.TESTING_ONLY")}
                </ThemedText>
              </View>

              <ThemedText
                style={[
                  styles.testOptionText,
                  selectedDuration === 1 && styles.testOptionTextSelected,
                ]}
              >
                {t("SLEEP_TIMER.MIN_1_TEST")}
              </ThemedText>

              {selectedDuration === 1 ? (
                <Lucide name="check" size={18} color={theme.primary} />
              ) : (
                <View style={{ width: 18 }} />
              )}
            </TouchableOpacity>

            {/* Preset Duration Chips Grid (3 cols x 2 rows) */}
            <View
              style={[
                styles.presetGrid,
                { flexDirection: isRtl ? "row-reverse" : "row" },
              ]}
            >
              {ALLOWED_TIMER_DURATIONS.filter(
                (p) => !("isTest" in p && p.isTest),
              ).map((preset) => {
                const isSelected = selectedDuration === preset.mins;
                return (
                  <TouchableOpacity
                    key={preset.mins}
                    onPress={() => setSelectedDuration(preset.mins)}
                    activeOpacity={0.7}
                    style={[
                      styles.presetChip,
                      isSelected && styles.presetChipSelected,
                    ]}
                  >
                    <ThemedText
                      style={[
                        styles.presetChipText,
                        isSelected && styles.presetChipTextSelected,
                      ]}
                    >
                      {t(preset.labelKey)}
                    </ThemedText>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Set Timer Action Button */}
            <View style={styles.footer}>
              <Button
                fullWidth
                variant="contained"
                onPress={handleSetTimer}
                disabled={!selectedDuration || isBusy}
                style={[
                  styles.submitButton,
                  (!selectedDuration || isBusy) && styles.submitButtonDisabled,
                ]}
              >
                {setTimerMutation.isPending ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <ThemedText style={styles.submitButtonText}>
                    {t("SLEEP_TIMER.SET_TIMER")}
                  </ThemedText>
                )}
              </Button>
            </View>
          </View>
        </RNAnimated.View>
      </View>
    </Modal>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>) {
  return StyleSheet.create({
    modalOverlay: {
      flex: 1,
      justifyContent: "flex-end",
    },
    backdrop: {
      ...StyleSheet.absoluteFill,
      backgroundColor: theme.overlayBackground,
    },
    backdropPressable: {
      flex: 1,
    },
    sheetContainer: {
      backgroundColor: theme.cardBackground,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      paddingBottom: Platform.OS === "ios" ? 40 : 24,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: -4 },
      shadowOpacity: 0.15,
      shadowRadius: 16,
      elevation: 20,
    },
    handleContainer: {
      alignItems: "center",
      paddingVertical: 12,
    },
    handleBar: {
      width: 44,
      height: 4.5,
      borderRadius: 3,
      backgroundColor: theme.divider,
    },
    header: {
      paddingHorizontal: 20,
      paddingBottom: 16,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.divider,
      alignItems: "center",
      justifyContent: "space-between",
    },
    headerLeft: {
      alignItems: "center",
      gap: 12,
      flex: 1,
    },
    headerIconBox: {
      width: 44,
      height: 44,
      borderRadius: 14,
      backgroundColor: theme.tintedIconBackground,
      alignItems: "center",
      justifyContent: "center",
    },
    headerTitleGroup: {
      flex: 1,
    },
    headerTitle: {
      fontSize: 18,
      color: theme.text,
    },
    headerSubtitle: {
      fontSize: 13,
      color: theme.textSecondary,
      marginTop: 2,
    },
    closeButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: theme.closeBtnBackground,
      alignItems: "center",
      justifyContent: "center",
    },
    body: {
      paddingHorizontal: 20,
      paddingTop: 18,
      gap: 16,
    },
    activeTimerCard: {
      backgroundColor: theme.activeCardBackground,
      borderWidth: 1.5,
      borderColor: theme.activeCardBorder,
      borderRadius: 16,
      padding: 14,
    },
    activeTimerRow: {
      alignItems: "center",
      gap: 12,
    },
    activeTimerIconBox: {
      width: 42,
      height: 42,
      borderRadius: 12,
      backgroundColor: theme.cardBackground,
      alignItems: "center",
      justifyContent: "center",
    },
    activeTimerInfo: {
      flex: 1,
    },
    activeTimerLabel: {
      fontSize: 12,
      color: theme.textSecondary,
    },
    countdownValue: {
      fontSize: 22,
      fontWeight: "800",
      color: theme.primary,
      fontVariant: ["tabular-nums"],
      marginTop: 2,
    },
    cancelActiveTimerButton: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      paddingVertical: 8,
      paddingHorizontal: 10,
      borderRadius: 10,
      backgroundColor: theme.cardBackground,
      borderWidth: 1,
      borderColor: theme.logoutBorder,
    },
    cancelActiveTimerText: {
      fontSize: 12,
      fontWeight: "700",
      color: theme.logoutText,
    },
    sectionHeaderRow: {
      alignItems: "center",
      gap: 6,
      marginTop: 4,
    },
    sectionTitle: {
      fontSize: 14,
      fontWeight: "600",
      color: theme.textSecondary,
    },
    testOptionCard: {
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: 10,
      paddingHorizontal: 14,
      borderRadius: 14,
      backgroundColor: theme.backgroundSecondary,
      borderWidth: 1.5,
      borderColor: theme.divider,
      borderStyle: "dashed",
    },
    testOptionCardSelected: {
      backgroundColor: theme.activeCardBackground,
      borderColor: theme.primary,
      borderStyle: "solid",
    },
    testBadge: {
      alignItems: "center",
      gap: 6,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 8,
      backgroundColor: theme.tintedIconBackground,
    },
    testBadgeText: {
      fontSize: 11,
      fontWeight: "700",
      color: theme.primary,
    },
    testOptionText: {
      fontSize: 13,
      fontWeight: "600",
      color: theme.text,
    },
    testOptionTextSelected: {
      fontWeight: "800",
      color: theme.primary,
    },
    presetGrid: {
      flexWrap: "wrap",
      gap: 10,
      justifyContent: "space-between",
    },
    presetChip: {
      width: "31%",
      height: 48,
      borderRadius: 14,
      backgroundColor: theme.backgroundSecondary,
      borderWidth: 1.5,
      borderColor: theme.divider,
      alignItems: "center",
      justifyContent: "center",
    },
    presetChipSelected: {
      backgroundColor: theme.activeCardBackground,
      borderColor: theme.primary,
    },
    presetChipText: {
      fontSize: 14,
      fontWeight: "600",
      color: theme.text,
    },
    presetChipTextSelected: {
      color: theme.primary,
      fontWeight: "800",
    },
    footer: {
      marginTop: 10,
    },
    submitButton: {
      height: 52,
      borderRadius: 16,
      alignItems: "center",
      justifyContent: "center",
    },
    submitButtonDisabled: {
      opacity: 0.5,
    },
    submitButtonText: {
      fontSize: 16,
      fontWeight: "700",
      color: "#FFFFFF",
    },
  });
}
