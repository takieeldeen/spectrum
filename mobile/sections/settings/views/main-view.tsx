import { StyleSheet, ScrollView } from "react-native";
import React from "react";
import Page from "@/components/page";
import { useTheme } from "@/hooks/use-theme";
import ProfileHeader from "../profile-header";
import PowerUsageSettings from "../power-usage-settings";
import ThemeModeSettings from "../theme-mode-settings";
import GeneralSettings from "../general-settings";
import LogoutButton from "../logout-button";

const ProfileMainView = () => {
  const theme = useTheme();
  const styles = createStyles(theme);

  return (
    <Page style={styles.page}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <ProfileHeader />
        <ThemeModeSettings />
        <PowerUsageSettings />
        <GeneralSettings />
        <LogoutButton />
      </ScrollView>
    </Page>
  );
};

const createStyles = (theme: ReturnType<typeof useTheme>) =>
  StyleSheet.create({
    page: {
      flex: 1,
    },
    scrollContent: {
      paddingHorizontal: 12,
      paddingTop: 8,
      paddingBottom: 40,
    },
  });

export default ProfileMainView;
