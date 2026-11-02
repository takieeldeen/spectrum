import React, { useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  I18nManager,
} from "react-native";
import { useTranslation } from "react-i18next";
import { Lucide } from "@react-native-vector-icons/lucide";

import { useTheme } from "@/hooks/use-theme";
import { Fade } from "@/components/ui/fade";
import { IDevice } from "@/types/device";
import DeviceCard from "../device-card";
import { EmptyView } from "./empty-view";
import { DeviceListLoadingView } from "./loading-view";
import { DeviceNewEditBottomSheet } from "../new-edit-view";
import { useGetDevices } from "@/api";

export function ListView() {
  const { data, isLoading, isFetching, refetch } = useGetDevices();
  const theme = useTheme();
  const styles = createStyles(theme);
  const { i18n } = useTranslation();
  const isArabic = (i18n.language || "ar").startsWith("ar");
  const isRtl = I18nManager.isRTL || isArabic;

  const [sheetVisible, setSheetVisible] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<IDevice | null>(null);

  const handleOpenCreate = () => {
    setSelectedDevice(null);
    setSheetVisible(true);
  };

  const handleOpenEdit = (device: IDevice) => {
    setSelectedDevice(device);
    setSheetVisible(true);
  };

  const handleCloseSheet = () => {
    setSheetVisible(false);
    setSelectedDevice(null);
  };

  const hasDevices = !isLoading && !!data && data.length > 0;

  return (
    <View style={styles.container}>
      {/* 1. Loading State with Fade */}
      <Fade
        in={isLoading}
        duration={250}
        exitDuration={0}
        style={styles.stateWrapper}
      >
        <DeviceListLoadingView count={3} />
      </Fade>

      {/* 2. Empty State with Fade & Pull-to-Refresh */}
      <Fade
        in={!isLoading && (!data || data.length === 0)}
        duration={250}
        exitDuration={0}
        style={styles.stateWrapper}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.emptyScrollContent}
          refreshControl={
            <RefreshControl
              refreshing={isFetching}
              onRefresh={refetch}
              tintColor={theme.primary}
            />
          }
        >
          <EmptyView onAddNew={handleOpenCreate} />
        </ScrollView>
      </Fade>

      {/* 3. Loaded Device List with Fade & Pull-to-Refresh */}
      <Fade in={hasDevices} duration={250} style={styles.stateWrapper}>
        <FlatList
          data={data || []}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => (
            <DeviceCard device={item} onEdit={handleOpenEdit} />
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          refreshControl={
            <RefreshControl
              refreshing={isFetching}
              onRefresh={refetch}
              tintColor={theme.primary}
            />
          }
        />
      </Fade>

      {/* Floating Circular Add Button */}
      {hasDevices ? (
        <TouchableOpacity
          style={[styles.fab, isRtl ? styles.fabRtl : styles.fabLtr]}
          onPress={handleOpenCreate}
          activeOpacity={0.85}
        >
          <Lucide name="plus" size={26} color="#FFFFFF" />
        </TouchableOpacity>
      ) : null}

      {/* Device New / Edit Bottom Sheet */}
      <DeviceNewEditBottomSheet
        visible={sheetVisible}
        onClose={handleCloseSheet}
        currentDevice={selectedDevice}
        onSuccess={refetch}
      />
    </View>
  );
}

const createStyles = (theme: ReturnType<typeof useTheme>) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    stateWrapper: {
      flex: 1,
    },
    emptyScrollContent: {
      flexGrow: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    listContent: {
      paddingHorizontal: 20,
      paddingTop: 8,
      paddingBottom: 96,
    },
    separator: {
      height: 14,
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

export default ListView;
