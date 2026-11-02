import { ActivationError } from "@/hooks/use-activate-strip";
import i18n from "@/i18n";

export type ErrorCodes =
  | "INVALID_SERIAL"
  | "MISSING_SSID"
  | "COLON_IN_CREDENTIALS"
  | "PERMISSIONS_DENIED"
  | "WIFI_CONNECTION_ERROR"
  | "TCP_CONFIG_TIMEOUT"
  | "STRIP_NACK"
  | "VERIFICATION_TIMEOUT";

export function getErrorBody(code: ErrorCodes): ActivationError {
  const { t } = i18n;
  switch (code) {
    case "INVALID_SERIAL":
      return {
        code: "INVALID_PARAMS",
        step: "IDLE",
        message: t("PLUG_ACTIVATION.ERR_INVALID_SERIAL"),
        recoveryHint: t("PLUG_ACTIVATION.HINT_INVALID_SERIAL"),
      };
    case "MISSING_SSID":
      return {
        code: "INVALID_PARAMS",
        step: "IDLE",
        message: t("PLUG_ACTIVATION.ERR_MISSING_SSID"),
        recoveryHint: t("PLUG_ACTIVATION.HINT_MISSING_SSID"),
      };
    case "COLON_IN_CREDENTIALS":
      return {
        code: "INVALID_PARAMS",
        step: "IDLE",
        message: t("PLUG_ACTIVATION.ERR_COLON_IN_CREDENTIALS"),
        recoveryHint: t("PLUG_ACTIVATION.HINT_COLON_IN_CREDENTIALS"),
      };
    case "PERMISSIONS_DENIED":
      return {
        code: "PERMISSION_DENIED",
        step: "REQUESTING_PERMISSIONS",
        message: t("PLUG_ACTIVATION.ERR_PERMISSION_DENIED"),
        recoveryHint: t("PLUG_ACTIVATION.HINT_PERMISSION_DENIED"),
      };
    case "WIFI_CONNECTION_ERROR":
      return {
        code: "HOTSPOT_CONNECTION_FAILED",
        step: "CONNECTING_STRIP_WIFI",
        message: t("PLUG_ACTIVATION.ERR_WIFI_CONNECTION_FAILED"),
        recoveryHint: t("PLUG_ACTIVATION.HINT_WIFI_CONNECTION_FAILED"),
      };
    case "TCP_CONFIG_TIMEOUT":
      return {
        code: "TCP_CONFIG_TIMEOUT",
        step: "SENDING_SERVER_IP",
        message: t("PLUG_ACTIVATION.ERR_SERVER_IP_FAILED"),
        recoveryHint: t("PLUG_ACTIVATION.HINT_SERVER_IP_FAILED"),
      };
    case "STRIP_NACK":
      return {
        code: "STRIP_NACK",
        step: "SENDING_WIFI_CREDENTIALS",
        message: t("PLUG_ACTIVATION.ERR_WIFI_CRED_FAILED"),
        recoveryHint: t("PLUG_ACTIVATION.HINT_WIFI_CRED_FAILED"),
      };
    case "VERIFICATION_TIMEOUT":
      return {
        code: "VERIFICATION_TIMEOUT",
        step: "VERIFYING_CONNECTION",
        message: t("PLUG_ACTIVATION.ERR_VERIFY_TIMEOUT"),
        recoveryHint: t("PLUG_ACTIVATION.HINT_VERIFY_TIMEOUT"),
      };
  }
}
