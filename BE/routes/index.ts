import { Router } from 'express';
import plugRoute from './plug.router';
import deviceRoute from './device.router';

const router = Router();

// Mount all plug-related routes under /plugs
router.use('/plugs', plugRoute);
router.use('/devices', deviceRoute);

export default router;
