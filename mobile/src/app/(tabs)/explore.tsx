import { useState, useRef, useEffect, useCallback } from "react";
import {
  ActivityIndicator,
  Alert,
  NativeModules,
  PermissionsAndroid,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { WebBadge } from "@/components/web-badge";
import { BottomTabInset, MaxContentWidth, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import WifiManager from "react-native-wifi-reborn";
import TcpSocket from "react-native-tcp-socket";

const STRIP_PORT = 30300; // Hotspot provisioning port
const LOCAL_SERVER_PORT = 10086; // Port where strip connects back on home Wi-Fi

/**
 * Derives the strip's IP from the phone's DHCP-assigned IP.
 * On every strip hotspot the device sits at <subnet>.1.
 */
function deriveGateway(phoneIp: string): string {
  const parts = phoneIp.split(".");
  if (parts.length !== 4) return "192.168.4.1"; // safe fallback
  parts[3] = "1";
  return parts.join(".");
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export default function TabTwoScreen() {
  const safeAreaInsets = useSafeAreaInsets();
  const insets = {
    ...safeAreaInsets,
    bottom: safeAreaInsets.bottom + BottomTabInset + Spacing.three,
  };
  const theme = useTheme();

  // ── Provisioning Form State ──
  const [stripSerialNumber, setStripSerialNumber] = useState("2CFDB3C1DE06");
  const [wifiNetworkName, setWifiNetworkName] = useState("ahmed");
  const [wifiPassword, setWifiPassword] = useState("ma2345678*#");
  const [serverIp, setServerIp] = useState("192.168.1.13");
  const [connecting, setConnecting] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");

  // ── Local Direct Control State (Phone acts as Server on 10086) ──
  const [phoneHomeIp, setPhoneHomeIp] = useState<string>("");
  const [localServerRunning, setLocalServerRunning] = useState(false);
  const [connectedStripIp, setConnectedStripIp] = useState<string | null>(null);
  const [outletStates, setOutletStates] = useState<Record<number, boolean>>({
    1: false,
    2: false,
    3: false,
    4: false,
  });
  const [telemetry, setTelemetry] = useState<{
    voltage: number;
    watts: number;
    temperature: number;
  }>({
    voltage: 0,
    watts: 0,
    temperature: 0,
  });
  const [togglingOutlet, setTogglingOutlet] = useState<number | null>(null);

  // References
  const stripHostRef = useRef("192.168.4.1");
  const localServerRef = useRef<any>(null);
  const activeSocketsRef = useRef<Map<string, any>>(new Map());

  const cleanSerial = stripSerialNumber.trim().toUpperCase();
  const stripWifiName =
    cleanSerial.length >= 7 ? `TONLY_TAP_${cleanSerial.slice(-7)}` : "";
  const stripWifiPassword =
    cleanSerial.length >= 7 ? `LGU_${cleanSerial.slice(-7)}` : "";

  // ── Start Local TCP Server on port 10086 ──
  const startLocalServer = useCallback(() => {
    if (localServerRef.current) return;
    try {
      const server = TcpSocket.createServer((socket: any) => {
        const rawIp = socket.remoteAddress || "";
        const stripIp = rawIp.replace(/^.*:/, "");
        console.log(`⚡ [Local Server] Strip connected from ${stripIp}`);

        activeSocketsRef.current.set(stripIp, socket);
        setConnectedStripIp(stripIp);

        // Ask for status immediately
        try {
          socket.write("up:getinfo:all\r\n");
          socket.write("up:power_report:2:vol\r\n");
        } catch (_) {}

        socket.on("data", (data: any) => {
          const raw = (typeof data === "string" ? data : data.toString())
            .replace(/\0/g, "")
            .trim();

          // Voltage report
          const voltMatch = raw.match(/up:power_report:2:(\d+)/i);
          if (voltMatch) {
            const val = Number(voltMatch[1]);
            if (val >= 50000) {
              setTelemetry((prev) => ({
                ...prev,
                voltage: Math.round(val / 1000),
              }));
            }
          }

          // Physical button press events
          const eventMatch = raw.match(/up:event:onoff:([1-4]):(on|off)/i);
          if (eventMatch) {
            const ch = parseInt(eventMatch[1], 10);
            const isOn = eventMatch[2].toLowerCase() === "on";
            setOutletStates((prev) => ({ ...prev, [ch]: isOn }));
            try {
              socket.write("up:getinfo:all\r\n");
            } catch (_) {}
          }

          // Complete info report (up:getinfo:...)
          if (raw.includes("up:getinfo:")) {
            const newStates: Record<number, boolean> = {};
            let totalPower_mW = 0;
            let temp_c = 0;

            for (let i = 1; i <= 4; i++) {
              const regex = new RegExp(`${i}:([^:]+)`, "i");
              const match = raw.match(regex);
              if (match) {
                const parts = match[1].split(";");
                const relay = parts[1]?.toLowerCase();
                newStates[i] = relay === "on";
                totalPower_mW += parseInt(parts[5] || "0", 10);
                temp_c = parseInt(parts[11] || "0", 10);
              }
            }

            if (Object.keys(newStates).length > 0) {
              setOutletStates((prev) => ({ ...prev, ...newStates }));
              setTelemetry((prev) => ({
                ...prev,
                watts: Math.round(totalPower_mW / 1000),
                temperature: temp_c,
              }));
            }
          }
        });

        socket.on("close", () => {
          console.log(`[Local Server] Strip disconnected: ${stripIp}`);
          activeSocketsRef.current.delete(stripIp);
          if (activeSocketsRef.current.size === 0) {
            setConnectedStripIp(null);
          }
        });

        socket.on("error", (err: any) => {
          console.warn(`[Local Server] Socket error (${stripIp}):`, err);
        });
      });

      server.listen(
        { port: LOCAL_SERVER_PORT, host: "0.0.0.0", reuseAddress: true },
        () => {
          console.log(
            `📡 [Local Server] Listening for strips on port ${LOCAL_SERVER_PORT}`,
          );
          setLocalServerRunning(true);
        },
      );

      server.on("error", (err: any) => {
        console.warn("[Local Server] Server error:", err);
      });

      localServerRef.current = server;
    } catch (e) {
      console.warn("Could not start local TCP server:", e);
    }
  }, []);

  // ── Detect Phone Wi-Fi IP and initialize local server ──
  const fetchPhoneIp = useCallback(async () => {
    try {
      if (Platform.OS === "android") {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        );
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) return;
      }
      const ip = await (WifiManager as any).getIP();
      if (ip && ip !== "0.0.0.0") {
        setPhoneHomeIp(ip);
        // Pre-fill Server IP input if currently default or empty
        setServerIp((current) =>
          !current || current === "192.168.1.13" ? ip : current,
        );
      }
    } catch (_) {}
  }, []);

  // useEffect(() => {
  //   fetchPhoneIp();
  //   startLocalServer();

  //   // Poll connected strips periodically
  //   const pollInterval = setInterval(() => {
  //     activeSocketsRef.current.forEach((sock) => {
  //       if (sock && !sock.destroyed) {
  //         try {
  //           sock.write("up:getinfo:all\r\n");
  //           sock.write("up:power_report:2:vol\r\n");
  //         } catch (_) {}
  //       }
  //     });
  //   }, 4000);

  //   return () => {
  //     clearInterval(pollInterval);
  //     try {
  //       localServerRef.current?.close();
  //     } catch (_) {}
  //   };
  // }, [fetchPhoneIp, startLocalServer]);

  /**
   * Helper to write to the actively connected strip.
   */
  const getActiveSocket = () => {
    if (connectedStripIp && activeSocketsRef.current.has(connectedStripIp)) {
      return activeSocketsRef.current.get(connectedStripIp);
    }
    const sockets = Array.from(activeSocketsRef.current.values());
    return sockets.length > 0 ? sockets[0] : null;
  };

  /**
   * Toggles an outlet ON or OFF directly over the local TCP socket.
   */
  const toggleOutlet = async (outletNum: number) => {
    const socket = getActiveSocket();
    if (!socket) {
      Alert.alert(
        "Strip Offline",
        "No strip is connected to this phone.\n\nMake sure the strip was provisioned with this phone's IP (" +
          (phoneHomeIp || "your phone IP") +
          ") and both devices are on the same Wi-Fi.",
      );
      return;
    }

    const nextState = !outletStates[outletNum];
    const cmd = `up:onoff:${outletNum}:${nextState ? "on" : "off"}\r\n`;

    setTogglingOutlet(outletNum);
    try {
      socket.write(cmd);
      setOutletStates((prev) => ({ ...prev, [outletNum]: nextState }));

      // Request fresh state verification
      setTimeout(() => {
        try {
          socket.write("up:getinfo:all\r\n");
        } catch (_) {}
      }, 350);
    } catch (e: any) {
      Alert.alert("Error", e?.message || "Failed to send command to strip.");
    } finally {
      setTogglingOutlet(null);
    }
  };

  /**
   * Turns all 4 outlets ON or OFF.
   */
  const setAllOutlets = (turnOn: boolean) => {
    const socket = getActiveSocket();
    if (!socket) {
      Alert.alert("Strip Offline", "No strip connected.");
      return;
    }
    for (let i = 1; i <= 4; i++) {
      socket.write(`up:onoff:${i}:${turnOn ? "on" : "off"}\r\n`);
    }
    setTimeout(() => {
      try {
        socket.write("up:getinfo:all\r\n");
      } catch (_) {}
    }, 400);
  };

  /**
   * Connects via temporary TCP socket during Hotspot mode.
   */
  const sendStripTcpCommand = (
    command: string,
    timeoutMs: number = 8000,
    settleMs: number = 400,
  ): Promise<string> => {
    return new Promise((resolve, reject) => {
      let client: any = null;
      let received = "";
      let finished = false;
      let settleTimer: any = null;

      const cleanup = () => {
        clearTimeout(timeoutTimer);
        clearTimeout(settleTimer);
        try {
          client?.destroy();
        } catch (_) {}
      };

      const succeed = (value: string) => {
        if (finished) return;
        finished = true;
        cleanup();
        resolve(value);
      };

      const fail = (err: any) => {
        if (finished) return;
        finished = true;
        cleanup();
        reject(err instanceof Error ? err : new Error(String(err)));
      };

      const timeoutTimer = setTimeout(() => {
        fail(new Error(`Timeout waiting for response to: ${command}`));
      }, timeoutMs);

      try {
        client = TcpSocket.createConnection(
          { host: stripHostRef.current, port: STRIP_PORT },
          () => {
            console.log(
              `[TCP] Connected to ${stripHostRef.current}:${STRIP_PORT}. Sending: ${command}`,
            );
            client.write(command + "\r\n");
          },
        );

        const cleanReceived = (raw: string) => raw.replace(/\0/g, "").trim();

        client.on("data", (data: any) => {
          const text = data.toString();
          console.log(`[TCP] Received: ${text}`);
          received += text;
          clearTimeout(settleTimer);
          settleTimer = setTimeout(
            () => succeed(cleanReceived(received)),
            settleMs,
          );
        });

        client.on("error", (err: any) => {
          console.error("[TCP] Socket error:", err);
          fail(err);
        });

        client.on("close", () => {
          if (received) succeed(cleanReceived(received));
          else fail(new Error("Connection closed without a response."));
        });
      } catch (e) {
        fail(e);
      }
    });
  };

  /**
   * Provisioning flow: Phone joins strip hotspot, configures Wi-Fi and server IP.
   */
  const connectAndProvision = async () => {
    if (Platform.OS === "web") {
      Alert.alert(
        "Not supported",
        "Wi-Fi provisioning only works in a native Android/iOS development build.",
      );
      return;
    }

    if (!stripWifiName) {
      Alert.alert(
        "Validation Error",
        "Please enter a valid Strip Serial Number (at least 7 characters).",
      );
      return;
    }

    const homeSsid = wifiNetworkName.trim();
    if (!homeSsid) {
      Alert.alert(
        "Validation Error",
        "Please enter your Home Wifi Network Name.",
      );
      return;
    }

    const srvIp = serverIp.trim();
    if (!srvIp) {
      Alert.alert("Validation Error", "Please enter the Target Server IP.");
      return;
    }

    if (homeSsid.includes(":") || wifiPassword.includes(":")) {
      Alert.alert(
        "Validation Error",
        "Wi-Fi Name and Password cannot contain colons (:).",
      );
      return;
    }

    let forcedWifi = false;

    try {
      setConnecting(true);

      if (Platform.OS === "android") {
        setStatusMessage("Requesting location permissions...");
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        );
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          Alert.alert(
            "Permission Denied",
            "Location permission is required for WiFi connections.",
          );
          return;
        }
      }

      // Step 1: Connect to the strip's setup hotspot
      setStatusMessage(`Connecting to ${stripWifiName}...`);
      console.log(`Connecting to strip hotspot: ${stripWifiName}`);
      await WifiManager.connectToProtectedSSID(
        stripWifiName,
        stripWifiPassword,
        false,
        false,
      );

      // Android: Force Wi-Fi routing for no-internet hotspot
      if (Platform.OS === "android") {
        try {
          const wm: any = WifiManager;
          if (typeof wm.forceWifiUsageWithOptions === "function") {
            await wm.forceWifiUsageWithOptions(true, { noInternet: true });
            forcedWifi = true;
          } else if (typeof wm.forceWifiUsage === "function") {
            await wm.forceWifiUsage(true);
            forcedWifi = true;
          }
        } catch (e) {
          console.warn("forceWifiUsage failed (continuing):", e);
        }
      }

      setStatusMessage("Connected to strip. Resolving gateway IP...");
      await sleep(3000);

      // Resolve strip IP
      try {
        const phoneIp = await (WifiManager as any).getIP();
        const resolved = deriveGateway(phoneIp);
        stripHostRef.current = resolved;
        console.log(
          `[Provisioning] Phone IP: ${phoneIp} → Gateway: ${resolved}`,
        );
        setStatusMessage(`Strip found at ${resolved}`);
      } catch (e) {
        console.warn("[Provisioning] getIP() fallback used:", e);
      }

      // Step 2: Configure target IP (where strip dials back on home Wi-Fi)
      setStatusMessage(`Setting Target Server IP (${srvIp})...`);
      console.log(`Sending: up:ip:${srvIp}`);
      await sendStripTcpCommand(`up:ip:${srvIp}`);

      await sleep(1000);

      // Step 3: Send home Wi-Fi credentials
      setStatusMessage(`Sending Wi-Fi credentials (${homeSsid})...`);
      console.log(`Sending credentials for SSID: ${homeSsid}`);
      const wifiRes = await sendStripTcpCommand(
        `up:connect:${homeSsid}:${wifiPassword}`,
      );

      // Step 4: Disconnect from strip hotspot
      setStatusMessage("Done! Disconnecting from hotspot...");
      try {
        await WifiManager.disconnect();
      } catch (_) {}

      Alert.alert(
        "Provisioning Successful!",
        `Strip credentials sent!\n\nResponse: ${wifiRes}\n\nThe strip is rebooting and joining "${homeSsid}".\nIt will dial this phone at ${srvIp}:${LOCAL_SERVER_PORT}.`,
      );
    } catch (e: any) {
      console.warn("Provisioning error:", e);
      Alert.alert(
        "Connection Error",
        e?.message || "Failed to communicate with strip.",
      );
    } finally {
      if (forcedWifi && Platform.OS === "android") {
        try {
          const wm: any = WifiManager;
          if (typeof wm.forceWifiUsageWithOptions === "function") {
            await wm.forceWifiUsageWithOptions(false, { noInternet: false });
          } else if (typeof wm.forceWifiUsage === "function") {
            await wm.forceWifiUsage(false);
          }
        } catch (_) {}
      }
      setConnecting(false);
      setStatusMessage("");
    }
  };

  const contentPlatformStyle = Platform.select({
    android: {
      paddingTop: insets.top,
      paddingLeft: insets.left,
      paddingRight: insets.right,
      paddingBottom: insets.bottom,
    },
    web: {
      paddingTop: Spacing.six,
      paddingBottom: Spacing.four,
    },
  });

  const inputStyle = [
    styles.input,
    {
      color: theme.text,
      backgroundColor: theme.background,
      borderColor: theme.backgroundSelected,
    },
  ];

  return (
    <ScrollView
      style={[styles.scrollView, { backgroundColor: theme.background }]}
      contentInset={insets}
      contentContainerStyle={[styles.contentContainer, contentPlatformStyle]}
      keyboardShouldPersistTaps="handled"
    >
      <ThemedView style={styles.container}>
        <ThemedView style={styles.titleContainer}>
          <ThemedText type="subtitle">Spectrum Local Control</ThemedText>
          <ThemedText style={styles.centerText} themeColor="textSecondary">
            Direct mobile-to-strip control on your local Wi-Fi.
          </ThemedText>
        </ThemedView>

        {/* ── CARD 1: LIVE OUTLET CONTROL ── */}
        <ThemedView type="backgroundElement" style={styles.card}>
          <View style={styles.sectionHeaderRow}>
            <View>
              <ThemedText type="smallBold">Direct Local Control</ThemedText>
              <ThemedText type="small" style={{ color: theme.textSecondary }}>
                {localServerRunning
                  ? `Server Port: ${LOCAL_SERVER_PORT} • Phone IP: ${phoneHomeIp || "Detecting..."}`
                  : "Server: Starting..."}
              </ThemedText>
            </View>
            <Pressable
              onPress={fetchPhoneIp}
              style={styles.refreshChip}
              hitSlop={8}
            >
              <ThemedText type="small" style={{ color: "#2563eb" }}>
                ↻ Refresh IP
              </ThemedText>
            </Pressable>
          </View>

          {/* Connection Status Banner */}
          <View
            style={[
              styles.statusBanner,
              {
                backgroundColor: connectedStripIp
                  ? "rgba(34, 197, 94, 0.15)"
                  : "rgba(234, 179, 8, 0.15)",
                borderColor: connectedStripIp ? "#22c55e" : "#eab308",
              },
            ]}
          >
            <ThemedText
              type="smallBold"
              style={{
                color: connectedStripIp ? "#16a34a" : "#ca8a04",
              }}
            >
              {connectedStripIp
                ? `⚡ Strip Connected (${connectedStripIp})`
                : "⚪ Waiting for strip to dial this phone..."}
            </ThemedText>
          </View>

          {/* Telemetry Metrics */}
          {connectedStripIp ? (
            <View style={styles.metricsRow}>
              <View style={styles.metricItem}>
                <ThemedText type="small" style={{ color: theme.textSecondary }}>
                  Power
                </ThemedText>
                <ThemedText type="smallBold">{telemetry.watts} W</ThemedText>
              </View>
              <View style={styles.metricItem}>
                <ThemedText type="small" style={{ color: theme.textSecondary }}>
                  Voltage
                </ThemedText>
                <ThemedText type="smallBold">
                  {telemetry.voltage > 0 ? `${telemetry.voltage} V` : "230 V"}
                </ThemedText>
              </View>
              <View style={styles.metricItem}>
                <ThemedText type="small" style={{ color: theme.textSecondary }}>
                  Temp
                </ThemedText>
                <ThemedText type="smallBold">
                  {telemetry.temperature}°C
                </ThemedText>
              </View>
            </View>
          ) : null}

          {/* 4 Outlets Grid */}
          <View style={styles.outletsGrid}>
            {[1, 2, 3, 4].map((num) => {
              const isOn = !!outletStates[num];
              const isToggling = togglingOutlet === num;
              return (
                <Pressable
                  key={num}
                  disabled={!connectedStripIp || isToggling}
                  onPress={() => toggleOutlet(num)}
                  style={({ pressed }) => [
                    styles.outletCard,
                    {
                      backgroundColor: isOn
                        ? "rgba(34, 197, 94, 0.15)"
                        : theme.background,
                      borderColor: isOn ? "#22c55e" : theme.backgroundSelected,
                    },
                    pressed && styles.pressed,
                    (!connectedStripIp || isToggling) && styles.disabled,
                  ]}
                >
                  <View style={styles.outletHeader}>
                    <ThemedText type="smallBold">Outlet {num}</ThemedText>
                    <View
                      style={[
                        styles.statusDot,
                        { backgroundColor: isOn ? "#22c55e" : "#94a3b8" },
                      ]}
                    />
                  </View>
                  <ThemedText
                    type="small"
                    style={{
                      color: isOn ? "#16a34a" : theme.textSecondary,
                      fontWeight: "700",
                      marginTop: 4,
                    }}
                  >
                    {isToggling ? "Switching..." : isOn ? "ON" : "OFF"}
                  </ThemedText>
                </Pressable>
              );
            })}
          </View>

          {/* Quick All ON / All OFF controls */}
          <View style={styles.quickActionRow}>
            <Pressable
              disabled={!connectedStripIp}
              style={[
                styles.quickActionButton,
                { backgroundColor: "#16a34a" },
                !connectedStripIp && styles.disabled,
              ]}
              onPress={() => setAllOutlets(true)}
            >
              <ThemedText type="smallBold" style={{ color: "#fff" }}>
                All ON
              </ThemedText>
            </Pressable>
            <Pressable
              disabled={!connectedStripIp}
              style={[
                styles.quickActionButton,
                { backgroundColor: "#dc2626" },
                !connectedStripIp && styles.disabled,
              ]}
              onPress={() => setAllOutlets(false)}
            >
              <ThemedText type="smallBold" style={{ color: "#fff" }}>
                All OFF
              </ThemedText>
            </Pressable>
          </View>
        </ThemedView>

        {/* ── CARD 2: PROVISIONING FORM ── */}
        <ThemedView type="backgroundElement" style={styles.card}>
          <ThemedText type="smallBold">Wi-Fi Provisioning Setup</ThemedText>
          <ThemedText type="small" style={{ color: theme.textSecondary }}>
            Use this when setting up a new strip or pointing it to this phone.
          </ThemedText>

          <View style={styles.inputGroup}>
            <ThemedText type="smallBold" style={styles.label}>
              Strip Serial Number
            </ThemedText>
            <TextInput
              style={inputStyle}
              placeholder="e.g. 2CFDB3C1DE06"
              placeholderTextColor={theme.textSecondary}
              value={stripSerialNumber}
              onChangeText={setStripSerialNumber}
              autoCapitalize="characters"
              autoCorrect={false}
            />
            {stripWifiName ? (
              <ThemedText
                type="small"
                style={{ color: theme.textSecondary, marginTop: 2 }}
              >
                Hotspot: {stripWifiName} (pwd: {stripWifiPassword})
              </ThemedText>
            ) : null}
          </View>

          <View style={styles.inputGroup}>
            <ThemedText type="smallBold" style={styles.label}>
              Home Wifi Network Name
            </ThemedText>
            <TextInput
              style={inputStyle}
              placeholder="Your 2.4GHz Wi-Fi Name (SSID)"
              placeholderTextColor={theme.textSecondary}
              value={wifiNetworkName}
              onChangeText={setWifiNetworkName}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.inputGroup}>
            <ThemedText type="smallBold" style={styles.label}>
              Home Wifi Password
            </ThemedText>
            <TextInput
              style={inputStyle}
              placeholder="Your Wi-Fi Password"
              placeholderTextColor={theme.textSecondary}
              value={wifiPassword}
              onChangeText={setWifiPassword}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.inputGroup}>
            <View
              style={{ flexDirection: "row", justifyContent: "space-between" }}
            >
              <ThemedText type="smallBold" style={styles.label}>
                Target Host IP (This Phone's IP)
              </ThemedText>
              {phoneHomeIp ? (
                <Pressable onPress={() => setServerIp(phoneHomeIp)}>
                  <ThemedText type="small" style={{ color: "#2563eb" }}>
                    Use Phone IP ({phoneHomeIp})
                  </ThemedText>
                </Pressable>
              ) : null}
            </View>
            <TextInput
              style={inputStyle}
              placeholder="e.g. 192.168.1.15"
              placeholderTextColor={theme.textSecondary}
              value={serverIp}
              onChangeText={setServerIp}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType={
                Platform.OS === "ios"
                  ? "numbers-and-punctuation"
                  : "decimal-pad"
              }
            />
          </View>

          {statusMessage ? (
            <ThemedText
              type="smallBold"
              style={{
                color: "#208AEF",
                textAlign: "center",
                marginVertical: Spacing.one,
              }}
            >
              {statusMessage}
            </ThemedText>
          ) : null}

          <Pressable
            disabled={connecting}
            style={({ pressed }) => [
              styles.connectButton,
              { backgroundColor: theme.text },
              pressed && styles.pressed,
              connecting && styles.disabled,
            ]}
            onPress={connectAndProvision}
          >
            {connecting ? (
              <ActivityIndicator color={theme.background} />
            ) : (
              <ThemedText
                type="smallBold"
                style={[styles.connectButtonText, { color: theme.background }]}
              >
                Connect & Provision Strip
              </ThemedText>
            )}
          </Pressable>
        </ThemedView>

        {Platform.OS === "web" && <WebBadge />}
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    flexDirection: "row",
    justifyContent: "center",
  },
  container: {
    maxWidth: MaxContentWidth,
    flexGrow: 1,
    paddingHorizontal: Spacing.four,
    gap: Spacing.four,
    paddingBottom: Spacing.six,
  },
  titleContainer: {
    gap: Spacing.two,
    alignItems: "center",
    paddingVertical: Spacing.four,
  },
  centerText: {
    textAlign: "center",
  },
  card: {
    borderRadius: Spacing.four,
    padding: Spacing.five,
    gap: Spacing.four,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  refreshChip: {
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
    borderRadius: Spacing.two,
    backgroundColor: "rgba(37, 99, 235, 0.1)",
  },
  statusBanner: {
    padding: Spacing.three,
    borderRadius: Spacing.two,
    borderWidth: 1,
    alignItems: "center",
  },
  metricsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: Spacing.two,
    backgroundColor: "rgba(0, 0, 0, 0.03)",
    borderRadius: Spacing.two,
  },
  metricItem: {
    alignItems: "center",
    gap: 2,
  },
  outletsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.three,
    justifyContent: "space-between",
  },
  outletCard: {
    width: "48%",
    padding: Spacing.three,
    borderRadius: Spacing.three,
    borderWidth: 1.5,
  },
  outletHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  quickActionRow: {
    flexDirection: "row",
    gap: Spacing.three,
    marginTop: Spacing.one,
  },
  quickActionButton: {
    flex: 1,
    height: 42,
    borderRadius: Spacing.two,
    justifyContent: "center",
    alignItems: "center",
  },
  inputGroup: {
    gap: Spacing.two,
  },
  label: {
    marginBottom: Spacing.half,
  },
  input: {
    height: 48,
    borderRadius: Spacing.two,
    borderWidth: 1,
    paddingHorizontal: Spacing.three,
    fontSize: 16,
  },
  connectButton: {
    height: 48,
    borderRadius: Spacing.two,
    justifyContent: "center",
    alignItems: "center",
    marginTop: Spacing.two,
  },
  connectButtonText: {
    fontSize: 16,
  },
  pressed: {
    opacity: 0.8,
  },
  disabled: {
    opacity: 0.6,
  },
});
