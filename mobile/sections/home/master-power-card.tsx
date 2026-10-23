import React, { useState } from "react";
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
import { usePlugs } from "@/providers/plug.provider";
import ThemedText from "@/components/themed-text";

export interface MasterPowerCardProps {
  onSuccess?: () => void;
}

export const MasterPowerCard: React.FC<MasterPowerCardProps> = ({
  onSuccess,
}) => {
  const isRtl = I18nManager.isRTL;
  const { liveData, connected, toggleAll } = usePlugs();
  const [isProcessing, setIsProcessing] = useState(false);
  const [justToggled, setJustToggled] = useState(false);

  const handleTurnOffAll = () => {
    if (isProcessing) return;
    setIsProcessing(true);

    try {
      const stripIds = Object.keys(liveData ?? {});
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
    <View style={styles.cardContainer}>
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

      {/* Top Section: Power Graphic (Left) & Title + Plug Slash Icon (Right in RTL) */}
      <View
        style={[
          styles.topRow,
          { flexDirection: isRtl ? "row" : "row-reverse" },
        ]}
      >
        {/* Left: Concentric Power Button Graphic */}
        <View style={styles.concentricWrapper}>
          {/* Outermost Ripple */}
          <View style={styles.rippleOuter}>
            {/* Middle Ripple */}
            <View style={styles.rippleMiddle}>
              {/* Inner Circle with Power Icon */}
              <View style={styles.powerCircleInner}>
                <Lucide
                  name="power"
                  size={28}
                  color="#FFFFFF"
                  strokeWidth={2.8}
                />
              </View>
            </View>
          </View>
        </View>

        {/* Center/Right Info: Title, Subtitle, and Plug-off Icon Badge */}
        <View
          style={[
            styles.infoAndIconContainer,
            { flexDirection: isRtl ? "row" : "row-reverse" },
          ]}
        >
          {/* Text Details */}
          <View style={styles.textContainer}>
            <ThemedText style={styles.cardTitle}>إيقاف جميع المخارج</ThemedText>
            <ThemedText style={styles.cardSubtitle}>
              سيتم إيقاف جميع الأجهزة المتصلة{"\n"}في كل شرائح الطاقة
            </ThemedText>
          </View>

          {/* Plug Icon with Diagonal Slash Badge */}
          <View style={styles.plugSlashBadge}>
            <Lucide name="plug" size={26} color="#FFFFFF" strokeWidth={2.2} />
            <View style={styles.slashLine} />
          </View>
        </View>
      </View>

      {/* Bottom Full-Width Action Button ("إيقاف الكل") */}
      <Pressable
        onPress={handleTurnOffAll}
        disabled={isProcessing}
        style={({ pressed }) => [
          styles.actionButton,
          pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] },
        ]}
        accessibilityLabel="إيقاف جميع المخارج"
      >
        {isProcessing ? (
          <ActivityIndicator color="#FFFFFF" size="small" />
        ) : (
          <ThemedText style={styles.actionButtonText}>
            {justToggled ? "تم الإيقاف ✓" : "إيقاف الكل"}
          </ThemedText>
        )}
      </Pressable>
    </View>
  );
};

export default MasterPowerCard;

const styles = StyleSheet.create({
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
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 12,
  },
  textContainer: {
    flex: 1,
    alignItems: "flex-end",
    justifyContent: "center",
  },
  cardTitle: {
    fontSize: 19,
    lineHeight: 27,
    fontWeight: "800",
    color: "#FFFFFF",
    textAlign: "right",
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 12.5,
    lineHeight: 18,
    fontWeight: "500",
    color: "rgba(255, 255, 255, 0.88)",
    textAlign: "right",
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
});
