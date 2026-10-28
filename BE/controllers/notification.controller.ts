import { Request, Response } from "express";
import notificationService from "../services/notification.service";

export class NotificationController {
  /**
   * Fetches paginated notifications for the authenticated user (sorted descending)
   */
  getNotifications = async (req: Request, res: Response) => {
    try {
      const userId = req.userId;
      if (!userId) {
        return res.status(401).json({ success: false, message: "Unauthorized" });
      }

      const { page, limit, filter } = req.query;
      const result = await notificationService.getUserNotifications(userId, {
        page: page ? Number(page) : 1,
        limit: limit ? Number(limit) : 20,
        filter: filter as any,
      });

      return res.status(200).json({
        success: true,
        ...result,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message || "Failed to fetch notifications",
      });
    }
  };

  /**
   * Marks a single notification as read
   */
  markAsRead = async (req: Request, res: Response) => {
    try {
      const userId = req.userId;
      const { id } = req.params;
      if (!userId) {
        return res.status(401).json({ success: false, message: "Unauthorized" });
      }

      const updated = await notificationService.markAsRead(id, userId);
      if (!updated) {
        return res.status(404).json({ success: false, message: "Notification not found" });
      }

      return res.status(200).json({
        success: true,
        data: updated,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message || "Failed to mark notification as read",
      });
    }
  };

  /**
   * Marks all notifications for the authenticated user as read
   */
  markAllAsRead = async (req: Request, res: Response) => {
    try {
      const userId = req.userId;
      if (!userId) {
        return res.status(401).json({ success: false, message: "Unauthorized" });
      }

      const result = await notificationService.markAllAsRead(userId);

      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message || "Failed to mark all notifications as read",
      });
    }
  };

  /**
   * Deletes a notification
   */
  deleteNotification = async (req: Request, res: Response) => {
    try {
      const userId = req.userId;
      const { id } = req.params;
      if (!userId) {
        return res.status(401).json({ success: false, message: "Unauthorized" });
      }

      const deleted = await notificationService.deleteNotification(id, userId);
      if (!deleted) {
        return res.status(404).json({ success: false, message: "Notification not found" });
      }

      return res.status(200).json({
        success: true,
        message: "Notification deleted successfully",
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message || "Failed to delete notification",
      });
    }
  };
}

export default new NotificationController();
