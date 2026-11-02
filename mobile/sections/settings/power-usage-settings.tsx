import React, { useState } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Switch,
  Platform,
  I18nManager,
} from "react-native";
import { useTranslation } from "react-i18next";
import Lucide from "@react-native-vector-icons/lucide";

import { useTheme } from "@/hooks/use-theme";
import ThemedText from "@/components/themed-text";
import { useAuth } from "@/context/auth-context";
import { useUpdateProfileMutation } from "@/api/user";
import KwhPriceBottomSheet from "./kwh-price-bottom-sheet";
import MonthlyBudgetBottomSheet from "./monthly-budget-bottom-sheet";
import UnitBottomSheet, { PowerUnit } from "./unit-bottom-sheet";
import i18n from "@/i18n";

export interface PowerUsageSettingsProps {
  kwhPrice?: string;
  monthlyBudget?: string;
  unit?: string;
  initialAlertEnabled?: boolean;
  onAlertChange?: (enabled: boolean) => void;
  onPressKwhPrice?: () => void;
  onSaveKwhPrice?: (price: number) => void;
  onPressMonthlyBudget?: () => void;
  onSaveMonthlyBudget?: (budget: number, alertPercent: number) => void;
  onPressUnit?: () => void;
  onSaveUnit?: (unit: PowerUnit) => void;
}

const PowerUsageSettings: React.FC<PowerUsageSettingsProps> = ({
  kwhPrice,
  monthlyBudget,
  unit,
  initialAlertEnabled = true,
  onAlertChange,
  onPressKwhPrice,
  onSaveKwhPrice,
  onPressMonthlyBudget,
  onSaveMonthlyBudget,
  onPressUnit,
  onSaveUnit,
}) => {
  const theme = useTheme();
  const styles = createStyles(theme);
  const { t, i18n } = useTranslation();
  const { user, updateUser } = useAuth();
  const updateProfileMutation = useUpdateProfileMutation();

  const [alertEnabled, setAlertEnabled] = useState(
    user?.overBudgetAlertEnabled ?? initialAlertEnabled,
  );
  const [isPriceSheetVisible, setIsPriceSheetVisible] = useState(false);
  const [numericPrice, setNumericPrice] = useState(user?.kwhCost ?? 0.7);

  const [isBudgetSheetVisible, setIsBudgetSheetVisible] = useState(false);
  const [numericBudget, setNumericBudget] = useState(
    user?.monthlyBudget ?? 300,
  );
  const [alertPercent, setAlertPercent] = useState(
    user?.budgetAlertPercent ?? 80,
  );

  const [isUnitSheetVisible, setIsUnitSheetVisible] = useState(false);
  const [powerUnit, setPowerUnit] = useState<PowerUnit>(user?.powerUnit ?? "W");

  React.useEffect(() => {
    if (user?.kwhCost !== undefined) {
      setNumericPrice(user.kwhCost);
    }
    if (user?.monthlyBudget !== undefined) {
      setNumericBudget(user.monthlyBudget);
    }
    if (user?.overBudgetAlertEnabled !== undefined) {
      setAlertEnabled(user.overBudgetAlertEnabled);
    }
    if (user?.budgetAlertPercent !== undefined) {
      setAlertPercent(user.budgetAlertPercent);
    }
    if (user?.powerUnit !== undefined) {
      setPowerUnit(user.powerUnit);
    }
  }, [
    user?.kwhCost,
    user?.monthlyBudget,
    user?.overBudgetAlertEnabled,
    user?.budgetAlertPercent,
    user?.powerUnit,
  ]);

  const handleToggleAlert = (value: boolean) => {
    setAlertEnabled(value);
    if (user) {
      updateUser({ ...user, overBudgetAlertEnabled: value });
    }
    updateProfileMutation.mutate({ overBudgetAlertEnabled: value });
    onAlertChange?.(value);
  };

  const handleOpenPriceSheet = () => {
    if (onPressKwhPrice) {
      onPressKwhPrice();
    } else {
      setIsPriceSheetVisible(true);
    }
  };

  const handleSavePrice = (newPrice: number) => {
    setNumericPrice(newPrice);
    if (user) {
      updateUser({ ...user, kwhCost: newPrice });
    }
    updateProfileMutation.mutate({ kwhCost: newPrice });
    onSaveKwhPrice?.(newPrice);
  };

  const handleOpenBudgetSheet = () => {
    if (onPressMonthlyBudget) {
      onPressMonthlyBudget();
    } else {
      setIsBudgetSheetVisible(true);
    }
  };

  const handleSaveBudget = (newBudget: number, newPercent: number) => {
    setNumericBudget(newBudget);
    setAlertPercent(newPercent);
    if (user) {
      updateUser({
        ...user,
        monthlyBudget: newBudget,
        budgetAlertPercent: newPercent,
      });
    }
    updateProfileMutation.mutate({
      monthlyBudget: newBudget,
      budgetAlertPercent: newPercent,
    });
    onSaveMonthlyBudget?.(newBudget, newPercent);
  };

  const handleOpenUnitSheet = () => {
    if (onPressUnit) {
      onPressUnit();
    } else {
      setIsUnitSheetVisible(true);
    }
  };

  const handleApplyUnit = (newUnit: PowerUnit) => {
    setPowerUnit(newUnit);
    if (user) {
      updateUser({ ...user, powerUnit: newUnit });
    }
    updateProfileMutation.mutate({ powerUnit: newUnit });
    onSaveUnit?.(newUnit);
  };

  const isRtl = I18nManager.isRTL || (i18n.language || "ar").startsWith("ar");
  const chevronIconName = isRtl ? "chevron-left" : "chevron-right";

  const displayPrice =
    kwhPrice ??
    t("PROFILE.FORMATTED_PRICE", { price: numericPrice.toFixed(2) });

  const displayBudget =
    monthlyBudget ?? t("PROFILE.FORMATTED_BUDGET", { budget: numericBudget });

  const displayUnit =
    unit ??
    (powerUnit === "kW"
      ? t("PROFILE.UNIT_DISPLAY_KW")
      : t("PROFILE.UNIT_DISPLAY_W"));

  return (
    <View style={styles.container}>
      {/* Section Title */}
      <ThemedText weight="700" fontSize={18} style={styles.sectionTitle}>
        {t("PROFILE.ENERGY_AND_COST")}
      </ThemedText>

      {/* Main Settings Card */}
      <View style={styles.card}>
        {/* Row 1: Price per kWh */}
        <TouchableOpacity
          style={styles.row}
          activeOpacity={0.7}
          onPress={handleOpenPriceSheet}
        >
          <View style={styles.rowStart}>
            <View style={styles.iconContainer}>
              <Lucide name="dollar-sign" size={20} color={theme.primary} />
            </View>
            <View style={styles.textContainer}>
              <ThemedText weight="700" style={styles.rowTitle}>
                {t("PROFILE.KWH_PRICE")}
              </ThemedText>
            </View>
          </View>

          <View style={styles.rowEnd}>
            <ThemedText weight="500" style={styles.valueText}>
              {displayPrice}
            </ThemedText>
            <Lucide
              name={chevronIconName}
              size={18}
              color={theme.textSecondary}
            />
          </View>
        </TouchableOpacity>

        <View style={styles.divider} />

        {/* Row 2: Monthly Budget */}
        <TouchableOpacity
          style={styles.row}
          activeOpacity={0.7}
          onPress={handleOpenBudgetSheet}
        >
          <View style={styles.rowStart}>
            <View style={styles.iconContainer}>
              <Lucide name="wallet" size={20} color={theme.primary} />
            </View>
            <View style={styles.textContainer}>
              <ThemedText weight="700" style={styles.rowTitle}>
                {t("PROFILE.MONTHLY_BUDGET")}
              </ThemedText>
            </View>
          </View>

          <View style={styles.rowEnd}>
            <ThemedText weight="500" style={styles.valueText}>
              {displayBudget}
            </ThemedText>
            <Lucide
              name={chevronIconName}
              size={18}
              color={theme.textSecondary}
            />
          </View>
        </TouchableOpacity>

        <View style={styles.divider} />

        {/* Row 3: Budget Exceeded Alert */}
        <TouchableOpacity
          style={styles.row}
          activeOpacity={0.85}
          onPress={() => handleToggleAlert(!alertEnabled)}
        >
          <View style={styles.rowStart}>
            <View style={styles.iconContainer}>
              <Lucide name="zap" size={20} color={theme.primary} />
            </View>
            <View style={styles.textContainer}>
              <ThemedText weight="700" style={styles.rowTitle}>
                {t("PROFILE.BUDGET_ALERT")}
              </ThemedText>
              <ThemedText style={styles.rowSubtitle}>
                {t("PROFILE.BUDGET_ALERT_SUBTITLE_DYNAMIC", {
                  percent: alertPercent,
                })}
              </ThemedText>
            </View>
          </View>

          <View style={styles.rowEnd}>
            <Switch
              value={alertEnabled}
              onValueChange={handleToggleAlert}
              trackColor={{
                false: theme.switchTrackOff,
                true: theme.primary,
              }}
              thumbColor="#FFFFFF"
            />
          </View>
        </TouchableOpacity>

        <View style={styles.divider} />

        {/* Row 4: Unit of Measurement */}
        <TouchableOpacity
          style={styles.row}
          activeOpacity={0.7}
          onPress={handleOpenUnitSheet}
        >
          <View style={styles.rowStart}>
            <View style={styles.iconContainer}>
              <Lucide name="ruler" size={20} color={theme.primary} />
            </View>
            <View style={styles.textContainer}>
              <ThemedText weight="700" style={styles.rowTitle}>
                {t("PROFILE.MEASUREMENT_UNIT")}
              </ThemedText>
            </View>
          </View>

          <View style={styles.rowEnd}>
            <ThemedText weight="500" style={styles.valueText}>
              {displayUnit}
            </ThemedText>
            <Lucide
              name={chevronIconName}
              size={18}
              color={theme.textSecondary}
            />
          </View>
        </TouchableOpacity>
      </View>

      {/* Price per kWh Bottom Sheet */}
      <KwhPriceBottomSheet
        visible={isPriceSheetVisible}
        onClose={() => setIsPriceSheetVisible(false)}
        currentPrice={numericPrice}
        onSavePrice={handleSavePrice}
      />

      {/* Monthly Budget Bottom Sheet */}
      <MonthlyBudgetBottomSheet
        visible={isBudgetSheetVisible}
        onClose={() => setIsBudgetSheetVisible(false)}
        currentBudget={numericBudget}
        currentAlertPercent={alertPercent}
        onSaveBudget={handleSaveBudget}
      />

      {/* Unit of Measurement Bottom Sheet */}
      <UnitBottomSheet
        visible={isUnitSheetVisible}
        onClose={() => setIsUnitSheetVisible(false)}
        currentUnit={powerUnit}
        onApplyUnit={handleApplyUnit}
      />
    </View>
  );
};

const createStyles = (theme: ReturnType<typeof useTheme>) =>
  StyleSheet.create({
    container: {
      marginTop: 20,
    },
    sectionTitle: {
      marginBottom: 12,
      paddingHorizontal: 4,
      textAlign: i18n.language === "en" ? "left" : "right",
    },
    card: {
      backgroundColor: theme.cardBackground,
      borderRadius: 20,
      paddingHorizontal: 16,
      borderWidth: 1,
      borderColor: theme.cardBorder,
      ...Platform.select({
        ios: {
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.04,
          shadowRadius: 8,
        },
        android: {
          elevation: 1.5,
        },
      }),
    },
    row: {
      flexDirection: i18n.language === "en" ? "row" : "row-reverse",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: 14,
    },
    rowStart: {
      flexDirection: i18n.language === "en" ? "row" : "row-reverse",
      alignItems: "center",
      gap: 12,
      flex: 1,
    },
    iconContainer: {
      width: 44,
      height: 44,
      borderRadius: 14,
      backgroundColor: theme.tintedIconBackground,
      alignItems: "center",
      justifyContent: "center",
    },
    textContainer: {
      flex: i18n.language === "en" ? 1 : 0,
      justifyContent: "center",
    },
    rowTitle: {
      fontSize: 15,
      color: theme.text,
    },
    rowSubtitle: {
      fontSize: 12,
      color: theme.textSecondary,
      marginTop: 2,
    },
    rowEnd: {
      flexDirection: i18n.language === "en" ? "row" : "row-reverse",
      alignItems: "center",
      gap: 8,
    },
    valueText: {
      fontSize: 14,
      color: theme.textSecondary,
    },
    divider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: theme.divider,
    },
  });

export default PowerUsageSettings;
