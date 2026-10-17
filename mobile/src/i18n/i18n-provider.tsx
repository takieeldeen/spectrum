import React, { useEffect, useState } from "react";
import { I18nextProvider } from "react-i18next";
import i18n from "@/i18n";

export function I18nProvider({
  lang,
  children,
}: {
  lang?: string;
  children: React.ReactNode;
}) {
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (lang && lang !== i18n.language) {
      i18n.changeLanguage(lang).finally(() => {
        setInitialized(true);
      });
    } else {
      setInitialized(true);
    }
  }, [lang]);

  if (!initialized) return null;

  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}

export default I18nProvider;
