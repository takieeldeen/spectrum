import React, { useState, useMemo } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  SectionList,
  TouchableOpacity,
} from "react-native";
import { useTranslation } from "react-i18next";
import { useRouter } from "expo-router";
import Lucide from "@react-native-vector-icons/lucide";

import Page from "@/components/page";
import { useTheme } from "@/hooks/use-theme";
import ThemedText from "@/components/themed-text";
import { Fade } from "@/components/ui/fade";
import FilterOptions from "../filter-options";
import NotificationItem, {
  getDateGroupKey,
  DateGroupKey,
} from "../notification-item";
import { NotificationsLoadingList } from "./loading-view";
import { NotificationsEmptyView } from "./empty-view";
import {
  useGetNotificationList,
  useGetUnreadNotificationsCount,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
} from "@/api/notifications";
import { INotificationItem } from "@/types/notifications";
import { NormalizedNotification } from "@/utils/notification-normalizer";
import i18n from "@/i18n";

const NotificationsListView = () => {
  // State Management
  const [filter, setFilter] = useState<FilterOptions>("ALL");

  // Custom Hooks & Router
  const { t } = useTranslation();
  const theme = useTheme();
  const styles = createStyles(theme);
  const router = useRouter();

  // Query Hook (Infinite scroll: 20 items per page, strictly sorted descending)
  // User rule: Do not rename data to plural of entity name
  const {
    data,
    isLoading,
    isFetching,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch,
  } = useGetNotificationList(filter);

  // Mutation Hooks
  const markReadMutation = useMarkNotificationRead();
  const markAllReadMutation = useMarkAllNotificationsRead();

  // Flatten infinite query pages
  const allItems = useMemo(() => {
    if (!data?.pages) return [];
    return data.pages.flatMap((page) => page.items || []);
  }, [data]);

  const handlePressNotification = (
    item: INotificationItem,
    normalized: NormalizedNotification,
  ) => {
    // 1. Mark as read on backend if unread
    if (item.readAt === null) {
      markReadMutation.mutate(item._id);
    }

    // 2. Route dynamically if route exists (e.g. /(tabs)/devices/[id])
    if (normalized.route) {
      router.push(normalized.route as any);
    }
  };

  // Group items by Today, Yesterday, Earlier
  const groupedSections = useMemo(() => {
    const groups: { [key in DateGroupKey]?: INotificationItem[] } = {};
    for (const item of allItems) {
      const groupKey = getDateGroupKey(item.createdAt);
      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey]!.push(item);
    }

    const order: DateGroupKey[] = [
      "GROUP_TODAY",
      "GROUP_YESTERDAY",
      "GROUP_EARLIER",
    ];

    return order
      .filter((k) => groups[k] && groups[k]!.length > 0)
      .map((k) => ({
        key: k,
        title: t(`NOTIFICATIONS.${k}`),
        data: groups[k]!,
      }));
  }, [allItems, t]);

  const { data: totalUnread } = useGetUnreadNotificationsCount();

  const unreadCount = useMemo(() => {
    if (typeof totalUnread === "number") {
      return totalUnread;
    }
    return allItems.filter((n) => n.readAt === null).length;
  }, [totalUnread, allItems]);

  return (
    <Page style={styles.pageContainer}>
      {/* Header Banner (Hidden smoothly if all notifications are read) */}
      <Fade in={unreadCount > 0} duration={250} unmountOnExit>
        <View style={styles.headerContainer}>
          <View style={styles.iconContainer}>
            <Lucide name="bell" size={24} color="white" />
          </View>
          <View
            style={{
              flex: 1,
              alignItems: i18n.language === "ar" ? "flex-end" : "flex-start",
            }}
          >
            <ThemedText style={styles.headerTitle}>
              {t("NOTIFICATIONS.UNREAD_COUNT", { count: unreadCount })}
            </ThemedText>
            <ThemedText style={styles.headerSubTitle}>
              {t("NOTIFICATIONS.PAGE_TITLE")}
            </ThemedText>
          </View>

          <TouchableOpacity
            style={styles.markAllButton}
            onPress={() => markAllReadMutation.mutate()}
            disabled={markAllReadMutation.isPending}
            activeOpacity={0.7}
          >
            <ThemedText style={styles.markAllButtonText}>
              {t("NOTIFICATIONS.MARK_ALL_READ")}
            </ThemedText>
          </TouchableOpacity>
        </View>
      </Fade>

      {/* Filter Tabs */}
      <FilterOptions currentFilter={filter} onFilter={(f) => setFilter(f)} />

      {/* Loading View with Fade */}
      <Fade in={isLoading} duration={250} style={{ flex: 1 }} exitDuration={0}>
        <NotificationsLoadingList count={6} />
      </Fade>

      {/* Empty View with Fade & RefreshControl */}
      <Fade
        in={!isLoading && groupedSections.length === 0}
        exitDuration={0}
        duration={250}
        style={{ flex: 1 }}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ flexGrow: 1 }}
          refreshControl={
            <RefreshControl
              refreshing={isFetching && !isFetchingNextPage}
              onRefresh={refetch}
              colors={[theme.primary]}
              tintColor={theme.primary}
              progressBackgroundColor={
                theme.isDark ? theme.backgroundElement : "#FFFFFF"
              }
            />
          }
        >
          <NotificationsEmptyView />
        </ScrollView>
      </Fade>

      {/* Populated List View with SectionList & Infinite Scrolling */}
      <Fade
        in={!isLoading && groupedSections.length > 0}
        duration={250}
        style={{ flex: 1 }}
      >
        <SectionList
          sections={groupedSections}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => (
            <NotificationItem item={item} onPress={handlePressNotification} />
          )}
          renderSectionHeader={({ section: { title } }) => (
            <ThemedText style={styles.sectionHeader}>{title}</ThemedText>
          )}
          onEndReached={() => {
            if (hasNextPage && !isFetchingNextPage) {
              fetchNextPage();
            }
          }}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            isFetchingNextPage ? (
              <View style={styles.footerLoader}>
                <ActivityIndicator size="small" color={theme.primary} />
              </View>
            ) : null
          }
          refreshControl={
            <RefreshControl
              refreshing={isFetching && !isFetchingNextPage}
              onRefresh={refetch}
              colors={[theme.primary]}
              tintColor={theme.primary}
              progressBackgroundColor={
                theme.isDark ? theme.backgroundElement : "#FFFFFF"
              }
            />
          }
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          SectionSeparatorComponent={() => <View style={{ height: 6 }} />}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        />
      </Fade>
    </Page>
  );
};

const createStyles = (theme: ReturnType<typeof useTheme>) =>
  StyleSheet.create({
    pageContainer: {
      padding: 12,
      gap: 12,
      backgroundColor: theme.background,
      flex: 1,
    },
    headerContainer: {
      width: "100%",
      padding: 14,
      backgroundColor: theme.primaryDark,
      borderRadius: 16,
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    iconContainer: {
      width: 44,
      height: 44,
      borderRadius: 12,
      backgroundColor: "rgba(255, 255, 255, 0.2)",
      justifyContent: "center",
      alignItems: "center",
    },
    headerTitle: {
      fontWeight: "800",
      color: "#FFFFFF",
      fontSize: 15,
      textAlign: i18n.language === "ar" ? "right" : "left",
    },
    headerSubTitle: {
      color: "rgba(255, 255, 255, 0.8)",
      fontSize: 12,
      marginTop: 2,
      textAlign: i18n.language === "ar" ? "right" : "left",
    },
    markAllButton: {
      backgroundColor: "rgba(255, 255, 255, 0.2)",
      borderRadius: 10,
      paddingHorizontal: 10,
      paddingVertical: 6,
    },
    markAllButtonText: {
      color: "#FFFFFF",
      fontSize: 11,
      fontWeight: "700",
    },
    listContent: {
      paddingBottom: 32,
      marginTop: 4,
    },
    sectionHeader: {
      fontSize: 14,
      fontWeight: "800",
      color: theme.isDark ? "#94A3B8" : "#475569",
      textAlign: "right",
      paddingHorizontal: 4,
      paddingTop: 8,
      paddingBottom: 4,
    },
    footerLoader: {
      paddingVertical: 18,
      alignItems: "center",
      justifyContent: "center",
    },
  });

export default NotificationsListView;
