import React from "react";
import {
  ScrollView,
  Pressable,
  StyleSheet,
  StyleProp,
  ViewStyle,
} from "react-native";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/hooks/use-theme";
import ThemedText from "@/components/themed-text";
import i18n from "@/i18n";

export type FilterOptions = "ALL" | "UNREAD" | "ALERTS" | "DEVICES" | "GUARDS";

export interface FilterItem {
  labelKey: string;
  value: FilterOptions;
}

export interface FilterOptionItemProps {
  item: FilterItem;
  selected: FilterOptions;
  onSelect: (type: FilterOptions) => void;
}

export const FILTERS: FilterItem[] = [
  {
    labelKey: "NOTIFICATIONS.FILTER_ALL",
    value: "ALL",
  },
  {
    labelKey: "NOTIFICATIONS.FILTER_UNREAD",
    value: "UNREAD",
  },
  {
    labelKey: "NOTIFICATIONS.FILTER_ALERTS",
    value: "ALERTS",
  },
  {
    labelKey: "NOTIFICATIONS.FILTER_DEVICES",
    value: "DEVICES",
  },
];

export function FilterOptionItem({
  item,
  selected,
  onSelect,
}: FilterOptionItemProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const styles = createStyles(theme);
  const isActive =
    item.value === selected ||
    (selected === "GUARDS" && item.value === "ALERTS");

  return (
    <Pressable
      onPress={() => onSelect(item.value)}
      style={({ pressed }) => [
        styles.chip,
        isActive ? styles.activeChip : styles.inactiveChip,
        pressed && styles.pressed,
      ]}
    >
      <ThemedText
        style={[
          styles.chipText,
          isActive ? styles.activeChipText : styles.inactiveChipText,
        ]}
      >
        {t(item.labelKey)}
      </ThemedText>
    </Pressable>
  );
}

export interface FilterOptionsProps {
  currentFilter: FilterOptions;
  onFilter: (type: FilterOptions) => void;
  style?: StyleProp<ViewStyle>;
}

export const FilterOptions = ({
  currentFilter,
  onFilter,
  style,
}: FilterOptionsProps) => {
  const theme = useTheme();
  const styles = createStyles(theme);

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={{ flexGrow: 0, minHeight: 64 }}
      contentContainerStyle={[styles.container, style]}
    >
      {FILTERS.map((filter) => (
        <FilterOptionItem
          key={filter.value}
          item={filter}
          selected={currentFilter}
          onSelect={onFilter}
        />
      ))}
    </ScrollView>
  );
};

const createStyles = (theme: ReturnType<typeof useTheme>) =>
  StyleSheet.create({
    container: {
      flexDirection: i18n.language === "ar" ? "row-reverse" : "row",
      alignItems: "center",
      gap: 8,
      paddingVertical: 4,
    },
    chip: {
      paddingHorizontal: 20,
      paddingVertical: 10,
      borderRadius: 999,
      justifyContent: "center",
      alignItems: "center",
    },
    activeChip: {
      backgroundColor: theme.primaryDark,
    },
    inactiveChip: {
      backgroundColor: theme.backgroundElement,
      borderWidth: 1,
      borderColor: theme.isDark
        ? "rgba(255, 255, 255, 0.08)"
        : "rgba(0, 0, 0, 0.06)",
    },
    pressed: {
      opacity: 0.88,
      transform: [{ scale: 0.97 }],
    },
    chipText: {
      fontSize: 14.5,
    },
    activeChipText: {
      color: "#FFFFFF",
      fontWeight: "700",
    },
    inactiveChipText: {
      color: theme.textSecondary,
    },
  });

export default FilterOptions;
