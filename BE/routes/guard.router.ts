import { Router } from "express";
import guardController from "../controllers/guard.controller";

const router = Router();

// GET /guards
router.get("/", guardController.getAllGuards);

// POST /guards
router.post("/", guardController.createGuard);

// GET /guards/device/:deviceId
router.get("/device/:deviceId", guardController.getGuardsByDeviceId);

// PATCH /guards/:id
router.patch("/:id", guardController.updateGuard);

// DELETE /guards/:id
router.delete("/:id", guardController.deleteGuard);

// PATCH /guards/:id/toggle
router.patch("/:id/toggle", guardController.toggleGuard);

export default router;
