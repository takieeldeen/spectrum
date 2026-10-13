import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  PermissionsAndroid,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { WebBadge } from "@/components/web-badge";
import { BottomTabInset, MaxContentWidth, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import WifiManager from "react-native-wifi-reborn";

export default function TabTwoScreen() {
  const safeAreaInsets = useSafeAreaInsets();
  const insets = {
    ...safeAreaInsets,
    bottom: safeAreaInsets.bottom + BottomTabInset + Spacing.three,
  };
  const theme = useTheme();

  const [wifiNetworkName, setWifiNetworkName] = useState("");
  const [wifiPassword, setWifiPassword] = useState("");
  const [connecting, setConnecting] = useState(false);

  const connectToSpecificSSID = async () => {
    if (!wifiNetworkName.trim()) {
      Alert.alert("Validation Error", "Please enter a Wifi Network Name.");
      return;
    }

    try {
      setConnecting(true);
      if (Platform.OS === "android") {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: "Location permission is required for WiFi connections",
            message:
              "This app needs location permission as this is required to scan and connect to WiFi networks.",
            buttonNegative: "DENY",
            buttonPositive: "ALLOW",
          },
        );
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          Alert.alert("Permission Denied", "Location permission is required for WiFi connections.");
          setConnecting(false);
          return;
        }
      }
      const ssid = wifiNetworkName.trim();
      const password = wifiPassword;
      const isWep = false;
      const isHidden = false;
      await WifiManager.connectToProtectedSSID(ssid, password, isWep, isHidden);
      Alert.alert("Connected", `Successfully connected to "${ssid}"!`);
    } catch (e: any) {
      console.warn(e);
      Alert.alert("Connection Error", e?.message || "Failed to connect to WiFi network.");
    } finally {
      setConnecting(false);
    }
  };

  const contentPlatformStyle = Platform.select({
    android: {
      paddingTop: insets.top,
      paddingLeft: insets.left,
      paddingRight: insets.right,
      paddingBottom: insets.bottom,
    },
    web: {
      paddingTop: Spacing.six,
      paddingBottom: Spacing.four,
    },
  });

  return (
    <ScrollView
      style={[styles.scrollView, { backgroundColor: theme.background }]}
      contentInset={insets}
      contentContainerStyle={[styles.contentContainer, contentPlatformStyle]}
    >
      <ThemedView style={styles.container}>
        <ThemedView style={styles.titleContainer}>
          <ThemedText type="subtitle">Explore</ThemedText>
          <ThemedText style={styles.centerText} themeColor="textSecondary">
            Configure your WiFi credentials below to connect your device.
          </ThemedText>
        </ThemedView>

        <ThemedView type="backgroundElement" style={styles.formCard}>
          <View style={styles.inputGroup}>
            <ThemedText type="smallBold" style={styles.label}>
              Wifi Network Name
            </ThemedText>
            <TextInput
              style={[
                styles.input,
                {
                  color: theme.text,
                  backgroundColor: theme.background,
                  borderColor: theme.backgroundSelected,
                },
              ]}
              placeholder="Wifi Network Name"
              placeholderTextColor={theme.textSecondary}
              value={wifiNetworkName}
              onChangeText={setWifiNetworkName}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.inputGroup}>
            <ThemedText type="smallBold" style={styles.label}>
              Wifi Password
            </ThemedText>
            <TextInput
              style={[
                styles.input,
                {
                  color: theme.text,
                  backgroundColor: theme.background,
                  borderColor: theme.backgroundSelected,
                },
              ]}
              placeholder="Wifi Password"
              placeholderTextColor={theme.textSecondary}
              value={wifiPassword}
              onChangeText={setWifiPassword}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <Pressable
            disabled={connecting}
            style={({ pressed }) => [
              styles.connectButton,
              { backgroundColor: theme.text },
              pressed && styles.pressed,
              connecting && styles.disabled,
            ]}
            onPress={connectToSpecificSSID}
          >
            {connecting ? (
              <ActivityIndicator color={theme.background} />
            ) : (
              <ThemedText
                type="smallBold"
                style={[styles.connectButtonText, { color: theme.background }]}
              >
                Connect
              </ThemedText>
            )}
          </Pressable>
        </ThemedView>

        {Platform.OS === "web" && <WebBadge />}
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    flexDirection: "row",
    justifyContent: "center",
  },
  container: {
    maxWidth: MaxContentWidth,
    flexGrow: 1,
    paddingHorizontal: Spacing.four,
  },
  titleContainer: {
    gap: Spacing.two,
    alignItems: "center",
    paddingVertical: Spacing.six,
  },
  centerText: {
    textAlign: "center",
  },
  formCard: {
    borderRadius: Spacing.four,
    padding: Spacing.five,
    gap: Spacing.four,
    marginTop: Spacing.two,
  },
  inputGroup: {
    gap: Spacing.two,
  },
  label: {
    marginBottom: Spacing.half,
  },
  input: {
    height: 48,
    borderRadius: Spacing.two,
    borderWidth: 1,
    paddingHorizontal: Spacing.three,
    fontSize: 16,
  },
  connectButton: {
    height: 48,
    borderRadius: Spacing.two,
    justifyContent: "center",
    alignItems: "center",
    marginTop: Spacing.two,
  },
  connectButtonText: {
    fontSize: 16,
  },
  pressed: {
    opacity: 0.8,
  },
  disabled: {
    opacity: 0.6,
  },
});
