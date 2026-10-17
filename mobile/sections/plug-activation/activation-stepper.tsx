import { View, Text } from "react-native";
import React from "react";
import { Stepper } from "@/components/ui";

const ActivationStepper = ({ currentStep }: { currentStep: number }) => {
  return (
    <>
      <Stepper
        activeStep={currentStep - 1}
        steps={[
          {
            title: "الاتصال بشبكة المشترك Wi-Fi",
          },
          {
            title: "إرسال بيانات الشبكة إلى الجهاز",
          },
          {
            title: "الاتصال بالمشترك",
          },
        ]}
      />
    </>
  );
};

export default ActivationStepper;
