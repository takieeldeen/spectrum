import React, { forwardRef } from "react";
import { View, StyleSheet, StyleProp, ViewStyle } from "react-native";
import {
  SafeAreaView,
  SafeAreaViewProps,
  Edges,
  Edge,
} from "react-native-safe-area-context";
import { useTheme } from "@/hooks/use-theme";

export type { Edge, Edges };

export interface PageProps extends SafeAreaViewProps {
  /**
   * Safe area edges to apply insets to.
   * Can be an array: ['top', 'bottom', 'left', 'right'] or specific edges like ['top'].
   * Defaults to: ['top', 'bottom', 'left', 'right'].
   */
  edges?: Edges;
  /**
   * Optional custom background color override.
   * Defaults to theme.background.
   */
  backgroundColor?: string;
  /**
   * Custom style overrides for the SafeAreaView container.
   */
  style?: StyleProp<ViewStyle>;
}

export const Page = forwardRef<View, PageProps>(
  (
    {
      children,
      style,
      edges = ["top", "bottom", "left", "right"],
      backgroundColor,
      ...rest
    },
    ref,
  ) => {
    const theme = useTheme();

    return (
      <SafeAreaView
        ref={ref}
        edges={edges}
        style={[
          styles.container,
          { backgroundColor: backgroundColor ?? theme.background },
          style,
        ]}
        {...rest}
      >
        {children}
      </SafeAreaView>
    );
  },
);

Page.displayName = "Page";

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default Page;
