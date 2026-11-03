import React, { useState } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Appearance,
  Platform,
} from "react-native";
import { useTranslation } from "react-i18next";
import Lucide from "@react-native-vector-icons/lucide";

import { Colors } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import ThemedText from "@/components/themed-text";
import { useAuth } from "@/context/auth-context";
import { useUpdateProfileMutation } from "@/api/user";
import { saveStoredTheme, getStoredTheme } from "@/utils/storage";
import i18n from "@/i18n";

export type ThemeMode = "light" | "dark" | "system";

export interface ThemeModeSettingsProps {
  initialTheme?: ThemeMode;
  onThemeChange?: (mode: ThemeMode) => void;
}

const PREVIEW_LIGHT_BG = Colors.light.backgroundElement;
const PREVIEW_LIGHT_BLOCK = Colors.light.backgroundSelected;
const PREVIEW_DARK_BG = Colors.dark.background;
const PREVIEW_DARK_BLOCK = Colors.dark.backgroundSelected;
const PREVIEW_BAR = Colors.light.primary;

const ThemeModeSettings: React.FC<ThemeModeSettingsProps> = ({
  initialTheme,
  onThemeChange,
}) => {
  const theme = useTheme();
  const styles = createStyles(theme);
  const { t } = useTranslation();
  const { user, updateUser } = useAuth();
  const updateProfileMutation = useUpdateProfileMutation();

  // Determine current active mode from user model, initial prop, or local storage/system
  const [selectedTheme, setSelectedTheme] = useState<ThemeMode>(
    initialTheme ?? user?.theme ?? "system",
  );

  React.useEffect(() => {
    if (user?.theme) {
      setSelectedTheme(user.theme);
    } else {
      getStoredTheme().then((stored) => {
        if (stored) {
          setSelectedTheme(stored);
        }
      });
    }
  }, [user?.theme]);

  const handleSelectTheme = async (mode: ThemeMode) => {
    setSelectedTheme(mode);
    if (mode === "system") {
      Appearance.setColorScheme("unspecified");
    } else {
      Appearance.setColorScheme(mode);
    }

    // 1. Save to local storage as fallback
    await saveStoredTheme(mode);

    // 2. If user is logged in, persist to database model
    if (user) {
      updateUser({ theme: mode });
      try {
        await updateProfileMutation.mutateAsync({ theme: mode });
      } catch (err) {
        console.warn("Failed to persist theme to database:", err);
      }
    }

    onThemeChange?.(mode);
  };

  const getActiveModeLabel = () => {
    switch (selectedTheme) {
      case "dark":
        return t("PROFILE.THEME_DARK_FULL");
      case "system":
        return t("PROFILE.THEME_SYSTEM_FULL");
      case "light":
      default:
        return t("PROFILE.THEME_LIGHT_FULL");
    }
  };

  return (
    <View style={styles.container}>
      {/* Header: Title on start (right in RTL), Active mode label on end (left in RTL) */}
      <View style={styles.headerRow}>
        <ThemedText weight="700" fontSize={18} style={styles.sectionTitle}>
          {t("PROFILE.APPEARANCE")}
        </ThemedText>
        <ThemedText weight="500" fontSize={14} style={styles.activeModeLabel}>
          {getActiveModeLabel()}
        </ThemedText>
      </View>

      {/* 3 Theme Mode Cards */}
      <View style={styles.cardsRow}>
        {/* Option 1: Light Mode (فاتح) */}
        <TouchableOpacity
          style={[
            styles.card,
            selectedTheme === "light"
              ? styles.cardSelected
              : styles.cardUnselected,
          ]}
          activeOpacity={0.8}
          onPress={() => handleSelectTheme("light")}
        >
          {/* Light Window Preview */}
          <View style={styles.lightPreview}>
            <View style={styles.previewTopBar} />
            <View style={styles.previewBottomRow}>
              <View style={styles.lightPreviewBlock} />
              <View style={styles.lightPreviewBlock} />
            </View>
          </View>

          {/* Label + Checkmark if active */}
          <View style={styles.labelRow}>
            {selectedTheme === "light" && (
              <Lucide name="check" size={16} color={theme.primary} />
            )}
            <ThemedText weight="700" style={styles.cardLabel}>
              {t("PROFILE.THEME_LIGHT")}
            </ThemedText>
          </View>
        </TouchableOpacity>

        {/* Option 2: Dark Mode (داكن) */}
        <TouchableOpacity
          style={[
            styles.card,
            selectedTheme === "dark"
              ? styles.cardSelected
              : styles.cardUnselected,
          ]}
          activeOpacity={0.8}
          onPress={() => handleSelectTheme("dark")}
        >
          {/* Dark Window Preview */}
          <View style={styles.darkPreview}>
            <View style={styles.previewTopBar} />
            <View style={styles.previewBottomRow}>
              <View style={styles.darkPreviewBlock} />
              <View style={styles.darkPreviewBlock} />
            </View>
          </View>

          {/* Label + Checkmark if active */}
          <View style={styles.labelRow}>
            {selectedTheme === "dark" && (
              <Lucide name="check" size={16} color={theme.primary} />
            )}
            <ThemedText weight="700" style={styles.cardLabel}>
              {t("PROFILE.THEME_DARK")}
            </ThemedText>
          </View>
        </TouchableOpacity>

        {/* Option 3: Auto / System (تلقائي) */}
        <TouchableOpacity
          style={[
            styles.card,
            selectedTheme === "system"
              ? styles.cardSelected
              : styles.cardUnselected,
          ]}
          activeOpacity={0.8}
          onPress={() => handleSelectTheme("system")}
        >
          {/* Split Window Preview */}
          <View style={styles.splitPreviewContainer}>
            {/* Split Background: Dark on left, Light on right */}
            <View style={styles.splitBackgroundRow}>
              <View style={styles.splitDarkHalf} />
              <View style={styles.splitLightHalf} />
            </View>

            {/* Content overlay */}
            <View style={styles.splitContentOverlay}>
              <View style={styles.previewTopBar} />
              <View style={styles.previewBottomRow}>
                <View style={styles.darkPreviewBlock} />
                <View style={styles.lightPreviewBlock} />
              </View>
            </View>
          </View>

          {/* Label + Checkmark if active */}
          <View style={styles.labelRow}>
            {selectedTheme === "system" && (
              <Lucide name="check" size={16} color={theme.primary} />
            )}
            <ThemedText weight="700" style={styles.cardLabel}>
              {t("PROFILE.THEME_SYSTEM")}
            </ThemedText>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const createStyles = (theme: ReturnType<typeof useTheme>) =>
  StyleSheet.create({
    container: {
      marginTop: 20,
    },
    headerRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 12,
      paddingHorizontal: 4,
    },
    sectionTitle: {
      color: theme.text,
    },
    activeModeLabel: {
      color: theme.textSecondary,
    },
    cardsRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    card: {
      flex: 1,
      backgroundColor: theme.cardBackground,
      borderRadius: 20,
      padding: 10,
      borderWidth: 2,
      ...Platform.select({
        ios: {
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.04,
          shadowRadius: 6,
        },
        android: {
          elevation: 1,
        },
      }),
    },
    cardSelected: {
      borderColor: theme.primary,
    },
    cardUnselected: {
      borderColor: theme.cardBorder,
    },

    /* Previews */
    lightPreview: {
      height: 74,
      borderRadius: 14,
      backgroundColor: PREVIEW_LIGHT_BG,
      padding: 8,
      justifyContent: "space-between",
    },
    darkPreview: {
      height: 74,
      borderRadius: 14,
      backgroundColor: PREVIEW_DARK_BG,
      padding: 8,
      justifyContent: "space-between",
    },
    splitPreviewContainer: {
      height: 74,
      borderRadius: 14,
      overflow: "hidden",
      position: "relative",
    },
    splitBackgroundRow: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      flexDirection: "row",
    },
    splitDarkHalf: {
      flex: 1,
      backgroundColor: PREVIEW_DARK_BG,
    },
    splitLightHalf: {
      flex: 1,
      backgroundColor: PREVIEW_LIGHT_BG,
    },
    splitContentOverlay: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      padding: 8,
      justifyContent: "space-between",
    },

    /* Preview internal blocks */
    previewTopBar: {
      height: 14,
      borderRadius: 7,
      backgroundColor: PREVIEW_BAR,
    },
    previewBottomRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    lightPreviewBlock: {
      flex: 1,
      height: 26,
      borderRadius: 8,
      backgroundColor: PREVIEW_LIGHT_BLOCK,
    },
    darkPreviewBlock: {
      flex: 1,
      height: 26,
      borderRadius: 8,
      backgroundColor: PREVIEW_DARK_BLOCK,
    },

    /* Card Label */
    labelRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      marginTop: 10,
      marginBottom: 2,
    },
    cardLabel: {
      fontSize: 15,
      color: theme.text,
    },
  });

export default ThemeModeSettings;
