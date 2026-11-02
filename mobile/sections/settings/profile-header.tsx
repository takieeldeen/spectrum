import { View, StyleSheet, TouchableOpacity } from "react-native";
import React, { useState } from "react";
import { useTheme } from "@/hooks/use-theme";
import { Image } from "expo-image";
import ThemedText from "@/components/themed-text";
import Lucide from "@react-native-vector-icons/lucide";
import { useAuth } from "@/context/auth-context";
import ProfileEditModal from "./profile-edit-modal";
import i18n from "@/i18n";

const DEFAULT_AVATAR = "https://mockmind-api.uifaces.co/content/human/215.jpg";

const ProfileHeader = () => {
  const theme = useTheme();
  const styles = createStyles(theme);
  const { user } = useAuth();
  const [showEditModal, setShowEditModal] = useState(false);

  const displayName = user?.name || "User";
  const displayEmail = user?.email || "";
  const displayImage = user?.imageUrl || DEFAULT_AVATAR;

  return (
    <>
      <View style={styles.card}>
        <View style={styles.upperPart}>
          <TouchableOpacity
            style={styles.primaryInfoContainer}
            onPress={() => setShowEditModal(true)}
            activeOpacity={0.8}
          >
            <View style={styles.imageContainer}>
              <Image source={{ uri: displayImage }} style={styles.image} />
            </View>
            <View style={styles.infoTextContainer}>
              <ThemedText numberOfLines={1} style={styles.nameText}>
                {displayName}
              </ThemedText>
              <ThemedText numberOfLines={1} style={styles.emailText}>
                {displayEmail}
              </ThemedText>
            </View>
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => setShowEditModal(true)}
              activeOpacity={0.7}
            >
              <Lucide name="pen" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </TouchableOpacity>
        </View>
      </View>

      <ProfileEditModal
        visible={showEditModal}
        onClose={() => setShowEditModal(false)}
      />
    </>
  );
};

const createStyles = (theme: ReturnType<typeof useTheme>) =>
  StyleSheet.create({
    card: {
      backgroundColor: theme.primaryDark,
      padding: 12,
      borderRadius: 12,
    },
    upperPart: {
      flexDirection: i18n.language === "en" ? "row" : "row-reverse",
      alignItems: "center",
    },

    primaryInfoContainer: {
      flexDirection: i18n.language === "en" ? "row" : "row-reverse",
      gap: 12,
      marginRight: i18n.language === "en" ? "auto" : 0,
      marginLeft: i18n.language === "ar" ? "auto" : 0,
    },

    imageContainer: {
      backgroundColor: "white",
      width: 64,
      height: 64,
      borderRadius: 32,
      overflow: "hidden",
    },

    image: {
      width: "100%",
      height: "100%",
    },
    infoTextContainer: {
      alignItems: i18n.language === "en" ? "flex-start" : "flex-end",
      justifyContent: "center",
      flex: 1,
    },
    editButton: {
      width: 48,
      height: 48,
      backgroundColor: "#ffffff40",
      borderRadius: 24,
      alignItems: "center",
      justifyContent: "center",
      marginLeft: 10,
    },
    nameText: {
      fontWeight: "800",
      fontSize: 20,
      color: "white",
    },
    emailText: {
      fontWeight: "400",
      fontSize: 14,
      color: "white",
    },
  });

export default ProfileHeader;
