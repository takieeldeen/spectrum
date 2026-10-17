import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  useCallback,
} from "react";
import { User, AuthContextType } from "@/types/user";
import {
  saveAuthSession,
  getAuthSession,
  clearAuthSession,
} from "@/utils/storage";
import { getMe } from "@/api/auth";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load preserved auth session on app startup
  useEffect(() => {
    let isMounted = true;

    async function loadStoredSession() {
      try {
        const stored = await getAuthSession();
        if (stored && stored.token && stored.user) {
          if (isMounted) {
            setToken(stored.token);
            setUser(stored.user);
          }

          // In the background, verify and refresh latest user state from backend
          try {
            const freshUser = await getMe(stored.token);
            if (isMounted && freshUser) {
              setUser(freshUser);
              await saveAuthSession(stored.token, freshUser);
            }
          } catch (apiErr: any) {
            // If the server explicitly rejected the token (401 / expired), invalidate session
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

    loadStoredSession();

    return () => {
      isMounted = false;
    };
  }, []);

  const login = useCallback(async (newToken: string, newUser: User) => {
    setToken(newToken);
    setUser(newUser);
    await saveAuthSession(newToken, newUser);
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
