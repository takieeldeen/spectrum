import React from "react";
import { View, StyleSheet } from "react-native";
import { useTranslation } from "react-i18next";
import { ThemedText } from "@/components/themed-text";
import { useTheme } from "@/hooks/use-theme";

interface StepperProps {
  currentStep: 1 | 2 | 3;
}

export function Stepper({ currentStep }: StepperProps) {
  const theme = useTheme();
  const styles = createStyles(theme);
  const { t } = useTranslation();

  const steps = [
    { number: 1, label: t("FORGOT_PASSWORD.STEP_EMAIL") },
    { number: 2, label: t("FORGOT_PASSWORD.STEP_OTP") },
    { number: 3, label: t("FORGOT_PASSWORD.STEP_PASSWORD") },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.stepperRow}>
        {steps.map((step, index) => {
          const isActive = currentStep >= step.number;
          const isCurrent = currentStep === step.number;

          return (
            <React.Fragment key={step.number}>
              {/* Step Item */}
              <View style={styles.stepItem}>
                <View
                  style={[
                    styles.circle,
                    isActive ? styles.activeCircle : styles.inactiveCircle,
                  ]}
                >
                  <ThemedText
                    weight="700"
                    style={[
                      styles.circleText,
                      isActive ? styles.activeCircleText : styles.inactiveCircleText,
                    ]}
                  >
                    {step.number}
                  </ThemedText>
                </View>
                <ThemedText
                  weight={isCurrent ? "700" : "500"}
                  style={[
                    styles.label,
                    isActive ? styles.activeLabel : styles.inactiveLabel,
                  ]}
                  numberOfLines={1}
                >
                  {step.label}
                </ThemedText>
              </View>

              {/* Connecting Line between steps */}
              {index < steps.length - 1 && (
                <View style={styles.lineContainer}>
                  <View
                    style={[
                      styles.line,
                      currentStep > step.number
                        ? styles.activeLine
                        : styles.inactiveLine,
                    ]}
                  />
                </View>
              )}
            </React.Fragment>
          );
        })}
      </View>
    </View>
  );
}

const createStyles = (theme: ReturnType<typeof useTheme>) =>
  StyleSheet.create({
    container: {
      width: "100%",
      paddingHorizontal: 20,
      marginBottom: 24,
    },
    stepperRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      justifyContent: "space-between",
    },
    stepItem: {
      alignItems: "center",
      minWidth: 70,
    },
    circle: {
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 8,
    },
    activeCircle: {
      backgroundColor: theme.primary,
    },
    inactiveCircle: {
      backgroundColor: theme.cardBackground,
      borderWidth: 1.5,
      borderColor: theme.cardBorder,
    },
    circleText: {
      fontSize: 13,
    },
    activeCircleText: {
      color: "#FFFFFF",
    },
    inactiveCircleText: {
      color: theme.textSecondary,
    },
    label: {
      fontSize: 12,
      textAlign: "center",
    },
    activeLabel: {
      color: theme.primary,
    },
    inactiveLabel: {
      color: theme.textSecondary,
    },
    lineContainer: {
      flex: 1,
      height: 32,
      justifyContent: "center",
      paddingHorizontal: 4,
    },
    line: {
      height: 2,
      borderRadius: 1,
    },
    activeLine: {
      backgroundColor: theme.primary,
    },
    inactiveLine: {
      backgroundColor: theme.cardBorder,
    },
  });

export default Stepper;
