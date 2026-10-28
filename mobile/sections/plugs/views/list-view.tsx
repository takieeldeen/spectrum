import React from "react";
import {
  StyleSheet,
  FlatList,
  RefreshControl,
  View,
  ActivityIndicator,
  TouchableOpacity,
  I18nManager,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ThemedView } from "@/components/themed-view";
import { ThemedText } from "@/components/themed-text";
import { useTheme } from "@/hooks/use-theme";
import { useTranslation } from "react-i18next";
import { PlugCard } from "../plug-card";
import { IPlug } from "@/types/plug";
import { useGetPlugList } from "@/api/plug";
import { Lucide } from "@react-native-vector-icons/lucide";
import { useRouter } from "expo-router";
import { EmptyView } from "./empty-view";

/* ==========================================================================
   PLUGS LIST VIEW COMPONENT
   ========================================================================== */

export function PlugsListView({ initialPlugs }: { initialPlugs?: IPlug[] }) {
  const router = useRouter();
  const theme = useTheme();
  const styles = createStyles(theme);
  const { i18n } = useTranslation();
  const isArabic = (i18n.language || "ar").startsWith("ar");
  const isRtl = I18nManager.isRTL || isArabic;

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
          keyExtractor={(item) => item._id!}
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

        {/* Floating Circular Add Button matching Devices List */}
        {plugs.length > 0 ? (
          <TouchableOpacity
            style={[
              styles.fab,
              isRtl ? styles.fabRtl : styles.fabLtr,
            ]}
            onPress={() => router.push("/(tabs)/plugs/plug-create-edit-page")}
            activeOpacity={0.85}
          >
            <Lucide name="plus" size={26} color="#FFFFFF" />
          </TouchableOpacity>
        ) : null}
      </SafeAreaView>
    </ThemedView>
  );
}

export default PlugsListView;

/* ==========================================================================
   STYLES (Theme Aware)
   ========================================================================== */

const createStyles = (theme: ReturnType<typeof useTheme>) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    safeArea: {
      flex: 1,
      paddingTop: 16,
    },
    listContent: {
      paddingHorizontal: 12,
      paddingBottom: 96,
      gap: 12,
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
    fab: {
      position: "absolute",
      bottom: 24,
      width: 58,
      height: 58,
      borderRadius: 29,
      backgroundColor: theme.primary,
      alignItems: "center",
      justifyContent: "center",
      shadowColor: theme.primary,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.35,
      shadowRadius: 10,
      elevation: 8,
    },
    fabLtr: {
      right: 20,
    },
    fabRtl: {
      left: 20,
    },
  });
