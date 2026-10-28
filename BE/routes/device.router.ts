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

// PUT /devices/:id
router.put('/:id', deviceController.updateDevice);
router.patch('/:id', deviceController.updateDevice);

// DELETE /devices/:id
router.delete('/:id', deviceController.deleteDevice);

// POST /devices/:id/toggle
router.post('/:id/toggle', deviceController.toggleDevice);

// POST /devices/:id/timer     → set sleep timer
// DELETE /devices/:id/timer   → cancel sleep timer
router.post('/:id/timer', deviceController.setTimer);
router.delete('/:id/timer', deviceController.cancelTimer);

export default router;

