import { Router } from "express";
import notificationController from "../controllers/notification.controller";
import authenticatedOnly from "../middlewares/auth.middleware";

const router = Router();

// All notification routes require authentication
router.use(authenticatedOnly);

router.get("/", notificationController.getNotifications);
router.patch("/read-all", notificationController.markAllAsRead);
router.patch("/:id/read", notificationController.markAsRead);
router.delete("/:id", notificationController.deleteNotification);

export default router;
