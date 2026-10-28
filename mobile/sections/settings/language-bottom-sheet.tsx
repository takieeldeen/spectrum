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
import { changeAppLanguage } from "@/i18n";
import { useAuth } from "@/context/auth-context";
import { useUpdateProfileMutation } from "@/api/user";
import { saveStoredLanguage } from "@/utils/storage";

export type LanguageCode = "ar" | "en";

export interface LanguageBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  currentLanguage?: LanguageCode;
  onApplyLanguage?: (lang: LanguageCode) => void;
}

const LanguageBottomSheet: React.FC<LanguageBottomSheetProps> = ({
  visible,
  onClose,
  currentLanguage,
  onApplyLanguage,
}) => {
  const theme = useTheme();
  const styles = createStyles(theme);
  const { t, i18n } = useTranslation();
  const { user, updateUser } = useAuth();
  const updateProfileMutation = useUpdateProfileMutation();

  const activeLang =
    currentLanguage ??
    (user?.language ??
      ((i18n.language || "ar").startsWith("ar") ? "ar" : "en"));

  const [showModal, setShowModal] = useState(visible);
  const [selectedLang, setSelectedLang] = useState<LanguageCode>(activeLang);

  const translateY = useRef(new Animated.Value(500)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setSelectedLang(activeLang);
      translateY.setValue(500);
      backdropOpacity.setValue(0);
      setShowModal(true);
    } else if (showModal) {
      handleClose();
    }
  }, [visible, activeLang]);

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

  const handleApply = async () => {
    onApplyLanguage?.(selectedLang);
    handleClose();

    // 1. Save to local storage as fallback
    await saveStoredLanguage(selectedLang);

    // 2. If authenticated, persist to user model in database
    if (user) {
      updateUser({ language: selectedLang });
      try {
        await updateProfileMutation.mutateAsync({ language: selectedLang });
      } catch (err) {
        console.warn("Failed to persist language to backend:", err);
      }
    }

    // 3. Switch language and restart native layout
    await changeAppLanguage(selectedLang);
  };

  if (!showModal) {
    return null;
  }

  const isArabic = selectedLang === "ar";
  const isEnglish = selectedLang === "en";

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
                {t("PROFILE.LANGUAGE_SHEET_TITLE")}
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

          {/* Option 1: Arabic (العربية) */}
          <TouchableOpacity
            style={[
              styles.optionCard,
              isArabic
                ? styles.optionCardSelected
                : styles.optionCardUnselected,
            ]}
            activeOpacity={0.8}
            onPress={() => setSelectedLang("ar")}
          >
            {/* Start Side: Badge + Titles */}
            <View style={styles.optionContent}>
              <View style={styles.langBadge}>
                <ThemedText weight="800" style={styles.arabicBadgeText}>
                  ع
                </ThemedText>
              </View>

              <View style={styles.optionTextColumn}>
                <ThemedText weight="700" style={styles.optionTitle}>
                  {t("PROFILE.LANG_ARABIC_TITLE")}
                </ThemedText>
                <ThemedText style={styles.optionSubtitle}>
                  {t("PROFILE.LANG_ARABIC_SUBTITLE")}
                </ThemedText>
              </View>
            </View>

            {/* End Side: Radio Button */}
            <View
              style={[
                styles.radioOuter,
                isArabic
                  ? styles.radioOuterSelected
                  : styles.radioOuterUnselected,
              ]}
            >
              {isArabic && (
                <View style={styles.radioInnerWhiteRing}>
                  <View style={styles.radioCenterDot} />
                </View>
              )}
            </View>
          </TouchableOpacity>

          {/* Option 2: English */}
          <TouchableOpacity
            style={[
              styles.optionCard,
              isEnglish
                ? styles.optionCardSelected
                : styles.optionCardUnselected,
            ]}
            activeOpacity={0.8}
            onPress={() => setSelectedLang("en")}
          >
            {/* Start Side: Badge + Titles */}
            <View style={styles.optionContent}>
              <View style={styles.langBadge}>
                <ThemedText weight="800" style={styles.englishBadgeText}>
                  En
                </ThemedText>
              </View>

              <View style={styles.optionTextColumn}>
                <ThemedText weight="700" style={styles.optionTitle}>
                  {t("PROFILE.LANG_ENGLISH_TITLE")}
                </ThemedText>
                <ThemedText style={styles.optionSubtitle}>
                  {t("PROFILE.LANG_ENGLISH_SUBTITLE")}
                </ThemedText>
              </View>
            </View>

            {/* End Side: Radio Button */}
            <View
              style={[
                styles.radioOuter,
                isEnglish
                  ? styles.radioOuterSelected
                  : styles.radioOuterUnselected,
              ]}
            >
              {isEnglish && (
                <View style={styles.radioInnerWhiteRing}>
                  <View style={styles.radioCenterDot} />
                </View>
              )}
            </View>
          </TouchableOpacity>

          {/* Restart / Reload note */}
          <ThemedText style={styles.noteText}>
            {t("PROFILE.LANGUAGE_RELOAD_NOTE")}
          </ThemedText>

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
      alignItems: "center",
      justifyContent: "space-between",
      marginTop: 8,
      marginBottom: 20,
    },
    titleColumn: {
      flex: 1,
    },
    headerTitle: {
      color: theme.text,
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
      paddingVertical: 14,
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

    /* Badges */
    langBadge: {
      width: 48,
      height: 48,
      borderRadius: 16,
      backgroundColor: theme.cardBackground,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: theme.cardBorder,
    },
    arabicBadgeText: {
      fontSize: 22,
      color: theme.text,
    },
    englishBadgeText: {
      fontSize: 18,
      color: theme.primary,
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
      fontSize: 13,
      color: theme.textSecondary,
    },

    /* Radio button */
    radioOuter: {
      width: 28,
      height: 28,
      borderRadius: 14,
      alignItems: "center",
      justifyContent: "center",
      marginHorizontal: 4,
    },
    radioOuterSelected: {
      backgroundColor: theme.primary,
    },
    radioOuterUnselected: {
      borderWidth: 2,
      borderColor: theme.cardBorder,
    },
    radioInnerWhiteRing: {
      width: 14,
      height: 14,
      borderRadius: 7,
      backgroundColor: "#FFFFFF",
      alignItems: "center",
      justifyContent: "center",
    },
    radioCenterDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: theme.primary,
    },

    /* Note Text */
    noteText: {
      fontSize: 13,
      color: theme.textSecondary,
      textAlign: "center",
      marginTop: 8,
      marginBottom: 20,
      paddingHorizontal: 20,
      lineHeight: 20,
    },

    /* Apply Button */
    applyBtn: {
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

export default LanguageBottomSheet;
