import { Router } from "express";
import wifiController from "../controllers/wifi.controller";
import authenticatedOnly from "../middlewares/auth.middleware";

const router = Router();
router.use(authenticatedOnly);

// POST /wifi
router.post("/", wifiController.createWifi);

// GET /wifi
router.get("/", wifiController.getWifiList);

export default router;
