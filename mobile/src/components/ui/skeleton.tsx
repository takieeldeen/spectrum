import React from "react";
import {
  DimensionValue,
  LayoutChangeEvent,
  StyleProp,
  StyleSheet,
  View,
  ViewProps,
  ViewStyle,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  interpolate,
  Easing,
} from "react-native-reanimated";

import { useTheme } from "@/hooks/use-theme";

/* ==========================================================================
   1. TYPES & PROPS
   ========================================================================== */

export type SkeletonVariant = "text" | "circular" | "rectangular" | "rounded";
export type SkeletonAnimation = "pulse" | "wave" | false;

export interface SkeletonProps extends ViewProps {
  /**
   * The animation type:
   * - `pulse`: smooth fading oscillation (default in MUI)
   * - `wave`: glowing shimmer sliding horizontally
   * - `false`: no animation
   * @default 'pulse'
   */
  animation?: SkeletonAnimation;

  /**
   * The shape variant of the skeleton:
   * - `text`: represents a single line of text with rounded corners (default)
   * - `circular`: circular shape for avatars and round icons
   * - `rectangular`: sharp corners
   * - `rounded`: rounded rectangle for cards, images, and buttons
   * @default 'text'
   */
  variant?: SkeletonVariant;

  /**
   * Width of the skeleton. Can be a number (px) or string percentage (e.g. '100%').
   */
  width?: DimensionValue;

  /**
   * Height of the skeleton. Can be a number (px) or string percentage.
   */
  height?: DimensionValue;

  /**
   * Custom border radius override.
   */
  borderRadius?: number;

  /**
   * Optional children. When provided, the Skeleton takes the natural size
   * of its children and masks them with the skeleton placeholder overlay.
   */
  children?: React.ReactNode;

  /**
   * Additional style for the container.
   */
  style?: StyleProp<ViewStyle>;
}

/* ==========================================================================
   2. STYLES FACTORY (Dark Mode Aware)
   ========================================================================== */

type Theme = ReturnType<typeof useTheme>;

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    root: {
      backgroundColor: theme.skeleton,
      overflow: "hidden",
    },
    overlay: {
      ...StyleSheet.absoluteFill,
      backgroundColor: theme.skeleton,
      overflow: "hidden",
    },
    hiddenChildren: {
      opacity: 0,
    },
    waveContainer: {
      ...StyleSheet.absoluteFill,
    },
  });

/* ==========================================================================
   3. HELPERS
   ========================================================================== */

const getBorderRadius = (
  variant: SkeletonVariant,
  borderRadiusOverride?: number
): number => {
  if (typeof borderRadiusOverride === "number") {
    return borderRadiusOverride;
  }
  switch (variant) {
    case "circular":
      return 9999;
    case "rectangular":
      return 0;
    case "rounded":
      return 8;
    case "text":
    default:
      return 4;
  }
};

/* ==========================================================================
   4. COMPONENT
   ========================================================================== */

/**
 * Skeleton placeholder component similar to Material UI (MUI) Skeleton.
 * Supports `pulse`, `wave`, and static animations across `text`, `circular`,
 * `rectangular`, and `rounded` variants with full light/dark mode theme support.
 */
export const Skeleton: React.FC<SkeletonProps> = ({
  animation = "pulse",
  variant = "text",
  width,
  height,
  borderRadius,
  children,
  style,
  onLayout,
  ...rest
}) => {
  const theme = useTheme();
  const styles = React.useMemo(() => createStyles(theme), [theme]);

  const hasChildren = Boolean(children);
  const computedBorderRadius = getBorderRadius(variant, borderRadius);

  // Layout width tracking for wave animation
  const initialWidth =
    typeof width === "number" ? width : variant === "circular" ? 40 : 200;
  const [layoutWidth, setLayoutWidth] = React.useState<number>(initialWidth);

  const handleLayout = (event: LayoutChangeEvent) => {
    const measuredWidth = event.nativeEvent.layout.width;
    if (measuredWidth > 0 && Math.abs(measuredWidth - layoutWidth) > 1) {
      setLayoutWidth(measuredWidth);
    }
    onLayout?.(event);
  };

  // Dimensions computation
  let computedWidth: DimensionValue | undefined = width;
  let computedHeight: DimensionValue | undefined = height;

  if (!hasChildren) {
    if (variant === "text") {
      computedHeight = height ?? 16;
      computedWidth = width ?? "100%";
    } else if (variant === "circular") {
      if (width !== undefined && height === undefined) {
        computedHeight = width;
      } else if (height !== undefined && width === undefined) {
        computedWidth = height;
      } else if (width === undefined && height === undefined) {
        computedWidth = 40;
        computedHeight = 40;
      }
    }
  }

  // Pulse animation: opacity oscillates smoothly between 1 and 0.4
  const pulseOpacity = useSharedValue(1);
  React.useEffect(() => {
    if (animation === "pulse") {
      pulseOpacity.value = withRepeat(
        withTiming(0.4, {
          duration: 900,
          easing: Easing.inOut(Easing.ease),
        }),
        -1,
        true
      );
    } else {
      pulseOpacity.value = 1;
    }
  }, [animation, pulseOpacity]);

  const animatedPulseStyle = useAnimatedStyle(() => ({
    opacity: pulseOpacity.value,
  }));

  // Wave animation: shimmer traverses from -layoutWidth to +layoutWidth
  const waveProgress = useSharedValue(0);
  React.useEffect(() => {
    if (animation === "wave") {
      waveProgress.value = 0;
      waveProgress.value = withRepeat(
        withTiming(1, {
          duration: 1600,
          easing: Easing.linear,
        }),
        -1,
        false
      );
    } else {
      waveProgress.value = 0;
    }
  }, [animation, waveProgress]);

  const animatedWaveStyle = useAnimatedStyle(() => {
    const translateX = interpolate(
      waveProgress.value,
      [0, 1],
      [-layoutWidth, layoutWidth]
    );
    return {
      transform: [{ translateX }],
    };
  });

  const waveColors = React.useMemo(
    () => ["transparent", theme.skeletonWave, "transparent"] as const,
    [theme.skeletonWave]
  );

  // If children are passed, wrap them invisibly to measure intrinsic layout
  if (hasChildren) {
    return (
      <View
        onLayout={handleLayout}
        style={[
          styles.root,
          {
            borderRadius: computedBorderRadius,
            width: computedWidth,
            height: computedHeight,
          },
          style,
        ]}
        accessibilityRole="progressbar"
        accessibilityLabel="Loading..."
        {...rest}
      >
        <View style={styles.hiddenChildren}>{children}</View>
        <Animated.View
          style={[
            styles.overlay,
            { borderRadius: computedBorderRadius },
            animation === "pulse" ? animatedPulseStyle : undefined,
          ]}
        >
          {animation === "wave" && (
            <Animated.View style={[styles.waveContainer, animatedWaveStyle]}>
              <LinearGradient
                colors={waveColors}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                style={StyleSheet.absoluteFill}
              />
            </Animated.View>
          )}
        </Animated.View>
      </View>
    );
  }

  // When no children, render direct skeleton block
  return (
    <Animated.View
      onLayout={handleLayout}
      style={[
        styles.root,
        {
          borderRadius: computedBorderRadius,
          width: computedWidth,
          height: computedHeight,
        },
        animation === "pulse" ? animatedPulseStyle : undefined,
        style,
      ]}
      accessibilityRole="progressbar"
      accessibilityLabel="Loading..."
      {...rest}
    >
      {animation === "wave" && (
        <Animated.View style={[styles.waveContainer, animatedWaveStyle]}>
          <LinearGradient
            colors={waveColors}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
      )}
    </Animated.View>
  );
};

export default Skeleton;
