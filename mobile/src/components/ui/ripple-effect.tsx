import React, { useEffect, useRef } from "react";
import {
  View,
  StyleSheet,
  Animated,
  Easing,
  StyleProp,
  ViewStyle,
} from "react-native";
import { useTheme } from "@/hooks/use-theme";

/* ==========================================================================
   1. TYPES & PROPS
   ========================================================================== */

export interface RippleEffectProps {
  /**
   * Outer diameter of the largest ripple in pixels.
   * @default 240
   */
  size?: number;

  /**
   * Base color of the ripple (hex, rgb, or rgba).
   * Defaults to theme.primary (#059669).
   */
  color?: string;

  /**
   * Number of concentric ripple rings.
   * @default 3
   */
  ringCount?: number;

  /**
   * Whether the pulse animation is active.
   * @default true
   */
  animated?: boolean;

  /**
   * Animation style:
   * - 'pulse': Subtle organic breathing expansion & contraction (matches design)
   * - 'wave': Continuous outward expanding waves
   * - 'none': Static concentric rings
   * @default 'pulse'
   */
  animationType?: "pulse" | "wave" | "none";

  /**
   * Duration of one full animation cycle in milliseconds.
   * @default 2000
   */
  duration?: number;

  /**
   * Minimum scale factor at the start/trough of the pulse.
   * @default 0.95
   */
  minScale?: number;

  /**
   * Maximum scale factor at the peak of the pulse.
   * Higher values produce a much stronger, more visible expansion.
   * @default 1.18
   */
  maxScale?: number;

  /**
   * Custom scale expansion amount (e.g. 0.20 for 20% expansion).
   * Overrides maxScale if provided.
   */
  scaleAmount?: number;

  /**
   * Custom style for the outer wrapper container.
   */
  style?: StyleProp<ViewStyle>;

  /**
   * Custom style applied to all ripple rings.
   */
  ringStyle?: StyleProp<ViewStyle>;

  /**
   * Optional center element (e.g. icon or badge).
   */
  children?: React.ReactNode;
}

/* ==========================================================================
   2. COLOR UTILITY
   ========================================================================== */

function hexToRgba(hex: string, alpha: number): string {
  if (!hex) return `rgba(5, 150, 105, ${alpha})`;
  if (hex.startsWith("rgba")) {
    return hex.replace(/[\d\.]+\)$/g, `${alpha})`);
  }
  if (hex.startsWith("rgb")) {
    return hex.replace("rgb", "rgba").replace(")", `, ${alpha})`);
  }
  let clean = hex.replace("#", "");
  if (clean.length === 3) {
    clean = clean
      .split("")
      .map((c) => c + c)
      .join("");
  }
  const r = parseInt(clean.substring(0, 2), 16) || 5;
  const g = parseInt(clean.substring(2, 4), 16) || 150;
  const b = parseInt(clean.substring(4, 6), 16) || 105;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/* ==========================================================================
   3. RIPPLE COMPONENT
   ========================================================================== */

export function RippleEffect({
  size = 240,
  color,
  ringCount = 3,
  animated = true,
  animationType = "pulse",
  duration = 2000,
  minScale = 0.95,
  maxScale = 1.18,
  scaleAmount,
  style,
  ringStyle,
  children,
}: RippleEffectProps) {
  const theme = useTheme();
  const baseColor = color ?? theme.primary;

  const isAnimated = animated && animationType !== "none";

  // Shared pulse animation value [0 -> 1 -> 0]
  const pulseAnim = useRef(new Animated.Value(0)).current;

  // Wave animation values for each ring
  const waveAnims = useRef(
    Array.from({ length: ringCount }).map(() => new Animated.Value(0))
  ).current;

  useEffect(() => {
    if (!isAnimated) {
      pulseAnim.setValue(0);
      return;
    }

    if (animationType === "pulse") {
      const pulseLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: duration / 2,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 0,
            duration: duration / 2,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      );
      pulseLoop.start();
      return () => pulseLoop.stop();
    }

    if (animationType === "wave") {
      const staggerDelay = duration / ringCount;
      const waveAnimations = waveAnims.map((anim, index) =>
        Animated.loop(
          Animated.sequence([
            Animated.delay(index * staggerDelay),
            Animated.timing(anim, {
              toValue: 1,
              duration: duration,
              easing: Easing.out(Easing.ease),
              useNativeDriver: true,
            }),
          ])
        )
      );

      Animated.parallel(waveAnimations).start();
      return () => waveAnimations.forEach((a) => a.stop());
    }
  }, [isAnimated, animationType, duration, ringCount]);

  // Pre-configured ratios and opacities matching the concentric ripple screenshot
  // Ordered from outermost (0) to innermost (ringCount - 1)
  const defaultRatios = [1.0, 0.7, 0.42, 0.25];
  const defaultFillOpacities = [0.03, 0.06, 0.11, 0.16];
  const defaultBorderOpacities = [0.08, 0.14, 0.22, 0.28];

  const rings = Array.from({ length: ringCount }).map((_, i) => {
    const ratio =
      i < defaultRatios.length
        ? defaultRatios[i]
        : 1 - (i / ringCount) * 0.75;
    const ringDiameter = Math.round(size * ratio);

    const fillAlpha =
      i < defaultFillOpacities.length
        ? defaultFillOpacities[i]
        : 0.03 + (i / ringCount) * 0.12;

    const borderAlpha =
      i < defaultBorderOpacities.length
        ? defaultBorderOpacities[i]
        : 0.08 + (i / ringCount) * 0.18;

    return {
      index: i,
      diameter: ringDiameter,
      backgroundColor: hexToRgba(baseColor, fillAlpha),
      borderColor: hexToRgba(baseColor, borderAlpha),
    };
  });

  return (
    <View
      style={[
        styles.container,
        { width: size, height: size },
        style,
      ]}
    >
      {/* Render rings from largest (outermost) to smallest (innermost) */}
      {rings.map((ring) => {
        let animatedStyle: any = {};

        if (isAnimated && animationType === "pulse") {
          // Dynamic and noticeable scale expansion
          const targetMaxScale =
            scaleAmount !== undefined ? 1 + scaleAmount : maxScale;
          const scaleDelta = targetMaxScale - minScale;

          // Outermost ring has the widest scale excursion, inner rings scale in resonance
          const ringMax = targetMaxScale - ring.index * (scaleDelta * 0.18);
          const ringMin = minScale + ring.index * ((1 - minScale) * 0.3);

          const scale = pulseAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [ringMin, ringMax],
          });
          const opacity = pulseAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [1, 0.68],
          });
          animatedStyle = {
            transform: [{ scale }],
            opacity,
          };
        } else if (isAnimated && animationType === "wave") {
          const waveAnim = waveAnims[ring.index];
          const targetMaxScale =
            scaleAmount !== undefined ? 1 + scaleAmount : maxScale;
          const scale = waveAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [minScale, targetMaxScale * 1.05],
          });
          const opacity = waveAnim.interpolate({
            inputRange: [0, 0.4, 1],
            outputRange: [1, 0.7, 0],
          });
          animatedStyle = {
            transform: [{ scale }],
            opacity,
          };
        }

        return (
          <Animated.View
            key={ring.index}
            pointerEvents="none"
            style={[
              styles.ring,
              {
                width: ring.diameter,
                height: ring.diameter,
                borderRadius: ring.diameter / 2,
                backgroundColor: ring.backgroundColor,
                borderColor: ring.borderColor,
                borderWidth: 1,
              },
              ringStyle,
              animatedStyle,
            ]}
          />
        );
      })}

      {/* Optional center content (icon, avatar, badge) */}
      {children ? (
        <View style={styles.contentContainer} pointerEvents="box-none">
          {children}
        </View>
      ) : null}
    </View>
  );
}

export default RippleEffect;

/* ==========================================================================
   4. STYLES
   ========================================================================== */

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  ring: {
    position: "absolute",
  },
  contentContainer: {
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
  },
});
