import React from "react";
import { StyleProp, ViewStyle } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  runOnJS,
} from "react-native-reanimated";

export interface FadeProps {
  in?: boolean;
  duration?: number;
  enterDuration?: number;
  exitDuration?: number;
  immediateExit?: boolean;
  unmountOnExit?: boolean;
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
}

/**
 * Fade component inspired by MUI's Fade transition.
 * Fades children in/out based on the `in` prop without needing ternary operators.
 * Supports `immediateExit` to animate smoothly on enter while instantly disappearing on exit.
 */
export const Fade: React.FC<FadeProps> = ({
  in: inProp = false,
  duration = 260,
  enterDuration,
  exitDuration,
  immediateExit = false,
  unmountOnExit = true,
  style,
  children,
}) => {
  const [mounted, setMounted] = React.useState(inProp);
  const opacity = useSharedValue(inProp ? 1 : 0);

  React.useEffect(() => {
    if (inProp) {
      setMounted(true);
      const enterDur = enterDuration ?? duration;
      opacity.value = withTiming(1, {
        duration: enterDur,
        easing: Easing.out(Easing.ease),
      });
    } else {
      const exitDur = immediateExit ? 0 : (exitDuration ?? duration);
      if (exitDur === 0) {
        opacity.value = 0;
        if (unmountOnExit) {
          setMounted(false);
        }
      } else {
        opacity.value = withTiming(
          0,
          { duration: exitDur, easing: Easing.in(Easing.ease) },
          (finished) => {
            if (finished && unmountOnExit) {
              runOnJS(setMounted)(false);
            }
          }
        );
      }
    }
  }, [inProp, duration, enterDuration, exitDuration, immediateExit, unmountOnExit, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  if (!mounted && unmountOnExit) {
    return null;
  }

  return (
    <Animated.View style={[animatedStyle, style]}>
      {children}
    </Animated.View>
  );
};

export default Fade;
