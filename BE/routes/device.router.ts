import { Router } from 'express';
import deviceController from '../controllers/device.controller';

const router = Router();

// POST /devices
router.post('/', deviceController.createDevice);

// GET /devices/unassigned
router.get('/unassigned', deviceController.getUnassignedDevices);

// GET /devices
router.get('/', deviceController.getAllDevices);

// GET /devices/:id
router.get('/:id', deviceController.getDeviceById);

// DELETE /devices/:id
router.delete('/:id', deviceController.deleteDevice);

// POST /devices/:id/toggle
router.post('/:id/toggle', deviceController.toggleDevice);

export default router;
