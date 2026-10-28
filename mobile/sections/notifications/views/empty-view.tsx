import React, { useEffect } from "react";
import { StyleSheet, View, StyleProp, ViewStyle } from "react-native";
import Svg, {
  Path,
  Circle,
  Defs,
  LinearGradient,
  Stop,
} from "react-native-svg";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
  interpolate,
} from "react-native-reanimated";
import { useTranslation } from "react-i18next";
import { ThemedText } from "@/components/themed-text";
import { useTheme } from "@/hooks/use-theme";

export interface NotificationsEmptyViewProps {
  style?: StyleProp<ViewStyle>;
}

export function NotificationsEmptyView({ style }: NotificationsEmptyViewProps) {
  const theme = useTheme();
  const { t } = useTranslation();
  const styles = createStyles(theme);

  // Reanimated ripple progress values (0 -> 1)
  const ripple1 = useSharedValue(0);
  const ripple2 = useSharedValue(0);
  const ripple3 = useSharedValue(0);

  // Subtle bell chime/tilt animation
  const bellSwing = useSharedValue(0);

  useEffect(() => {
    // Staggered continuous ripple waves
    ripple1.value = withRepeat(
      withTiming(1, { duration: 3200, easing: Easing.bezier(0.25, 0.1, 0.25, 1) }),
      -1,
      false
    );

    const timer2 = setTimeout(() => {
      ripple2.value = withRepeat(
        withTiming(1, { duration: 3200, easing: Easing.bezier(0.25, 0.1, 0.25, 1) }),
        -1,
        false
      );
    }, 1000);

    const timer3 = setTimeout(() => {
      ripple3.value = withRepeat(
        withTiming(1, { duration: 3200, easing: Easing.bezier(0.25, 0.1, 0.25, 1) }),
        -1,
        false
      );
    }, 2000);

    // Gentle breathing pulse for central disc & bell
    bellSwing.value = withRepeat(
      withTiming(1, { duration: 2200, easing: Easing.inOut(Easing.quad) }),
      -1,
      true
    );

    return () => {
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, [ripple1, ripple2, ripple3, bellSwing]);

  // Outer Expanding Ripple 1 Style
  const rippleStyle1 = useAnimatedStyle(() => {
    const scale = interpolate(ripple1.value, [0, 1], [0.92, 1.45]);
    const opacity = interpolate(ripple1.value, [0, 0.35, 1], [0.65, 0.45, 0]);
    return {
      transform: [{ scale }],
      opacity,
    };
  });

  // Outer Expanding Ripple 2 Style
  const rippleStyle2 = useAnimatedStyle(() => {
    const scale = interpolate(ripple2.value, [0, 1], [0.92, 1.45]);
    const opacity = interpolate(ripple2.value, [0, 0.35, 1], [0.65, 0.45, 0]);
    return {
      transform: [{ scale }],
      opacity,
    };
  });

  // Outer Expanding Ripple 3 Style
  const rippleStyle3 = useAnimatedStyle(() => {
    const scale = interpolate(ripple3.value, [0, 1], [0.92, 1.45]);
    const opacity = interpolate(ripple3.value, [0, 0.35, 1], [0.65, 0.45, 0]);
    return {
      transform: [{ scale }],
      opacity,
    };
  });

  // Subtle breathing scale on the center illustration
  const centerBreathingStyle = useAnimatedStyle(() => {
    const scale = interpolate(bellSwing.value, [0, 1], [1, 1.03]);
    return {
      transform: [{ scale }],
    };
  });

  // SVG palette tokens aware of light/dark mode
  const outerCircleFill = theme.isDark ? "rgba(10, 122, 85, 0.16)" : "#E4F5EB";
  const innerCircleFill = theme.isDark ? "rgba(10, 122, 85, 0.28)" : "#D3EFE0";
  const centralCircleFill = theme.isDark ? "#086646" : "#0D6E4C";
  const particleFill = theme.isDark ? "#34D399" : "#74C69D";
  const badgeBorder = theme.isDark ? theme.backgroundElement : "#FFFFFF";

  // Ripple ring color
  const rippleBorderColor = theme.isDark
    ? "rgba(52, 211, 153, 0.22)"
    : "rgba(13, 110, 76, 0.18)";
  const rippleBgColor = theme.isDark
    ? "rgba(10, 122, 85, 0.10)"
    : "rgba(228, 245, 235, 0.50)";

  return (
    <View style={[styles.container, style]}>
      {/* Visual Ripple Illustration */}
      <View style={styles.illustrationWrapper}>
        {/* Animated Ripple Waves behind SVG */}
        <Animated.View
          style={[
            styles.rippleRing,
            { borderColor: rippleBorderColor, backgroundColor: rippleBgColor },
            rippleStyle1,
          ]}
        />
        <Animated.View
          style={[
            styles.rippleRing,
            { borderColor: rippleBorderColor, backgroundColor: rippleBgColor },
            rippleStyle2,
          ]}
        />
        <Animated.View
          style={[
            styles.rippleRing,
            { borderColor: rippleBorderColor, backgroundColor: rippleBgColor },
            rippleStyle3,
          ]}
        />

        {/* Foreground SVG with Breathing Micro-animation */}
        <Animated.View style={centerBreathingStyle}>
          <Svg width={250} height={250} viewBox="0 0 250 250">
            <Defs>
              <LinearGradient id="badgeGrad" x1="0" y1="0" x2="1" y2="1">
                <Stop offset="0%" stopColor="#25A274" />
                <Stop offset="100%" stopColor="#107B55" />
              </LinearGradient>
            </Defs>

            {/* 1. Large Outer Light-Green Aura Circle */}
            <Circle cx="125" cy="125" r="115" fill={outerCircleFill} />

            {/* 2. Middle Translucent Ring */}
            <Circle cx="125" cy="125" r="88" fill={innerCircleFill} />

            {/* 3. Small Floating Ambient Dots */}
            <Circle cx="64" cy="56" r="6" fill={particleFill} opacity={0.8} />
            <Circle cx="196" cy="64" r="4.5" fill={particleFill} opacity={0.8} />
            <Circle cx="80" cy="192" r="5" fill={particleFill} opacity={0.8} />

            {/* 4. Main Deep-Green Solid Center Circle */}
            <Circle cx="125" cy="125" r="60" fill={centralCircleFill} />

            {/* 5. Center White Bell Icon */}
            {/* Bell Top Knob/Ball */}
            <Circle cx="125" cy="88" r="4" fill="#FFFFFF" />

            {/* Bell Body */}
            <Path
              d="M125 91 C115 91 106 99 106 112 C106 122 103 126 97 132 L153 132 C147 126 144 122 144 112 C144 99 135 91 125 91 Z"
              fill="#FFFFFF"
            />

            {/* Bell Clapper (Ringing bottom curve) */}
            <Path
              d="M117 136 C117 141.5 120.5 145 125 145 C129.5 145 133 141.5 133 136"
              stroke="#FFFFFF"
              strokeWidth={4.5}
              strokeLinecap="round"
              fill="none"
            />

            {/* 6. Success Checkmark Floating Badge at Bottom-Right */}
            <Circle cx="160" cy="158" r="19" fill={badgeBorder} />
            <Circle cx="160" cy="158" r="16" fill="url(#badgeGrad)" />
            <Path
              d="M152 158.5 L157.5 163.5 L168 153"
              stroke="#FFFFFF"
              strokeWidth={3.8}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          </Svg>
        </Animated.View>
      </View>

      {/* Text Content */}
      <View style={styles.textContainer}>
        <ThemedText style={styles.title}>
          {t("NOTIFICATIONS.EMPTY_TITLE")}
        </ThemedText>

        <ThemedText style={styles.description}>
          {t("NOTIFICATIONS.EMPTY_SUBTITLE")}
        </ThemedText>
      </View>
    </View>
  );
}

export default NotificationsEmptyView;

const createStyles = (theme: ReturnType<typeof useTheme>) =>
  StyleSheet.create({
    container: {
      flex: 1,
      width: "100%",
      alignItems: "center",
      justifyContent: "center",
      alignSelf: "center",
      paddingHorizontal: 32,
      paddingVertical: 20,
    },
    illustrationWrapper: {
      width: 250,
      height: 250,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 32,
    },
    rippleRing: {
      position: "absolute",
      width: 230,
      height: 230,
      borderRadius: 115,
      borderWidth: 1.5,
    },
    textContainer: {
      width: "100%",
      alignItems: "center",
      justifyContent: "center",
      alignSelf: "center",
      maxWidth: 340,
      gap: 12,
    },
    title: {
      width: "100%",
      fontSize: 26,
      fontWeight: "900",
      textAlign: "center",
      alignSelf: "center",
      color: theme.isDark ? "#FFFFFF" : "#141C2B",
      letterSpacing: -0.3,
    },
    description: {
      width: "100%",
      fontSize: 16,
      textAlign: "center",
      alignSelf: "center",
      lineHeight: 25,
      fontWeight: "500",
      color: theme.isDark ? "#94A3B8" : "#64748B",
    },
  });
