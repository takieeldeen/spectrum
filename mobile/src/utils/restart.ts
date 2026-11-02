import { Platform, DevSettings } from "react-native";
import * as Updates from "expo-updates";

/**
 * Restarts the application to apply native layout changes (RTL / LTR).
 */
export async function restartApp(): Promise<void> {
  if (Platform.OS === "web") {
    if (typeof window !== "undefined" && window.location) {
      window.location.reload();
    }
    return;
  }

  // 1. Try DevSettings.reload first in development
  if (__DEV__ && DevSettings && typeof DevSettings.reload === "function") {
    try {
      DevSettings.reload();
      return;
    } catch (e) {
      // DevSettings reload fallback
    }
  }

  // 2. Try expo-updates reloadAsync in production / standalone
  try {
    if (Updates && typeof Updates.reloadAsync === "function") {
      await Updates.reloadAsync();
      return;
    }
  } catch (e) {
    // Updates.reloadAsync might not be supported without release channel
  }
}
