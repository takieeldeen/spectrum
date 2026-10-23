import React from "react";
import {
  StyleSheet,
  View,
  StyleProp,
  ViewStyle,
  Dimensions,
} from "react-native";
import { Image } from "expo-image";
import { useTranslation } from "react-i18next";
import { Lucide } from "@react-native-vector-icons/lucide";

import { ThemedText } from "@/components/themed-text";
import { Button } from "@/components/ui";
import { useTheme } from "@/hooks/use-theme";

/* ==========================================================================
   1. TYPES & PROPS
   ========================================================================== */

export interface EmptyViewProps {
  onAddNew?: () => void;
  style?: StyleProp<ViewStyle>;
}

const { width: SCREEN_WIDTH } = Dimensions.get("window");

/* ==========================================================================
   2. EMPTY VIEW COMPONENT (DEVICES)
   ========================================================================== */

export function EmptyView({ onAddNew, style }: EmptyViewProps) {
  const theme = useTheme();
  const { t } = useTranslation();
  const isDark = theme.isDark;

  const imageSource = isDark
    ? require("@/../assets/images/states/empty-dark.png")
    : require("@/../assets/images/states/empty-light.png");

  return (
    <View style={[styles.container, style]}>
      {/* 1. Empty State Illustration */}
      <Image
        source={imageSource}
        style={styles.image}
        contentFit="contain"
        transition={300}
      />

      {/* 2. Text Content */}
      <View style={styles.textContainer}>
        <ThemedText style={styles.title}>{t("NO_DEVICES_FOUND")}</ThemedText>

        <ThemedText
          style={[styles.description, { color: theme.textSecondary }]}
        >
          {t("EMPTY_DEVICES_DESCRIPTION")}
        </ThemedText>
      </View>

      {/* 3. Action Button */}
      {onAddNew && (
        <Button
          variant="outlined"
          color="primary"
          size="large"
          onPress={onAddNew}
          style={styles.actionButton}
          startIcon={<Lucide name="plus" size={18} color={theme.primary} />}
        >
          <ThemedText style={[styles.buttonText, { color: theme.primary }]}>
            {t("NEW_DEVICE")}
          </ThemedText>
        </Button>
      )}
    </View>
  );
}

export default EmptyView;

/* ==========================================================================
   3. STYLES
   ========================================================================== */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  image: {
    width: Math.min(SCREEN_WIDTH * 0.65, 260),
    height: Math.min(SCREEN_WIDTH * 0.55, 220),
    marginBottom: 20,
    alignSelf: "center",
  },
  textContainer: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    maxWidth: 340,
    marginBottom: 24,
  },
  title: {
    width: "100%",
    fontSize: 20,
    fontWeight: "700",
    textAlign: "center",
    alignSelf: "center",
    marginBottom: 8,
    lineHeight: 28,
  },
  description: {
    width: "100%",
    fontSize: 14,
    textAlign: "center",
    alignSelf: "center",
    lineHeight: 22,
    fontWeight: "400",
  },
  actionButton: {
    minWidth: 160,
    alignSelf: "center",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  buttonText: {
    fontSize: 15,
    fontWeight: "600",
    textAlign: "center",
  },
});
