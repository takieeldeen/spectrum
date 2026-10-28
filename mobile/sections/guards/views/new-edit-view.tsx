import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  Modal,
  Platform,
  Animated as RNAnimated,
  Easing as RNEasing,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  I18nManager,
  ActivityIndicator,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolateColor,
  Easing,
} from "react-native-reanimated";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import { Lucide } from "@react-native-vector-icons/lucide";

import { useTheme } from "@/hooks/use-theme";
import ThemedText from "@/components/themed-text";
import { getAppFont } from "@/constants/fonts";
import { useSnackbar } from "@/components/ui/snackbar-provider";
import { useCreateGuard, useUpdateGuard } from "@/api/guards";
import { IGuard, GuardAction, GuardComparator, GuardTarget } from "@/types/guard";

export interface GuardNewEditBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  deviceId: string;
  currentGuard?: IGuard | null;
  onSuccess?: () => void;
}

interface FormValues {
  action: GuardAction;
  comparator: GuardComparator;
  target: GuardTarget;
  value: number;
}

// ---------------------------------------------------------------------------
// 0.3s Transition Components (transition: all 0.3s ease)
// ---------------------------------------------------------------------------

type LucideIconName = React.ComponentProps<typeof Lucide>["name"];

interface AnimatedActionCardProps {
  selected: boolean;
  onPress: () => void;
  icon: LucideIconName;
  title: string;
  desc: string;
  theme: ReturnType<typeof useTheme>;
  styles: ReturnType<typeof createStyles>;
}

function AnimatedActionCard({
  selected,
  onPress,
  icon,
  title,
  desc,
  theme,
  styles,
}: AnimatedActionCardProps) {
  const progress = useSharedValue(selected ? 1 : 0);

  useEffect(() => {
    progress.value = withTiming(selected ? 1 : 0, {
      duration: 300,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
    });
  }, [selected]);

  const cardAnimStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      progress.value,
      [0, 1],
      [theme.backgroundSecondary, theme.activeCardBackground]
    ),
    borderColor: interpolateColor(
      progress.value,
      [0, 1],
      [theme.divider, theme.activeCardBorder]
    ),
  }));

  const iconBoxAnimStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      progress.value,
      [0, 1],
      [theme.cardBackground, theme.primary]
    ),
  }));

  const radioAnimStyle = useAnimatedStyle(() => ({
    borderColor: interpolateColor(
      progress.value,
      [0, 1],
      [theme.divider, theme.primary]
    ),
    backgroundColor: interpolateColor(
      progress.value,
      [0, 1],
      ["rgba(0, 0, 0, 0)", theme.primary]
    ),
  }));

  const iconActiveAnimStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
  }));

  const iconInactiveAnimStyle = useAnimatedStyle(() => ({
    opacity: 1 - progress.value,
  }));

  const checkmarkAnimStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ scale: progress.value }],
  }));

  return (
    <Pressable style={{ flex: 1 }} onPress={onPress}>
      <Animated.View style={[styles.actionCard, cardAnimStyle]}>
        <View style={styles.cardHeaderRow}>
          <Animated.View style={[styles.actionIconBox, iconBoxAnimStyle]}>
            <Animated.View
              pointerEvents="none"
              style={[StyleSheet.absoluteFill, styles.iconCenter, iconInactiveAnimStyle]}
            >
              <Lucide name={icon} size={20} color={theme.textSecondary} />
            </Animated.View>
            <Animated.View
              pointerEvents="none"
              style={[StyleSheet.absoluteFill, styles.iconCenter, iconActiveAnimStyle]}
            >
              <Lucide name={icon} size={20} color="#FFFFFF" />
            </Animated.View>
          </Animated.View>

          <Animated.View style={[styles.radioCircle, radioAnimStyle]}>
            <Animated.View style={checkmarkAnimStyle}>
              <Lucide name="check" size={13} color="#FFFFFF" />
            </Animated.View>
          </Animated.View>
        </View>

        <ThemedText style={styles.cardTitle}>{title}</ThemedText>
        <ThemedText style={styles.cardDesc}>{desc}</ThemedText>
      </Animated.View>
    </Pressable>
  );
}

interface AnimatedSegmentButtonProps {
  selected: boolean;
  onPress: () => void;
  icon: LucideIconName;
  label: string;
  theme: ReturnType<typeof useTheme>;
  styles: ReturnType<typeof createStyles>;
}

function AnimatedSegmentButton({
  selected,
  onPress,
  icon,
  label,
  theme,
  styles,
}: AnimatedSegmentButtonProps) {
  const { i18n } = useTranslation();
  const fontStyle = getAppFont("700", i18n.language);
  const progress = useSharedValue(selected ? 1 : 0);

  useEffect(() => {
    progress.value = withTiming(selected ? 1 : 0, {
      duration: 300,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
    });
  }, [selected]);

  const buttonAnimStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      progress.value,
      [0, 1],
      ["rgba(0, 0, 0, 0)", theme.cardBackground]
    ),
    shadowOpacity: progress.value * 0.08,
    elevation: progress.value * 2,
  }));

  const textAnimStyle = useAnimatedStyle(() => ({
    color: interpolateColor(
      progress.value,
      [0, 1],
      [theme.textSecondary, theme.primary]
    ),
  }));

  const iconActiveAnimStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
  }));

  const iconInactiveAnimStyle = useAnimatedStyle(() => ({
    opacity: 1 - progress.value,
  }));

  return (
    <Pressable style={{ flex: 1 }} onPress={onPress}>
      <Animated.View style={[styles.segmentButton, buttonAnimStyle]}>
        <View style={{ width: 16, height: 16, alignItems: "center", justifyContent: "center" }}>
          <Animated.View
            pointerEvents="none"
            style={[StyleSheet.absoluteFill, styles.iconCenter, iconInactiveAnimStyle]}
          >
            <Lucide name={icon} size={16} color={theme.textSecondary} />
          </Animated.View>
          <Animated.View
            pointerEvents="none"
            style={[StyleSheet.absoluteFill, styles.iconCenter, iconActiveAnimStyle]}
          >
            <Lucide name={icon} size={16} color={theme.primary} />
          </Animated.View>
        </View>

        <Animated.Text style={[styles.segmentText, fontStyle, textAnimStyle]}>
          {label}
        </Animated.Text>
      </Animated.View>
    </Pressable>
  );
}

interface AnimatedMetricCardProps {
  selected: boolean;
  onPress: () => void;
  icon: LucideIconName;
  label: string;
  theme: ReturnType<typeof useTheme>;
  styles: ReturnType<typeof createStyles>;
}

function AnimatedMetricCard({
  selected,
  onPress,
  icon,
  label,
  theme,
  styles,
}: AnimatedMetricCardProps) {
  const { i18n } = useTranslation();
  const fontStyle = getAppFont("700", i18n.language);
  const progress = useSharedValue(selected ? 1 : 0);

  useEffect(() => {
    progress.value = withTiming(selected ? 1 : 0, {
      duration: 300,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
    });
  }, [selected]);

  const cardAnimStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      progress.value,
      [0, 1],
      [theme.backgroundSecondary, theme.activeCardBackground]
    ),
    borderColor: interpolateColor(
      progress.value,
      [0, 1],
      [theme.divider, theme.activeCardBorder]
    ),
  }));

  const textAnimStyle = useAnimatedStyle(() => ({
    color: interpolateColor(
      progress.value,
      [0, 1],
      [theme.textSecondary, theme.primary]
    ),
  }));

  const iconActiveAnimStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
  }));

  const iconInactiveAnimStyle = useAnimatedStyle(() => ({
    opacity: 1 - progress.value,
  }));

  return (
    <Pressable style={{ flex: 1 }} onPress={onPress}>
      <Animated.View style={[styles.metricCard, cardAnimStyle]}>
        <View style={{ width: 24, height: 24, alignItems: "center", justifyContent: "center" }}>
          <Animated.View
            pointerEvents="none"
            style={[StyleSheet.absoluteFill, styles.iconCenter, iconInactiveAnimStyle]}
          >
            <Lucide name={icon} size={22} color={theme.textSecondary} />
          </Animated.View>
          <Animated.View
            pointerEvents="none"
            style={[StyleSheet.absoluteFill, styles.iconCenter, iconActiveAnimStyle]}
          >
            <Lucide name={icon} size={22} color={theme.primary} />
          </Animated.View>
        </View>

        <Animated.Text style={[styles.metricText, fontStyle, textAnimStyle]}>
          {label}
        </Animated.Text>
      </Animated.View>
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// Main Bottom Sheet Component
// ---------------------------------------------------------------------------

export function GuardNewEditBottomSheet({
  visible,
  onClose,
  deviceId,
  currentGuard,
  onSuccess,
}: GuardNewEditBottomSheetProps) {
  const theme = useTheme();
  const styles = createStyles(theme);
  const snackbar = useSnackbar();
  const { t, i18n } = useTranslation();
  const isArabic = (i18n.language || "ar").startsWith("ar");
  const isRtl = I18nManager.isRTL || isArabic;
  const isEdit = Boolean(currentGuard?._id);

  const [showModal, setShowModal] = useState(visible);

  const translateY = useRef(new RNAnimated.Value(650)).current;
  const backdropOpacity = useRef(new RNAnimated.Value(0)).current;

  // Mutations
  const createGuardMutation = useCreateGuard();
  const updateGuardMutation = useUpdateGuard();

  // Yup validation schema
  const formSchema = useMemo(
    () =>
      yup.object().shape({
        action: yup
          .string()
          .oneOf(["ON", "OFF"])
          .required(),
        comparator: yup
          .string()
          .oneOf(["MIN", "MAX"])
          .required(),
        target: yup
          .string()
          .oneOf(["CURRENT", "TEMPERATURE", "POWER"])
          .required(),
        value: yup
          .number()
          .typeError(t("GUARDS.VALIDATION_VALUE_REQUIRED"))
          .positive(t("GUARDS.VALIDATION_VALUE_POSITIVE"))
          .required(t("GUARDS.VALIDATION_VALUE_REQUIRED")),
      }),
    [t]
  );

  // Default values following standard pattern
  const defaultValues: FormValues = useMemo(
    () => ({
      action: isEdit && currentGuard ? currentGuard.action : "OFF",
      comparator: isEdit && currentGuard ? currentGuard.comparator : "MIN",
      target: isEdit && currentGuard ? currentGuard.target : "CURRENT",
      value:
        isEdit && currentGuard?.value !== undefined ? currentGuard.value : 2,
    }),
    [isEdit, currentGuard]
  );

  const methods = useForm<FormValues>({
    resolver: yupResolver(formSchema),
    defaultValues,
  });

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { isSubmitting },
  } = methods;

  const currentAction = watch("action");
  const currentComparator = watch("comparator");
  const currentTarget = watch("target");
  const currentValue = watch("value");

  useEffect(() => {
    if (visible) {
      reset(defaultValues);
      translateY.setValue(650);
      backdropOpacity.setValue(0);
      setShowModal(true);
    } else if (showModal) {
      handleClose();
    }
  }, [visible, currentGuard]);

  const onModalShow = () => {
    RNAnimated.parallel([
      RNAnimated.timing(backdropOpacity, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }),
      RNAnimated.spring(translateY, {
        toValue: 0,
        damping: 24,
        mass: 0.9,
        stiffness: 220,
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
      }),
      RNAnimated.timing(translateY, {
        toValue: 650,
        duration: 220,
        easing: RNEasing.in(RNEasing.cubic),
        useNativeDriver: true,
      }),
    ]).start(() => {
      setShowModal(false);
      onClose();
    });
  };

  // Step config based on target
  const metricConfig = useMemo(() => {
    switch (currentTarget) {
      case "TEMPERATURE":
        return {
          step: 5,
          min: 10,
          max: 120,
          unit: t("GUARDS.UNIT_CELSIUS"),
          label:
            currentComparator === "MIN"
              ? t("GUARDS.THRESHOLD_LABEL_MIN_TEMP")
              : t("GUARDS.THRESHOLD_LABEL_MAX_TEMP"),
        };
      case "POWER":
        return {
          step: 100,
          min: 50,
          max: 5000,
          unit: t("GUARDS.UNIT_WATT"),
          label:
            currentComparator === "MIN"
              ? t("GUARDS.THRESHOLD_LABEL_MIN_POWER")
              : t("GUARDS.THRESHOLD_LABEL_MAX_POWER"),
        };
      case "CURRENT":
      default:
        return {
          step: 1,
          min: 0.5,
          max: 32,
          unit: t("GUARDS.UNIT_AMPERE"),
          label:
            currentComparator === "MIN"
              ? t("GUARDS.THRESHOLD_LABEL_MIN_CURRENT")
              : t("GUARDS.THRESHOLD_LABEL_MAX_CURRENT"),
        };
    }
  }, [currentTarget, currentComparator, t]);

  const handleIncrement = () => {
    const nextVal = Math.min(
      metricConfig.max,
      (currentValue || 0) + metricConfig.step
    );
    setValue("value", nextVal, { shouldValidate: true });
  };

  const handleDecrement = () => {
    const nextVal = Math.max(
      metricConfig.min,
      (currentValue || 0) - metricConfig.step
    );
    setValue("value", nextVal, { shouldValidate: true });
  };

  const onSubmit = handleSubmit(async (data: FormValues) => {
    try {
      const payload = {
        deviceId,
        action: data.action,
        comparator: data.comparator,
        target: data.target,
        value: Number(data.value),
      };

      if (isEdit && currentGuard?._id) {
        await updateGuardMutation.mutateAsync({
          id: currentGuard._id,
          data: payload,
        });
        snackbar.success(t("GUARDS.UPDATE_SUCCESS"));
      } else {
        await createGuardMutation.mutateAsync(payload);
        snackbar.success(t("GUARDS.CREATE_SUCCESS"));
      }

      handleClose();
      onSuccess?.();
    } catch (error: any) {
      snackbar.error(error?.message || t("BE_ERROR.generic"));
    }
  });

  const isBusy =
    isSubmitting ||
    createGuardMutation.isPending ||
    updateGuardMutation.isPending;

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
        <RNAnimated.View
          style={[styles.backdrop, { opacity: backdropOpacity }]}
        >
          <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />
        </RNAnimated.View>

        {/* Animated Slide-up Sheet */}
        <RNAnimated.View
          style={[
            styles.sheetContainer,
            { transform: [{ translateY }] },
          ]}
        >
          {/* Grabber Handle */}
          <View style={styles.grabberHandle} />

          {/* Header Row */}
          <View style={styles.headerRow}>
            {/* Close Button */}
            <TouchableOpacity
              onPress={handleClose}
              style={styles.closeButton}
              activeOpacity={0.7}
            >
              <Lucide name="x" size={20} color={theme.textSecondary} />
            </TouchableOpacity>

            {/* Titles */}
            <View style={styles.headerTitles}>
              <ThemedText style={styles.headerTitle}>
                {isEdit
                  ? t("GUARDS.FORM_TITLE_EDIT")
                  : t("GUARDS.FORM_TITLE_CREATE")}
              </ThemedText>
              <ThemedText style={styles.headerSubtitle}>
                {t("GUARDS.FORM_SUBTITLE")}
              </ThemedText>
            </View>
          </View>

          {/* Form Content */}
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            {/* 1. Purpose / Action Selection (إغلاق الجهاز / تشغيل الجهاز) */}
            <View style={styles.section}>
              <ThemedText style={styles.sectionLabel}>
                {t("GUARDS.PURPOSE_SECTION")}
              </ThemedText>

              <View style={styles.cardsRow}>
                {/* Option OFF (إغلاق الجهاز) with 0.3s transition */}
                <AnimatedActionCard
                  selected={currentAction === "OFF"}
                  onPress={() => setValue("action", "OFF")}
                  icon="power"
                  title={t("GUARDS.ACTION_OFF_TITLE")}
                  desc={t("GUARDS.ACTION_OFF_DESC")}
                  theme={theme}
                  styles={styles}
                />

                {/* Option ON (تشغيل الجهاز) with 0.3s transition */}
                <AnimatedActionCard
                  selected={currentAction === "ON"}
                  onPress={() => setValue("action", "ON")}
                  icon="play"
                  title={t("GUARDS.ACTION_ON_TITLE")}
                  desc={t("GUARDS.ACTION_ON_DESC")}
                  theme={theme}
                  styles={styles}
                />
              </View>
            </View>

            {/* 2. Rule Type / Comparator (الحد الأدنى / الحد الأقصى) */}
            <View style={styles.section}>
              <ThemedText style={styles.sectionLabel}>
                {t("GUARDS.TYPE_SECTION")}
              </ThemedText>

              <View style={styles.segmentedControl}>
                {/* Min Option with 0.3s transition */}
                <AnimatedSegmentButton
                  selected={currentComparator === "MIN"}
                  onPress={() => setValue("comparator", "MIN")}
                  icon="arrow-down"
                  label={t("GUARDS.COMP_MIN")}
                  theme={theme}
                  styles={styles}
                />

                {/* Max Option with 0.3s transition */}
                <AnimatedSegmentButton
                  selected={currentComparator === "MAX"}
                  onPress={() => setValue("comparator", "MAX")}
                  icon="arrow-up"
                  label={t("GUARDS.COMP_MAX")}
                  theme={theme}
                  styles={styles}
                />
              </View>
            </View>

            {/* 3. Monitored Metric (التيار / درجة الحرارة / استهلاك الكهرباء) */}
            <View style={styles.section}>
              <ThemedText style={styles.sectionLabel}>
                {t("GUARDS.METRIC_SECTION")}
              </ThemedText>

              <View style={styles.metricsRow}>
                {/* Metric: Current with 0.3s transition */}
                <AnimatedMetricCard
                  selected={currentTarget === "CURRENT"}
                  onPress={() => {
                    setValue("target", "CURRENT");
                    setValue("value", 2);
                  }}
                  icon="activity"
                  label={t("GUARDS.METRIC_CURRENT")}
                  theme={theme}
                  styles={styles}
                />

                {/* Metric: Temperature with 0.3s transition */}
                <AnimatedMetricCard
                  selected={currentTarget === "TEMPERATURE"}
                  onPress={() => {
                    setValue("target", "TEMPERATURE");
                    setValue("value", 60);
                  }}
                  icon="thermometer"
                  label={t("GUARDS.METRIC_TEMP")}
                  theme={theme}
                  styles={styles}
                />

                {/* Metric: Power with 0.3s transition */}
                <AnimatedMetricCard
                  selected={currentTarget === "POWER"}
                  onPress={() => {
                    setValue("target", "POWER");
                    setValue("value", 2000);
                  }}
                  icon="zap"
                  label={t("GUARDS.METRIC_POWER")}
                  theme={theme}
                  styles={styles}
                />
              </View>
            </View>

            {/* 4. Stepper Threshold Value */}
            <View style={styles.section}>
              <ThemedText style={styles.sectionLabel}>
                {metricConfig.label}
              </ThemedText>

              <View style={styles.stepperContainer}>
                {/* Decrement Button (-) */}
                <TouchableOpacity
                  style={styles.stepperMinusButton}
                  onPress={handleDecrement}
                  activeOpacity={0.7}
                >
                  <Lucide name="minus" size={20} color={theme.text} />
                </TouchableOpacity>

                {/* Center Value + Unit Input */}
                <View style={styles.stepperInputWrapper}>
                  <ThemedText style={styles.stepperUnitText}>
                    {metricConfig.unit}
                  </ThemedText>
                  <TextInput
                    style={styles.stepperInput}
                    value={String(currentValue ?? "")}
                    keyboardType="numeric"
                    onChangeText={(val) => {
                      const num = parseFloat(val);
                      setValue("value", isNaN(num) ? 0 : num, {
                        shouldValidate: true,
                      });
                    }}
                    textAlign="center"
                  />
                </View>

                {/* Increment Button (+) */}
                <TouchableOpacity
                  style={styles.stepperPlusButton}
                  onPress={handleIncrement}
                  activeOpacity={0.7}
                >
                  <Lucide name="plus" size={22} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>

          {/* Action Buttons (Save & Cancel) */}
          <View style={styles.footerRow}>
            {/* Cancel Button */}
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={handleClose}
              activeOpacity={0.7}
            >
              <ThemedText style={styles.cancelButtonText}>
                {t("GUARDS.CANCEL")}
              </ThemedText>
            </TouchableOpacity>

            {/* Save Button */}
            <TouchableOpacity
              style={[
                styles.saveButton,
                isBusy && { opacity: 0.7 },
              ]}
              onPress={onSubmit}
              disabled={isBusy}
              activeOpacity={0.85}
            >
              {isBusy ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <ThemedText style={styles.saveButtonText}>
                  {t("GUARDS.SAVE")}
                </ThemedText>
              )}
            </TouchableOpacity>
          </View>
        </RNAnimated.View>
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
      ...StyleSheet.absoluteFill,
      backgroundColor: "rgba(0, 0, 0, 0.45)",
    },
    sheetContainer: {
      backgroundColor: theme.cardBackground,
      borderTopLeftRadius: 28,
      borderTopRightRadius: 28,
      paddingTop: 12,
      paddingHorizontal: 20,
      paddingBottom: Platform.OS === "ios" ? 36 : 24,
      maxHeight: "88%",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: -4 },
      shadowOpacity: 0.12,
      shadowRadius: 16,
      elevation: 20,
    },
    grabberHandle: {
      width: 44,
      height: 5,
      borderRadius: 3,
      backgroundColor: theme.divider,
      alignSelf: "center",
      marginBottom: 14,
    },
    headerRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingBottom: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.divider,
    },
    headerTitles: {
      flex: 1,
      alignItems: "flex-start",
      marginLeft: 12,
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: "800",
      color: theme.text,
    },
    headerSubtitle: {
      fontSize: 12,
      color: theme.textSecondary,
      marginTop: 2,
    },
    closeButton: {
      width: 38,
      height: 38,
      borderRadius: 19,
      backgroundColor: theme.backgroundSecondary,
      alignItems: "center",
      justifyContent: "center",
    },
    scrollContent: {
      paddingVertical: 18,
      gap: 20,
    },
    section: {
      gap: 10,
    },
    sectionLabel: {
      fontSize: 15,
      fontWeight: "700",
      color: theme.text,
      textAlign: "left",
    },
    cardsRow: {
      flexDirection: "row",
      gap: 12,
    },
    actionCard: {
      flex: 1,
      backgroundColor: theme.backgroundSecondary,
      borderRadius: 18,
      padding: 14,
      borderWidth: 1.5,
      borderColor: theme.divider,
      gap: 8,
    },
    cardHeaderRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    actionIconBox: {
      width: 36,
      height: 36,
      borderRadius: 12,
      backgroundColor: theme.cardBackground,
      alignItems: "center",
      justifyContent: "center",
    },
    radioCircle: {
      width: 22,
      height: 22,
      borderRadius: 11,
      borderWidth: 1.5,
      borderColor: theme.divider,
      alignItems: "center",
      justifyContent: "center",
    },
    cardTitle: {
      fontSize: 15,
      fontWeight: "800",
      color: theme.text,
      textAlign: "left",
    },
    cardDesc: {
      fontSize: 11,
      color: theme.textSecondary,
      lineHeight: 16,
      textAlign: "left",
    },
    segmentedControl: {
      flexDirection: "row",
      backgroundColor: theme.backgroundSecondary,
      borderRadius: 16,
      padding: 4,
      gap: 4,
    },
    segmentButton: {
      flex: 1,
      height: 44,
      borderRadius: 12,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowRadius: 4,
    },
    segmentText: {
      fontSize: 14,
      fontWeight: "700",
      color: theme.textSecondary,
    },
    metricsRow: {
      flexDirection: "row",
      gap: 10,
    },
    metricCard: {
      flex: 1,
      backgroundColor: theme.backgroundSecondary,
      borderRadius: 16,
      paddingVertical: 14,
      paddingHorizontal: 8,
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      borderWidth: 1.5,
      borderColor: theme.divider,
    },
    metricText: {
      fontSize: 12,
      fontWeight: "700",
      color: theme.textSecondary,
      textAlign: "center",
    },
    iconCenter: {
      alignItems: "center",
      justifyContent: "center",
    },
    stepperContainer: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: theme.backgroundSecondary,
      borderRadius: 18,
      padding: 6,
      gap: 8,
    },
    stepperMinusButton: {
      width: 48,
      height: 48,
      borderRadius: 14,
      backgroundColor: theme.cardBackground,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: theme.divider,
    },
    stepperPlusButton: {
      width: 48,
      height: 48,
      borderRadius: 14,
      backgroundColor: theme.primary,
      alignItems: "center",
      justifyContent: "center",
    },
    stepperInputWrapper: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.cardBackground,
      borderRadius: 14,
      height: 48,
      borderWidth: 1,
      borderColor: theme.divider,
      paddingHorizontal: 12,
      gap: 6,
    },
    stepperInput: {
      fontSize: 22,
      fontWeight: "800",
      color: theme.text,
      minWidth: 50,
      padding: 0,
    },
    stepperUnitText: {
      fontSize: 14,
      fontWeight: "600",
      color: theme.textSecondary,
    },
    footerRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: theme.divider,
    },
    cancelButton: {
      flex: 1,
      height: 50,
      borderRadius: 16,
      backgroundColor: theme.backgroundSecondary,
      alignItems: "center",
      justifyContent: "center",
    },
    cancelButtonText: {
      fontSize: 15,
      fontWeight: "700",
      color: theme.text,
    },
    saveButton: {
      flex: 1.5,
      height: 50,
      borderRadius: 16,
      backgroundColor: theme.primary,
      alignItems: "center",
      justifyContent: "center",
      shadowColor: theme.primary,
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.25,
      shadowRadius: 6,
      elevation: 3,
    },
    saveButtonText: {
      fontSize: 16,
      fontWeight: "800",
      color: "#FFFFFF",
    },
  });

export default GuardNewEditBottomSheet;
