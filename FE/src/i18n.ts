import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import ar from './dictionaries/ar.json';
import en from './dictionaries/en.json';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      ar: { translation: ar },
      en: { translation: en },
    },
    lng: 'ar', // default locale
    fallbackLng: 'ar',
    interpolation: {
      escapeValue: false, // react already safes from xss
    },
  });

export default i18n;
