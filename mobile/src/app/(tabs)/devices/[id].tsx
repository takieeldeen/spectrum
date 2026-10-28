import React from "react";
import { useLocalSearchParams } from "expo-router";
import { DeviceDetailsView } from "@/../sections/devices/views/details-view";

export default function DeviceDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return <DeviceDetailsView deviceId={id} />;
}
