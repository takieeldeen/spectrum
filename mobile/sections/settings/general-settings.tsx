import React, { useState } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Platform,
  I18nManager,
} from "react-native";
import { useTranslation } from "react-i18next";
import Constants from "expo-constants";
import Lucide from "@react-native-vector-icons/lucide";

import { useTheme } from "@/hooks/use-theme";
import ThemedText from "@/components/themed-text";
import { useAuth } from "@/context/auth-context";
import LanguageBottomSheet, { LanguageCode } from "./language-bottom-sheet";
import i18n from "@/i18n";

export interface GeneralSettingsProps {
  currentLanguage?: string;
  appVersion?: string;
  onPressLanguage?: () => void;
  onSelectLanguage?: (lang: LanguageCode) => void;
  onPressAbout?: () => void;
}

const GeneralSettings: React.FC<GeneralSettingsProps> = ({
  currentLanguage,
  appVersion,
  onPressLanguage,
  onSelectLanguage,
  onPressAbout,
}) => {
  const theme = useTheme();
  const styles = createStyles(theme);
  const { t, i18n } = useTranslation();
  const { user } = useAuth();

  const [isLangSheetVisible, setIsLangSheetVisible] = useState(false);

  const activeLangCode =
    user?.language ?? ((i18n.language || "ar").startsWith("ar") ? "ar" : "en");
  const displayLangText =
    currentLanguage ??
    (activeLangCode === "ar"
      ? t("PROFILE.LANG_ARABIC_TITLE")
      : t("PROFILE.LANG_ENGLISH_TITLE"));

  const handleOpenLanguage = () => {
    if (onPressLanguage) {
      onPressLanguage();
    } else {
      setIsLangSheetVisible(true);
    }
  };

  const handleApplyLanguage = (lang: LanguageCode) => {
    onSelectLanguage?.(lang);
  };

  const isRtl = I18nManager.isRTL || (i18n.language || "ar").startsWith("ar");
  const chevronIconName = isRtl ? "chevron-left" : "chevron-right";

  const resolvedVersion =
    appVersion ??
    t("PROFILE.APP_VERSION", {
      version: Constants.expoConfig?.version ?? "1.0.0",
    });

  return (
    <View style={styles.container}>
      {/* Section Title */}
      <ThemedText weight="700" fontSize={18} style={styles.sectionTitle}>
        {t("PROFILE.GENERAL")}
      </ThemedText>

      {/* Settings Card */}
      <View style={styles.card}>
        {/* Row 1: Language */}
        <TouchableOpacity
          style={styles.row}
          activeOpacity={0.7}
          onPress={handleOpenLanguage}
        >
          <View style={styles.rowStart}>
            <View style={styles.iconContainer}>
              <Lucide name="globe" size={20} color={theme.primary} />
            </View>
            <View style={styles.textContainer}>
              <ThemedText weight="700" style={styles.rowTitle}>
                {t("PROFILE.LANGUAGE")}
              </ThemedText>
            </View>
          </View>

          <View style={styles.rowEnd}>
            <ThemedText weight="500" style={styles.valueText}>
              {displayLangText}
            </ThemedText>
            <Lucide
              name={chevronIconName}
              size={18}
              color={theme.textSecondary}
            />
          </View>
        </TouchableOpacity>

        <View style={styles.divider} />

        {/* Row 2: About App / Version */}
        <TouchableOpacity
          style={styles.row}
          activeOpacity={0.7}
          onPress={onPressAbout}
          disabled={!onPressAbout}
        >
          <View style={styles.rowStart}>
            <View style={styles.iconContainer}>
              <Lucide name="info" size={20} color={theme.primary} />
            </View>
            <View style={styles.textContainer}>
              <ThemedText weight="700" style={styles.rowTitle}>
                {t("PROFILE.ABOUT_APP")}
              </ThemedText>
            </View>
          </View>

          <View style={styles.rowEnd}>
            <ThemedText weight="500" style={styles.valueText}>
              {resolvedVersion}
            </ThemedText>
            <Lucide
              name={chevronIconName}
              size={18}
              color={theme.textSecondary}
            />
          </View>
        </TouchableOpacity>
      </View>

      {/* Language Bottom Sheet Modal */}
      <LanguageBottomSheet
        visible={isLangSheetVisible}
        onClose={() => setIsLangSheetVisible(false)}
        onApplyLanguage={handleApplyLanguage}
      />
    </View>
  );
};

const createStyles = (theme: ReturnType<typeof useTheme>) =>
  StyleSheet.create({
    container: {
      marginTop: 20,
      marginBottom: 32,
    },
    sectionTitle: {
      marginBottom: 12,
      paddingHorizontal: 4,
      color: theme.text,
      textAlign: i18n.language === "en" ? "left" : "right",
    },
    card: {
      backgroundColor: theme.cardBackground,
      borderRadius: 20,
      paddingHorizontal: 16,
      borderWidth: 1,
      borderColor: theme.cardBorder,
      ...Platform.select({
        ios: {
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.04,
          shadowRadius: 8,
        },
        android: {
          elevation: 1.5,
        },
      }),
    },
    row: {
      flexDirection: i18n.language === "en" ? "row" : "row-reverse",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: 14,
    },
    rowStart: {
      flexDirection: i18n.language === "en" ? "row" : "row-reverse",
      alignItems: "center",
      gap: 12,
      flex: 1,
    },
    iconContainer: {
      width: 44,
      height: 44,
      borderRadius: 14,
      backgroundColor: theme.tintedIconBackground,
      alignItems: "center",
      justifyContent: "center",
    },
    textContainer: {
      flex: i18n.language === "ar" ? 0 : 1,
      justifyContent: "center",
    },
    rowTitle: {
      fontSize: 15,
      color: theme.text,
    },
    rowEnd: {
      flexDirection: i18n.language === "en" ? "row" : "row-reverse",
      alignItems: "center",
      gap: 8,
    },
    valueText: {
      fontSize: 14,
      color: theme.textSecondary,
    },
    divider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: theme.divider,
    },
  });

export default GeneralSettings;
