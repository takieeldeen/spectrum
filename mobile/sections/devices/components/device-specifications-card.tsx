import React from "react";
import { View, StyleSheet, I18nManager } from "react-native";
import { useTranslation } from "react-i18next";
import { Lucide } from "@react-native-vector-icons/lucide";

import { useTheme } from "@/hooks/use-theme";
import ThemedText from "@/components/themed-text";
import { IDevice } from "@/types/device";

export interface DeviceSpecificationsCardProps {
  device?: IDevice | null;
  isConnected?: boolean;
}

export function DeviceSpecificationsCard({
  device,
  isConnected = false,
}: DeviceSpecificationsCardProps) {
  const theme = useTheme();
  const styles = createStyles(theme);
  const { t, i18n } = useTranslation();
  const isArabic = (i18n.language || "ar").startsWith("ar");

  const plugObj =
    typeof device?.plugId === "object" ? device.plugId : undefined;
  const stripName = plugObj?.name;

  const isAssigned = !!device?.plugId && device.plugId !== "";

  const formatLastActive = (dateStr?: string) => {
    if (!dateStr) return t("DEVICE_DETAILS.NEVER");
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString(isArabic ? "ar-EG" : "en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateStr;
    }
  };

  const rows = [
    {
      id: "name",
      label: t("DEVICE_DETAILS.DEVICE_NAME"),
      value: device?.name || "--",
      icon: "cpu" as const,
    },
    {
      id: "type",
      label: t("DEVICE_DETAILS.DEVICE_TYPE"),
      value: t("DEVICE_DETAILS.DEFAULT_TYPE_VAL"),
      icon: "box" as const,
    },
    {
      id: "strip",
      label: t("DEVICE_DETAILS.PARENT_STRIP"),
      value: stripName || t("DEVICE_DETAILS.STATUS_UNASSIGNED"),
      icon: "plug" as const,
    },
    {
      id: "port",
      label: t("DEVICE_DETAILS.PORT_NUMBER"),
      value: isAssigned && device?.plugPort
        ? t("DEVICE_CARD.OUTLET_NUMBER", { num: device.plugPort })
        : t("DEVICE_DETAILS.STATUS_UNASSIGNED"),
      icon: "hash" as const,
    },
    {
      id: "lastActive",
      label: t("DEVICE_DETAILS.LAST_ACTIVE"),
      value: formatLastActive(device?.lastTurnedOn),
      icon: "clock" as const,
    },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Lucide name="info" size={20} color={theme.primary} />
        <ThemedText style={styles.sectionTitle}>
          {t("DEVICE_DETAILS.SPECIFICATIONS_TITLE")}
        </ThemedText>
      </View>

      <View style={styles.card}>
        {rows.map((row, index) => (
          <React.Fragment key={row.id}>
            {index > 0 && <View style={styles.divider} />}
            <View style={styles.row}>
              <View style={styles.rowLabelGroup}>
                <Lucide
                  name={row.icon}
                  size={16}
                  color={theme.textSecondary}
                />
                <ThemedText style={styles.rowLabel}>{row.label}</ThemedText>
              </View>
              <ThemedText numberOfLines={1} style={styles.rowValue}>
                {row.value}
              </ThemedText>
            </View>
          </React.Fragment>
        ))}
      </View>
    </View>
  );
}

const createStyles = (theme: ReturnType<typeof useTheme>) =>
  StyleSheet.create({
    container: {
      gap: 12,
    },
    headerRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      paddingHorizontal: 4,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: "700",
      color: theme.text,
    },
    card: {
      backgroundColor: theme.cardBackground,
      borderRadius: 20,
      padding: 16,
      borderWidth: 1,
      borderColor: theme.divider,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.04,
      shadowRadius: 6,
      elevation: 1,
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: 10,
    },
    rowLabelGroup: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    rowLabel: {
      fontSize: 13,
      color: theme.textSecondary,
    },
    rowValue: {
      fontSize: 13,
      fontWeight: "700",
      color: theme.text,
      maxWidth: "50%",
      textAlign: "right",
    },
    divider: {
      height: 1,
      backgroundColor: theme.divider,
    },
  });

export default DeviceSpecificationsCard;
