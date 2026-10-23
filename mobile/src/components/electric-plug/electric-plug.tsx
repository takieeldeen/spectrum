import React from "react";
import {
  View,
  StyleSheet,
  Pressable,
  StyleProp,
  ViewStyle,
  Platform,
} from "react-native";
import { Lucide } from "@react-native-vector-icons/lucide";
import { useTheme } from "@/hooks/use-theme";
import { ThemedText } from "@/components/themed-text";

/* ==========================================================================
   1. TYPES & PROPS
   ========================================================================== */

export type OutletProps = {
  on?: boolean;
  watts?: number;
  power_mw?: number;
  runtime?: number;
  current_a?: number;
  temperature_c?: number;
};

export type PlugProps = {
  outlets?: {
    outlet1?: OutletProps;
    outlet2?: OutletProps;
    outlet3?: OutletProps;
    outlet4?: OutletProps;
  };
  outletNumbers?: {
    outlet1?: number | string;
    outlet2?: number | string;
    outlet3?: number | string;
    outlet4?: number | string;
  };
  onToggleMaster?: () => void;
  onToggleOutlet?: (
    outletKey: "outlet1" | "outlet2" | "outlet3" | "outlet4",
  ) => void;
  hideSwitch?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
};

/* ==========================================================================
   2. SINGLE PLUG SOCKET COMPONENT (European / Schuko Style)
   ========================================================================== */

export function PlugSocket({
  outlet,
  outletNumber,
  hideSwitch,
  disabled = false,
  onToggle,
}: {
  outlet?: OutletProps;
  outletNumber?: number | string;
  hideSwitch?: boolean;
  disabled?: boolean;
  onToggle?: () => void;
}) {
  const theme = useTheme();
  const isOnline = outlet?.on ?? false;
  const isDark = theme.isDark;

  // When disabled: buttons and indicators are greyed out instead of orange and green
  const greyColor = isDark ? "#6B7280" : "#9CA3AF";
  const statusColor = disabled ? greyColor : isOnline ? "#10B981" : "#F59E0B";

  const numberColor = disabled
    ? greyColor
    : isOnline
      ? isDark
        ? "#34D399"
        : "#059669"
      : theme.textSecondary;

  return (
    <View style={[styles.socketContainer, disabled && { opacity: 0.75 }]}>
      {/* Outer Socket Basin */}
      <View
        style={[
          styles.socketOuter,
          {
            borderColor: statusColor,
            backgroundColor: disabled
              ? isDark
                ? "rgba(107, 114, 128, 0.08)"
                : "rgba(156, 163, 175, 0.1)"
              : isOnline
                ? "rgba(16, 185, 129, 0.08)"
                : "rgba(245, 158, 11, 0.06)",
          },
        ]}
      >
        {/* Inner Socket Well */}
        <View
          style={[
            styles.socketInner,
            {
              backgroundColor: theme.socketInnerBackground,
              borderColor: isDark ? "#38383A" : "#D1D5DB",
            },
          ]}
        >
          {/* Top Brass Grounding Clip */}
          <View style={styles.groundContactTop}>
            <View style={styles.brassPin} />
          </View>

          {/* Left & Right Alignment Guide Notches */}
          <View style={styles.notchesRow}>
            <View
              style={[
                styles.sideNotch,
                { backgroundColor: isDark ? "#2C2C2E" : "#E5E7EB" },
              ]}
            />

            {/* Two Pin Holes */}
            <View style={styles.pinHolesContainer}>
              <View
                style={[
                  styles.pinHole,
                  { backgroundColor: isDark ? "#0A0A0A" : "#374151" },
                ]}
              />
              <View
                style={[
                  styles.pinHole,
                  { backgroundColor: isDark ? "#0A0A0A" : "#374151" },
                ]}
              />
            </View>

            <View
              style={[
                styles.sideNotch,
                { backgroundColor: isDark ? "#2C2C2E" : "#E5E7EB" },
              ]}
            />
          </View>

          {/* Bottom Brass Grounding Clip */}
          <View style={styles.groundContactBottom}>
            <View style={styles.brassPin} />
          </View>
        </View>
      </View>

      {/* Socket Individual Power Switch Button & Outlet Number */}
      {!hideSwitch && (
        <Pressable
          disabled={disabled}
          onPress={disabled ? undefined : onToggle}
          hitSlop={6}
          style={({ pressed }) => [
            styles.switchContainer,
            pressed && !disabled && { opacity: 0.7 },
          ]}
        >
          <View
            style={[
              styles.socketButton,
              {
                borderColor: statusColor,
                backgroundColor: disabled
                  ? isDark
                    ? "#242426"
                    : "#F3F4F6"
                  : isOnline
                    ? "rgba(16, 185, 129, 0.14)"
                    : isDark
                      ? "#242426"
                      : "#F3F4F6",
              },
            ]}
          >
            <Lucide name="power" size={12} color={statusColor} />
          </View>
          {outletNumber != null && (
            <ThemedText
              style={[styles.outletNumberText, { color: numberColor }]}
            >
              {outletNumber}
            </ThemedText>
          )}
        </Pressable>
      )}
    </View>
  );
}

/* ==========================================================================
   3. ELECTRIC PLUG MAIN COMPONENT
   ========================================================================== */

export function ElectricPlug({
  outlets,
  outletNumbers,
  onToggleMaster,
  onToggleOutlet,
  hideSwitch,
  disabled = false,
  style,
}: PlugProps) {
  const theme = useTheme();
  const isDark = theme.isDark;

  // Check if all outlets are turned off
  const outletList = [
    outlets?.outlet1,
    outlets?.outlet2,
    outlets?.outlet3,
    outlets?.outlet4,
  ];
  const allOffline = outletList.every((outlet) => !outlet?.on);

  const greyColor = isDark ? "#6B7280" : "#9CA3AF";
  const masterColor = disabled
    ? greyColor
    : allOffline
      ? "#F59E0B"
      : theme.primary;
  const masterLedColor = disabled
    ? greyColor
    : allOffline
      ? "#F59E0B"
      : "#10B981";

  return (
    <View style={styles.wrapper}>
      <View
        style={[
          styles.stripBody,
          {
            backgroundColor: isDark ? theme.backgroundElement : "#FFFFFF",
            borderColor: isDark
              ? theme.backgroundSelected
              : "rgba(0, 0, 0, 0.08)",
          },
          disabled && { opacity: 0.8 },
          style,
        ]}
      >
        {/* Outlets 1 to 4 */}
        <PlugSocket
          outlet={outlets?.outlet1}
          outletNumber={outletNumbers?.outlet1 ?? 1}
          hideSwitch={hideSwitch}
          disabled={disabled}
          onToggle={() => !disabled && onToggleOutlet?.("outlet1")}
        />
        <PlugSocket
          outlet={outlets?.outlet2}
          outletNumber={outletNumbers?.outlet2 ?? 2}
          hideSwitch={hideSwitch}
          disabled={disabled}
          onToggle={() => !disabled && onToggleOutlet?.("outlet2")}
        />
        <PlugSocket
          outlet={outlets?.outlet3}
          outletNumber={outletNumbers?.outlet3 ?? 3}
          hideSwitch={hideSwitch}
          disabled={disabled}
          onToggle={() => !disabled && onToggleOutlet?.("outlet3")}
        />
        <PlugSocket
          outlet={outlets?.outlet4}
          outletNumber={outletNumbers?.outlet4 ?? 4}
          hideSwitch={hideSwitch}
          disabled={disabled}
          onToggle={() => !disabled && onToggleOutlet?.("outlet4")}
        />

        {/* Master Control & USB Section */}
        <View style={styles.masterSection}>
          {/* Master LED + Power Switch Row */}
          <View style={styles.masterControlsRow}>
            {/* Status LED Indicator */}
            <View
              style={[
                styles.statusLed,
                {
                  backgroundColor: masterLedColor,
                  shadowColor: disabled ? "transparent" : masterLedColor,
                },
              ]}
            />

            {/* Master Power Toggle Button */}
            <Pressable
              disabled={disabled}
              onPress={disabled ? undefined : onToggleMaster}
              hitSlop={8}
              style={({ pressed }) => [
                styles.masterButton,
                {
                  borderColor: masterColor,
                  backgroundColor: disabled
                    ? isDark
                      ? "#242426"
                      : "#F3F4F6"
                    : allOffline
                      ? isDark
                        ? "#242426"
                        : "#FFFBEB"
                      : `${theme.primary}18`,
                },
                pressed && !disabled && { opacity: 0.7 },
              ]}
            >
              <Lucide name="power" size={15} color={masterColor} />
            </Pressable>
          </View>

          {/* USB Ports & Grille Panel */}
          <View
            style={[
              styles.usbPanel,
              {
                backgroundColor: isDark ? "#1C1C1E" : "#F3F4F6",
                borderColor: isDark ? "#38383A" : "#E5E7EB",
              },
            ]}
          >
            {/* Ventilation / Cooling Slats */}
            <View style={styles.grilleContainer}>
              {[0, 1, 2, 3].map((i) => (
                <View
                  key={i}
                  style={[
                    styles.grilleSlat,
                    {
                      backgroundColor: isDark ? "#2C2C2E" : "#9CA3AF",
                    },
                  ]}
                />
              ))}
            </View>

            {/* Dual USB-A Output Ports */}
            <View style={styles.usbPortsContainer}>
              <View style={styles.usbPort}>
                <View style={styles.usbPin} />
              </View>
              <View style={styles.usbPort}>
                <View style={styles.usbPin} />
              </View>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

/* ==========================================================================
   4. STYLES
   ========================================================================== */

const styles = StyleSheet.create({
  wrapper: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  stripBody: {
    width: "100%",
    flexDirection: "row-reverse",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 10,
    borderRadius: 16,
    borderWidth: 1,
    ...Platform.select({
      ios: {
        shadowColor: "#000000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 10,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  socketContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  socketOuter: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    padding: 3,
  },
  socketInner: {
    width: "100%",
    height: "100%",
    borderRadius: 20,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "space-between",
    position: "relative",
    paddingVertical: 2,
  },
  groundContactTop: {
    width: 9,
    height: 5,
    backgroundColor: "#C59A3F",
    borderBottomLeftRadius: 3,
    borderBottomRightRadius: 3,
    borderWidth: 0.5,
    borderColor: "#8B672D",
    alignItems: "center",
  },
  groundContactBottom: {
    width: 9,
    height: 5,
    backgroundColor: "#C59A3F",
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
    borderWidth: 0.5,
    borderColor: "#8B672D",
    alignItems: "center",
  },
  brassPin: {
    width: "60%",
    height: 1,
    backgroundColor: "rgba(255, 255, 255, 0.4)",
  },
  notchesRow: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 2,
  },
  sideNotch: {
    width: 2.5,
    height: 7,
    borderRadius: 1,
  },
  pinHolesContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  pinHole: {
    width: 5.5,
    height: 5.5,
    borderRadius: 3,
  },
  switchContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  socketButton: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  outletNumberText: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: "700",
  },
  masterSection: {
    flex: 1.1,
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    paddingHorizontal: 4,
  },
  masterControlsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  statusLed: {
    width: 6,
    height: 6,
    borderRadius: 3,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 4,
  },
  masterButton: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  usbPanel: {
    width: "100%",
    height: 24,
    borderRadius: 7,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingHorizontal: 4,
  },
  grilleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  grilleSlat: {
    width: 1.5,
    height: 12,
    borderRadius: 1,
  },
  usbPortsContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  usbPort: {
    width: 7,
    height: 14,
    backgroundColor: "#1F2937",
    borderRadius: 2,
    padding: 1,
    justifyContent: "center",
  },
  usbPin: {
    width: "50%",
    height: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: 0.5,
  },
});

export default ElectricPlug;
