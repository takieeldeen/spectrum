import React, { useState, useMemo } from "react";
import {
  View,
  StyleSheet,
  Pressable,
  I18nManager,
  Platform,
  ActivityIndicator,
} from "react-native";
import Svg, {
  Defs,
  LinearGradient,
  Stop,
  Rect,
  Path,
} from "react-native-svg";
import { Lucide } from "@react-native-vector-icons/lucide";
import { useTranslation } from "react-i18next";
import { usePlugs } from "@/providers/plug.provider";
import { useTheme } from "@/hooks/use-theme";
import ThemedText from "@/components/themed-text";
import { Fade } from "@/components/ui/fade";

export interface MasterPowerCardProps {
  onSuccess?: () => void;
  isEmpty?: boolean;
}

/* ==========================================================================
   EMPTY STATE COMPONENT (For General Master Power Switch)
   ========================================================================== */

export interface MasterPowerEmptyViewProps {
  styles: ReturnType<typeof createStyles>;
  theme: ReturnType<typeof useTheme>;
}

export const MasterPowerEmptyView: React.FC<MasterPowerEmptyViewProps> = ({
  styles,
  theme,
}) => {
  const { t } = useTranslation();

  return (
    <View style={styles.emptyCardContainer}>
      <View style={styles.emptyIconBadge}>
        <Lucide name="power-off" size={26} color={theme.textSecondary} />
      </View>
      <ThemedText weight="700" style={styles.emptyTitle}>
        {t("DASHBOARD.NO_OUTLETS_TO_CONTROL")}
      </ThemedText>
      <ThemedText style={styles.emptySubtitle}>
        {t("DASHBOARD.NO_OUTLETS_TO_CONTROL_HINT")}
      </ThemedText>
    </View>
  );
};

/* ==========================================================================
   MAIN MASTER POWER CARD COMPONENT
   ========================================================================== */

export const MasterPowerCard: React.FC<MasterPowerCardProps> = ({
  onSuccess,
  isEmpty: propIsEmpty,
}) => {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const isArabic = (i18n.language || "ar").startsWith("ar");
  const isRtl = I18nManager.isRTL || isArabic;
  const { liveData, connected, toggleAll } = usePlugs();
  const [isProcessing, setIsProcessing] = useState(false);
  const [justToggled, setJustToggled] = useState(false);

  const stripIds = useMemo(() => Object.keys(liveData ?? {}), [liveData]);
  const totalOutletsCount = useMemo(() => {
    return stripIds.reduce(
      (sum, id) => sum + Object.keys(liveData?.[id]?.outlets ?? {}).length,
      0,
    );
  }, [liveData, stripIds]);

  // Determine empty state: zero configured outlets across all strips or prop override
  const isCardEmpty = propIsEmpty ?? totalOutletsCount === 0;

  const styles = useMemo(
    () => createStyles(theme, isRtl, isArabic),
    [theme, isRtl, isArabic],
  );

  const handleTurnOffAll = () => {
    if (isProcessing) return;
    setIsProcessing(true);

    try {
      if (stripIds.length > 0 && connected) {
        stripIds.forEach((stripId) => {
          toggleAll(stripId, "off");
        });
      }

      setJustToggled(true);
      onSuccess?.();

      setTimeout(() => {
        setIsProcessing(false);
        setTimeout(() => setJustToggled(false), 2000);
      }, 500);
    } catch {
      setIsProcessing(false);
    }
  };

  return (
    <View style={{ width: "100%" }}>
      {/* 1. Empty State View with Fade */}
      <Fade in={isCardEmpty} duration={250} unmountOnExit>
        <MasterPowerEmptyView styles={styles} theme={theme} />
      </Fade>

      {/* 2. Loaded Master Switch Card with Fade */}
      <Fade
        in={!isCardEmpty}
        duration={250}
        unmountOnExit
        style={styles.cardContainer}
      >
        {/* Background Gradient & Organic Decorative Curves */}
        <View style={StyleSheet.absoluteFill}>
          <Svg width="100%" height="100%">
            <Defs>
              <LinearGradient id="cardGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <Stop offset="0%" stopColor="#0B875D" />
                <Stop offset="50%" stopColor="#0A7A55" />
                <Stop offset="100%" stopColor="#066746" />
              </LinearGradient>
            </Defs>
            <Rect width="100%" height="100%" rx={26} fill="url(#cardGrad)" />
            {/* Subtle decorative wavy curves */}
            <Path
              d="M -20,120 Q 80,60 220,130 T 450,110 L 450,220 L -20,220 Z"
              fill="rgba(255, 255, 255, 0.05)"
            />
            <Path
              d="M -30,80 Q 70,140 180,90 T 460,130 L 460,220 L -30,220 Z"
              fill="rgba(0, 0, 0, 0.04)"
            />
          </Svg>
        </View>

        {/* Top Section: Info/Icon (at start) and Concentric Power Button (at end) */}
        <View style={styles.topRow}>
          {/* Info Container: Title, Subtitle, and Plug-off Icon Badge */}
          <View style={styles.infoAndIconContainer}>
            {/* Plug Icon with Diagonal Slash Badge */}
            <View style={styles.plugSlashBadge}>
              <Lucide name="plug" size={26} color="#FFFFFF" />
              <View style={styles.slashLine} />
            </View>

            {/* Text Details */}
            <View style={styles.textContainer}>
              <ThemedText style={styles.cardTitle}>
                {t("DASHBOARD.TURN_OFF_ALL_OUTLETS")}
              </ThemedText>
              <ThemedText style={styles.cardSubtitle}>
                {t("DASHBOARD.TURN_OFF_ALL_SUBTITLE")}
              </ThemedText>
            </View>
          </View>

          {/* Concentric Power Button Graphic */}
          <View style={styles.concentricWrapper}>
            {/* Outermost Ripple */}
            <View style={styles.rippleOuter}>
              {/* Middle Ripple */}
              <View style={styles.rippleMiddle}>
                {/* Inner Circle with Power Icon */}
                <View style={styles.powerCircleInner}>
                  <Lucide name="power" size={28} color="#FFFFFF" />
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Bottom Full-Width Action Button */}
        <Pressable
          onPress={handleTurnOffAll}
          disabled={isProcessing}
          style={({ pressed }) => [
            styles.actionButton,
            pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] },
          ]}
          accessibilityLabel={t("DASHBOARD.TURN_OFF_ALL_OUTLETS")}
        >
          {isProcessing ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <ThemedText style={styles.actionButtonText}>
              {justToggled
                ? t("DASHBOARD.ALL_TURNED_OFF")
                : t("DASHBOARD.TURN_OFF_ALL")}
            </ThemedText>
          )}
        </Pressable>
      </Fade>
    </View>
  );
};

export default MasterPowerCard;

const createStyles = (
  theme: ReturnType<typeof useTheme>,
  isRtl: boolean,
  isArabic: boolean,
) => {
  const isDark = theme.isDark;
  const naturalRow = "row";

  return StyleSheet.create({
    cardContainer: {
      width: "100%",
      borderRadius: 26,
      overflow: "hidden",
      paddingHorizontal: 16,
      paddingTop: 18,
      paddingBottom: 16,
      marginBottom: 8,
      position: "relative",
      ...Platform.select({
        ios: {
          shadowColor: "#0A7A55",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.25,
          shadowRadius: 10,
        },
        android: {
          elevation: 4,
        },
      }),
    },
    topRow: {
      flexDirection: naturalRow,
      alignItems: "center",
      justifyContent: "space-between",
      width: "100%",
    },
    concentricWrapper: {
      alignItems: "center",
      justifyContent: "center",
      width: 104,
      height: 104,
      marginEnd: 4,
    },
    rippleOuter: {
      width: 104,
      height: 104,
      borderRadius: 52,
      backgroundColor: "rgba(255, 255, 255, 0.08)",
      alignItems: "center",
      justifyContent: "center",
    },
    rippleMiddle: {
      width: 84,
      height: 84,
      borderRadius: 42,
      backgroundColor: "rgba(255, 255, 255, 0.12)",
      alignItems: "center",
      justifyContent: "center",
    },
    powerCircleInner: {
      width: 62,
      height: 62,
      borderRadius: 31,
      backgroundColor: "#0A7A55",
      borderWidth: 1.5,
      borderColor: "rgba(255, 255, 255, 0.25)",
      alignItems: "center",
      justifyContent: "center",
      ...Platform.select({
        ios: {
          shadowColor: "#000000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.2,
          shadowRadius: 4,
        },
        android: {
          elevation: 3,
        },
      }),
    },
    infoAndIconContainer: {
      flex: 1,
      flexDirection: naturalRow,
      alignItems: "center",
      justifyContent: "flex-start",
      gap: 12,
    },
    textContainer: {
      flex: 1,
      alignItems: isRtl ? "flex-end" : "flex-start",
      justifyContent: "center",
    },
    cardTitle: {
      fontSize: 19,
      lineHeight: 27,
      fontWeight: "800",
      color: "#FFFFFF",
      textAlign: isRtl ? "right" : "left",
      marginBottom: 4,
    },
    cardSubtitle: {
      fontSize: 12.5,
      lineHeight: 18,
      fontWeight: "500",
      color: "rgba(255, 255, 255, 0.88)",
      textAlign: isRtl ? "right" : "left",
    },
    plugSlashBadge: {
      width: 48,
      height: 48,
      borderRadius: 16,
      backgroundColor: "rgba(255, 255, 255, 0.18)",
      alignItems: "center",
      justifyContent: "center",
      position: "relative",
      borderWidth: 1,
      borderColor: "rgba(255, 255, 255, 0.15)",
    },
    slashLine: {
      position: "absolute",
      width: 2.2,
      height: 32,
      backgroundColor: "#FFFFFF",
      borderRadius: 2,
      transform: [{ rotate: "45deg" }],
    },
    actionButton: {
      width: "100%",
      height: 52,
      borderRadius: 18,
      backgroundColor: "#034833",
      alignItems: "center",
      justifyContent: "center",
      marginTop: 14,
      borderWidth: 1,
      borderColor: "rgba(255, 255, 255, 0.08)",
    },
    actionButtonText: {
      fontSize: 18,
      fontWeight: "800",
      color: "#FFFFFF",
      textAlign: "center",
    },
    emptyCardContainer: {
      width: "100%",
      borderRadius: 26,
      backgroundColor: isDark ? theme.backgroundElement : "#FFFFFF",
      borderWidth: 1,
      borderColor: isDark
        ? "rgba(255, 255, 255, 0.08)"
        : "rgba(0, 0, 0, 0.05)",
      paddingHorizontal: 20,
      paddingVertical: 24,
      alignItems: "center",
      justifyContent: "center",
      gap: 10,
      minHeight: 160,
      marginBottom: 8,
      ...Platform.select({
        ios: {
          shadowColor: "#000000",
          shadowOffset: { width: 0, height: 3 },
          shadowOpacity: isDark ? 0.25 : 0.05,
          shadowRadius: 8,
        },
        android: {
          elevation: 2,
        },
      }),
    },
    emptyIconBadge: {
      width: 54,
      height: 54,
      borderRadius: 27,
      backgroundColor: theme.tintedIconBackground,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 2,
    },
    emptyTitle: {
      fontSize: 16,
      lineHeight: 22,
      color: theme.text,
      textAlign: "center",
    },
    emptySubtitle: {
      fontSize: 13,
      lineHeight: 19,
      color: theme.textSecondary,
      textAlign: "center",
      maxWidth: 290,
    },
  });
};
