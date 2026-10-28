import { Router } from 'express';
import authController from '../controllers/auth.controller';
import { authenticatedOnly } from '../guards/auth.guard';

const router = Router();

// POST /auth/signup
router.post('/signup', authController.signup);

// POST /auth/activate
router.post('/activate', authController.activateAccount);

// POST /auth/resend-invitation
router.post('/resend-invitation', authController.resendInvitation);

// POST /auth/login
router.post('/login', authController.login);

// GET /auth/me (Protected route)
router.get('/me', authenticatedOnly, authController.getMe);

import multer from 'multer';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

// POST /auth/avatar (Protected route)
router.post('/avatar', authenticatedOnly, upload.single('file'), authController.uploadAvatar);

// PATCH /auth/profile (Protected route)
router.patch('/profile', authenticatedOnly, authController.updateProfile);

// POST /auth/change-password (Protected route)
router.post('/change-password', authenticatedOnly, authController.changePassword);

export default router;
