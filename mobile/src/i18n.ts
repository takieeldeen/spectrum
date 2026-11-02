import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { I18nManager } from "react-native";

import ar from "./dictionaries/ar.json";
import en from "./dictionaries/en.json";
import { saveStoredLanguage } from "./utils/storage";
import { restartApp } from "./utils/restart";

// 1. Always allow RTL at the native level so switching to RTL is never blocked
I18nManager.allowRTL(true);

// Determine initial locale from native I18nManager.isRTL
const initialLocale = I18nManager.isRTL ? "ar" : "en";

i18n.use(initReactI18next).init({
  resources: {
    ar: { translation: ar },
    en: { translation: en },
  },
  lng: initialLocale,
  fallbackLng: "en",
  interpolation: {
    escapeValue: false, // react already safes from xss
  },
});

export async function changeAppLanguage(lang: "ar" | "en") {
  const isAr = lang === "ar";

  // Persist language to local storage
  await saveStoredLanguage(lang);

  // Set native RTL layout flag
  // CRITICAL: Always keep allowRTL(true) enabled so RTL support is never revoked at runtime!
  I18nManager.allowRTL(true);
  I18nManager.forceRTL(isAr);

  // Switch i18n language
  await i18n.changeLanguage(lang);

  // Brief delay to ensure native SharedPreferences / NSUserDefaults flush to disk
  await new Promise((resolve) => setTimeout(resolve, 300));

  // Restart the app to apply the proper native layout (RTL or LTR)
  await restartApp();
}

export default i18n;
