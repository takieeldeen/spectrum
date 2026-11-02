import { PermissionsAndroid, Platform } from "react-native";
import WifiManager from "react-native-wifi-reborn";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function getWifiNetwork(SSID: string) {
  try {
    let networks = await WifiManager.loadWifiList();
    const found = networks?.find((n: any) => (n?.ssid ?? n?.SSID) === SSID);
    if (found) return found;

    networks = await WifiManager.reScanAndLoadWifiList();
    return networks?.find((n: any) => (n?.ssid ?? n?.SSID) === SSID) ?? null;
  } catch (err) {
    console.warn("getWifiNetwork scan error:", err);
    return null;
  }
}

export function deriveGateway(phoneIp?: string): string {
  if (!phoneIp) return "192.168.4.1";
  const parts = phoneIp.split(".");
  if (parts.length !== 4) return "192.168.4.1";
  parts[3] = "1";
  return parts.join(".");
}

export async function pollWifiSearch(
  SSID: string,
  retryCount: number = 4,
  waitingTime: number = 15000,
) {
  for (let attempt = 0; attempt < retryCount; attempt++) {
    const network = await getWifiNetwork(SSID);
    if (network) {
      return network;
    }

    if (attempt < retryCount - 1) {
      await sleep(waitingTime);
    }
  }

  return null;
}

export async function getWifiPermissions() {
  if (Platform.OS === "android") {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
    );
    console.log(granted);
    if (granted !== PermissionsAndroid.RESULTS.GRANTED) return false;
  }
  return true;
}

export async function connectToWifiNetwork(SSID: string, password: string) {
  // Check if already connected before connecting
  try {
    const currentWifi = await WifiManager.getCurrentWifiSSID();
    if (currentWifi && currentWifi === SSID) {
      const targetIp = await WifiManager.getIP();
      return targetIp;
    }
    await WifiManager.connectToProtectedSSID(SSID, password, false, false);
    // await removeWifiForcedRestrictions();
    const targetIp = await WifiManager.getIP();
    return targetIp;
  } catch (err) {
    console.log("SOMETHING WENT WRONG WHILE CONNECTING TO NETWORK", err);
    return null;
  }
}

export async function unbindForcedWifi() {
  if (Platform.OS === "android") {
    if (typeof WifiManager.forceWifiUsageWithOptions === "function") {
      await WifiManager.forceWifiUsageWithOptions(false, { noInternet: false });
    } else if (typeof WifiManager.forceWifiUsage === "function") {
      await WifiManager.forceWifiUsage(false);
    }
  }
}

export async function forceWifiUsage() {
  if (Platform.OS === "android") {
    const wm: any = WifiManager;
    if (typeof wm.forceWifiUsageWithOptions === "function") {
      await wm.forceWifiUsageWithOptions(true, { noInternet: true });
    } else if (typeof wm.forceWifiUsage === "function") {
      await wm.forceWifiUsage(true);
    }
  }
}
