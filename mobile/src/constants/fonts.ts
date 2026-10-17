import { TextStyle, Platform } from "react-native";
import {
  Cairo_200ExtraLight,
  Cairo_300Light,
  Cairo_400Regular,
  Cairo_500Medium,
  Cairo_600SemiBold,
  Cairo_700Bold,
  Cairo_800ExtraBold,
  Cairo_900Black,
} from "@expo-google-fonts/cairo";
import i18n from "@/i18n";

export type FontWeightValue =
  | "100"
  | "200"
  | "300"
  | "400"
  | "500"
  | "600"
  | "700"
  | "800"
  | "900"
  | 100
  | 200
  | 300
  | 400
  | 500
  | 600
  | 700
  | 800
  | 900
  | "normal"
  | "bold"
  | "ultralight"
  | "thin"
  | "light"
  | "medium"
  | "semibold"
  | "extrabold"
  | "heavy"
  | "black";

/**
 * Cairo fonts map to supply to `useFonts()` or `Font.loadAsync()`
 */
export const CAIRO_FONTS_MAP = {
  Cairo_200ExtraLight,
  Cairo_300Light,
  Cairo_400Regular,
  Cairo_500Medium,
  Cairo_600SemiBold,
  Cairo_700Bold,
  Cairo_800ExtraBold,
  Cairo_900Black,
  // Convenient alias family names
  "Cairo-ExtraLight": Cairo_200ExtraLight,
  "Cairo-Light": Cairo_300Light,
  "Cairo-Regular": Cairo_400Regular,
  "Cairo-Medium": Cairo_500Medium,
  "Cairo-SemiBold": Cairo_600SemiBold,
  "Cairo-Bold": Cairo_700Bold,
  "Cairo-ExtraBold": Cairo_800ExtraBold,
  "Cairo-Black": Cairo_900Black,
};

/**
 * Dynamically resolves the exact Cairo typeface file for each font weight.
 *
 * In React Native on Android, setting `fontFamily: 'Cairo'` with `fontWeight: '600'`
 * will fail to pick the semi-bold font file and fall back to regular (400) because Android
 * requires the specific font family name that maps to the loaded font file.
 * This helper guarantees 300, 400, 500, 600, 700, 800 all render with their distinct weights.
 */
export function getCairoFontFamily(weight?: FontWeightValue | string): string {
  const w = weight ? String(weight).toLowerCase() : "400";

  switch (w) {
    case "100":
    case "200":
    case "ultralight":
    case "thin":
      return "Cairo_200ExtraLight";

    case "300":
    case "light":
      return "Cairo_300Light";

    case "500":
    case "medium":
      return "Cairo_500Medium";

    case "600":
    case "semibold":
      return "Cairo_600SemiBold";

    case "700":
    case "bold":
      return "Cairo_700Bold";

    case "800":
    case "extrabold":
    case "heavy":
      return "Cairo_800ExtraBold";

    case "900":
    case "black":
      return "Cairo_900Black";

    case "400":
    case "normal":
    case "regular":
    default:
      return "Cairo_400Regular";
  }
}

/**
 * Returns dynamic font styles based on language and target font weight.
 * - For Arabic (`ar`): returns the exact Cairo font family and clears numeric `fontWeight`
 *   on Android so the font engine directly uses the true custom weight file.
 * - For English (`en`): uses standard font weight mapping.
 */
export function getAppFont(
  weight?: FontWeightValue | string,
  language?: string,
): TextStyle {
  const currentLang = language || i18n.language || "ar";
  const isArabic = currentLang.toLowerCase().startsWith("ar");

  if (isArabic) {
    const family = getCairoFontFamily(weight);
    return {
      fontFamily: family,
      // Crucial for Android: remove numeric fontWeight so Android doesn't fail to match the custom file
      fontWeight: Platform.select({
        android: undefined,
        ios: undefined,
        default: undefined,
      }),
    };
  }

  // English fallback: retain standard font weight
  const validWeight = (
    typeof weight === "number" ? String(weight) : weight || "normal"
  ) as TextStyle["fontWeight"];

  return {
    fontWeight: validWeight,
  };
}
