import React, { useState, useMemo } from "react";
import {
  View,
  Modal,
  Pressable,
  TextInput,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  StyleProp,
  ViewStyle,
} from "react-native";
import { Lucide } from "@react-native-vector-icons/lucide";

import { ThemedText } from "@/components/themed-text";
import { useTheme } from "@/hooks/use-theme";

export interface ComboboxDefaultOption {
  label: string;
  value: string;
  subLabel?: string;
  disabled?: boolean;
}

export interface ComboboxProps<T = ComboboxDefaultOption> {
  label?: string;
  value?: string | null;
  onChange: (value: string) => void;
  options: T[];
  getOptionLabel?: (option: T) => string;
  getOptionValue?: (option: T) => string;
  getOptionSubLabel?: (option: T) => string | undefined;
  placeholder?: string;
  searchPlaceholder?: string;
  disabled?: boolean;
  error?: string;
  leadIcon?: string;
  clearable?: boolean;
  allowEmpty?: boolean;
  emptyLabel?: string;
  emptyResultsText?: string;
  containerStyle?: StyleProp<ViewStyle>;
  triggerStyle?: StyleProp<ViewStyle>;
  showSearch?: boolean;
}

export function Combobox<T = ComboboxDefaultOption>({
  label,
  value,
  onChange,
  options,
  getOptionLabel = (opt: any) => opt?.label ?? String(opt),
  getOptionValue = (opt: any) => opt?.value ?? opt?._id ?? opt?.id ?? String(opt),
  getOptionSubLabel = (opt: any) => opt?.subLabel,
  placeholder = "Select an option...",
  searchPlaceholder = "Search...",
  disabled = false,
  error,
  leadIcon,
  clearable = true,
  allowEmpty = true,
  emptyLabel = "None",
  emptyResultsText = "No options found",
  containerStyle,
  triggerStyle,
  showSearch = true,
}: ComboboxProps<T>) {
  const theme = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const selectedOption = useMemo(() => {
    if (!value) return null;
    return options.find((opt) => getOptionValue(opt) === value) || null;
  }, [value, options, getOptionValue]);

  const filteredOptions = useMemo(() => {
    if (!searchQuery.trim()) return options;
    const q = searchQuery.toLowerCase().trim();
    return options.filter((opt) => {
      const labelStr = getOptionLabel(opt)?.toLowerCase() || "";
      const subLabelStr = getOptionSubLabel(opt)?.toLowerCase() || "";
      return labelStr.includes(q) || subLabelStr.includes(q);
    });
  }, [options, searchQuery, getOptionLabel, getOptionSubLabel]);

  const handleSelect = (val: string) => {
    onChange(val);
    setIsOpen(false);
    setSearchQuery("");
  };

  const handleClear = () => {
    onChange("");
    setSearchQuery("");
  };

  return (
    <View style={[styles.container, containerStyle]}>
      {label ? (
        <ThemedText style={[styles.label, { color: theme.text }]}>
          {label}
        </ThemedText>
      ) : null}

      {/* Trigger Button */}
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => !disabled && setIsOpen(true)}
        style={[
          styles.triggerWrapper,
          {
            backgroundColor: theme.backgroundElement || "#F3F4F6",
            borderColor: error ? "#DC2626" : `${theme.textSecondary}25`,
            opacity: disabled ? 0.6 : 1,
          },
          triggerStyle,
        ]}
      >
        {leadIcon ? (
          <Lucide name={leadIcon as any} size={18} color={theme.textSecondary} />
        ) : null}

        <ThemedText
          style={[
            styles.triggerText,
            {
              color: selectedOption ? theme.text : `${theme.textSecondary}80`,
            },
          ]}
          numberOfLines={1}
        >
          {selectedOption ? getOptionLabel(selectedOption) : placeholder}
        </ThemedText>

        {selectedOption && clearable && !disabled ? (
          <Pressable
            hitSlop={8}
            onPress={handleClear}
            style={styles.iconButton}
          >
            <Lucide name="x" size={16} color={theme.textSecondary} />
          </Pressable>
        ) : (
          <Lucide name="chevron-down" size={18} color={theme.textSecondary} />
        )}
      </TouchableOpacity>

      {error ? <ThemedText style={styles.errorText}>{error}</ThemedText> : null}

      {/* Options Modal */}
      <Modal
        visible={isOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsOpen(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.modalOverlay}
        >
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setIsOpen(false)}
          />

          <View
            style={[
              styles.modalCard,
              { backgroundColor: theme.background || "#FFFFFF" },
            ]}
          >
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleRow}>
                <ThemedText style={styles.modalTitle}>
                  {label || placeholder}
                </ThemedText>
              </View>
              <TouchableOpacity
                onPress={() => setIsOpen(false)}
                style={[
                  styles.closeModalBtn,
                  { backgroundColor: `${theme.textSecondary}15` },
                ]}
              >
                <Lucide name="x" size={18} color={theme.text} />
              </TouchableOpacity>
            </View>

            {/* Search Input */}
            {showSearch ? (
              <View
                style={[
                  styles.searchWrapper,
                  {
                    backgroundColor: theme.backgroundElement || "#F3F4F6",
                    borderColor: `${theme.textSecondary}25`,
                  },
                ]}
              >
                <Lucide name="search" size={18} color={theme.textSecondary} />
                <TextInput
                  style={[styles.searchInput, { color: theme.text }]}
                  placeholder={searchPlaceholder}
                  placeholderTextColor={`${theme.textSecondary}80`}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  autoCorrect={false}
                />
                {searchQuery ? (
                  <Pressable onPress={() => setSearchQuery("")}>
                    <Lucide name="x" size={16} color={theme.textSecondary} />
                  </Pressable>
                ) : null}
              </View>
            ) : null}

            {/* Options List */}
            <ScrollView
              style={styles.optionsList}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {/* Allow unselecting / None */}
              {allowEmpty ? (
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => handleSelect("")}
                  style={[
                    styles.optionItem,
                    !value && { backgroundColor: `${theme.primary}12` },
                  ]}
                >
                  <View
                    style={[
                      styles.optionIconBadge,
                      { backgroundColor: `${theme.textSecondary}18` },
                    ]}
                  >
                    <Lucide name="minus" size={16} color={theme.textSecondary} />
                  </View>
                  <View style={styles.optionContent}>
                    <ThemedText
                      style={[
                        styles.optionTitle,
                        { color: theme.textSecondary },
                      ]}
                    >
                      {emptyLabel}
                    </ThemedText>
                  </View>
                  {!value ? (
                    <Lucide name="check" size={18} color={theme.primary} />
                  ) : null}
                </TouchableOpacity>
              ) : null}

              {filteredOptions.map((opt, idx) => {
                const optVal = getOptionValue(opt);
                const optLabel = getOptionLabel(opt);
                const optSub = getOptionSubLabel(opt);
                const isSelected = value === optVal;

                return (
                  <TouchableOpacity
                    key={`${optVal}-${idx}`}
                    activeOpacity={0.7}
                    onPress={() => handleSelect(optVal)}
                    style={[
                      styles.optionItem,
                      isSelected && { backgroundColor: `${theme.primary}12` },
                    ]}
                  >
                    <View
                      style={[
                        styles.optionIconBadge,
                        {
                          backgroundColor: isSelected
                            ? theme.primary
                            : `${theme.textSecondary}18`,
                        },
                      ]}
                    >
                      <Lucide
                        name={leadIcon ? (leadIcon as any) : "check-circle-2"}
                        size={16}
                        color={isSelected ? "#FFFFFF" : theme.text}
                      />
                    </View>

                    <View style={styles.optionContent}>
                      <ThemedText
                        style={[
                          styles.optionTitle,
                          {
                            color: isSelected ? theme.primary : theme.text,
                            fontWeight: isSelected ? "700" : "500",
                          },
                        ]}
                      >
                        {optLabel}
                      </ThemedText>
                      {optSub ? (
                        <ThemedText
                          style={[
                            styles.optionSubTitle,
                            { color: theme.textSecondary },
                          ]}
                        >
                          {optSub}
                        </ThemedText>
                      ) : null}
                    </View>

                    {isSelected ? (
                      <Lucide name="check" size={18} color={theme.primary} />
                    ) : null}
                  </TouchableOpacity>
                );
              })}

              {filteredOptions.length === 0 && (
                <View style={styles.emptyContainer}>
                  <ThemedText style={[styles.emptyText, { color: theme.textSecondary }]}>
                    {emptyResultsText}
                  </ThemedText>
                </View>
              )}
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

export default Combobox;

const styles = StyleSheet.create({
  container: {
    gap: 6,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
  },
  triggerWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 12,
    height: 48,
    gap: 10,
  },
  triggerText: {
    flex: 1,
    fontSize: 15,
  },
  iconButton: {
    padding: 4,
  },
  errorText: {
    fontSize: 12,
    color: "#DC2626",
    marginTop: 2,
    paddingHorizontal: 4,
    fontWeight: "500",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalCard: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: Platform.OS === "ios" ? 40 : 24,
    maxHeight: "80%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  modalTitleRow: {
    flex: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  closeModalBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  searchWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    gap: 8,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    paddingVertical: 0,
  },
  optionsList: {
    maxHeight: 280,
  },
  optionItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 12,
    gap: 12,
    marginBottom: 4,
  },
  optionIconBadge: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 15,
  },
  optionSubTitle: {
    fontSize: 12,
    marginTop: 2,
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 28,
  },
  emptyText: {
    fontSize: 14,
  },
});
