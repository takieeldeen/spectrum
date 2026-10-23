import { Router } from "express";
import analyticsController from "../controllers/analytics.controller";
import { authenticatedOnly } from "../middlewares/auth.middleware";

const router = Router();

// Protected routes
router.use(authenticatedOnly);

router.get("/day", analyticsController.getDay.bind(analyticsController));
router.get("/week", analyticsController.getWeek.bind(analyticsController));
router.get("/month", analyticsController.getMonth.bind(analyticsController));
router.get("/breakdown", analyticsController.getBreakdown.bind(analyticsController));
router.get("/strips", analyticsController.getStripsSummary.bind(analyticsController));
router.post("/flush", analyticsController.triggerFlush.bind(analyticsController));
router.post("/rollup", analyticsController.triggerRollup.bind(analyticsController));

export default router;
