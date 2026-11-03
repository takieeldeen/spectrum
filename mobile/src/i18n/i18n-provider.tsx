import React, { useEffect, useState } from "react";
import { I18nextProvider } from "react-i18next";
import i18n from "@/i18n";
import { getStoredLanguage } from "@/utils/storage";
import { LayoutDirectionProvider } from "@/i18n/layout-direction";

function normalizeLang(value?: string | null): "ar" | "en" {
  return (value ?? "ar").startsWith("ar") ? "ar" : "en";
}

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
        const targetLang = normalizeLang(lang ?? stored ?? "ar");

        if (targetLang !== normalizeLang(i18n.language)) {
          await i18n.changeLanguage(targetLang);
        }
      } catch {
        // Fallback to current i18n state
      } finally {
        setInitialized(true);
      }
    }

    initLanguage();
  }, [lang]);

  if (!initialized) return null;

  return (
    <I18nextProvider i18n={i18n}>
      <LayoutDirectionProvider>{children}</LayoutDirectionProvider>
    </I18nextProvider>
  );
}

export default I18nProvider;
