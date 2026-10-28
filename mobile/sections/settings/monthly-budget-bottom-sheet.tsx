import React, { useState, useEffect, useRef } from "react";
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
} from "react-native";
import { useTranslation } from "react-i18next";
import Lucide from "@react-native-vector-icons/lucide";

import { useTheme } from "@/hooks/use-theme";
import ThemedText from "@/components/themed-text";

export interface MonthlyBudgetBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  currentBudget?: number;
  currentAlertPercent?: number;
  onSaveBudget?: (budget: number, alertPercent: number) => void;
}

const BUDGET_PRESETS = [150, 300, 500, 1000];
const PERCENT_PRESETS = [50, 80, 100];

const MonthlyBudgetBottomSheet: React.FC<MonthlyBudgetBottomSheetProps> = ({
  visible,
  onClose,
  currentBudget = 300,
  currentAlertPercent = 80,
  onSaveBudget,
}) => {
  const theme = useTheme();
  const styles = createStyles(theme);
  const { t, i18n } = useTranslation();

  const isRtl = I18nManager.isRTL || (i18n.language || "ar").startsWith("ar");

  const [showModal, setShowModal] = useState(visible);
  const [budget, setBudget] = useState(currentBudget);
  const [manualInput, setManualInput] = useState(String(currentBudget));
  const [alertPercent, setAlertPercent] = useState(currentAlertPercent);

  const translateY = useRef(new Animated.Value(600)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setBudget(currentBudget);
      setManualInput(String(currentBudget));
      setAlertPercent(currentAlertPercent);
      translateY.setValue(600);
      backdropOpacity.setValue(0);
      setShowModal(true);
    } else if (showModal) {
      handleClose();
    }
  }, [visible, currentBudget, currentAlertPercent]);

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
        toValue: 600,
        duration: 220,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start(() => {
      setShowModal(false);
      onClose();
    });
  };

  const handleSelectPreset = (value: number) => {
    setBudget(value);
    setManualInput(String(value));
  };

  const handleManualInputChange = (text: string) => {
    setManualInput(text);
    const parsed = parseFloat(text);
    if (!isNaN(parsed) && parsed > 0) {
      setBudget(parsed);
    }
  };

  const handleSave = () => {
    onSaveBudget?.(budget, alertPercent);
    handleClose();
  };

  const calculatedAlertAmount = Math.round((budget * alertPercent) / 100);

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
            StyleSheet.absoluteFill,
            {
              backgroundColor: theme.overlayBackground,
              opacity: backdropOpacity,
            },
          ]}
        >
          <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />
        </Animated.View>

        {/* Animated Bottom Sheet Card */}
        <Animated.View
          style={[
            styles.sheetCard,
            {
              transform: [{ translateY }],
            },
          ]}
        >
          {/* Top Handle */}
          <View style={styles.handleContainer}>
            <View style={styles.handle} />
          </View>

          {/* Header Row */}
          <View style={styles.headerRow}>
            <View style={styles.titleColumn}>
              <ThemedText weight="800" fontSize={22} style={styles.headerTitle}>
                {t("PROFILE.BUDGET_SHEET_TITLE")}
              </ThemedText>
              <ThemedText style={styles.headerSubtitle}>
                {t("PROFILE.BUDGET_SHEET_SUBTITLE")}
              </ThemedText>
            </View>

            <TouchableOpacity
              style={styles.closeBtn}
              activeOpacity={0.7}
              onPress={handleClose}
            >
              <Lucide name="x" size={18} color={theme.text} />
            </TouchableOpacity>
          </View>

          {/* Emerald Hero Card */}
          <View style={styles.heroCard}>
            <ThemedText weight="600" style={styles.heroLabel}>
              {t("PROFILE.MONTHLY_LIMIT_LABEL")}
            </ThemedText>
            <ThemedText weight="800" style={styles.heroBudgetAmount}>
              {budget}
            </ThemedText>
            <ThemedText weight="500" style={styles.heroUnit}>
              {t("PROFILE.PER_MONTH_LABEL")}
            </ThemedText>
          </View>

          {/* Preset Suggestions Row */}
          <View style={styles.presetsRow}>
            {BUDGET_PRESETS.map((amount) => {
              const isSelected = budget === amount;
              return (
                <TouchableOpacity
                  key={amount}
                  style={[
                    styles.presetPill,
                    isSelected
                      ? styles.presetPillSelected
                      : styles.presetPillUnselected,
                  ]}
                  activeOpacity={0.75}
                  onPress={() => handleSelectPreset(amount)}
                >
                  <ThemedText
                    weight={isSelected ? "800" : "700"}
                    style={[
                      styles.presetText,
                      isSelected
                        ? styles.presetTextSelected
                        : styles.presetTextUnselected,
                    ]}
                  >
                    {amount}
                  </ThemedText>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Manual Entry Input below suggestions */}
          <View style={styles.manualInputWrapper}>
            <TextInput
              style={[
                styles.manualTextInput,
                { textAlign: isRtl ? "right" : "left" },
              ]}
              placeholder={t("PROFILE.CUSTOM_BUDGET_PLACEHOLDER")}
              placeholderTextColor={theme.textSecondary}
              keyboardType="numeric"
              value={manualInput}
              onChangeText={handleManualInputChange}
            />
            <ThemedText weight="600" style={styles.inputCurrency}>
              {t("PROFILE.CURRENCY_EGP")}
            </ThemedText>
          </View>

          {/* Alert Threshold Section */}
          <ThemedText weight="700" fontSize={15} style={styles.alertSectionTitle}>
            {t("PROFILE.ALERT_AT_TITLE")}
          </ThemedText>

          <View style={styles.percentRow}>
            {PERCENT_PRESETS.map((pct) => {
              const isSelected = alertPercent === pct;
              return (
                <TouchableOpacity
                  key={pct}
                  style={[
                    styles.percentPill,
                    isSelected
                      ? styles.percentPillSelected
                      : styles.percentPillUnselected,
                  ]}
                  activeOpacity={0.75}
                  onPress={() => setAlertPercent(pct)}
                >
                  <ThemedText
                    weight={isSelected ? "800" : "700"}
                    style={[
                      styles.percentText,
                      isSelected
                        ? styles.percentTextSelected
                        : styles.percentTextUnselected,
                    ]}
                  >
                    {pct}%
                  </ThemedText>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Calculated Alert Amount Note */}
          <ThemedText style={styles.alertNoteText}>
            {t("PROFILE.ALERT_CALCULATION_TEXT", {
              amount: calculatedAlertAmount,
            })}
          </ThemedText>

          {/* Save Button */}
          <TouchableOpacity
            style={styles.saveBtn}
            activeOpacity={0.85}
            onPress={handleSave}
          >
            <ThemedText weight="800" fontSize={18} style={styles.saveBtnText}>
              {t("PROFILE.SAVE_BUDGET")}
            </ThemedText>
          </TouchableOpacity>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const createStyles = (theme: ReturnType<typeof useTheme>) =>
  StyleSheet.create({
    modalOverlay: {
      flex: 1,
      justifyContent: "flex-end",
    },
    sheetCard: {
      backgroundColor: theme.cardBackground,
      borderTopLeftRadius: 32,
      borderTopRightRadius: 32,
      paddingHorizontal: 20,
      paddingTop: 12,
      paddingBottom: Platform.OS === "ios" ? 40 : 28,
      borderWidth: 1,
      borderColor: theme.cardBorder,
      ...Platform.select({
        ios: {
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -6 },
          shadowOpacity: 0.12,
          shadowRadius: 16,
        },
        android: {
          elevation: 12,
        },
      }),
    },
    handleContainer: {
      alignItems: "center",
      paddingVertical: 6,
    },
    handle: {
      width: 48,
      height: 5,
      borderRadius: 3,
      backgroundColor: theme.divider,
    },
    headerRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      justifyContent: "space-between",
      marginTop: 8,
      marginBottom: 16,
    },
    titleColumn: {
      flex: 1,
    },
    headerTitle: {
      color: theme.text,
      marginBottom: 4,
    },
    headerSubtitle: {
      fontSize: 13,
      color: theme.textSecondary,
    },
    closeBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.closeBtnBackground,
      alignItems: "center",
      justifyContent: "center",
      marginLeft: 12,
    },

    /* Emerald Hero Card */
    heroCard: {
      backgroundColor: theme.primary,
      borderRadius: 24,
      paddingVertical: 22,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 16,
      ...Platform.select({
        ios: {
          shadowColor: theme.primary,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.25,
          shadowRadius: 10,
        },
        android: {
          elevation: 4,
        },
      }),
    },
    heroLabel: {
      color: "#FFFFFF",
      opacity: 0.9,
      fontSize: 14,
      marginBottom: 4,
    },
    heroBudgetAmount: {
      color: "#FFFFFF",
      fontSize: 48,
      lineHeight: 54,
    },
    heroUnit: {
      color: "#FFFFFF",
      opacity: 0.9,
      fontSize: 14,
      marginTop: 4,
    },

    /* Preset Suggestion Pills */
    presetsRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      marginBottom: 12,
    },
    presetPill: {
      flex: 1,
      height: 48,
      borderRadius: 16,
      alignItems: "center",
      justifyContent: "center",
    },
    presetPillSelected: {
      backgroundColor: theme.tintedIconBackground,
      borderWidth: 2,
      borderColor: theme.primary,
    },
    presetPillUnselected: {
      backgroundColor: theme.stepperBackground,
      borderWidth: 1,
      borderColor: theme.cardBorder,
    },
    presetText: {
      fontSize: 16,
    },
    presetTextSelected: {
      color: theme.primary,
    },
    presetTextUnselected: {
      color: theme.text,
    },

    /* Manual Input Row */
    manualInputWrapper: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: theme.stepperBackground,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: theme.cardBorder,
      paddingHorizontal: 14,
      height: 48,
      marginBottom: 16,
    },
    manualTextInput: {
      flex: 1,
      fontSize: 15,
      color: theme.text,
      paddingVertical: 8,
    },
    inputCurrency: {
      fontSize: 14,
      color: theme.textSecondary,
      marginLeft: 8,
    },

    /* Alert Threshold Section */
    alertSectionTitle: {
      color: theme.text,
      marginBottom: 10,
    },
    percentRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      marginBottom: 10,
    },
    percentPill: {
      flex: 1,
      height: 48,
      borderRadius: 16,
      alignItems: "center",
      justifyContent: "center",
    },
    percentPillSelected: {
      backgroundColor: theme.tintedIconBackground,
      borderWidth: 2,
      borderColor: theme.primary,
    },
    percentPillUnselected: {
      backgroundColor: theme.stepperBackground,
      borderWidth: 1,
      borderColor: theme.cardBorder,
    },
    percentText: {
      fontSize: 16,
    },
    percentTextSelected: {
      color: theme.primary,
    },
    percentTextUnselected: {
      color: theme.text,
    },
    alertNoteText: {
      fontSize: 13,
      color: theme.textSecondary,
      marginBottom: 18,
      textAlign: "center",
    },

    /* Save Button */
    saveBtn: {
      backgroundColor: theme.primary,
      borderRadius: 18,
      paddingVertical: 16,
      alignItems: "center",
      justifyContent: "center",
    },
    saveBtnText: {
      color: "#FFFFFF",
    },
  });

export default MonthlyBudgetBottomSheet;
