import React from "react";
import { useTranslation } from "react-i18next";
import { Stepper } from "@/components/ui";

const ActivationStepper = ({ currentStep }: { currentStep: number }) => {
  const { t } = useTranslation();

  return (
    <Stepper
      activeStep={Math.max(0, currentStep - 1)}
      steps={[
        {
          title: t("PLUG_ACTIVATION.STEP_SCAN_TITLE"),
        },
        {
          title: t("PLUG_ACTIVATION.STEP_CONNECT_TITLE"),
        },
        {
          title: t("PLUG_ACTIVATION.STEP_SEND_TITLE"),
        },
        {
          title: t("PLUG_ACTIVATION.STEP_VERIFY_TITLE"),
        },
      ]}
    />
  );
};

export default ActivationStepper;
