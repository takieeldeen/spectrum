import React, { useMemo } from "react";
import { StyleSheet, StyleProp, ViewStyle } from "react-native";
import { useTranslation } from "react-i18next";

import { Combobox, ComboboxDefaultOption } from "@/components/ui/combobox";
import { changeAppLanguage } from "@/i18n";
import { useTheme } from "@/hooks/use-theme";

export interface LanguageComboboxProps {
  containerStyle?: StyleProp<ViewStyle>;
  triggerStyle?: StyleProp<ViewStyle>;
  compact?: boolean;
  showLabel?: boolean;
}

export function LanguageCombobox({
  containerStyle,
  triggerStyle,
  compact = true,
  showLabel = false,
}: LanguageComboboxProps) {
  const theme = useTheme();
  const styles = createStyles(theme);
  const { t, i18n } = useTranslation();

  const currentLang = (i18n.language || "ar").startsWith("ar") ? "ar" : "en";

  const languageOptions: ComboboxDefaultOption[] = useMemo(
    () => [
      {
        label: t("LANG_ARABIC_TITLE", { defaultValue: "العربية" }),
        value: "ar",
        subLabel: t("LANG_ARABIC_SUBTITLE", { defaultValue: "Arabic" }),
      },
      {
        label: t("LANG_ENGLISH_TITLE", { defaultValue: "English" }),
        value: "en",
        subLabel: t("LANG_ENGLISH_SUBTITLE", { defaultValue: "الإنجليزية" }),
      },
    ],
    [t],
  );

  const handleLanguageChange = async (newLang: string) => {
    if (!newLang || newLang === currentLang) {
      return;
    }
    if (newLang === "ar" || newLang === "en") {
      await changeAppLanguage(newLang);
    }
  };

  return (
    <Combobox
      label={showLabel ? t("LOGIN_PAGE.LANGUAGE_LABEL", { defaultValue: "Language" }) : undefined}
      value={currentLang}
      onChange={handleLanguageChange}
      options={languageOptions}
      leadIcon="globe"
      clearable={false}
      allowEmpty={false}
      showSearch={false}
      placeholder={t("LOGIN_PAGE.SELECT_LANGUAGE", { defaultValue: "Language" })}
      containerStyle={[styles.container, containerStyle]}
      triggerStyle={[
        compact ? styles.compactTrigger : styles.regularTrigger,
        triggerStyle,
      ]}
    />
  );
}

export default LanguageCombobox;

const createStyles = (theme: ReturnType<typeof useTheme>) =>
  StyleSheet.create({
    container: {
      alignSelf: "flex-end",
    },
    compactTrigger: {
      height: 38,
      minWidth: 124,
      paddingHorizontal: 12,
      borderRadius: 19,
      backgroundColor: theme.socketInnerBackground,
      borderColor: theme.cardBorder,
    },
    regularTrigger: {
      height: 48,
      borderRadius: 14,
      backgroundColor: theme.socketInnerBackground,
      borderColor: theme.cardBorder,
    },
  });
