import React from "react";
import {
  View,
  StyleSheet,
  Switch,
  TouchableOpacity,
  I18nManager,
} from "react-native";
import Svg, { Path } from "react-native-svg";
import { useTranslation } from "react-i18next";
import { Lucide } from "@react-native-vector-icons/lucide";

import { useTheme } from "@/hooks/use-theme";
import ThemedText from "@/components/themed-text";
import { useGetGuards, useToggleGuard } from "@/api/guards";
import { IGuard } from "@/types/guard";
import { useSnackbar } from "@/components/ui/snackbar-provider";
import { Skeleton } from "@/components/ui/skeleton";

export interface DeviceGuardsListProps {
  deviceId: string;
  onAddGuard?: () => void;
  onEditGuard?: (guard: IGuard) => void;
}

export function DeviceGuardsList({
  deviceId,
  onAddGuard,
  onEditGuard,
}: DeviceGuardsListProps) {
  const theme = useTheme();
  const styles = createStyles(theme);
  const { t, i18n } = useTranslation();
  const snackbar = useSnackbar();

  // Following user rule: do NOT rename `data` to plural `guards`
  const { data, isLoading } = useGetGuards({ deviceId });
  const toggleMutation = useToggleGuard();

  const handleToggle = async (guard: IGuard) => {
    try {
      await toggleMutation.mutateAsync({
        id: guard._id,
        isEnabled: !guard.isEnabled,
      });
      snackbar.success(t("GUARDS.TOGGLE_SUCCESS"));
    } catch (err: any) {
      snackbar.error(err?.message || "Failed to toggle guard");
    }
  };

  const getGuardIcon = (target: string) => {
    switch (target) {
      case "TEMPERATURE":
        return <Lucide name="thermometer" size={18} color="#EF4444" />;
      case "POWER":
        return <Lucide name="zap" size={18} color="#F59E0B" />;
      case "CURRENT":
      default:
        return <Lucide name="activity" size={18} color={theme.primary} />;
    }
  };

  const getGuardLabel = (guard: IGuard) => {
    switch (guard.target) {
      case "TEMPERATURE":
        return t("GUARDS.RULE_OVERHEAT", { value: guard.value });
      case "POWER":
        return t("GUARDS.RULE_OVERLOAD", { value: guard.value });
      case "CURRENT":
        return t("GUARDS.RULE_OVERCURRENT", { value: guard.value });
      default:
        return t("GUARDS.RULE_GENERIC", {
          action:
            guard.action === "OFF"
              ? t("GUARDS.ACTION_CUTOFF")
              : t("GUARDS.ACTION_TURN_ON"),
          metric: guard.target,
          value: guard.value,
        });
    }
  };

  return (
    <View style={styles.container}>
      {/* 1. Header Row */}
      <View style={styles.headerRow}>
        {/* Header Icon Badge */}
        <View style={styles.headerIconBadge}>
          <Lucide name="shield-check" size={24} color={theme.primary} />
        </View>
        <View style={styles.headerTextGroup}>
          <ThemedText style={styles.sectionTitle}>
            {t("GUARDS.TITLE")}
          </ThemedText>
          <ThemedText style={styles.subtitle}>
            {t("GUARDS.SUBTITLE")}
          </ThemedText>
        </View>

        {/* Small Add Button if guards already exist */}
        {data && data.length > 0 && onAddGuard ? (
          <TouchableOpacity
            style={styles.headerAddBtn}
            onPress={onAddGuard}
            activeOpacity={0.7}
          >
            <Lucide name="plus" size={18} color={theme.primary} />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* 2. Loading State */}
      {isLoading ? (
        <View style={styles.listContainer}>
          <DeviceGuardSkeleton />
          <DeviceGuardSkeleton />
        </View>
      ) : !data || data.length === 0 ? (
        /* 3. Redesigned Empty State matching Mockup */
        <View style={styles.emptyCard}>
          {/* Concentric Circle Illustration with Shield & Floating Dots */}
          <View style={styles.graphicOuterCircle}>
            {/* Small floating dots */}
            <View style={styles.floatingDotLeft} />
            <View style={styles.floatingDotRight} />

            <View style={styles.graphicInnerCircle}>
              {/* Solid Emerald Shield with White Checkmark */}
              <Lucide name="shield-plus" size={48} color={theme.primary} />
            </View>
          </View>

          {/* Empty State Titles */}
          <ThemedText style={styles.emptyTitle}>
            {t("GUARDS.EMPTY_TITLE")}
          </ThemedText>
          <ThemedText style={styles.emptySubtitle}>
            {t("GUARDS.EMPTY_SUBTITLE")}
          </ThemedText>

          {/* Metric Tags Pills */}
          <View style={styles.tagsRow}>
            <View style={styles.tagPill}>
              <ThemedText style={styles.tagText}>
                {t("GUARDS.TAG_TEMP")}
              </ThemedText>
            </View>
            <View style={styles.tagPill}>
              <ThemedText style={styles.tagText}>
                {t("GUARDS.TAG_CURRENT")}
              </ThemedText>
            </View>
            <View style={styles.tagPill}>
              <ThemedText style={styles.tagText}>
                {t("GUARDS.TAG_POWER")}
              </ThemedText>
            </View>
          </View>

          {/* Primary Action Button */}
          <TouchableOpacity
            style={styles.addButton}
            onPress={onAddGuard}
            activeOpacity={0.85}
          >
            <Lucide name="plus" size={20} color="#FFFFFF" />
            <ThemedText style={styles.addButtonText}>
              {t("GUARDS.ADD_GUARD_BUTTON")}
            </ThemedText>
          </TouchableOpacity>
        </View>
      ) : (
        /* 4. Active Guards List */
        <View style={styles.listContainer}>
          {data.map((guard) => (
            <View key={guard._id} style={styles.guardCard}>
              <TouchableOpacity
                style={styles.guardLeft}
                onPress={() => onEditGuard?.(guard)}
                activeOpacity={0.7}
              >
                <View style={styles.iconBox}>{getGuardIcon(guard.target)}</View>
                <View style={styles.textContainer}>
                  <ThemedText numberOfLines={2} style={styles.guardLabel}>
                    {getGuardLabel(guard)}
                  </ThemedText>
                  <ThemedText style={styles.guardStatus}>
                    {guard.isEnabled
                      ? t("DEVICE_DETAILS.STATUS_CONNECTED")
                      : t("DEVICE_DETAILS.STATUS_STANDBY")}
                  </ThemedText>
                </View>
              </TouchableOpacity>

              <Switch
                value={guard.isEnabled ?? true}
                onValueChange={() => handleToggle(guard)}
                trackColor={{
                  false: theme.divider,
                  true: theme.primary,
                }}
                thumbColor="#FFFFFF"
                ios_backgroundColor={theme.divider}
              />
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

/**
 * Skeleton for small component as required by user rules
 */
export function DeviceGuardSkeleton() {
  const theme = useTheme();
  return (
    <View
      style={{
        backgroundColor: theme.cardBackground,
        borderRadius: 16,
        padding: 14,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        borderWidth: 1,
        borderColor: theme.divider,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
        <Skeleton width={36} height={36} borderRadius={12} animation="pulse" />
        <View style={{ gap: 6 }}>
          <Skeleton
            width={160}
            height={14}
            borderRadius={4}
            animation="pulse"
          />
          <Skeleton width={70} height={10} borderRadius={4} animation="pulse" />
        </View>
      </View>
      <Skeleton width={44} height={24} borderRadius={12} animation="pulse" />
    </View>
  );
}

const createStyles = (theme: ReturnType<typeof useTheme>) =>
  StyleSheet.create({
    container: {
      gap: 16,
      marginVertical: 8,
    },
    headerRow: {
      flexDirection: "row",
      alignItems: "center",
      // justifyContent: "space-between",
      paddingHorizontal: 4,
    },
    headerTextGroup: {
      gap: 2,
      alignItems: "flex-start",
    },
    sectionTitle: {
      fontSize: 22,
      fontWeight: "800",
      color: theme.text,
      lineHeight: 28,
    },
    subtitle: {
      fontSize: 13,
      color: theme.textSecondary,
      lineHeight: 18,
    },
    headerIconBadge: {
      width: 44,
      height: 44,
      borderRadius: 14,
      // backgroundColor: theme.tintedIconBackground,
      alignItems: "center",
      justifyContent: "center",
    },
    headerAddBtn: {
      width: 36,
      height: 36,
      borderRadius: 12,
      backgroundColor: theme.tintedIconBackground,
      alignItems: "center",
      justifyContent: "center",
      marginLeft: "auto",
    },
    listContainer: {
      gap: 10,
    },
    emptyCard: {
      backgroundColor: theme.cardBackground,
      borderRadius: 26,
      paddingVertical: 32,
      paddingHorizontal: 20,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1.5,
      borderStyle: "dashed",
      borderColor: theme.isDark ? "rgba(16, 185, 129, 0.35)" : "#B2DCD0",
      gap: 12,
    },
    graphicOuterCircle: {
      width: 124,
      height: 124,
      borderRadius: 62,
      backgroundColor: theme.isDark ? "rgba(16, 185, 129, 0.08)" : "#EBF8F3",
      alignItems: "center",
      justifyContent: "center",
      position: "relative",
      marginBottom: 6,
    },
    graphicInnerCircle: {
      width: 90,
      height: 90,
      borderRadius: 45,
      backgroundColor: theme.isDark ? "rgba(16, 185, 129, 0.14)" : "#D8F3E7",
      alignItems: "center",
      justifyContent: "center",
    },
    floatingDotLeft: {
      position: "absolute",
      left: 10,
      top: 68,
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: theme.isDark ? "rgba(16, 185, 129, 0.3)" : "#C1EAD9",
    },
    floatingDotRight: {
      position: "absolute",
      right: 18,
      top: 26,
      width: 7,
      height: 7,
      borderRadius: 3.5,
      backgroundColor: theme.isDark ? "rgba(16, 185, 129, 0.3)" : "#C1EAD9",
    },
    emptyTitle: {
      fontSize: 20,
      fontWeight: "800",
      color: theme.text,
      textAlign: "center",
      marginTop: 4,
    },
    emptySubtitle: {
      fontSize: 14,
      color: theme.textSecondary,
      textAlign: "center",
      lineHeight: 22,
      maxWidth: 320,
    },
    tagsRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 10,
      marginVertical: 6,
    },
    tagPill: {
      backgroundColor: theme.isDark ? "rgba(16, 185, 129, 0.12)" : "#EAF7F2",
      paddingHorizontal: 18,
      paddingVertical: 7,
      borderRadius: 20,
    },
    tagText: {
      fontSize: 13,
      fontWeight: "700",
      color: theme.primary,
    },
    addButton: {
      width: "100%",
      height: 52,
      borderRadius: 16,
      backgroundColor: theme.primary,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      marginTop: 8,
      shadowColor: theme.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.25,
      shadowRadius: 8,
      elevation: 4,
    },
    addButtonText: {
      fontSize: 16,
      fontWeight: "800",
      color: "#FFFFFF",
    },
    guardCard: {
      backgroundColor: theme.cardBackground,
      borderRadius: 16,
      padding: 14,
      borderWidth: 1,
      borderColor: theme.divider,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.04,
      shadowRadius: 4,
      elevation: 1,
    },
    guardLeft: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      flex: 1,
      marginRight: 8,
    },
    iconBox: {
      width: 38,
      height: 38,
      borderRadius: 12,
      backgroundColor: theme.backgroundSecondary,
      alignItems: "center",
      justifyContent: "center",
    },
    textContainer: {
      flex: 1,
      gap: 2,
    },
    guardLabel: {
      fontSize: 13,
      fontWeight: "600",
      color: theme.text,
    },
    guardStatus: {
      fontSize: 11,
      color: theme.textSecondary,
    },
  });

export default DeviceGuardsList;
