import { Platform, DevSettings } from "react-native";
import * as Updates from "expo-updates";

let RNRestart: { restart?: () => void } | null = null;
try {
  RNRestart =
    require("react-native-restart").default || require("react-native-restart");
} catch {
  RNRestart = null;
}

/**
 * Restarts the application so native I18nManager.isRTL can take effect.
 * Fast Refresh / a JS-only reload is not enough — Yoga reads the flag at boot.
 */
export async function restartApp(): Promise<void> {
  if (Platform.OS === "web") {
    if (typeof window !== "undefined" && window.location) {
      window.location.reload();
    }
    return;
  }

  if (RNRestart && typeof RNRestart.restart === "function") {
    try {
      RNRestart.restart();
      return;
    } catch {
      // Fall through
    }
  }

  try {
    const expo = require("expo") as { reloadAppAsync?: (reason?: string) => Promise<void> };
    if (typeof expo.reloadAppAsync === "function") {
      await expo.reloadAppAsync("rtl-layout");
      return;
    }
  } catch {
    // Fall through
  }

  try {
    if (Updates && typeof Updates.reloadAsync === "function") {
      await Updates.reloadAsync();
      return;
    }
  } catch {
    // Fall through
  }

  if (__DEV__ && DevSettings && typeof DevSettings.reload === "function") {
    try {
      DevSettings.reload();
    } catch {
      // Ignore
    }
  }
}
