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

export interface KwhPriceBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  currentPrice?: number;
  onSavePrice?: (price: number) => void;
  dailyKwhEstimate?: number;
}

const KwhPriceBottomSheet: React.FC<KwhPriceBottomSheetProps> = ({
  visible,
  onClose,
  currentPrice = 0.7,
  onSavePrice,
  dailyKwhEstimate = 0.24,
}) => {
  const theme = useTheme();
  const styles = createStyles(theme);
  const { t } = useTranslation();

  const [showModal, setShowModal] = useState(visible);
  const [price, setPrice] = useState(currentPrice);

  const translateY = useRef(new Animated.Value(500)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setPrice(currentPrice);
      translateY.setValue(500);
      backdropOpacity.setValue(0);
      setShowModal(true);
    } else if (showModal) {
      handleClose();
    }
  }, [visible, currentPrice]);

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

  const handleIncrement = () => {
    setPrice((prev) => Number((prev + 0.05).toFixed(2)));
  };

  const handleDecrement = () => {
    setPrice((prev) => (prev > 0.05 ? Number((prev - 0.05).toFixed(2)) : 0));
  };

  const handleSave = () => {
    onSavePrice?.(price);
    handleClose();
  };

  const estimatedDailyCost = (dailyKwhEstimate * price).toFixed(2);

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
        {/* Animated Backdrop */}
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
          {/* Top Drag Handle */}
          <View style={styles.handleContainer}>
            <View style={styles.handle} />
          </View>

          {/* Sheet Header */}
          <View style={styles.headerRow}>
            <View style={styles.titleColumn}>
              <ThemedText weight="800" fontSize={22} style={styles.headerTitle}>
                {t("PROFILE.KWH_PRICE_SHEET_TITLE")}
              </ThemedText>
              <ThemedText style={styles.headerSubtitle}>
                {t("PROFILE.KWH_PRICE_SHEET_SUBTITLE")}
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

          {/* Stepper Card */}
          <View style={styles.stepperCard}>
            {/* Minus Button */}
            <TouchableOpacity
              style={styles.minusBtn}
              activeOpacity={0.8}
              onPress={handleDecrement}
            >
              <Lucide name="minus" size={24} color={theme.text} />
            </TouchableOpacity>

            {/* Price Value & Unit */}
            <View style={styles.priceColumn}>
              <ThemedText weight="800" style={styles.priceText}>
                {price.toFixed(2)}
              </ThemedText>
              <ThemedText style={styles.unitText}>
                {t("PROFILE.KWH_UNIT_LABEL")}
              </ThemedText>
            </View>

            {/* Plus Button */}
            <TouchableOpacity
              style={styles.plusBtn}
              activeOpacity={0.8}
              onPress={handleIncrement}
            >
              <Lucide name="plus" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {/* Daily Consumption Calculation Banner */}
          <View style={styles.insightBanner}>
            <ThemedText style={styles.insightText}>
              {t("PROFILE.KWH_ESTIMATE_CALCULATION", {
                kwh: dailyKwhEstimate,
                cost: estimatedDailyCost,
              })}
            </ThemedText>

            <View style={styles.zapBadge}>
              <Lucide name="zap" size={20} color={theme.primary} />
            </View>
          </View>

          {/* Save Button */}
          <TouchableOpacity
            style={styles.saveBtn}
            activeOpacity={0.85}
            onPress={handleSave}
          >
            <ThemedText weight="800" fontSize={18} style={styles.saveBtnText}>
              {t("PROFILE.SAVE_PRICE")}
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
    stepperCard: {
      backgroundColor: theme.stepperBackground,
      borderRadius: 24,
      paddingVertical: 22,
      paddingHorizontal: 16,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    minusBtn: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: theme.cardBackground,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: theme.cardBorder,
      ...Platform.select({
        ios: {
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.06,
          shadowRadius: 6,
        },
        android: {
          elevation: 2,
        },
      }),
    },
    priceColumn: {
      alignItems: "center",
      justifyContent: "center",
      flex: 1,
    },
    priceText: {
      fontSize: 42,
      color: theme.text,
      lineHeight: 48,
    },
    unitText: {
      fontSize: 13,
      color: theme.textSecondary,
      marginTop: 4,
    },
    plusBtn: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: theme.primary,
      alignItems: "center",
      justifyContent: "center",
      ...Platform.select({
        ios: {
          shadowColor: theme.primary,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
        },
        android: {
          elevation: 4,
        },
      }),
    },
    insightBanner: {
      marginTop: 16,
      backgroundColor: theme.tintedIconBackground,
      borderRadius: 18,
      paddingVertical: 14,
      paddingHorizontal: 16,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
    },
    insightText: {
      flex: 1,
      fontSize: 13,
      lineHeight: 20,
      color: theme.text,
    },
    zapBadge: {
      width: 44,
      height: 44,
      borderRadius: 14,
      backgroundColor: theme.cardBackground,
      alignItems: "center",
      justifyContent: "center",
    },
    saveBtn: {
      marginTop: 20,
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

export default KwhPriceBottomSheet;
