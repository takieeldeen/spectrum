import { Request, Response } from 'express';
import userService from '../services/user.service';

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

      const { name, phoneNumber, language, theme, imageUrl } = req.body;
      const updatedUser = await userService.updateProfile(userId, {
        name,
        phoneNumber,
        language,
        theme,
        imageUrl,
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
