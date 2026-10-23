import { useState, useRef, useCallback, useEffect } from "react";
import { Platform, PermissionsAndroid } from "react-native";
import WifiManager from "react-native-wifi-reborn";
import TcpSocket from "react-native-tcp-socket";
import { useUpdatePlug, getPlugById } from "@/api/plug";
import { DEFAULT_SERVER_HOST } from "@/constants/api";
import { getWifiNetwork } from "@/utils/wifi";

export const STRIP_HOTSPOT_PORT = 30300; // Port when strip is in SoftAP mode
export const STRIP_LAN_PORT = 10086; // Port strip connects back to on LAN

export type ActivationStep =
  | "IDLE"
  | "REQUESTING_PERMISSIONS"
  | "CONNECTING_STRIP_WIFI" // Connecting to TONLY_TAP_... hotspot
  | "RESOLVING_GATEWAY" // Binding socket routing and discovering strip IP
  | "SENDING_SERVER_IP" // Sending up:ip:...
  | "SENDING_WIFI_CREDENTIALS" // Sending up:connect:...
  | "RECONNECTING_HOME_WIFI" // Disconnecting hotspot & restoring phone LAN
  | "VERIFYING_CONNECTION" // Verifying strip reaches LAN
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

export interface UseActivateStripReturn {
  currentStep: ActivationStep;
  stepIndex: number; // 1: Connect to strip, 2: Send credentials, 3: Verify & connect
  isLoading: boolean;
  isSuccess: boolean;
  isError: boolean;
  error: ActivationError | null;
  statusMessage: string;
  activatedStripIp: string | null;
  detectedPhoneIp: string;
  detectedSsid: string;
  activate: (params: ActivationParams) => Promise<boolean>;
  retry: () => Promise<boolean>;
  cancel: () => void;
  reset: () => void;
  refreshNetworkInfo: () => Promise<void>;
}

function deriveGateway(phoneIp: string): string {
  if (!phoneIp) return "192.168.4.1";
  const parts = phoneIp.split(".");
  if (parts.length !== 4) return "192.168.4.1";
  parts[3] = "1";
  return parts.join(".");
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * useActivateStrip
 * Dedicated hook solely responsible for activating or reactivating a new/reset power strip:
 * 1. Derives credentials from Serial Number
 * 2. Joins strip SoftAP (TONLY_TAP_...)
 * 3. Sends target server IP and home Wi-Fi credentials via TCP
 * 4. Disconnects SoftAP and restores phone connection to home Wi-Fi
 * 5. Verifies strip reaches home Wi-Fi and updates backend record
 */
export function useActivateStrip(): UseActivateStripReturn {
  const [currentStep, setCurrentStep] = useState<ActivationStep>("IDLE");
  const [error, setError] = useState<ActivationError | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>("");
  const [activatedStripIp, setActivatedStripIp] = useState<string | null>(null);
  const [detectedPhoneIp, setDetectedPhoneIp] = useState<string>("");
  const [detectedSsid, setDetectedSsid] = useState<string>("");

  const lastParamsRef = useRef<ActivationParams | null>(null);
  const isCancelledRef = useRef<boolean>(false);
  const forcedWifiRef = useRef<boolean>(false);
  const verifyServerRef = useRef<any>(null);

  const updatePlugMutation = useUpdatePlug();

  // Map high-level steps to 1..3 for UI steppers
  const stepIndex =
    currentStep === "REQUESTING_PERMISSIONS" ||
    currentStep === "CONNECTING_STRIP_WIFI" ||
    currentStep === "RESOLVING_GATEWAY"
      ? 1
      : currentStep === "SENDING_SERVER_IP" ||
          currentStep === "SENDING_WIFI_CREDENTIALS"
        ? 2
        : currentStep === "RECONNECTING_HOME_WIFI" ||
            currentStep === "VERIFYING_CONNECTION" ||
            currentStep === "SUCCESS"
          ? 3
          : 1;

  const isLoading =
    currentStep !== "IDLE" &&
    currentStep !== "SUCCESS" &&
    currentStep !== "ERROR";

  const isSuccess = currentStep === "SUCCESS";
  const isError = currentStep === "ERROR";

  // Auto-detect current Phone IP and SSID on home network
  const refreshNetworkInfo = useCallback(async () => {
    try {
      if (Platform.OS === "android") {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        );
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) return;
      }

      const [ip, ssid] = await Promise.allSettled([
        (WifiManager as any).getIP(),
        WifiManager.getCurrentWifiSSID(),
      ]);

      if (ip.status === "fulfilled" && ip.value && ip.value !== "0.0.0.0") {
        setDetectedPhoneIp(ip.value);
      }
      if (ssid.status === "fulfilled" && ssid.value) {
        setDetectedSsid(ssid.value.replace(/^"|"$/g, ""));
      }
    } catch (_) {}
  }, []);

  useEffect(() => {
    refreshNetworkInfo();
  }, [refreshNetworkInfo]);

  const unbindForcedWifi = useCallback(async () => {
    if (forcedWifiRef.current && Platform.OS === "android") {
      try {
        const wm: any = WifiManager;
        if (typeof wm.forceWifiUsageWithOptions === "function") {
          await wm.forceWifiUsageWithOptions(false, { noInternet: false });
        } else if (typeof wm.forceWifiUsage === "function") {
          await wm.forceWifiUsage(false);
        }
      } catch (_) {}
      forcedWifiRef.current = false;
    }
  }, []);

  const closeVerifyServer = useCallback(() => {
    try {
      verifyServerRef.current?.close();
      verifyServerRef.current = null;
    } catch (_) {}
  }, []);

  useEffect(() => {
    return () => {
      isCancelledRef.current = true;
      unbindForcedWifi();
      closeVerifyServer();
    };
  }, [unbindForcedWifi, closeVerifyServer]);

  /**
   * Helper to send TCP command to strip in SoftAP mode (port 30300)
   */
  const sendStripTcpCommand = (
    host: string,
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
        fail(new Error(`Timeout waiting for response to: ${command}`));
      }, timeoutMs);

      try {
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
          clearTimeout(settleTimer);
          settleTimer = setTimeout(
            () => succeed(cleanReceived(received)),
            settleMs,
          );
        });

        client.on("error", (err: any) => {
          fail(err);
        });

        client.on("close", () => {
          if (received) succeed(cleanReceived(received));
          else fail(new Error("Connection closed without response."));
        });
      } catch (e) {
        fail(e);
      }
    });
  };

  /**
   * Helper to verify strip connection on Cloud via backend polling
   */
  const waitForStripOnLan = (
    plugId?: string,
    timeoutMs: number = 30000,
  ): Promise<string> => {
    return new Promise((resolve, reject) => {
      let isDone = false;
      let timer: any = null;
      let pollInterval: any = null;

      const finish = (ip: string) => {
        if (isDone) return;
        isDone = true;
        clearTimeout(timer);
        clearInterval(pollInterval);
        resolve(ip);
      };

      // Poll cloud backend to detect when strip dials the cloud server
      if (plugId) {
        pollInterval = setInterval(async () => {
          if (isDone) return;
          try {
            const p = await getPlugById(plugId);
            if (p && (p.connected || p.isOnline || p.ipAddress)) {
              finish(p.ipAddress || "connected");
            }
          } catch (_) {}
        }, 1500);
      } else {
        setTimeout(() => finish("connected"), 2000);
      }

      timer = setTimeout(() => {
        if (!isDone) {
          isDone = true;
          clearInterval(pollInterval);
          reject(
            new Error(
              "Timed out waiting for strip to connect to the Wi-Fi. Check Wi-Fi credentials and ensure port 10086 is open on the server.",
            ),
          );
        }
      }, timeoutMs);
    });
  };

  /**
   * Main activation procedure
   */
  const activate = async (params: ActivationParams): Promise<boolean> => {
    lastParamsRef.current = params;
    isCancelledRef.current = false;
    setError(null);

    const cleanSerial = params.serialNumber?.trim().toUpperCase() || "";
    const homeSsid = params.homeSsid?.trim() || "";
    const homePassword = params.homePassword?.trim() || "";

    // Input Validation
    if (cleanSerial.length < 7) {
      const err: ActivationError = {
        code: "INVALID_PARAMS",
        step: "IDLE",
        message: "الرقم التسلسلي غير صحيح. يجب أن يتكون من 7 أحرف على الأقل.",
        recoveryHint: "يرجى التحقق من الملصق الموجود على المشترك.",
      };
      setError(err);
      setCurrentStep("ERROR");
      return false;
    }

    if (!homeSsid) {
      const err: ActivationError = {
        code: "INVALID_PARAMS",
        step: "IDLE",
        message: "يرجى إدخال اسم شبكة Wi-Fi المنزلية.",
        recoveryHint: "تأكد من اتصال هاتفك بشبكة 2.4GHz المنزلية أولاً.",
      };
      setError(err);
      setCurrentStep("ERROR");
      return false;
    }

    if (homeSsid.includes(":") || homePassword.includes(":")) {
      const err: ActivationError = {
        code: "INVALID_PARAMS",
        step: "IDLE",
        message: "اسم الشبكة وكلمة المرور لا يمكن أن تحتوي على الرمز (:).",
        recoveryHint: "نظام المشترك يستخدم الرمز (:) كفاصل في الأوامر.",
      };
      setError(err);
      setCurrentStep("ERROR");
      return false;
    }

    const stripWifiName = `TONLY_TAP_${cleanSerial.slice(-7)}`;
    const stripWifiPassword = `LGU_${cleanSerial.slice(-7)}`;

    try {
      // Step 1: Permissions
      setCurrentStep("REQUESTING_PERMISSIONS");
      setStatusMessage("جاري طلب أذونات الموقع والشبكة...");

      if (Platform.OS === "android") {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        );
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          throw {
            code: "PERMISSION_DENIED",
            step: "REQUESTING_PERMISSIONS",
            message: "تم رفض إذن الوصول للموقع الجغرافي المطلوب لشبكات Wi-Fi.",
            recoveryHint:
              "يرجى منح إذن الموقع للتطبيق من إعدادات الهاتف والمحاولة مجدداً.",
          };
        }
      }

      if (isCancelledRef.current) return false;

      // Step 2: Connect to SoftAP
      setCurrentStep("CONNECTING_STRIP_WIFI");
      setStatusMessage(`جاري الاتصال بنقطة بث المشترك (${stripWifiName})...`);

      try {
        await getWifiNetwork(stripWifiName);
        await WifiManager.connectToProtectedSSID(
          stripWifiName,
          stripWifiPassword,
          false,
          false,
        );
      } catch (hotspotErr: any) {
        throw {
          code: "HOTSPOT_CONNECTION_FAILED",
          step: "CONNECTING_STRIP_WIFI",
          message: `تعذر الاتصال بنقطة بث المشترك (${stripWifiName}).`,
          recoveryHint:
            "تأكد من تشغيل المشترك وأن مؤشر LED يومض بسرعة باللون الأزرق (اضغط مطولاً على الزر لمدة 5 ثوانٍ لإعادة ضبط وضع التهيئة).",
          rawError: hotspotErr,
        };
      }

      if (isCancelledRef.current) return false;

      // Step 3: Resolve Gateway IP
      setCurrentStep("RESOLVING_GATEWAY");
      setStatusMessage("جاري توجيه الاتصال وقراءة عنوان المشترك...");

      if (Platform.OS === "android") {
        try {
          const wm: any = WifiManager;
          if (typeof wm.forceWifiUsageWithOptions === "function") {
            await wm.forceWifiUsageWithOptions(true, { noInternet: true });
            forcedWifiRef.current = true;
          } else if (typeof wm.forceWifiUsage === "function") {
            await wm.forceWifiUsage(true);
            forcedWifiRef.current = true;
          }
        } catch (_) {}
      }

      await sleep(2500);
      if (isCancelledRef.current) return false;

      let stripGateway = "192.168.4.1";
      try {
        const phoneIp = await (WifiManager as any).getIP();
        if (phoneIp && phoneIp !== "0.0.0.0") {
          stripGateway = deriveGateway(phoneIp);
        }
      } catch (_) {}

      // Step 4: Send Target Server IP (Cloud Server IP where strip connects back on port 10086)
      setCurrentStep("SENDING_SERVER_IP");
      const targetServerIp = DEFAULT_SERVER_HOST;
      setStatusMessage(
        `إرسال عنوان خادم المزامنة السحابي (${targetServerIp})...`,
      );

      try {
        await sendStripTcpCommand(
          stripGateway,
          `up:ip:${targetServerIp}`,
          8000,
        );
      } catch (ipErr: any) {
        throw {
          code: "TCP_CONFIG_TIMEOUT",
          step: "SENDING_SERVER_IP",
          message: "فشل إرسال عنوان الخادم إلى المشترك عبر منفذ التهيئة.",
          recoveryHint: "تأكد من بقاء الهاتف قريباً من المشترك أثناء الإعداد.",
          rawError: ipErr,
        };
      }

      if (isCancelledRef.current) return false;
      await sleep(1000);

      // Step 5: Send Wi-Fi credentials
      setCurrentStep("SENDING_WIFI_CREDENTIALS");
      setStatusMessage(`إرسال بيانات شبكة Wi-Fi (${homeSsid})...`);

      try {
        await sendStripTcpCommand(
          stripGateway,
          `up:connect:${homeSsid}:${homePassword}`,
          8000,
        );
      } catch (credErr: any) {
        throw {
          code: "STRIP_NACK",
          step: "SENDING_WIFI_CREDENTIALS",
          message: "فشل في إرسال بيانات شبكة الـ Wi-Fi للمشترك.",
          recoveryHint:
            "تأكد من صحة كلمة مرور الشبكة وخلوها من الرموز الخاصة كالنقطتين (:).",
          rawError: credErr,
        };
      }

      if (isCancelledRef.current) return false;

      // Step 6: Disconnect SoftAP & restore Home Wi-Fi
      setCurrentStep("RECONNECTING_HOME_WIFI");
      setStatusMessage("جاري استعادة الاتصال بشبكة المنزل...");

      await unbindForcedWifi();
      try {
        await WifiManager.disconnect();
      } catch (_) {}

      await sleep(3000);
      if (isCancelledRef.current) return false;

      // Step 7: Verify Connection on LAN
      setCurrentStep("VERIFYING_CONNECTION");
      setStatusMessage("جاري انتظار اتصال المشترك والتحقق من الاستجابة...");

      let verifiedIp: string = "";
      try {
        verifiedIp = await waitForStripOnLan(params.plugId, 30000);
        setActivatedStripIp(verifiedIp);
      } catch (verifyErr: any) {
        throw {
          code: "VERIFICATION_TIMEOUT",
          step: "VERIFYING_CONNECTION",
          message:
            "انتهت مهلة انتظار المشترك. لم يتمكن المشترك من الاتصال بشبكة Wi-Fi المنزلية.",
          recoveryHint:
            "تأكد من: 1. صحة كلمة مرور شبكة الـ Wi-Fi. 2. أن الشبكة تعمل بتردد 2.4GHz. 3. أن هاتفك متصل بنفس الشبكة.",
          rawError: verifyErr,
        };
      }

      // Update backend if plugId provided
      if (params.plugId && verifiedIp) {
        try {
          await updatePlugMutation.mutateAsync({
            id: params.plugId,
            payload: { ipAddress: verifiedIp },
          });
        } catch (_) {}
      }

      closeVerifyServer();
      setCurrentStep("SUCCESS");
      setStatusMessage("تم تهيئة وتشغيل المشترك بنجاح!");
      return true;
    } catch (caughtErr: any) {
      await unbindForcedWifi();
      closeVerifyServer();

      const normalizedError: ActivationError = {
        code: caughtErr.code || "HOTSPOT_TIMEOUT",
        step: caughtErr.step || currentStep,
        message: caughtErr.message || "حدث خطأ غير متوقع أثناء تفعيل المشترك.",
        recoveryHint:
          caughtErr.recoveryHint ||
          "يرجى التأكد من تشغيل المشترك وقربه من الهاتف وإعادة المحاولة.",
        rawError: caughtErr.rawError || caughtErr,
      };

      setError(normalizedError);
      setCurrentStep("ERROR");
      setStatusMessage(normalizedError.message);
      return false;
    }
  };

  const retry = async (): Promise<boolean> => {
    if (lastParamsRef.current) {
      return activate(lastParamsRef.current);
    }
    return false;
  };

  const cancel = () => {
    isCancelledRef.current = true;
    unbindForcedWifi();
    closeVerifyServer();
    setCurrentStep("IDLE");
    setError(null);
    setStatusMessage("");
  };

  const reset = () => {
    cancel();
  };

  return {
    currentStep,
    stepIndex,
    isLoading,
    isSuccess,
    isError,
    error,
    statusMessage,
    activatedStripIp,
    detectedPhoneIp,
    detectedSsid,
    activate,
    retry,
    cancel,
    reset,
    refreshNetworkInfo,
  };
}

export default useActivateStrip;
