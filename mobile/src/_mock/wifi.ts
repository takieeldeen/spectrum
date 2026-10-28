import { IWifi } from "@/types/wifi";

export const MOCK_WIFI_LIST: IWifi[] = [
  {
    _id: "wifi-1",
    ssid: "Home_5G_Fiber",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    _id: "wifi-2",
    ssid: "Spectrum_Office",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];
