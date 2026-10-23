import { Platform } from "react-native";
import * as FileSystem from "expo-file-system/legacy";
import { User } from "@/types/user";
let SecureStore: typeof import("expo-secure-store") | null = null;
try {
  SecureStore = require("expo-secure-store");
} catch {
  SecureStore = null;
}

export interface StoredAuthSession {
  token: string;
  user: User;
}

const AUTH_FILE_NAME = "spectrum_auth_session.json";
const STORAGE_KEY = "spectrum_auth_session";

// In-memory fallback
let memoryStorage: StoredAuthSession | null = null;

/**
 * Persists user session (token and user object) to disk / local storage
 */
export async function saveAuthSession(
  token: string,
  user: User,
): Promise<void> {
  const payload: StoredAuthSession = { token, user };
  memoryStorage = payload;

  try {
    if (Platform.OS === "web") {
      if (typeof window !== "undefined" && window.localStorage) {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
      }
      return;
    }

    let saved = false;
    if (SecureStore?.setItemAsync) {
      try {
        await SecureStore.setItemAsync(STORAGE_KEY, JSON.stringify(payload));
        saved = true;
      } catch (e) {
        // Fall back to FileSystem
      }
    }

    if (!saved && FileSystem.documentDirectory) {
      const fileUri = `${FileSystem.documentDirectory}${AUTH_FILE_NAME}`;
      await FileSystem.writeAsStringAsync(fileUri, JSON.stringify(payload));
    }
  } catch (err) {
    console.warn("Failed to persist auth session to storage:", err);
  }
}

/**
 * Retrieves preserved user session from disk / local storage
 */
export async function getAuthSession(): Promise<StoredAuthSession | null> {
  try {
    if (Platform.OS === "web") {
      if (typeof window !== "undefined" && window.localStorage) {
        const data = window.localStorage.getItem(STORAGE_KEY);
        if (data) {
          const parsed = JSON.parse(data) as StoredAuthSession;
          memoryStorage = parsed;
          return parsed;
        }
      }
      return memoryStorage;
    }

    if (SecureStore?.getItemAsync) {
      try {
        const data = await SecureStore.getItemAsync(STORAGE_KEY);
        if (data) {
          const parsed = JSON.parse(data) as StoredAuthSession;
          memoryStorage = parsed;
          return parsed;
        }
      } catch (e) {
        // Fall back to FileSystem
      }
    }

    if (FileSystem.documentDirectory) {
      const fileUri = `${FileSystem.documentDirectory}${AUTH_FILE_NAME}`;
      const fileInfo = await FileSystem.getInfoAsync(fileUri);
      if (fileInfo.exists) {
        const content = await FileSystem.readAsStringAsync(fileUri);
        if (content) {
          const parsed = JSON.parse(content) as StoredAuthSession;
          memoryStorage = parsed;
          return parsed;
        }
      }
    }
  } catch (err) {
    console.warn("Failed to retrieve auth session from storage:", err);
  }

  return memoryStorage;
}

/**
 * Removes preserved session from disk / local storage
 */
export async function clearAuthSession(): Promise<void> {
  memoryStorage = null;

  try {
    if (Platform.OS === "web") {
      if (typeof window !== "undefined" && window.localStorage) {
        window.localStorage.removeItem(STORAGE_KEY);
      }
      return;
    }

    if (FileSystem.documentDirectory) {
      const fileUri = `${FileSystem.documentDirectory}${AUTH_FILE_NAME}`;
      const fileInfo = await FileSystem.getInfoAsync(fileUri);
      if (fileInfo.exists) {
        await FileSystem.deleteAsync(fileUri, { idempotent: true });
      }
    }
  } catch (err) {
    console.warn("Failed to clear auth session from storage:", err);
  }
}
