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

import DeviceCard from "../device-card";
import { EmptyView } from "./empty-view";
import { useGetDevices } from "@/api";

export function ListView() {
  const { data: devices, isLoading: loadingDevices } = useGetDevices();
  console.log(devices);
  const router = useRouter();
  const theme = useTheme();
  const styles = createStyles(theme);

  return (
    <View style={styles.container}>
      {devices?.length === 0 ? (
        <EmptyView />
      ) : (
        <ScrollView
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        >
          {devices?.map((item) => (
            <DeviceCard
              device={item}
              key={item._id}
              // onTogglePower={handleTogglePower}
              // onDelete={handleDeleteDevice}
              // onEdit={(d) => console.log("Edit device:", d._id)}
            />
          ))}
        </ScrollView>
      )}
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

    listContainer: {
      flex: 1,
    },
    listContent: {
      paddingHorizontal: 20,
      paddingTop: 8,
      paddingBottom: 40,
      gap: 14,
    },
  });

export default ListView;
