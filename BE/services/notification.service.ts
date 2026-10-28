import NotificationModel from "../models/notification.model";
import { INotification, NotificationType, NotificationEntityType } from "../types/notification.type";
import { getIO } from "./socket.service";

export interface CreateNotificationParams {
  userId: string;
  type: NotificationType;
  entityType: NotificationEntityType;
  entityId: string;
  data?: Record<string, any>;
}

export interface GetNotificationsQuery {
  page?: number;
  limit?: number;
  filter?: "ALL" | "UNREAD" | "GUARD" | "CONSUMPTION" | "DEVICE" | "SYSTEM";
}

export interface PaginatedNotificationsResult {
  items: INotification[];
  total: number;
  page: number;
  totalPages: number;
  hasMore: boolean;
}

export class NotificationService {
  /**
   * Persists a notification to the database and broadcasts it in real-time
   * to the user's private socket room (user_${userId}).
   */
  async createNotification(params: CreateNotificationParams): Promise<INotification> {
    const notification = await NotificationModel.create({
      userId: params.userId,
      type: params.type,
      entityType: params.entityType,
      entityId: params.entityId,
      data: params.data || {},
      readAt: null,
    });

    // Real-time broadcast to user's connected clients
    try {
      const io = getIO();
      if (io) {
        console.log(`📢 Emitting notification to user room: user_${params.userId}`);
        io.to(`user_${params.userId}`).emit("notification", notification);
      }
    } catch (err) {
      console.error("Failed to emit socket notification:", err);
    }

    return notification;
  }

  /**
   * Fetches paginated notifications for a user, strictly sorted in descending
   * creation order (newest first).
   */
  async getUserNotifications(
    userId: string,
    query: GetNotificationsQuery = {}
  ): Promise<PaginatedNotificationsResult> {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(query.limit) || 20));
    const skip = (page - 1) * limit;

    const filterObj: Record<string, any> = { userId };

    if (query.filter === "UNREAD") {
      filterObj.readAt = null;
    } else if (query.filter && ["GUARD", "CONSUMPTION", "DEVICE", "SYSTEM"].includes(query.filter)) {
      filterObj.type = query.filter;
    }

    const [items, total] = await Promise.all([
      NotificationModel.find(filterObj)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      NotificationModel.countDocuments(filterObj),
    ]);

    const totalPages = Math.ceil(total / limit) || 1;
    const hasMore = page < totalPages;

    return {
      items: items as unknown as INotification[],
      total,
      page,
      totalPages,
      hasMore,
    };
  }

  /**
   * Marks a specific notification as read.
   */
  async markAsRead(notificationId: string, userId: string): Promise<INotification | null> {
    return await NotificationModel.findOneAndUpdate(
      { _id: notificationId, userId },
      { readAt: new Date() },
      { new: true }
    );
  }

  /**
   * Marks all unread notifications for a user as read.
   */
  async markAllAsRead(userId: string): Promise<{ modifiedCount: number }> {
    const result = await NotificationModel.updateMany(
      { userId, readAt: null },
      { readAt: new Date() }
    );
    return { modifiedCount: result.modifiedCount };
  }

  /**
   * Deletes a notification by ID.
   */
  async deleteNotification(notificationId: string, userId: string): Promise<boolean> {
    const result = await NotificationModel.findOneAndDelete({
      _id: notificationId,
      userId,
    });
    return !!result;
  }
}

export default new NotificationService();
