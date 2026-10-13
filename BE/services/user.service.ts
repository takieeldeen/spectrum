import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import UserModel from '../models/user.model';
import emailService from './email.service';
import { IUser, UserLanguage, UserTheme } from '../types/user.type';

export interface SignupDTO {
  name: string;
  email: string;
  password: string;
  passwordConfirmation: string;
  language?: UserLanguage;
  theme?: UserTheme;
  phoneNumber?: string;
  imageUrl?: string;
}

export interface LoginDTO {
  email: string;
  password: string;
}

export interface LoginResult {
  accessToken: string;
  user: IUser;
}

export class UserService {
  /**
   * Authenticates user with email and password and returns JWT accessToken
   * @param credentials Login credentials (email, password)
   * @returns JWT accessToken and user object
   */
  async login(credentials: LoginDTO): Promise<LoginResult> {
    const { email, password } = credentials;

    if (!email || !password) {
      throw new Error('Email and password are required');
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await UserModel.findOne({ email: normalizedEmail }).select('+password');

    if (!user) {
      throw new Error('Invalid email or password');
    }

    if (user.status === 'INACTIVE' || user.status === 'PENDING') {
      throw new Error('Account is not activated. Please check your email to activate your account.');
    }

    if (user.status === 'SUSPENDED') {
      throw new Error('Account is suspended. Please contact support.');
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      throw new Error('Invalid email or password');
    }

    user.lastLogin = new Date();
    await user.save();

    const secret = process.env.JWT_SECRET || 'spectrum_jwt_super_secret_key_2026_xyz!';
    const expiresIn = (process.env.JWT_EXPIRES_IN || '7d') as any;

    const payload = {
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      status: user.status,
    };

    const accessToken = jwt.sign(payload, secret, { expiresIn });

    return {
      accessToken,
      user,
    };
  }

  /**
   * Registers a new user account with activation token and sends a localized email
   * @param data Signup credentials and profile information
   * @returns The created user document
   */
  async signup(data: SignupDTO): Promise<IUser> {
    const { name, email, password, passwordConfirmation, language = 'ar', theme = 'dark', phoneNumber, imageUrl } = data;

    // 1. First check password and confirmation
    if (!password || !passwordConfirmation) {
      throw new Error('Password and password confirmation are required');
    }

    if (password !== passwordConfirmation) {
      throw new Error('Password and password confirmation do not match');
    }

    if (password.length < 6) {
      throw new Error('Password must be at least 6 characters long');
    }

    if (!name || name.trim().length === 0) {
      throw new Error('Name is required');
    }

    if (!email || email.trim().length === 0) {
      throw new Error('Email is required');
    }

    // 2. Second check if the email already exists
    const normalizedEmail = email.toLowerCase().trim();
    const existingUser = await UserModel.findOne({ email: normalizedEmail });

    if (existingUser) {
      throw new Error('Email is already registered');
    }

    // 3. Generate a long random activation token and token expiration of next hour
    const activationToken = crypto.randomBytes(32).toString('hex');
    const activationTokenExpiration = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now

    // 4. Create new user with status INACTIVE
    const user = new UserModel({
      name: name.trim(),
      email: normalizedEmail,
      password,
      status: 'INACTIVE',
      language,
      theme,
      phoneNumber: phoneNumber?.trim() || null,
      imageUrl: imageUrl || null,
      activationToken,
      activationTokenExpiration,
    });

    await user.save();

    // 5. Send formatted, localized email with the activation token
    try {
      await emailService.sendActivationEmail({
        to: user.email,
        name: user.name,
        token: activationToken,
        language: user.language,
      });
    } catch (emailError: any) {
      console.error(`⚠️ Failed to send activation email to ${user.email}:`, emailError.message);
      // We don't fail the signup if the email transport has a network issue, but we log it
    }

    return user;
  }

  /**
   * Activates a user account using the provided activation token
   * @param token The activation token sent via email
   * @returns The activated user document
   */
  async activateAccount(token: string): Promise<IUser> {
    if (!token) {
      throw new Error('Activation token is required');
    }

    const user = await UserModel.findOne({
      activationToken: token,
      activationTokenExpiration: { $gt: new Date() },
    }).select('+activationToken');

    if (!user) {
      throw new Error('Invalid or expired activation token');
    }

    user.status = 'ACTIVE';
    user.activationToken = undefined;
    user.activationTokenExpiration = undefined;

    await user.save();
    return user;
  }

  /**
   * Finds a user by ID
   */
  async getUserById(id: string): Promise<IUser | null> {
    return await UserModel.findById(id);
  }

  /**
   * Finds a user by email
   */
  async getUserByEmail(email: string): Promise<IUser | null> {
    return await UserModel.findOne({ email: email.toLowerCase().trim() });
  }

  /**
   * Resends invitation/activation email to a user with INACTIVE status.
   * Checks if user has INACTIVE status, regenerates activationToken with a new expiration,
   * saves user document, and sends activation email.
   * @param emailOrId User email or ID
   */
  async resendInvitation(emailOrId: string): Promise<IUser> {
    if (!emailOrId || emailOrId.trim().length === 0) {
      throw new Error('Email or User ID is required');
    }

    const trimmed = emailOrId.trim();
    let user: IUser | null = null;

    if (trimmed.includes('@')) {
      user = await UserModel.findOne({ email: trimmed.toLowerCase() }).select('+activationToken');
    } else if (mongoose.Types.ObjectId.isValid(trimmed) && trimmed.length === 24) {
      user = await UserModel.findById(trimmed).select('+activationToken');
    }

    if (!user) {
      user = await UserModel.findOne({ activationToken: trimmed }).select('+activationToken');
    }

    if (!user) {
      throw new Error('User not found');
    }

    if (user.status !== 'INACTIVE') {
      throw new Error('User is not in INACTIVE status');
    }

    const token = user.resendInvitation();

    await user.save();

    try {
      await emailService.sendActivationEmail({
        to: user.email,
        name: user.name,
        token,
        language: user.language,
      });
    } catch (emailError: any) {
      console.error(`⚠️ Failed to resend activation email to ${user.email}:`, emailError.message);
    }

    return user;
  }

  /**
   * Updates profile information for a user
   */
  async updateProfile(
    userId: string,
    data: {
      name?: string;
      phoneNumber?: string | null;
      language?: UserLanguage;
      theme?: UserTheme;
      imageUrl?: string | null;
    }
  ): Promise<IUser> {
    const user = await UserModel.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    if (data.name !== undefined) user.name = data.name.trim();
    if (data.phoneNumber !== undefined) user.phoneNumber = data.phoneNumber ? data.phoneNumber.trim() : null;
    if (data.language !== undefined) user.language = data.language;
    if (data.theme !== undefined) user.theme = data.theme;
    if (data.imageUrl !== undefined) user.imageUrl = data.imageUrl;

    await user.save();
    return user;
  }

  /**
   * Changes password for a user after verifying current password
   */
  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    const user = await UserModel.findById(userId).select('+password');
    if (!user) {
      throw new Error('User not found');
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      throw new Error('Current password is incorrect');
    }

    if (!newPassword || newPassword.length < 8) {
      throw new Error('New password must be at least 8 characters long');
    }

    user.password = newPassword;
    user.lastPasswordChange = new Date();
    await user.save();
  }
}

export default new UserService();
