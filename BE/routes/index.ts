import { Router } from "express";
import plugRoute from "./plug.router";
import deviceRoute from "./device.router";
import guardRoute from "./guard.router";
import authRoute from "./auth.router";

const router = Router();

// Mount routes
router.use("/auth", authRoute);
router.use("/plugs", plugRoute);
router.use("/devices", deviceRoute);
router.use("/guards", guardRoute);

export default router;
