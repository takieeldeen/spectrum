import { Router } from 'express';
import plugController from '../controllers/plug.controller';

const router = Router();

// POST /plugs
router.post('/', plugController.createPlug);

// GET /plugs
router.get('/', plugController.getAllPlugs);

// GET /plugs/:plugId
router.get('/:plugId', plugController.getPlugById);

// PUT /plugs/:id
router.put('/:id', plugController.updatePlug);

export default router;
