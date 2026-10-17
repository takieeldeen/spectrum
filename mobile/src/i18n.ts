import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { I18nManager } from "react-native";

import ar from "./dictionaries/ar.json";
import en from "./dictionaries/en.json";

// Allow RTL layout in React Native
I18nManager.allowRTL(true);

i18n.use(initReactI18next).init({
  resources: {
    ar: { translation: ar },
    en: { translation: en },
  },
  lng: "ar", // default locale matching Next.js frontend
  fallbackLng: "en",
  interpolation: {
    escapeValue: false, // react already safes from xss
  },
});

const isArabic = (i18n.language || "ar").startsWith("ar");
if (I18nManager.isRTL !== isArabic) {
  I18nManager.forceRTL(isArabic);
}

i18n.on("languageChanged", (lng) => {
  const isAr = (lng || "en").startsWith("ar");
  if (I18nManager.isRTL !== isAr) {
    I18nManager.forceRTL(isAr);
  }
});

export default i18n;
