import React, { useState } from "react";
import {
  TouchableOpacity,
  StyleSheet,
  View,
  Platform,
} from "react-native";
import { useTranslation } from "react-i18next";
import { useRouter } from "expo-router";
import Lucide from "@react-native-vector-icons/lucide";

import { useTheme } from "@/hooks/use-theme";
import ThemedText from "@/components/themed-text";
import { useAuth } from "@/context/auth-context";
import {
  ConfirmationMessage,
  useConfirmationMessage,
} from "@/components/confirmation-message";

export interface LogoutButtonProps {
  onLogout?: () => void;
}

const LogoutButton: React.FC<LogoutButtonProps> = ({ onLogout }) => {
  const theme = useTheme();
  const styles = createStyles(theme);
  const { t } = useTranslation();
  const { logout } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const { showConfirmation, hideConfirmation, confirmationProps } =
    useConfirmationMessage();

  const performLogout = async () => {
    try {
      setLoading(true);
      await logout();
      hideConfirmation();
      onLogout?.();
      router.replace("/login");
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePress = () => {
    showConfirmation({
      variant: "Error",
      icon: <Lucide name="log-out" size={28} color="#DC2626" />,
      title: t("PROFILE.LOGOUT"),
      subtitle: t("PROFILE.CONFIRM_LOGOUT_MESSAGE"),
      confirmText: t("PROFILE.LOGOUT"),
      cancelText: t("CANCEL"),
      loading,
      onConfirm: performLogout,
    });
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.button}
        activeOpacity={0.7}
        onPress={handlePress}
        disabled={loading}
      >
        <ThemedText weight="700" style={styles.text} numberOfLines={1}>
          {t("PROFILE.LOGOUT")}
        </ThemedText>
        <Lucide name="log-out" size={20} color={theme.logoutText} />
      </TouchableOpacity>

      <ConfirmationMessage
        {...confirmationProps}
        loading={loading}
      />
    </View>
  );
};

const createStyles = (theme: ReturnType<typeof useTheme>) =>
  StyleSheet.create({
    container: {
      marginTop: 8,
      marginBottom: 32,
    },
    button: {
      width: "100%",
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 10,
      paddingVertical: 14,
      paddingHorizontal: 16,
      borderRadius: 24,
      borderWidth: 1.5,
      borderColor: theme.logoutBorder,
      backgroundColor: theme.logoutBackground,
      ...Platform.select({
        ios: {
          shadowColor: theme.logoutBorder,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 6,
        },
        android: {
          elevation: 1,
        },
      }),
    },
    text: {
      fontSize: 16,
      color: theme.logoutText,
      flexShrink: 1,
    },
  });

export default LogoutButton;
