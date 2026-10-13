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

// PATCH /auth/profile (Protected route)
router.patch('/profile', authenticatedOnly, authController.updateProfile);

// POST /auth/change-password (Protected route)
router.post('/change-password', authenticatedOnly, authController.changePassword);

export default router;
