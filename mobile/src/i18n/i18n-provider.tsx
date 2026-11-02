import React, { useEffect, useState } from "react";
import { I18nextProvider } from "react-i18next";
import { I18nManager } from "react-native";
import i18n from "@/i18n";
import { getStoredLanguage } from "@/utils/storage";

export function I18nProvider({
  lang,
  children,
}: {
  lang?: string;
  children: React.ReactNode;
}) {
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    async function initLanguage() {
      try {
        const stored = await getStoredLanguage();
        const targetLang =
          lang ?? stored ?? (I18nManager.isRTL ? "ar" : "en");
        
        const shouldBeRTL = targetLang === "ar";

        // Always ensure RTL is allowed
        I18nManager.allowRTL(true);

        // If native direction does not match target language, force it
        if (I18nManager.isRTL !== shouldBeRTL) {
          I18nManager.forceRTL(shouldBeRTL);
        }

        if (targetLang && targetLang !== i18n.language) {
          await i18n.changeLanguage(targetLang);
        }
      } catch (e) {
        // Fallback to current i18n state
      } finally {
        setInitialized(true);
      }
    }

    initLanguage();
  }, [lang]);

  if (!initialized) return null;

  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}

export default I18nProvider;
