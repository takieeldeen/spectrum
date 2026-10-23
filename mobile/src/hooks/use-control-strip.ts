// hooks/use-control-strip.ts
import { usePlugs } from "@/providers/plug.provider";
import { useCallback, useMemo } from "react";
// adjust path to where your provider lives

export interface OutletData {
  config: number;
  current_A: number;
  energy_kwh: number;
  event: string;
  on: boolean;
  overheat: "on" | "off";
  overload: "on" | "off";
  power_W: number;
  power_mW: number;
  previous: number;
  rawParts: any[];
  runtime: number;
  state: number;
  status: "on" | "off";
  temperature_c: number;
  watts: number;
}

export interface PlugData {
  outlets: {
    outlet1: OutletData;
    outlet2: OutletData;
    outlet3: OutletData;
    outlet4: OutletData;
  };
  plugId: string;
  raw: string;
  serialNumber: string;
  voltage: number;
}

export interface OutletState {
  on: boolean;
  watts: number;
  power_mw: number;
  runtime: number;
  temperature_c: number;
}

export interface StripState {
  outlet1: OutletState;
  outlet2: OutletState;
  outlet3: OutletState;
  outlet4: OutletState;
}

type StripOrderType = "ON" | "OFF" | "GET_INFO";

const getOrderCommand = (orderType: StripOrderType, outletNumber: number) => {
  switch (orderType) {
    case "ON":
      return `up:onoff:${outletNumber}:on\r\n`;
    case "OFF":
      return `up:onoff:${outletNumber}:off\r\n`;
    case "GET_INFO":
      return `up:getinfo:${outletNumber}\r\n`;
    default:
      return "";
  }
};

const pickOutletState = (o: OutletData): OutletState => ({
  on: o.on,
  watts: o.watts,
  power_mw: o.power_mW,
  runtime: o.runtime,
  temperature_c: o.temperature_c,
});

export function useControlStrip({ stripId }: { stripId: string }) {
  const {
    liveData: allLiveData,
    connected,
    sendOrder: send,
    toggleAll,
  } = usePlugs();

  const liveData: PlugData | null = allLiveData[stripId] ?? null;
  const isLoading = !liveData;

  const stripState = useMemo<StripState | null>(() => {
    if (!liveData) return null;
    const { outlet1, outlet2, outlet3, outlet4 } = liveData.outlets;
    return {
      outlet1: pickOutletState(outlet1),
      outlet2: pickOutletState(outlet2),
      outlet3: pickOutletState(outlet3),
      outlet4: pickOutletState(outlet4),
    };
  }, [liveData]);

  const toggleOutlet = useCallback(
    (newState: "on" | "off", outletNumber: number) => {
      if (!connected) return { success: false, error: "Not Connected" };
      send(
        stripId,
        getOrderCommand(newState === "on" ? "ON" : "OFF", outletNumber),
      );
      return { success: true, error: null };
    },
    [connected, send, stripId],
  );

  const toggleAllOutlet = useCallback(() => {
    if (!connected || !stripState) return;
    const allOff = Object.values(stripState).every((o) => !o.on);
    toggleAll(stripId, allOff ? "on" : "off");
  }, [connected, stripState, stripId, toggleAll]);

  return {
    liveData,
    toggleOutlet,
    stripState,
    toggleAllOutlet,
    connected,
    isLoading,
  };
}
