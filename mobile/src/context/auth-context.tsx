import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  useCallback,
} from "react";
import { Appearance } from "react-native";
import { User, AuthContextType, UserTheme, UserLanguage } from "@/types/user";
import {
  saveAuthSession,
  getAuthSession,
  clearAuthSession,
  saveStoredTheme,
  getStoredTheme,
  saveStoredLanguage,
  getStoredLanguage,
} from "@/utils/storage";
import { getMe } from "@/api/auth";
import i18n, { changeAppLanguage } from "@/i18n";

export function applyTheme(themeMode?: UserTheme | null) {
  if (!themeMode) return;
  if (themeMode === "system") {
    Appearance.setColorScheme("unspecified");
  } else {
    Appearance.setColorScheme(themeMode);
  }
}

export async function applyLanguage(lang?: UserLanguage | null) {
  if (!lang) return;
  const normalized: "ar" | "en" = lang.startsWith("ar") ? "ar" : "en";
  const current: "ar" | "en" = (i18n.language || "ar").startsWith("ar")
    ? "ar"
    : "en";
  if (normalized === current) return;
  await changeAppLanguage(normalized);
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load preserved auth session and settings on app startup
  useEffect(() => {
    let isMounted = true;

    async function loadStoredSessionAndSettings() {
      try {
        // 1. Initial fallback: load settings from local storage
        const [fallbackTheme, fallbackLang, stored] = await Promise.all([
          getStoredTheme(),
          getStoredLanguage(),
          getAuthSession(),
        ]);

        if (fallbackTheme) {
          applyTheme(fallbackTheme);
        }
        if (fallbackLang) {
          await applyLanguage(fallbackLang);
        }

        // 2. If stored session exists, prefill user and their preferences
        if (stored && stored.token && stored.user) {
          if (isMounted) {
            setToken(stored.token);
            setUser(stored.user);
          }

          if (stored.user.theme) {
            applyTheme(stored.user.theme);
            saveStoredTheme(stored.user.theme);
          }
          if (stored.user.language) {
            await applyLanguage(stored.user.language);
            saveStoredLanguage(stored.user.language);
          }

          // 3. In the background, verify and refresh latest user state from backend
          try {
            const freshUser = await getMe(stored.token);
            if (isMounted && freshUser) {
              setUser(freshUser);
              await saveAuthSession(stored.token, freshUser);

              // Apply fresh settings from DB and update local fallback
              if (freshUser.theme) {
                applyTheme(freshUser.theme);
                await saveStoredTheme(freshUser.theme);
              }
              if (freshUser.language) {
                await applyLanguage(freshUser.language);
                await saveStoredLanguage(freshUser.language);
              }
            }
          } catch (apiErr: any) {
            const message = apiErr?.message?.toLowerCase?.() || "";
            if (
              message.includes("unauthorized") ||
              message.includes("jwt expired") ||
              message.includes("invalid token")
            ) {
              if (isMounted) {
                setToken(null);
                setUser(null);
              }
              await clearAuthSession();
            }
          }
        }
      } catch (err) {
        console.warn("Failed to load initial auth session:", err);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadStoredSessionAndSettings();

    return () => {
      isMounted = false;
    };
  }, []);

  const login = useCallback(async (newToken: string, newUser: User) => {
    setToken(newToken);
    setUser(newUser);
    await saveAuthSession(newToken, newUser);

    // Apply and persist user settings from login
    if (newUser.theme) {
      applyTheme(newUser.theme);
      await saveStoredTheme(newUser.theme);
    }
    if (newUser.language) {
      await applyLanguage(newUser.language);
      await saveStoredLanguage(newUser.language);
    }
  }, []);

  const logout = useCallback(async () => {
    setToken(null);
    setUser(null);
    await clearAuthSession();
  }, []);

  const updateUser = useCallback(
    (updated: Partial<User>) => {
      setUser((prev) => {
        if (!prev) return null;
        const next = { ...prev, ...updated };
        if (token) {
          saveAuthSession(token, next);
        }
        return next;
      });

      if (updated.theme) {
        applyTheme(updated.theme);
        saveStoredTheme(updated.theme);
      }
      if (updated.language) {
        applyLanguage(updated.language);
        saveStoredLanguage(updated.language);
      }
    },
    [token],
  );

  const value = useMemo(
    () => ({
      user,
      token,
      isAuthenticated: !!token,
      isLoading,
      login,
      logout,
      updateUser,
    }),
    [user, token, isLoading, login, logout, updateUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
