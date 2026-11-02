import { DEFAULT_SERVER_HOST } from "@/constants/api";
import { getErrorBody } from "@/utils/strip-activation";
import { verifyPlugConnection } from "@/api/plug";
import {
  connectToWifiNetwork,
  deriveGateway,
  forceWifiUsage,
  pollWifiSearch,
  getWifiPermissions,
  unbindForcedWifi,
} from "@/utils/wifi";
import { useCallback, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import TcpSocket from "react-native-tcp-socket";
import WifiManager from "react-native-wifi-reborn";
import { Alert } from "react-native";

export const STRIP_HOTSPOT_PORT = 30300; // Port when strip is in SoftAP mode
export const STRIP_LAN_PORT = 10086; // Port strip connects back to on LAN

export type GeneralStep = "PAIRING" | "CONFIGURING" | "VERIFYING";

export type ActivationStep =
  | "IDLE"
  | "VALIDATING_PARAMS"
  | "REQUESTING_PERMISSIONS"
  | "SCANNING_STRIP_WIFI"
  | "HOTSPOT_NOT_FOUND"
  | "CONNECTING_STRIP_WIFI"
  | "RESOLVING_GATEWAY"
  | "SENDING_SERVER_IP"
  | "SERVER_IP_CONFIRMED"
  | "SENDING_WIFI_CREDENTIALS"
  | "WIFI_CREDENTIALS_CONFIRMED"
  | "DISCONNECTING_STRIP_WIFI"
  | "RECONNECTING_HOME_WIFI"
  | "VERIFYING_CONNECTION"
  | "SUCCESS"
  | "ERROR";

export type ActivationErrorCode =
  | "INVALID_PARAMS"
  | "PERMISSION_DENIED"
  | "HOTSPOT_CONNECTION_FAILED"
  | "HOTSPOT_TIMEOUT"
  | "GATEWAY_RESOLUTION_FAILED"
  | "TCP_CONFIG_TIMEOUT"
  | "STRIP_NACK"
  | "WIFI_RESTORE_FAILED"
  | "VERIFICATION_TIMEOUT"
  | "ABORTED";

export interface ActivationError {
  code: ActivationErrorCode;
  step: ActivationStep;
  message: string;
  recoveryHint?: string;
  rawError?: any;
}

export interface ActivationParams {
  serialNumber: string;
  homeSsid: string;
  homePassword: string;
  serverIp?: string;
  plugId?: string;
}

export const GENERAL_STEPS_INDEX: Record<ActivationStep, GeneralStep> = {
  IDLE: "PAIRING",
  VALIDATING_PARAMS: "PAIRING",
  REQUESTING_PERMISSIONS: "PAIRING",
  SCANNING_STRIP_WIFI: "PAIRING",
  HOTSPOT_NOT_FOUND: "PAIRING",
  CONNECTING_STRIP_WIFI: "PAIRING",
  RESOLVING_GATEWAY: "PAIRING",
  SENDING_SERVER_IP: "CONFIGURING",
  SERVER_IP_CONFIRMED: "CONFIGURING",
  SENDING_WIFI_CREDENTIALS: "CONFIGURING",
  WIFI_CREDENTIALS_CONFIRMED: "CONFIGURING",
  DISCONNECTING_STRIP_WIFI: "VERIFYING",
  RECONNECTING_HOME_WIFI: "VERIFYING",
  VERIFYING_CONNECTION: "VERIFYING",
  SUCCESS: "VERIFYING",
  ERROR: "PAIRING",
};

export const GENERAL_INDEX = GENERAL_STEPS_INDEX;

export const GENERAL_STEP_NUMERIC_INDEX: Record<GeneralStep, number> = {
  PAIRING: 1,
  CONFIGURING: 2,
  VERIFYING: 3,
};

export const DETAILED_STEPS_INDEX: Record<ActivationStep, number> = {
  IDLE: 0,
  VALIDATING_PARAMS: 1,
  REQUESTING_PERMISSIONS: 2,
  SCANNING_STRIP_WIFI: 3,
  HOTSPOT_NOT_FOUND: 3,
  CONNECTING_STRIP_WIFI: 4,
  RESOLVING_GATEWAY: 5,
  SENDING_SERVER_IP: 6,
  SERVER_IP_CONFIRMED: 7,
  SENDING_WIFI_CREDENTIALS: 8,
  WIFI_CREDENTIALS_CONFIRMED: 9,
  DISCONNECTING_STRIP_WIFI: 10,
  RECONNECTING_HOME_WIFI: 11,
  VERIFYING_CONNECTION: 12,
  SUCCESS: 13,
  ERROR: 0,
};

export const DETAILED_INDEX = DETAILED_STEPS_INDEX;

const stepIndex: Record<ActivationStep, number> = {
  IDLE: 0,
  VALIDATING_PARAMS: 1,
  REQUESTING_PERMISSIONS: 1,
  SCANNING_STRIP_WIFI: 1,
  HOTSPOT_NOT_FOUND: 1,
  CONNECTING_STRIP_WIFI: 2,
  RESOLVING_GATEWAY: 2,
  SENDING_SERVER_IP: 3,
  SERVER_IP_CONFIRMED: 3,
  SENDING_WIFI_CREDENTIALS: 3,
  WIFI_CREDENTIALS_CONFIRMED: 3,
  DISCONNECTING_STRIP_WIFI: 4,
  RECONNECTING_HOME_WIFI: 4,
  VERIFYING_CONNECTION: 4,
  SUCCESS: 4,
  ERROR: 1,
};

const loadingStates: Record<ActivationStep, boolean> = {
  IDLE: false,
  VALIDATING_PARAMS: true,
  REQUESTING_PERMISSIONS: true,
  SCANNING_STRIP_WIFI: true,
  HOTSPOT_NOT_FOUND: false,
  CONNECTING_STRIP_WIFI: true,
  RESOLVING_GATEWAY: true,
  SENDING_SERVER_IP: true,
  SERVER_IP_CONFIRMED: true,
  SENDING_WIFI_CREDENTIALS: true,
  WIFI_CREDENTIALS_CONFIRMED: true,
  DISCONNECTING_STRIP_WIFI: true,
  RECONNECTING_HOME_WIFI: true,
  VERIFYING_CONNECTION: true,
  SUCCESS: false,
  ERROR: false,
};

const errors = {};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export function useActivateStrip() {
  const { t } = useTranslation();
  const [currentStep, setCurrentStep] = useState<ActivationStep>("IDLE");
  const [error, setError] = useState<ActivationError | null>(null);
  const [rawError, setRawError] = useState<any>(null);
  const [statusMessage, setStatusMessage] = useState<string>("");
  const [activatedStripIp, setActivatedStripIp] = useState<string | null>(null);
  const [detectedPhoneIp, setDetectedPhoneIp] = useState<string>("");
  const [detectedSsid, setDetectedSsid] = useState<string>("");

  const lastParamsRef = useRef<ActivationParams | null>(null);
  const isCancelledRef = useRef<boolean>(false);
  const forcedWifiRef = useRef<boolean>(false);
  const verifyServerRef = useRef<any>(null);
  const verifiedRef = useRef<boolean>(false);
  // computed states ////////////////////////////////////////////////////
  const isLoading = loadingStates[currentStep];
  const isSuccess = currentStep === "SUCCESS";
  const isError = currentStep === "ERROR";

  const notifyVerified = useCallback((ip?: string) => {
    verifiedRef.current = true;
    if (ip) {
      setActivatedStripIp(ip);
    }
  }, []);

  // HELPER FUNCTIONS ///////////////////////////////////////////
  const retry = async (): Promise<boolean> => {
    if (lastParamsRef.current) {
      return activate(lastParamsRef.current);
    }
    return false;
  };

  const cancel = () => {
    isCancelledRef.current = true;
    verifiedRef.current = false;
    unbindForcedWifi();
    // closeVerifyServer();
    setCurrentStep("IDLE");
    setError(null);
    setStatusMessage("");
  };

  const reset = () => {
    cancel();
  };
  const sendStripTcpCommand = (
    host: string,
    command: string,
    expected?: string,
    timeoutMs: number = 8000,
  ): Promise<string> => {
    return new Promise((resolve, reject) => {
      let client: any = null;
      let received = "";
      let finished = false;

      const cleanup = () => {
        clearTimeout(timeoutTimer);
        try {
          client?.destroy();
        } catch (_) {}
      };

      const succeed = (val: string) => {
        if (finished) return;
        finished = true;
        cleanup();
        resolve(val);
      };

      const fail = (err: any) => {
        if (finished) return;
        finished = true;
        cleanup();
        reject(err instanceof Error ? err : new Error(String(err)));
      };

      const timeoutTimer = setTimeout(() => {
        fail(new Error(`Timeout waiting for response to "${command}"`));
      }, timeoutMs);

      try {
        console.log(
          `➡️ Sending: "${command}" to ${host}:${STRIP_HOTSPOT_PORT} ...`,
        );
        client = TcpSocket.createConnection(
          { host, port: STRIP_HOTSPOT_PORT },
          () => {
            client.write(command + "\r\n");
          },
        );

        const cleanReceived = (raw: string) => raw.replace(/\0/g, "").trim();

        client.on("data", (data: any) => {
          const text = data.toString();
          received += text;
          // Finish as soon as newline received or expected response found
          if (
            received.includes("\n") ||
            (expected && received.includes(expected))
          ) {
            const res = cleanReceived(received);
            console.log(`📥 Strip answered: "${res}"`);
            if (expected && !res.includes(expected)) {
              fail(new Error(`Expected "${expected}" but got "${res}"`));
            } else {
              succeed(res);
            }
          }
        });

        client.on("error", (err: any) => {
          fail(err);
        });

        client.on("close", () => {
          if (received) {
            const res = cleanReceived(received);
            if (expected && !res.includes(expected)) {
              fail(new Error(`Expected "${expected}" but got "${res}"`));
            } else {
              succeed(res);
            }
          } else {
            fail(new Error("Connection closed without response."));
          }
        });
      } catch (e) {
        fail(e);
      }
    });
  };
  // Main Activation Function //////////////////////////////////////////
  const activate = async (params: ActivationParams) => {
    console.log("triggered");
    lastParamsRef.current = params;
    isCancelledRef.current = false;
    verifiedRef.current = false;
    setError(null);
    // Validating Parameters //////////////
    setCurrentStep("VALIDATING_PARAMS");
    setStatusMessage(t("PLUG_ACTIVATION.STATUS_VALIDATING_PARAMS"));

    const cleanSerial = params.serialNumber?.trim().toUpperCase() || "";
    const homeSsid = params.homeSsid || "";
    const homePassword = params.homePassword || "";

    if (cleanSerial.length < 7) {
      setError(getErrorBody("INVALID_SERIAL"));
      setCurrentStep("ERROR");
      return false;
    }

    if (!homeSsid) {
      setError(getErrorBody("MISSING_SSID"));
      setCurrentStep("ERROR");
      return false;
    }

    if (homeSsid.includes(":") || homePassword.includes(":")) {
      setError(getErrorBody("COLON_IN_CREDENTIALS"));
      setCurrentStep("ERROR");
      return false;
    }

    const stripWifiName = `TONLY_TAP_${cleanSerial.slice(-7)}`;
    const stripWifiPassword = `LGU_${cleanSerial.slice(-7)}`;

    try {
      // Asking For Permissions ////////////////////
      setCurrentStep("REQUESTING_PERMISSIONS");
      setStatusMessage(t("PLUG_ACTIVATION.STATUS_REQUESTING_PERMISSIONS"));
      const permissionGranted = await getWifiPermissions();
      console.log(permissionGranted);
      if (!permissionGranted) throw getErrorBody("PERMISSIONS_DENIED");

      if (isCancelledRef.current) return false;
      // Searching for WIFI Network //////////////////
      setCurrentStep("SCANNING_STRIP_WIFI");
      setStatusMessage(
        t("PLUG_ACTIVATION.STATUS_SCANNING_STRIP_WIFI", {
          name: stripWifiName,
        }),
      );
      const wifiNetwork = await pollWifiSearch(stripWifiName);
      if (!wifiNetwork) {
        console.log("[Activation] Hotspot not found after polling period");
        setCurrentStep("HOTSPOT_NOT_FOUND");
        setStatusMessage(
          t("PLUG_ACTIVATION.STATUS_HOTSPOT_NOT_FOUND", {
            name: stripWifiName,
          }),
        );
        return false;
      }
      if (isCancelledRef.current) return false;
      // Connecting to WIFI ///////////////////////////
      setCurrentStep("CONNECTING_STRIP_WIFI");
      setStatusMessage(
        t("PLUG_ACTIVATION.STATUS_CONNECTING_STRIP_WIFI", {
          name: stripWifiName,
        }),
      );
      let phoneIp = await connectToWifiNetwork(
        stripWifiName,
        stripWifiPassword,
      );

      if (!phoneIp) {
        throw getErrorBody("WIFI_CONNECTION_ERROR");
      }

      // Resolving Gateway / Forcing Wi-Fi ////////////
      setCurrentStep("RESOLVING_GATEWAY");
      setStatusMessage(t("PLUG_ACTIVATION.STATUS_RESOLVING_GATEWAY"));
      await forceWifiUsage();
      await sleep(2500);
      if (isCancelledRef.current) return false;

      const currentPhoneIp = (await WifiManager.getIP()) || phoneIp;
      setDetectedPhoneIp(currentPhoneIp);
      let stripIp = deriveGateway(currentPhoneIp);
      console.log(
        `[Activation] Phone IP: ${currentPhoneIp} → Strip Gateway IP: ${stripIp}`,
      );

      const sendCommandWithFallback = async (
        command: string,
        expected?: string,
        timeoutMs: number = 8000,
      ) => {
        try {
          return await sendStripTcpCommand(stripIp, command, expected, timeoutMs);
        } catch (err) {
          const fallbackIp =
            stripIp === "192.168.1.1" ? "192.168.4.1" : "192.168.1.1";
          console.warn(
            `[Activation] Command failed on ${stripIp}, trying fallback IP ${fallbackIp}...`,
          );
          try {
            const res = await sendStripTcpCommand(
              fallbackIp,
              command,
              expected,
              timeoutMs,
            );
            stripIp = fallbackIp;
            return res;
          } catch (_) {
            throw err;
          }
        }
      };

      // Send Server IP //////////////////////////////
      setCurrentStep("SENDING_SERVER_IP");
      const targetServerIp = DEFAULT_SERVER_HOST;
      setStatusMessage(
        t("PLUG_ACTIVATION.STATUS_SENDING_SERVER_IP", {
          ip: targetServerIp,
        }),
      );

      try {
        console.log(
          `[Activation] Sending target server IP: up:ip:${targetServerIp} to ${stripIp}`,
        );
        const ipRes = await sendCommandWithFallback(
          `up:ip:${targetServerIp}`,
          "up:ip:ip_ok",
          8000,
        );
        console.log(`[Activation] Target server IP response:`, ipRes);
      } catch (ipErr: any) {
        console.warn(`[Activation] Failed to send target server IP:`, ipErr);
        setRawError(ipErr);
        throw getErrorBody("TCP_CONFIG_TIMEOUT");
      }

      // Server IP Confirmed //////////////////////////
      setCurrentStep("SERVER_IP_CONFIRMED");
      setStatusMessage(t("PLUG_ACTIVATION.STATUS_SERVER_IP_CONFIRMED"));
      if (isCancelledRef.current) return false;
      await sleep(1000);

      // Send WIFI Credentials ///////////////////////
      setCurrentStep("SENDING_WIFI_CREDENTIALS");
      setStatusMessage(
        t("PLUG_ACTIVATION.STATUS_SENDING_WIFI_CREDENTIALS", {
          ssid: homeSsid,
        }),
      );
      try {
        console.log(
          `[Activation] Sending Wi-Fi credentials to ${stripIp} for SSID: ${homeSsid}`,
        );
        const wifiRes = await sendCommandWithFallback(
          `up:connect:${homeSsid}:${homePassword}`,
          "up:connect:connect_ok",
          8000,
        );
        console.log(`[Activation] Wi-Fi credentials response:`, wifiRes);
      } catch (credErr: any) {
        console.warn(`[Activation] Failed to send Wi-Fi credentials:`, credErr);
        throw getErrorBody("STRIP_NACK");
      }

      // Wi-Fi Credentials Confirmed //////////////////
      setCurrentStep("WIFI_CREDENTIALS_CONFIRMED");
      setStatusMessage(t("PLUG_ACTIVATION.STATUS_WIFI_CREDENTIALS_CONFIRMED"));
      if (isCancelledRef.current) return false;
      await sleep(1000);

      // Disconnect from Strip Wi-Fi //////////////////
      setCurrentStep("DISCONNECTING_STRIP_WIFI");
      setStatusMessage(t("PLUG_ACTIVATION.STATUS_DISCONNECTING_STRIP_WIFI"));
      await unbindForcedWifi();
      try {
        await WifiManager.disconnect();
      } catch (_) {}
      if (isCancelledRef.current) return false;

      // Reconnect to Home Wi-Fi /////////////////////
      setCurrentStep("RECONNECTING_HOME_WIFI");
      setStatusMessage(t("PLUG_ACTIVATION.STATUS_RECONNECTING_HOME_WIFI"));
      await sleep(2000);
      if (isCancelledRef.current) return false;

      // Verify Connection ////////////////////////////
      setCurrentStep("VERIFYING_CONNECTION");
      setStatusMessage(t("PLUG_ACTIVATION.STATUS_VERIFYING_CONNECTION"));

      const VERIFICATION_TIMEOUT_MS = 45000;
      const POLL_INTERVAL_MS = 2000;
      const verificationStartTime = Date.now();
      let verified = false;

      while (Date.now() - verificationStartTime < VERIFICATION_TIMEOUT_MS) {
        if (isCancelledRef.current) return false;
        if (verifiedRef.current) {
          verified = true;
          break;
        }

        if (params.plugId) {
          try {
            const verification = await verifyPlugConnection(params.plugId);
            if (verification?.dataReceived) {
              verified = true;
              if (verification.ipAddress) {
                setActivatedStripIp(verification.ipAddress);
              }
              break;
            }
          } catch (_) {
            // Polling might fail temporarily while phone reconnects to network; ignore and retry
          }
        }

        await sleep(POLL_INTERVAL_MS);
      }

      if (!verified) {
        throw getErrorBody("VERIFICATION_TIMEOUT");
      }

      if (isCancelledRef.current) return false;

      // Success //////////////////////////////////////
      setCurrentStep("SUCCESS");
      setStatusMessage(t("PLUG_ACTIVATION.STATUS_SUCCESS"));
      return true;
    } catch (caughtErr: any) {
      const normalizedError: ActivationError = {
        code: caughtErr.code || "HOTSPOT_TIMEOUT",
        step: caughtErr.step || currentStep,
        message: caughtErr.message || t("PLUG_ACTIVATION.ERR_UNEXPECTED"),
        recoveryHint:
          caughtErr.recoveryHint || t("PLUG_ACTIVATION.HINT_UNEXPECTED"),
        rawError: caughtErr.rawError || caughtErr,
      };
      Alert.alert(
        normalizedError?.rawError?.message ||
          normalizedError?.rawError ||
          caughtErr?.message ||
          "Something went wrong",
      );
      setError(normalizedError);
      setCurrentStep("ERROR");
      setStatusMessage(normalizedError.message);
      return false;
    } finally {
    }
  };

  return {
    activate,
    error,
    currentStep,
    generalStep: GENERAL_STEPS_INDEX[currentStep],
    generalStepIndex:
      GENERAL_STEP_NUMERIC_INDEX[GENERAL_STEPS_INDEX[currentStep]],
    detailedStepIndex: DETAILED_STEPS_INDEX[currentStep],
    rawError,
    stepIndex: stepIndex[currentStep],
    isLoading,
    isSuccess,
    isError,
    retry,
    cancel,
    reset,
    notifyVerified,
    statusMessage,
    activatedStripIp,
    detectedPhoneIp,
    detectedSsid,
  };
}
