import React from "react";
import {
  StyleSheet,
  FlatList,
  RefreshControl,
  View,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ThemedView } from "@/components/themed-view";
import { ThemedText } from "@/components/themed-text";
import { useTheme } from "@/hooks/use-theme";
import { useTranslation } from "react-i18next";
import { PlugCard } from "../plug-card";
import { IPlug } from "@/types/plug";
import { useGetPlugList } from "@/api/plug";
import { Button } from "@/components/ui";
import Lucide from "@react-native-vector-icons/lucide";
import { useRouter } from "expo-router";
import { EmptyView } from "./empty-view";

/* ==========================================================================
   1. DUMMY PLUGS BASED ON BACKEND MODEL (PlugSchema in plug.model.ts)
   ========================================================================== */

export const DUMMY_PLUGS: IPlug[] = [
  {
    _id: "plug-1",
    id: "plug-1",
    user: "660c1d2e3f4a5b6c7d8e9f01",
    name: "Living Room Strip",
    arabicName: "مشترك الصالة",
    serialNumber: "SPK-PLG-00142",
    ipAddress: "192.168.1.101",
    roomId: "room-living-room",
    connected: true,
    isOnline: true,
    createdAt: "2026-03-10T10:00:00.000Z",
    updatedAt: "2026-10-15T15:30:00.000Z",
    outlets: {
      outlet1: {
        on: true,
        watts: 45,
        power_mw: 45000,
        runtime: 120,
        temperature_c: 32,
      },
      outlet2: {
        on: true,
        watts: 12,
        power_mw: 12000,
        runtime: 340,
        temperature_c: 28,
      },
      outlet3: {
        on: false,
        watts: 0,
        power_mw: 0,
        runtime: 0,
        temperature_c: 24,
      },
      outlet4: {
        on: true,
        watts: 95,
        power_mw: 95000,
        runtime: 85,
        temperature_c: 35,
      },
    },
  },
  {
    _id: "plug-2",
    id: "plug-2",
    user: "660c1d2e3f4a5b6c7d8e9f01",
    name: "Office Workstation Strip",
    arabicName: "مشترك المكتب",
    serialNumber: "SPK-PLG-00155",
    ipAddress: "192.168.1.102",
    roomId: "room-office",
    connected: true,
    isOnline: true,
    createdAt: "2026-04-12T11:20:00.000Z",
    updatedAt: "2026-10-15T16:45:00.000Z",
    outlets: {
      outlet1: {
        on: true,
        watts: 85,
        power_mw: 85000,
        runtime: 510,
        temperature_c: 34,
      },
      outlet2: {
        on: true,
        watts: 55,
        power_mw: 55000,
        runtime: 320,
        temperature_c: 30,
      },
      outlet3: {
        on: true,
        watts: 28,
        power_mw: 28000,
        runtime: 240,
        temperature_c: 27,
      },
      outlet4: {
        on: false,
        watts: 0,
        power_mw: 0,
        runtime: 0,
        temperature_c: 23,
      },
    },
  },
  {
    _id: "plug-3",
    id: "plug-3",
    user: "660c1d2e3f4a5b6c7d8e9f01",
    name: "Bedroom Strip",
    arabicName: "مشترك غرفة النوم",
    serialNumber: "SPK-PLG-00189",
    ipAddress: "192.168.1.103",
    roomId: "room-bedroom",
    connected: false,
    isOnline: false,
    createdAt: "2026-05-01T09:15:00.000Z",
    updatedAt: "2026-10-14T20:10:00.000Z",
    outlets: {
      outlet1: {
        on: false,
        watts: 0,
        power_mw: 0,
        runtime: 0,
        temperature_c: 22,
      },
      outlet2: {
        on: false,
        watts: 0,
        power_mw: 0,
        runtime: 0,
        temperature_c: 22,
      },
      outlet3: {
        on: false,
        watts: 0,
        power_mw: 0,
        runtime: 0,
        temperature_c: 22,
      },
      outlet4: {
        on: false,
        watts: 0,
        power_mw: 0,
        runtime: 0,
        temperature_c: 22,
      },
    },
  },
  {
    _id: "plug-4",
    id: "plug-4",
    user: "660c1d2e3f4a5b6c7d8e9f01",
    name: "Kitchen Appliances Strip",
    arabicName: "مشترك المطبخ",
    serialNumber: "SPK-PLG-00204",
    ipAddress: "192.168.1.104",
    roomId: "room-kitchen",
    connected: true,
    isOnline: true,
    createdAt: "2026-06-18T14:00:00.000Z",
    updatedAt: "2026-10-15T17:10:00.000Z",
    outlets: {
      outlet1: {
        on: true,
        watts: 120,
        power_mw: 120000,
        runtime: 45,
        temperature_c: 38,
      },
      outlet2: {
        on: false,
        watts: 0,
        power_mw: 0,
        runtime: 0,
        temperature_c: 25,
      },
      outlet3: {
        on: true,
        watts: 65,
        power_mw: 65000,
        runtime: 190,
        temperature_c: 29,
      },
      outlet4: {
        on: true,
        watts: 15,
        power_mw: 15000,
        runtime: 600,
        temperature_c: 27,
      },
    },
  },
];

/* ==========================================================================
   2. PLUGS LIST VIEW COMPONENT
   ========================================================================== */

export function PlugsListView({ initialPlugs }: { initialPlugs?: IPlug[] }) {
  const router = useRouter();
  const theme = useTheme();
  const { t } = useTranslation();

  const {
    data: plugsData,
    isLoading,
    isRefetching,
    refetch,
  } = useGetPlugList();

  const plugs = plugsData ?? initialPlugs ?? [];

  const onRefresh = async () => {
    await refetch();
  };

  const renderItem = ({ item }: { item: IPlug }) => {
    return <PlugCard plug={item} />;
  };

  const renderEmptyComponent = () => {
    if (isLoading) {
      return (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      );
    }

    return (
      <EmptyView
        onAddNew={() => router.push("/(tabs)/plugs/plug-create-edit-page")}
      />
    );
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={["left", "right"]}>
        <FlatList
          data={plugs}
          keyExtractor={(item) => (item._id || item.id) as string}
          renderItem={renderItem}
          contentContainerStyle={[
            styles.listContent,
            plugs.length === 0 && styles.listContentEmpty,
          ]}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={renderEmptyComponent}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={onRefresh}
              tintColor={theme.primary}
              colors={[theme.primary]}
            />
          }
        />
        {plugs.length > 0 && (
          <Button
            color="primary"
            onPress={() => router.push("/(tabs)/plugs/plug-create-edit-page")}
            style={{
              height: 48,
              width: 48,
              borderRadius: 24,
              paddingHorizontal: 0,
              paddingVertical: 0,
              position: "absolute",
              bottom: 12,
              right: 12,
            }}
          >
            <Lucide name="plus" color="white" size={24} />
          </Button>
        )}
      </SafeAreaView>
    </ThemedView>
  );
}

export default PlugsListView;

/* ==========================================================================
   3. STYLES
   ========================================================================== */

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    paddingTop: 16,
  },
  listContent: {
    paddingHorizontal: 12,
    paddingBottom: 40,
  },
  listContentEmpty: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  centerContainer: {
    paddingVertical: 60,
    alignItems: "center",
    justifyContent: "center",
  },
});
