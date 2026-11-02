import { Router } from 'express';
import authController from '../controllers/auth.controller';
import { authenticatedOnly } from '../guards/auth.guard';

const router = Router();

// POST /auth/signup
router.post('/signup', authController.signup);

// POST /auth/activate
router.post('/activate', authController.activateAccount);
router.get('/activate', authController.activateAccount);

// POST /auth/activate-code
router.post('/activate-code', authController.activateAccountWithCode);

// POST /auth/resend-invitation
router.post('/resend-invitation', authController.resendInvitation);

// POST /auth/login
router.post('/login', authController.login);

// POST /auth/send-otp
router.post('/send-otp', authController.sendOTP);

// POST /auth/check-otp
router.post('/check-otp', authController.checkOTP);

// POST /auth/reset-password
router.post('/reset-password', authController.resetPassword);

// POST /auth/forget-password (alias for send-otp)
router.post('/forget-password', authController.forgetPassword);

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
