import { DarkTheme, DefaultTheme, ThemeProvider, Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useColorScheme } from "react-native";
import { useEffect, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { AnimatedSplashOverlay } from "@/components/animated-icon";
import { AuthProvider } from "@/context/auth-context";
import { I18nProvider } from "@/i18n/i18n-provider";
import { SnackbarProvider } from "@/components/ui/snackbar-provider";
import { StatusBar } from "expo-status-bar";
import { useFonts } from "expo-font";
import { CAIRO_FONTS_MAP } from "@/constants/fonts";
import "@/i18n";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded] = useFonts(CAIRO_FONTS_MAP);
  const colorScheme = useColorScheme();
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: 2,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );
  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <I18nProvider>
          <ThemeProvider
            value={colorScheme === "dark" ? DarkTheme : DefaultTheme}
          >
            <SnackbarProvider>
              <AnimatedSplashOverlay />
              <StatusBar style={colorScheme === "dark" ? "light" : "dark"} />
              <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="index" />
                <Stack.Screen name="login" />
                <Stack.Screen name="register" />
                <Stack.Screen name="verify-email" />
                <Stack.Screen name="activate" />
                <Stack.Screen name="(tabs)" />
                <Stack.Screen name="forget-password" />
              </Stack>
            </SnackbarProvider>
          </ThemeProvider>
        </I18nProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
