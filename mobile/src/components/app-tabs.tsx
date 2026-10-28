import { useTranslation } from "react-i18next";
import { useTheme } from "@/hooks/use-theme";
import { Tabs } from "expo-router";
import { Pressable, I18nManager } from "react-native";
import { Lucide } from "@react-native-vector-icons/lucide";
import { getAppFont } from "@/constants/fonts";

import { useGetUnreadNotificationsCount } from "@/api/notifications";

export default function AppTabs() {
  const theme = useTheme();
  const { t, i18n } = useTranslation();
  const isArabic = i18n.language?.startsWith("ar") ?? false;
  const { data: unreadCount } = useGetUnreadNotificationsCount();

  // If native I18nManager.isRTL has not taken effect in this session,
  // manually reverse tab order so reading flow is Right-to-Left (Profile on right, Plugs on left)
  const shouldReverseOrder = !I18nManager.isRTL && isArabic;

  const tabScreens = [
    <Tabs.Screen
      key="profile"
      name="profile"
      options={{
        headerShown: false,
        title: t("NAVBAR.PROFILE"),
        tabBarInactiveTintColor: theme.textSecondary,
        tabBarActiveTintColor: theme.primary,
        tabBarIcon: ({ color, size }) => (
          <Lucide name="user" color={color} size={size} />
        ),
      }}
    />,
    <Tabs.Screen
      key="notifications"
      name="notifications"
      options={{
        headerShown: false,
        title: t("NOTIFICATIONS.PAGE_TITLE"),
        tabBarInactiveTintColor: theme.textSecondary,
        tabBarActiveTintColor: theme.primary,
        tabBarBadge:
          unreadCount && unreadCount > 0
            ? unreadCount > 99
              ? "99+"
              : unreadCount
            : undefined,
        tabBarBadgeStyle: {
          backgroundColor: theme.logoutText,
          color: "#FFFFFF",
          fontSize: 10,
          fontWeight: "700",
        },
        tabBarIcon: ({ color, size }) => (
          <Lucide name="bell" color={color} size={size} />
        ),
      }}
    />,
    <Tabs.Screen
      key="index"
      name="index"
      options={{
        title: t("NAVBAR.HOME"),
        headerShown: false,
        tabBarActiveTintColor: "white",
        tabBarIcon: () => <Lucide name="house" color="white" size={24} />,
        tabBarInactiveTintColor: theme.textSecondary,
        tabBarIconStyle: {
          backgroundColor: theme.primary,
          aspectRatio: 1,
          height: 48,
          borderRadius: 24,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        },
        tabBarLabel: () => null,
        tabBarLabelStyle: { color: theme.background },
      }}
    />,
    <Tabs.Screen
      key="plugs"
      name="plugs"
      options={{
        headerShown: false,
        title: t("NAVBAR.PLUGS"),
        tabBarInactiveTintColor: theme.textSecondary,
        tabBarActiveTintColor: theme.primary,
        tabBarIcon: ({ color, size }) => (
          <Lucide name="plug" color={color} size={size} />
        ),
      }}
    />,
    <Tabs.Screen
      key="devices"
      name="devices"
      options={{
        headerShown: false,
        title: t("NAVBAR.DEVICES"),
        tabBarInactiveTintColor: theme.textSecondary,
        tabBarActiveTintColor: theme.primary,
        tabBarIcon: ({ color, size }) => (
          <Lucide name="server" color={color} size={size} />
        ),
      }}
    />,
  ];

  return (
    <Tabs
      screenOptions={{
        tabBarStyle: {
          backgroundColor: theme.background,
        },
        tabBarLabelStyle: {
          ...getAppFont("600", i18n.language),
        },

        headerPressColor: theme.primary,
        tabBarButton: ({ ref, ...rest }) => (
          <Pressable
            {...rest}
            ref={ref as any}
            android_ripple={{
              color: `${theme.primary}33`,
              borderless: true,
            }}
          />
        ),
      }}
    >
      <Tabs.Screen name="explore" options={{ href: null }} />
      {shouldReverseOrder ? [...tabScreens].reverse() : tabScreens}
    </Tabs>
  );
}
