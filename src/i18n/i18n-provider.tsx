'use client';

import { useEffect, useState } from 'react';
import { I18nextProvider } from 'react-i18next';
import i18n from '../i18n';
import { useSettingsContext } from 'src/components/settings';

export function I18nProvider({ lang, children }: { lang: string, children: React.ReactNode }) {
  const [initialized, setInitialized] = useState(false);
  const settings = useSettingsContext();

  useEffect(() => {
    i18n.changeLanguage(lang).then(() => {
      const dir = lang === 'ar' ? 'rtl' : 'ltr';
      document.dir = dir;
      if (settings.direction !== dir) {
        settings.onUpdateField('direction', dir);
      }
      setInitialized(true);
    });
  }, [lang, settings]);

  if (!initialized) return null;

  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}
