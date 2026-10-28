import { INotificationItem, NotificationEntityType, NotificationType } from "@/types/notifications";

export interface NormalizedNotification {
  id: string;
  title: string;
  body: string;
  icon: string;
  route?: string;
  entityType: NotificationEntityType;
  entityId: string;
  type: NotificationType;
  readAt: Date | null;
  createdAt: Date;
  raw: INotificationItem;
}

/**
 * Middleware utility function that transforms raw notification payloads
 * into normalized human-readable titles, bodies, icons, and navigation routes
 * based on polymorphic entityType and entityId.
 */
export function normalizeNotification(
  raw: INotificationItem,
  t: (key: string, options?: any) => string
): NormalizedNotification {
  const { entityType, entityId, type, data } = raw;
  let title = "";
  let body = "";
  let icon = "bell";
  let route: string | undefined;

  // 1. Resolve Navigation Route dynamically based on entityType and entityId
  switch (entityType) {
    case "DEVICE":
      route = `/(tabs)/devices/${entityId}`;
      break;
    case "STRIP":
      route = `/(tabs)/plugs/${entityId}`;
      break;
    default:
      route = undefined;
      break;
  }

  // 2. Resolve Title, Body, and Icon based on semantic type and payload
  if (type === "GUARD") {
    const entityName =
      data?.entityName || data?.deviceName || t("NOTIFICATIONS.DEFAULT_DEVICE");
    const targetKey = data?.target ? `GUARDS.METRIC_${data.target}` : "GUARDS.METRIC_CURRENT";
    const targetText = t(targetKey);
    const actionText =
      data?.action === "OFF"
        ? t("NOTIFICATIONS.ACTION_TURNED_OFF")
        : t("NOTIFICATIONS.ACTION_TURNED_ON");

    const bodyKey =
      data?.comparator === "MIN"
        ? "NOTIFICATIONS.GUARD_TRIGGER_BODY_MIN"
        : data?.comparator === "MAX"
          ? "NOTIFICATIONS.GUARD_TRIGGER_BODY_MAX"
          : "NOTIFICATIONS.GUARD_TRIGGER_BODY";

    title = `${actionText}: ${entityName}`;
    body = t(bodyKey, {
      name: entityName,
      action: actionText,
      target: targetText,
      threshold: data?.threshold !== undefined ? data.threshold : "--",
      actual: data?.actualValue !== undefined ? data.actualValue : "--",
    });

    if (data?.target === "TEMPERATURE") {
      icon = "thermometer";
    } else if (data?.target === "POWER") {
      icon = "zap";
    } else {
      icon = "activity";
    }
  } else if (data?.event === "SLEEP_TIMER") {
    const entityName =
      data?.deviceName || data?.entityName || t("NOTIFICATIONS.DEFAULT_DEVICE");
    title = t("NOTIFICATIONS.SLEEP_TIMER_TITLE");

    if (data?.outcome === "offline") {
      body = t("NOTIFICATIONS.SLEEP_TIMER_OFFLINE", { name: entityName });
      icon = "wifi-off";
    } else if (data?.outcome === "failure") {
      body = t("NOTIFICATIONS.SLEEP_TIMER_FAILED", { name: entityName });
      icon = "alert-circle";
    } else {
      body = t("NOTIFICATIONS.SLEEP_TIMER_COMPLETED", { name: entityName });
      icon = "timer";
    }
  } else if (type === "CONSUMPTION") {
    title = t("NOTIFICATIONS.CONSUMPTION_ALERT_TITLE");
    body = data?.message || t("NOTIFICATIONS.CONSUMPTION_ALERT_BODY");
    icon = "trending-up";
  } else {
    title = data?.title || t("NOTIFICATIONS.SYSTEM_ALERT");
    body = data?.message || data?.body || "";
    icon = "info";
  }

  return {
    id: raw._id,
    title,
    body,
    icon,
    route,
    entityType,
    entityId,
    type,
    readAt: raw.readAt ? new Date(raw.readAt) : null,
    createdAt: new Date(raw.createdAt),
    raw,
  };
}
