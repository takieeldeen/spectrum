import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { I18nManager, Platform } from "react-native";
import ar from "./dictionaries/ar.json";
import en from "./dictionaries/en.json";
import { saveStoredLanguage } from "./utils/storage";

I18nManager.allowRTL(true);

const initialLocale = "ar";

i18n.use(initReactI18next).init({
  resources: {
    ar: { translation: ar },
    en: { translation: en },
  },
  lng: initialLocale,
  fallbackLng: "ar",
  interpolation: {
    escapeValue: false,
  },
});

export function isRtlLanguage(lang?: string | null) {
  return (lang ?? "ar").startsWith("ar");
}

export async function changeAppLanguage(lang: "ar" | "en") {
  await saveStoredLanguage(lang);

  if (Platform.OS !== "web") {
    I18nManager.allowRTL(true);
    I18nManager.forceRTL(isRtlLanguage(lang));
  }

  await i18n.changeLanguage(lang);
}

export default i18n;
