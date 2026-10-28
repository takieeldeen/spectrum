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
} from "react-native";
import { useTranslation } from "react-i18next";
import Lucide from "@react-native-vector-icons/lucide";

import { useTheme } from "@/hooks/use-theme";
import ThemedText from "@/components/themed-text";

export type PowerUnit = "W" | "kW";

export interface UnitBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  currentUnit?: PowerUnit;
  onApplyUnit?: (unit: PowerUnit) => void;
}

const UnitBottomSheet: React.FC<UnitBottomSheetProps> = ({
  visible,
  onClose,
  currentUnit = "W",
  onApplyUnit,
}) => {
  const theme = useTheme();
  const styles = createStyles(theme);
  const { t } = useTranslation();

  const [showModal, setShowModal] = useState(visible);
  const [selectedUnit, setSelectedUnit] = useState<PowerUnit>(currentUnit);

  const translateY = useRef(new Animated.Value(500)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setSelectedUnit(currentUnit);
      translateY.setValue(500);
      backdropOpacity.setValue(0);
      setShowModal(true);
    } else if (showModal) {
      handleClose();
    }
  }, [visible, currentUnit]);

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
        toValue: 500,
        duration: 220,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start(() => {
      setShowModal(false);
      onClose();
    });
  };

  const handleApply = () => {
    onApplyUnit?.(selectedUnit);
    handleClose();
  };

  if (!showModal) {
    return null;
  }

  const isWatt = selectedUnit === "W";
  const isKilowatt = selectedUnit === "kW";

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
                {t("PROFILE.UNIT_SHEET_TITLE")}
              </ThemedText>
              <ThemedText style={styles.headerSubtitle}>
                {t("PROFILE.UNIT_SHEET_SUBTITLE")}
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

          {/* Option 1: Watt (W) */}
          <TouchableOpacity
            style={[
              styles.optionCard,
              isWatt ? styles.optionCardSelected : styles.optionCardUnselected,
            ]}
            activeOpacity={0.8}
            onPress={() => setSelectedUnit("W")}
          >
            {/* Right side: Radio button + Title & Subtitle */}
            <View style={styles.optionContent}>
              <View
                style={[
                  styles.radioOuter,
                  isWatt ? styles.radioOuterSelected : styles.radioOuterUnselected,
                ]}
              >
                {isWatt && <View style={styles.radioInnerSelected} />}
              </View>

              <View style={styles.optionTextColumn}>
                <ThemedText weight="700" style={styles.optionTitle}>
                  {t("PROFILE.UNIT_WATT_TITLE")}
                </ThemedText>
                <ThemedText style={styles.optionSubtitle}>
                  {t("PROFILE.UNIT_WATT_SUBTITLE")}
                </ThemedText>
              </View>
            </View>

            {/* Left side: Sample Value Badge */}
            <ThemedText weight="800" style={styles.sampleValueText}>
              {t("PROFILE.UNIT_WATT_SAMPLE")}
            </ThemedText>
          </TouchableOpacity>

          {/* Option 2: Kilowatt (kW) */}
          <TouchableOpacity
            style={[
              styles.optionCard,
              isKilowatt
                ? styles.optionCardSelected
                : styles.optionCardUnselected,
            ]}
            activeOpacity={0.8}
            onPress={() => setSelectedUnit("kW")}
          >
            {/* Right side: Radio button + Title & Subtitle */}
            <View style={styles.optionContent}>
              <View
                style={[
                  styles.radioOuter,
                  isKilowatt
                    ? styles.radioOuterSelected
                    : styles.radioOuterUnselected,
                ]}
              >
                {isKilowatt && <View style={styles.radioInnerSelected} />}
              </View>

              <View style={styles.optionTextColumn}>
                <ThemedText weight="700" style={styles.optionTitle}>
                  {t("PROFILE.UNIT_KILOWATT_TITLE")}
                </ThemedText>
                <ThemedText style={styles.optionSubtitle}>
                  {t("PROFILE.UNIT_KILOWATT_SUBTITLE")}
                </ThemedText>
              </View>
            </View>

            {/* Left side: Sample Value Badge */}
            <ThemedText weight="800" style={styles.sampleValueText}>
              {t("PROFILE.UNIT_KILOWATT_SAMPLE")}
            </ThemedText>
          </TouchableOpacity>

          {/* Apply Button */}
          <TouchableOpacity
            style={styles.applyBtn}
            activeOpacity={0.85}
            onPress={handleApply}
          >
            <ThemedText weight="800" fontSize={18} style={styles.applyBtnText}>
              {t("PROFILE.APPLY")}
            </ThemedText>
          </TouchableOpacity>
        </Animated.View>
      </View>
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
      marginBottom: 20,
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

    /* Option Cards */
    optionCard: {
      borderRadius: 20,
      paddingVertical: 18,
      paddingHorizontal: 16,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 14,
    },
    optionCardSelected: {
      backgroundColor: theme.tintedIconBackground,
      borderWidth: 2,
      borderColor: theme.primary,
    },
    optionCardUnselected: {
      backgroundColor: theme.stepperBackground,
      borderWidth: 1,
      borderColor: theme.cardBorder,
    },
    optionContent: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      flex: 1,
    },

    /* Radio button */
    radioOuter: {
      width: 26,
      height: 26,
      borderRadius: 13,
      alignItems: "center",
      justifyContent: "center",
    },
    radioOuterSelected: {
      backgroundColor: theme.primary,
    },
    radioOuterUnselected: {
      borderWidth: 2,
      borderColor: theme.cardBorder,
    },
    radioInnerSelected: {
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: "#FFFFFF",
    },

    optionTextColumn: {
      flex: 1,
    },
    optionTitle: {
      fontSize: 16,
      color: theme.text,
      marginBottom: 3,
    },
    optionSubtitle: {
      fontSize: 12,
      color: theme.textSecondary,
    },

    sampleValueText: {
      fontSize: 16,
      color: theme.primary,
      marginLeft: 8,
    },

    /* Apply Button */
    applyBtn: {
      marginTop: 10,
      backgroundColor: theme.primary,
      borderRadius: 18,
      paddingVertical: 16,
      alignItems: "center",
      justifyContent: "center",
    },
    applyBtnText: {
      color: "#FFFFFF",
    },
  });

export default UnitBottomSheet;
