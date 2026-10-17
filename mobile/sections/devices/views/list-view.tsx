import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Switch,
  Platform,
  RefreshControl,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { SymbolView } from "expo-symbols";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useTheme } from "@/hooks/use-theme";
import { Colors, Spacing } from "@/constants/theme";
import { Button, Card, Divider, Popover, usePopover } from "@/components/ui";
import Lucide from "@react-native-vector-icons/lucide";

export interface Device {
  id: string;
  name: string;
  model: string;
  serialNumber: string;
  ip: string;
  isOnline: boolean;
  isOn: boolean;
  brightness: number;
  currentColor: string;
  connectionType: "Wi-Fi" | "Hotspot" | "Bluetooth";
  lastSeen?: string;
}

const INITIAL_DEVICES: Device[] = [
  {
    id: "dev-1",
    name: "Living Room Lightstrip",
    model: "Spectrum Strip Pro v2",
    serialNumber: "2CFDB3C1DE06",
    ip: "192.168.1.142",
    isOnline: true,
    isOn: true,
    brightness: 85,
    currentColor: "#10B981",
    connectionType: "Wi-Fi",
    lastSeen: "Just now",
  },
  {
    id: "dev-2",
    name: "Desk Ambient Glow",
    model: "Spectrum Neon Flex",
    serialNumber: "2CFDB3C1B2A1",
    ip: "192.168.1.155",
    isOnline: true,
    isOn: false,
    brightness: 60,
    currentColor: "#6366F1",
    connectionType: "Wi-Fi",
    lastSeen: "2 mins ago",
  },
  {
    id: "dev-3",
    name: "Bedroom Ceiling Halo",
    model: "Spectrum Strip Pro v1",
    serialNumber: "2CFDB3C09F44",
    ip: "192.168.1.189",
    isOnline: false,
    isOn: false,
    brightness: 40,
    currentColor: "#F59E0B",
    connectionType: "Wi-Fi",
    lastSeen: "3 hours ago",
  },
];

import DeviceCard, { DeviceItem } from "../device-card";

export const DUMMY_DEVICES: DeviceItem[] = [
  {
    _id: "dev-1",
    nameAr: "الكمبيوتر",
    nameEn: "Workstation PC",
    strip: {
      _id: "strip-1",
      nameAr: "مشترك المكتب",
      nameEn: "Office Strip",
    },
    plugPort: 3,
    voltage: 220,
    current: 0.12,
    power: 27,
    isOn: true,
    isOnline: true,
  },
  {
    _id: "dev-2",
    nameAr: "شاشة العرض",
    nameEn: "Main Monitor",
    strip: {
      _id: "strip-1",
      nameAr: "مشترك المكتب",
      nameEn: "Office Strip",
    },
    plugPort: 1,
    voltage: 221,
    current: 0.25,
    power: 55,
    isOn: true,
    isOnline: true,
  },
  {
    _id: "dev-3",
    nameAr: "مكيف الهواء",
    nameEn: "Air Conditioner",
    strip: {
      _id: "strip-2",
      nameAr: "مشترك غرفة النوم",
      nameEn: "Bedroom Strip",
    },
    plugPort: 2,
    voltage: 0,
    current: 0,
    power: 0,
    isOn: false,
    isOnline: false,
    connected: false,
  },
  {
    _id: "dev-4",
    nameAr: "جهاز الراوتر",
    nameEn: "Wi-Fi Router",
    strip: {
      _id: "strip-3",
      nameAr: "مشترك الصالة",
      nameEn: "Living Room Strip",
    },
    plugPort: 1,
    voltage: 220,
    current: 0.05,
    power: 11,
    isOn: true,
    isOnline: true,
  },
];

export function ListView() {
  const router = useRouter();
  const theme = useTheme();
  const styles = createStyles(theme);

  const [deviceList, setDeviceList] = useState<DeviceItem[]>(DUMMY_DEVICES);

  const handleTogglePower = (target: DeviceItem) => {
    setDeviceList((prev) =>
      prev.map((d) => (d._id === target._id ? { ...d, isOn: !d.isOn } : d)),
    );
  };

  const handleDeleteDevice = (target: DeviceItem) => {
    setDeviceList((prev) => prev.filter((d) => d._id !== target._id));
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      >
        {deviceList.map((item) => (
          <DeviceCard
            key={item._id}
            devices={item}
            onTogglePower={handleTogglePower}
            onDelete={handleDeleteDevice}
            onEdit={(d) => console.log("Edit device:", d._id)}
          />
        ))}
      </ScrollView>
    </View>
  );
}

const createStyles = (theme: typeof Colors.light | typeof Colors.dark) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
      padding: 12,
      paddingHorizontal: 0,
    },
    safeArea: {
      flex: 1,
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 20,
      paddingTop: 16,
      paddingBottom: 12,
    },
    title: {
      fontSize: 28,
      fontWeight: "700",
      letterSpacing: -0.5,
    },
    subtitle: {
      fontSize: 13,
      color: theme.textSecondary,
      marginTop: 2,
    },
    addButton: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: theme.primary,
      paddingVertical: 8,
      paddingHorizontal: 14,
      borderRadius: 20,
      gap: 6,
      shadowColor: theme.primary,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 4,
      elevation: 2,
    },
    addButtonPressed: {
      opacity: 0.85,
    },
    addButtonText: {
      color: "#FFFFFF",
      fontSize: 14,
      fontWeight: "600",
    },
    searchSection: {
      paddingHorizontal: 20,
      marginBottom: 8,
    },
    searchBar: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: theme.backgroundElement,
      borderRadius: 12,
      paddingHorizontal: 12,
      paddingVertical: Platform.OS === "ios" ? 10 : 6,
      marginBottom: 10,
    },
    searchInput: {
      flex: 1,
      fontSize: 15,
      color: theme.text,
      marginLeft: 8,
      padding: 0,
    },
    filterRow: {
      flexDirection: "row",
      gap: 8,
    },
    filterPill: {
      paddingVertical: 6,
      paddingHorizontal: 14,
      borderRadius: 16,
      backgroundColor: theme.backgroundElement,
    },
    filterPillSelected: {
      backgroundColor: theme.primary,
    },
    filterPillText: {
      fontSize: 13,
      fontWeight: "500",
      color: theme.textSecondary,
    },
    filterPillTextSelected: {
      color: "#FFFFFF",
      fontWeight: "600",
    },
    listContainer: {
      flex: 1,
    },
    listContent: {
      paddingHorizontal: 20,
      paddingTop: 8,
      paddingBottom: 40,
      gap: 14,
    },
    deviceCard: {
      backgroundColor: theme.backgroundElement,
      borderRadius: 18,
      padding: 16,
      borderWidth: 1,
      borderColor: "rgba(0,0,0,0.04)",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.04,
      shadowRadius: 6,
      elevation: 1,
    },
    cardHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    deviceInfoLeft: {
      flexDirection: "row",
      alignItems: "center",
      flex: 1,
      marginRight: 12,
    },
    colorIndicator: {
      width: 40,
      height: 40,
      borderRadius: 20,
      marginRight: 12,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.6,
      shadowRadius: 8,
      elevation: 3,
    },
    nameGroup: {
      flex: 1,
    },
    deviceName: {
      fontSize: 16,
      fontWeight: "600",
    },
    deviceMeta: {
      fontSize: 12,
      color: theme.textSecondary,
      marginTop: 2,
    },
    cardSpecsRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      marginTop: 12,
      paddingVertical: 8,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: "rgba(0,0,0,0.06)",
    },
    specBadge: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: theme.backgroundSelected,
      paddingVertical: 3,
      paddingHorizontal: 8,
      borderRadius: 6,
      gap: 4,
    },
    specLabel: {
      fontSize: 11,
      fontWeight: "700",
      color: theme.textSecondary,
    },
    specValue: {
      fontSize: 11,
      color: theme.text,
      fontFamily: Platform.select({ ios: "Courier", default: "monospace" }),
    },
    statusBadge: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 3,
      paddingHorizontal: 8,
      borderRadius: 6,
      marginLeft: "auto",
      gap: 5,
    },
    statusBadgeOnline: {
      backgroundColor: "rgba(16, 185, 129, 0.12)",
    },
    statusBadgeOffline: {
      backgroundColor: "rgba(156, 163, 175, 0.14)",
    },
    statusDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
    },
    statusDotOnline: {
      backgroundColor: "#10B981",
    },
    statusDotOffline: {
      backgroundColor: "#9CA3AF",
    },
    statusText: {
      fontSize: 11,
      fontWeight: "600",
    },
    statusTextOnline: {
      color: "#059669",
    },
    statusTextOffline: {
      color: "#6B7280",
    },
    cardFooter: {
      flexDirection: "row",
      gap: 10,
      marginTop: 10,
    },
    cardButton: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: theme.backgroundSelected,
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: 10,
      gap: 6,
    },
    cardButtonText: {
      fontSize: 12,
      fontWeight: "600",
      color: "#374151",
    },
    emptyContainer: {
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 48,
      paddingHorizontal: 24,
    },
    emptyIconCircle: {
      width: 72,
      height: 72,
      borderRadius: 36,
      backgroundColor: theme.backgroundElement,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 16,
    },
    emptyTitle: {
      fontSize: 18,
      fontWeight: "600",
      marginBottom: 6,
    },
    emptySubtitle: {
      fontSize: 13,
      color: theme.textSecondary,
      textAlign: "center",
      lineHeight: 18,
      marginBottom: 20,
    },
    emptyAction: {
      backgroundColor: theme.primary,
      paddingVertical: 10,
      paddingHorizontal: 18,
      borderRadius: 12,
    },
    emptyActionText: {
      color: "#FFFFFF",
      fontSize: 14,
      fontWeight: "600",
    },
    provisionBanner: {
      flexDirection: "row",
      backgroundColor: "rgba(245, 158, 11, 0.08)",
      borderWidth: 1,
      borderColor: "rgba(245, 158, 11, 0.2)",
      borderRadius: 14,
      padding: 14,
      gap: 12,
      alignItems: "flex-start",
      marginTop: 8,
    },
    bannerIconWrapper: {
      paddingTop: 2,
    },
    bannerTextWrapper: {
      flex: 1,
    },
    bannerTitle: {
      fontSize: 14,
      fontWeight: "600",
      color: "#B45309",
      marginBottom: 3,
    },
    bannerDescription: {
      fontSize: 12,
      lineHeight: 17,
      color: "#92400E",
    },
  });

export default ListView;
