import { PermissionsAndroid, Platform } from "react-native";
import WifiManager from "react-native-wifi-reborn";

export async function getWifiNetwork(SSID: string) {
  let networks = await WifiManager.loadWifiList();

  if (networks?.some((n) => n.SSID?.trim() === SSID.trim())) {
    return networks?.find((net) => net.SSID === SSID);
  }
  networks = await WifiManager.reScanAndLoadWifiList();
  return networks?.find((n) => n.SSID?.trim() === SSID.trim()) ?? null;
}

export async function getWifiPermissions() {
  if (Platform.OS === "android") {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
    );
    if (granted !== PermissionsAndroid.RESULTS.GRANTED) return false;
  }
  return true;
}

export async function removeWifiForcedRestrictions() {
  if (Platform.OS === "android") {
    if (typeof WifiManager.forceWifiUsageWithOptions === "function") {
      await WifiManager.forceWifiUsageWithOptions(false, { noInternet: false });
      return false;
    } else if (typeof WifiManager.forceWifiUsage === "function") {
      await WifiManager.forceWifiUsage(false);
      return false;
    }
  }
}
