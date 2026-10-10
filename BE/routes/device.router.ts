import { Router } from 'express';
import deviceController from '../controllers/device.controller';

const router = Router();

// POST /devices
router.post('/', deviceController.createDevice);

// GET /devices
router.get('/', deviceController.getAllDevices);

// DELETE /devices/:id
router.delete('/:id', deviceController.deleteDevice);

export default router;
