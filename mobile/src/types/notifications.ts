export type NotificationType = "GUARD" | "CONSUMPTION" | "SYSTEM" | "DEVICE";
export type NotificationEntityType = "DEVICE" | "STRIP" | "GUARD" | "SYSTEM";

export interface GuardNotificationData {
  entityName?: string;
  deviceName?: string;
  plugId?: string;
  plugName?: string;
  port?: number;
  action?: "ON" | "OFF";
  target?: "CURRENT" | "TEMPERATURE" | "POWER";
  comparator?: "MIN" | "MAX";
  threshold?: number;
  actualValue?: number;
  icon?: string;
  [key: string]: any;
}

export interface INotificationItem {
  _id: string;
  userId?: string;
  type: NotificationType;
  entityType: NotificationEntityType;
  entityId: string;
  data: GuardNotificationData | Record<string, any>;
  readAt: Date | string | null;
  createdAt: Date | string;
  updatedAt?: Date | string;
}

export interface PaginatedNotificationsResponse {
  success: boolean;
  items: INotificationItem[];
  total: number;
  page: number;
  totalPages: number;
  hasMore: boolean;
}
