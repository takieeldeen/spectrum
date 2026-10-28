import { Router } from "express";
import plugRoute from "./plug.router";
import deviceRoute from "./device.router";
import guardRoute from "./guard.router";
import authRoute from "./auth.router";
import analyticsRoute from "./analytics.router";
import notificationRoute from "./notification.router";
import wifiRoute from "./wifi.router";

const router = Router();

// Mount routes
router.use("/auth", authRoute);
router.use("/plugs", plugRoute);
router.use("/devices", deviceRoute);
router.use("/guards", guardRoute);
router.use("/analytics", analyticsRoute);
router.use("/notifications", notificationRoute);
router.use("/wifi", wifiRoute);

export default router;
