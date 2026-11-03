import React, { createContext, useContext, useMemo } from "react";
import { StyleSheet, View, type StyleProp, type ViewProps, type ViewStyle } from "react-native";
import { useTranslation } from "react-i18next";
import { isRtlLanguage } from "@/i18n";

export type LayoutDirection = "rtl" | "ltr";

const LayoutDirectionContext = createContext<LayoutDirection>("ltr");

let LocaleDirContext: React.Context<LayoutDirection> | null = null;
try {
  LocaleDirContext =
    require("expo-router/react-navigation").LocaleDirContext ?? null;
} catch {
  try {
    LocaleDirContext =
      require("@react-navigation/native").LocaleDirContext ?? null;
  } catch {
    LocaleDirContext = null;
  }
}

export function useLayoutDirection(): LayoutDirection {
  return useContext(LayoutDirectionContext);
}

export function useIsRtlLayout() {
  return useLayoutDirection() === "rtl";
}

export function useDirectionStyle(): { direction: LayoutDirection } {
  return { direction: useLayoutDirection() };
}

export function LayoutDirectionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { i18n } = useTranslation();
  const direction: LayoutDirection = isRtlLanguage(i18n.language)
    ? "rtl"
    : "ltr";

  const tree = (
    <LayoutDirectionContext.Provider value={direction}>
      <View
        collapsable={false}
        // @ts-expect-error `dir` is used by react-native-web
        dir={direction}
        style={[styles.root, { direction }]}
      >
        {children}
      </View>
    </LayoutDirectionContext.Provider>
  );

  if (LocaleDirContext) {
    return (
      <LocaleDirContext.Provider value={direction}>
        {tree}
      </LocaleDirContext.Provider>
    );
  }

  return tree;
}

export function DirectedView({
  style,
  ...props
}: ViewProps) {
  const direction = useLayoutDirection();
  const merged: StyleProp<ViewStyle> = useMemo(
    () => [{ direction }, style],
    [direction, style],
  );

  return (
    <View
      collapsable={false}
      // @ts-expect-error `dir` is used by react-native-web
      dir={direction}
      style={merged}
      {...props}
    />
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
