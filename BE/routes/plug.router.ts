import { Router } from "express";
import plugController from "../controllers/plug.controller";
import authenticatedOnly from "../middlewares/auth.middleware";

const router = Router();
router.use(authenticatedOnly);

// POST /plugs
router.post("/", plugController.createPlug);

// GET /plugs
router.get("/", plugController.getAllPlugs);

// GET /plugs/:plugId
router.get("/:plugId", plugController.getPlugById);

// PUT /plugs/:id
router.put("/:id", plugController.updatePlug);

// POST /plugs/:id/toggle
router.post("/:id/toggle", plugController.toggleOutlet);

export default router;
