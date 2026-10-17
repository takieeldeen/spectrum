import React, { useState } from "react";
import {
  View,
  TextInput,
  Image,
  Pressable,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { SymbolView } from "expo-symbols";

import { ThemedText } from "@/components/themed-text";
import { useTheme } from "@/hooks/use-theme";
import { useLoginMutation } from "@/api/auth";
import { useAuth } from "@/context/auth-context";
import {
  ConfirmationMessage,
  useConfirmationMessage,
} from "@/components/confirmation-message";

/* ── Custom Fallback Icons for Pixel-Perfect Rendering ── */
function MailOutline({
  size = 20,
  color = "#6B7280",
}: {
  size?: number;
  color?: string;
}) {
  return (
    <View
      style={{
        width: size,
        height: size * 0.75,
        borderRadius: 4,
        borderWidth: 1.6,
        borderColor: color,
        justifyContent: "flex-start",
        alignItems: "center",
        overflow: "hidden",
      }}
    >
      <View
        style={{
          width: size * 0.7,
          height: size * 0.7,
          borderBottomWidth: 1.5,
          borderRightWidth: 1.5,
          borderColor: color,
          transform: [{ rotate: "45deg" }, { translateY: -size * 0.35 }],
        }}
      />
    </View>
  );
}

function LockOutline({
  size = 20,
  color = "#6B7280",
}: {
  size?: number;
  color?: string;
}) {
  return (
    <View style={{ width: size, height: size, alignItems: "center" }}>
      {/* Shackle */}
      <View
        style={{
          width: size * 0.6,
          height: size * 0.45,
          borderWidth: 1.6,
          borderColor: color,
          borderTopLeftRadius: size * 0.3,
          borderTopRightRadius: size * 0.3,
          borderBottomWidth: 0,
        }}
      />
      {/* Body */}
      <View
        style={{
          width: size * 0.85,
          height: size * 0.55,
          borderWidth: 1.6,
          borderColor: color,
          borderRadius: 4,
          justifyContent: "center",
          alignItems: "center",
          marginTop: -1,
        }}
      >
        <View
          style={{
            width: 3,
            height: 4,
            backgroundColor: color,
            borderRadius: 1.5,
          }}
        />
      </View>
    </View>
  );
}

function EyeOutline({
  size = 20,
  color = "#6B7280",
}: {
  size?: number;
  color?: string;
}) {
  return (
    <View
      style={{
        width: size,
        height: size * 0.65,
        borderWidth: 1.6,
        borderColor: color,
        borderRadius: size * 0.4,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <View
        style={{
          width: size * 0.3,
          height: size * 0.3,
          borderRadius: (size * 0.3) / 2,
          backgroundColor: color,
        }}
      />
    </View>
  );
}

const LoginView = () => {
  const theme = useTheme();
  const styles = createStyles(theme);
  const router = useRouter();
  const { login } = useAuth();
  const loginMutation = useLoginMutation();
  const { showConfirmation, confirmationProps } = useConfirmationMessage();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleSignIn = () => {
    if (!email.trim() || !password) {
      showConfirmation({
        variant: "Warning",
        title: "Missing Information",
        subtitle: "Please enter both your email and password.",
      });
      return;
    }

    loginMutation.mutate(
      { email: email.trim(), password },
      {
        onSuccess: async (response) => {
          await login(response.data.accessToken, response.data.user);
          router.replace("/(tabs)");
        },
        onError: (err) => {
          showConfirmation({
            variant: "Error",
            title: "Login Failed",
            subtitle:
              err.message || "Invalid email or password. Please try again.",
            confirmText: "Try Again",
          });
        },
      },
    );
  };

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: theme.background }]}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.headerContainer}>
            <Image
              source={require("@/assets/images/spectrum-mini-logo.png")}
              style={styles.logo}
              resizeMode="contain"
            />
            <ThemedText style={styles.title} type="title">
              Welcome Back
            </ThemedText>
            <ThemedText
              style={[styles.subtitle, { color: theme.textSecondary }]}
            >
              Set up your Smart Home
            </ThemedText>
          </View>

          {/* Form */}
          <View style={styles.formContainer}>
            {/* Email Field */}
            <View style={styles.fieldGroup}>
              <ThemedText style={styles.label}>Email</ThemedText>
              <View style={styles.inputWrapper}>
                <SymbolView
                  name={{ ios: "envelope", android: "mail", web: "mail" }}
                  size={20}
                  tintColor="#6B7280"
                  fallback={<MailOutline size={20} color="#6B7280" />}
                />
                <TextInput
                  style={styles.textInput}
                  placeholder="example@youremail"
                  placeholderTextColor="#9CA3AF"
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  autoCorrect={false}
                />
              </View>
            </View>

            {/* Password Field */}
            <View style={styles.fieldGroup}>
              <ThemedText style={styles.label}>Password</ThemedText>
              <View style={styles.inputWrapper}>
                <SymbolView
                  name={{ ios: "lock", android: "lock", web: "lock" }}
                  size={20}
                  tintColor="#6B7280"
                  fallback={<LockOutline size={20} color="#6B7280" />}
                />
                <TextInput
                  style={styles.textInput}
                  placeholder="**********"
                  placeholderTextColor="#9CA3AF"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <Pressable
                  onPress={() => setShowPassword((prev) => !prev)}
                  hitSlop={8}
                >
                  <SymbolView
                    name={{
                      ios: showPassword ? "eye.slash" : "eye",
                      android: showPassword ? "visibility_off" : "visibility",
                      web: showPassword ? "visibility_off" : "visibility",
                    }}
                    size={20}
                    tintColor="#6B7280"
                    fallback={<EyeOutline size={20} color="#6B7280" />}
                  />
                </Pressable>
              </View>
            </View>

            {/* Forget Password */}
            <View style={styles.optionsRow}>
              <Pressable hitSlop={8}>
                <ThemedText style={styles.forgotPasswordText}>
                  Forget Password?
                </ThemedText>
              </Pressable>
            </View>

            {/* Sign In Button */}
            <Pressable
              disabled={loginMutation.isPending}
              style={({ pressed }) => [
                styles.signInButton,
                pressed && styles.signInButtonPressed,
                loginMutation.isPending && styles.signInButtonDisabled,
              ]}
              onPress={handleSignIn}
            >
              {loginMutation.isPending ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <ThemedText style={styles.signInButtonText}>Sign In</ThemedText>
              )}
            </Pressable>

            {/* Divider */}
            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <ThemedText style={styles.dividerText}>or</ThemedText>
              <View style={styles.dividerLine} />
            </View>

            {/* Sign Up Row */}
            <View style={styles.signUpRow}>
              <ThemedText style={styles.signUpPrompt}>
                Don't have an account?{" "}
              </ThemedText>
              <Pressable hitSlop={8}>
                <ThemedText style={styles.signUpLink}>Sign Up</ThemedText>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Formatted Confirmation / Alert Dialog */}
      <ConfirmationMessage {...confirmationProps} />
    </SafeAreaView>
  );
};

const createStyles = (theme: ReturnType<typeof useTheme>) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
    },
    scrollContent: {
      flexGrow: 1,
      paddingHorizontal: 24,
      paddingTop: 40,
      paddingBottom: 24,
      justifyContent: "center",
    },
    headerContainer: {
      alignItems: "center",
      marginBottom: 36,
    },
    logo: {
      width: 80,
      height: 80,
      marginBottom: 16,
    },
    title: {
      fontSize: 32,
      fontWeight: "600",
      lineHeight: 38,
      textAlign: "center",
    },
    subtitle: {
      fontSize: 16,
      marginTop: 6,
      textAlign: "center",
    },
    formContainer: {
      width: "100%",
    },
    fieldGroup: {
      marginBottom: 20,
    },
    label: {
      fontSize: 16,
      fontWeight: "500",
      color: "#111827",
      marginBottom: 8,
    },
    inputWrapper: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: "#FFFFFF",
      borderRadius: 16,
      borderWidth: 1,
      borderColor: "#E5E7EB",
      paddingHorizontal: 16,
      height: 54,
    },
    textInput: {
      flex: 1,
      fontSize: 16,
      color: "#111827",
      marginLeft: 12,
      paddingVertical: 0,
    },
    optionsRow: {
      flexDirection: "row",
      justifyContent: "flex-end",
      alignItems: "center",
      marginTop: 4,
      marginBottom: 28,
    },
    forgotPasswordText: {
      fontSize: 15,
      color: "#1F2937",
      textDecorationLine: "underline",
    },
    signInButton: {
      backgroundColor: "#059669",
      borderRadius: 16,
      height: 54,
      justifyContent: "center",
      alignItems: "center",
      shadowColor: "#059669",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.25,
      shadowRadius: 8,
      elevation: 3,
    },
    signInButtonPressed: {
      opacity: 0.85,
    },
    signInButtonDisabled: {
      opacity: 0.65,
    },
    signInButtonText: {
      color: "#FFFFFF",
      fontSize: 17,
      fontWeight: "600",
    },
    dividerRow: {
      flexDirection: "row",
      alignItems: "center",
      marginVertical: 24,
      gap: 12,
    },
    dividerLine: {
      flex: 1,
      height: 1,
      backgroundColor: "#E5E7EB",
    },
    dividerText: {
      fontSize: 14,
      color: "#9CA3AF",
      textTransform: "lowercase",
    },
    signUpRow: {
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
    },
    signUpPrompt: {
      fontSize: 15,
      color: "#6B7280",
    },
    signUpLink: {
      fontSize: 15,
      fontWeight: "600",
      color: "#059669",
    },
  });

export default LoginView;
