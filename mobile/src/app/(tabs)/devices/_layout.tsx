import { View, Text } from "react-native";
import React from "react";
import { Stack } from "expo-router";
import { useTheme } from "@/hooks/use-theme";
import { Image } from "expo-image";
import { getAppFont } from "@/constants/fonts";
import { useTranslation } from "react-i18next";
// import LOGO from "@/assets/images/spectrum-mini-logo.png"

const DevicesLayout = () => {
  const theme = useTheme();
  const { i18n } = useTranslation();
  const isArabic = i18n.language?.startsWith("ar") ?? false;

  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          title: isArabic ? "أجهزتي" : "Devices",
          headerShadowVisible: false,
          headerStyle: {
            backgroundColor: theme.background,
          },
          headerTitleStyle: {
            fontSize: 28,
            color: theme.text,
            ...getAppFont("700", i18n.language),
          },
          headerLeft: () => (
            <Image
              source={require("@/assets/images/spectrum-mini-logo.png")}
              contentFit="contain"
              style={{ width: 32, height: 32, marginRight: 12 }}
            />
          ),
        }}
      />
    </Stack>
  );
};

export default DevicesLayout;
