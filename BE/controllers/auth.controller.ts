import { Request, Response } from 'express';
import userService from '../services/user.service';
import s3Service from '../services/s3.service';

export class AuthController {
  /**
   * Handles user signup request
   */
  signup = async (req: Request, res: Response) => {
    try {
      const {
        name,
        email,
        password,
        passwordConfirmation,
        language,
        theme,
        phoneNumber,
        imageUrl,
      } = req.body;

      const user = await userService.signup({
        name,
        email,
        password,
        passwordConfirmation,
        language,
        theme,
        phoneNumber,
        imageUrl,
      });

      return res.status(201).json({
        success: true,
        message: 'User registered successfully. Please check your email to activate your account.',
        data: user,
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        message: error.message || 'An error occurred during sign up.',
      });
    }
  };

  /**
   * Handles user account activation request
   */
  activateAccount = async (req: Request, res: Response) => {
    try {
      const token = (req.body?.token || req.query?.token || req.params?.token) as string;

      if (!token) {
        return res.status(400).json({
          success: false,
          message: 'Activation token is required',
        });
      }

      const user = await userService.activateAccount(token);

      return res.status(200).json({
        success: true,
        message: 'Account activated successfully.',
        data: user,
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        message: error.message || 'Failed to activate account.',
      });
    }
  };

  /**
   * Handles resending user invitation / activation email
   */
  resendInvitation = async (req: Request, res: Response) => {
    try {
      const emailOrId = (req.body?.email || req.body?.identifier || req.body?.id) as string;

      if (!emailOrId) {
        return res.status(400).json({
          success: false,
          message: 'Email is required',
        });
      }

      const user = await userService.resendInvitation(emailOrId);

      return res.status(200).json({
        success: true,
        message: 'Activation invitation resent successfully. Please check your email.',
        data: user,
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        message: error.message || 'Failed to resend invitation.',
      });
    }
  };

  /**
   * Handles user login request and returns JWT access token
   */
  login = async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Email and password are required',
        });
      }

      const result = await userService.login({ email, password });

      return res.status(200).json({
        success: true,
        message: 'Logged in successfully',
        data: result,
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        message: error.message || 'Login failed',
      });
    }
  };

  /**
   * Returns current authenticated user profile
   */
  getMe = async (req: Request, res: Response) => {
    return res.status(200).json({
      success: true,
      data: req.user,
    });
  };

  /**
   * Updates profile details for the authenticated user
   */
  updateProfile = async (req: Request, res: Response) => {
    try {
      const userId = req.user?._id?.toString() || req.userId;
      if (!userId) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
      }

      const {
        name,
        email,
        phoneNumber,
        language,
        theme,
        imageUrl,
        kwhCost,
        monthlyBudget,
        overBudgetAlertEnabled,
        budgetAlertPercent,
        powerUnit,
      } = req.body;
      const updatedUser = await userService.updateProfile(userId, {
        name,
        email,
        phoneNumber,
        language,
        theme,
        imageUrl,
        kwhCost: kwhCost !== undefined ? Number(kwhCost) : undefined,
        monthlyBudget: monthlyBudget !== undefined ? Number(monthlyBudget) : undefined,
        overBudgetAlertEnabled:
          overBudgetAlertEnabled !== undefined
            ? Boolean(overBudgetAlertEnabled)
            : undefined,
        budgetAlertPercent:
          budgetAlertPercent !== undefined ? Number(budgetAlertPercent) : undefined,
        powerUnit,
      });

      return res.status(200).json({
        success: true,
        message: 'Profile updated successfully',
        data: updatedUser,
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        message: error.message || 'Failed to update profile',
      });
    }
  };

  /**
   * Uploads avatar picture to S3 (or local fallback)
   */
  uploadAvatar = async (req: Request, res: Response) => {
    try {
      const userId = req.user?._id?.toString() || req.userId;
      if (!userId) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
      }

      let buffer: Buffer | null = null;
      let mimeType = 'image/jpeg';
      let ext = 'jpg';

      if (req.file) {
        buffer = req.file.buffer;
        mimeType = req.file.mimetype;
        const rawExt = req.file.originalname?.split('.').pop()?.toLowerCase();
        if (rawExt && ['jpg', 'jpeg', 'png', 'webp'].includes(rawExt)) {
          ext = rawExt === 'jpeg' ? 'jpg' : rawExt;
        } else if (mimeType) {
          const mimeExt = mimeType.split('/')[1]?.toLowerCase();
          ext = mimeExt === 'jpeg' ? 'jpg' : (mimeExt || 'jpg');
        }
      } else if (req.body?.image) {
        const imageString = req.body.image as string;
        if (imageString.startsWith('data:')) {
          const matches = imageString.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
          if (matches && matches.length === 3) {
            mimeType = matches[1];
            buffer = Buffer.from(matches[2], 'base64');
            const mimeExt = mimeType.split('/')[1]?.toLowerCase();
            ext = mimeExt === 'jpeg' ? 'jpg' : (mimeExt || 'jpg');
          } else {
            return res.status(400).json({ success: false, message: 'Invalid base64 image data' });
          }
        } else {
          buffer = Buffer.from(imageString, 'base64');
          if (req.body.mimeType) {
            mimeType = req.body.mimeType;
            const mimeExt = mimeType.split('/')[1]?.toLowerCase();
            ext = mimeExt === 'jpeg' ? 'jpg' : (mimeExt || 'jpg');
          }
        }
      }

      if (!buffer) {
        return res.status(400).json({ success: false, message: 'No image file or base64 provided' });
      }

      const fileName = `avatar-${userId}.${ext}`;

      // Get user's existing avatar url if any to delete old image/upsert cleanly
      const currentUser = await userService.getUserById(userId);
      const oldImageUrl = currentUser?.imageUrl;

      const imageUrl = await s3Service.uploadProfilePicture(
        buffer,
        fileName,
        mimeType,
        userId,
        oldImageUrl
      );

      // If requested, also update user's profile with this new avatar url
      if (req.query?.updateUser === 'true' || req.body?.updateUser) {
        await userService.updateProfile(userId, { imageUrl });
      }

      return res.status(200).json({
        success: true,
        message: 'Profile picture uploaded successfully',
        data: { imageUrl },
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        message: error.message || 'Failed to upload profile picture',
      });
    }
  };

  /**
   * Changes password for the authenticated user
   */
  changePassword = async (req: Request, res: Response) => {
    try {
      const userId = req.user?._id?.toString() || req.userId;
      if (!userId) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
      }

      const { currentPassword, newPassword } = req.body;
      if (!currentPassword || !newPassword) {
        return res.status(400).json({
          success: false,
          message: 'Current password and new password are required',
        });
      }

      await userService.changePassword(userId, currentPassword, newPassword);

      return res.status(200).json({
        success: true,
        message: 'Password changed successfully',
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        message: error.message || 'Failed to change password',
      });
    }
  };
}

export default new AuthController();
