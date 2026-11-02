import crypto from 'crypto';
import bcrypt from 'bcryptjs';
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

export class AuthError extends Error {
  code: string;
  data?: any;

  constructor(message: string, code: string, data?: any) {
    super(message);
    this.name = 'AuthError';
    this.code = code;
    this.data = data;
    Object.setPrototypeOf(this, AuthError.prototype);
  }
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
      throw new AuthError('Email and password are required', 'MISSING_CREDENTIALS');
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await UserModel.findOne({ email: normalizedEmail }).select('+password');

    if (!user) {
      throw new AuthError('Invalid email or password', 'INVALID_CREDENTIALS');
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      throw new AuthError('Invalid email or password', 'INVALID_CREDENTIALS');
    }

    if (user.status === 'INACTIVE' || user.status === 'PENDING') {
      throw new AuthError(
        'Account is not activated. Please check your email to activate your account.',
        'ACCOUNT_INACTIVE',
        { email: user.email, status: user.status }
      );
    }

    if (user.status === 'SUSPENDED') {
      throw new AuthError('Account is suspended. Please contact support.', 'ACCOUNT_SUSPENDED', {
        email: user.email,
        status: user.status,
      });
    }

    user.lastLogin = new Date();
    await user.save();

    const accessToken = this.generateAuthToken(user);

    return {
      accessToken,
      user,
    };
  }

  /**
   * Helper method to generate standard JWT auth access token
   */
  private generateAuthToken(user: IUser): string {
    const secret = process.env.JWT_SECRET || 'spectrum_jwt_super_secret_key_2026_xyz!';
    const expiresIn = (process.env.JWT_EXPIRES_IN || '7d') as any;

    const payload = {
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      status: user.status,
    };

    return jwt.sign(payload, secret, { expiresIn });
  }

  /**
   * Registers a new user account with activation token and 6-digit code, then sends a localized email
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

    // 3. Generate a secure activation token and 6-digit mobile verification code
    const activationToken = crypto.randomBytes(32).toString('hex');
    const activationCode = Math.floor(100000 + Math.random() * 900000).toString();
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
      activationCode,
      activationTokenExpiration,
    });

    await user.save();

    // 5. Send formatted, localized email with the activation token and code
    try {
      await emailService.sendActivationEmail({
        to: user.email,
        name: user.name,
        token: activationToken,
        code: activationCode,
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
   * @returns The activated user document and JWT accessToken
   */
  async activateAccount(token: string): Promise<{ user: IUser; accessToken: string }> {
    if (!token) {
      throw new Error('Activation token is required');
    }

    const user = await UserModel.findOne({
      activationToken: token,
      activationTokenExpiration: { $gt: new Date() },
    }).select('+activationToken +activationCode');

    if (!user) {
      throw new Error('Invalid or expired activation token');
    }

    user.status = 'ACTIVE';
    user.activationToken = undefined;
    user.activationCode = undefined;
    user.activationTokenExpiration = undefined;

    await user.save();

    const accessToken = this.generateAuthToken(user);
    return { user, accessToken };
  }

  /**
   * Activates a user account using the 6-digit verification code sent via email
   * @param email User email
   * @param code 6-digit verification code
   * @returns The activated user document and JWT accessToken
   */
  async activateAccountWithCode(
    email: string,
    code: string,
  ): Promise<{ user: IUser; accessToken: string }> {
    if (!email || !code) {
      throw new Error('Email and verification code are required');
    }

    const normalizedEmail = email.toLowerCase().trim();
    const cleanCode = code.trim();

    const user = await UserModel.findOne({
      email: normalizedEmail,
      activationCode: cleanCode,
      activationTokenExpiration: { $gt: new Date() },
    }).select('+activationToken +activationCode');

    if (!user) {
      throw new Error('Invalid or expired verification code');
    }

    user.status = 'ACTIVE';
    user.activationToken = undefined;
    user.activationCode = undefined;
    user.activationTokenExpiration = undefined;

    await user.save();

    const accessToken = this.generateAuthToken(user);
    return { user, accessToken };
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
   * Checks if user has INACTIVE status, regenerates activationToken & activationCode with a new expiration,
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
      user = await UserModel.findOne({ email: trimmed.toLowerCase() }).select('+activationToken +activationCode');
    } else if (mongoose.Types.ObjectId.isValid(trimmed) && trimmed.length === 24) {
      user = await UserModel.findById(trimmed).select('+activationToken +activationCode');
    }

    if (!user) {
      user = await UserModel.findOne({ activationToken: trimmed }).select('+activationToken +activationCode');
    }

    if (!user) {
      throw new Error('User not found');
    }

    if (user.status !== 'INACTIVE') {
      throw new Error('User is not in INACTIVE status');
    }

    const { token, code } = user.resendInvitation();

    await user.save();

    try {
      await emailService.sendActivationEmail({
        to: user.email,
        name: user.name,
        token,
        code,
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
      email?: string;
      phoneNumber?: string | null;
      language?: UserLanguage;
      theme?: UserTheme;
      imageUrl?: string | null;
      kwhCost?: number;
      monthlyBudget?: number;
      overBudgetAlertEnabled?: boolean;
      budgetAlertPercent?: number;
      powerUnit?: 'W' | 'kW';
    }
  ): Promise<IUser> {
    const user = await UserModel.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    if (data.name !== undefined) user.name = data.name.trim();

    if (data.email !== undefined) {
      const trimmedEmail = data.email.toLowerCase().trim();
      if (trimmedEmail !== user.email) {
        const existing = await UserModel.findOne({
          email: trimmedEmail,
          _id: { $ne: userId },
        });
        if (existing) {
          throw new Error('Email is already in use');
        }
        user.email = trimmedEmail;
      }
    }

    if (data.phoneNumber !== undefined) user.phoneNumber = data.phoneNumber ? data.phoneNumber.trim() : null;
    if (data.language !== undefined) user.language = data.language;
    if (data.theme !== undefined) user.theme = data.theme;
    if (data.imageUrl !== undefined) user.imageUrl = data.imageUrl;
    if (data.kwhCost !== undefined) user.kwhCost = data.kwhCost;
    if (data.monthlyBudget !== undefined) user.monthlyBudget = data.monthlyBudget;
    if (data.overBudgetAlertEnabled !== undefined) user.overBudgetAlertEnabled = data.overBudgetAlertEnabled;
    if (data.budgetAlertPercent !== undefined) user.budgetAlertPercent = data.budgetAlertPercent;
    if (data.powerUnit !== undefined) user.powerUnit = data.powerUnit;

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

  /**
   * Step 1 — sendOTP
   * - Generate a cryptographically secure 6-digit OTP.
   * - Hash it and store the hash in user.OTP.
   * - Set user.OTPExpiration to the current time + 10 minutes.
   * - Reset user.OTPChecked to false.
   * - Email the plaintext OTP to the user.
   */
  async sendOTP(email: string): Promise<{ message: string }> {
    if (!email) {
      throw new Error('Email is required');
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await UserModel.findOne({ email: normalizedEmail }).select('+password +OTP');

    if (!user) {
      throw new Error('User with this email does not exist');
    }

    // Generate a cryptographically secure 6-digit OTP (100000 to 999999)
    const plainOtp = crypto.randomInt(100000, 1000000).toString();

    // Hash it and store the hash in user.OTP
    const salt = await bcrypt.genSalt(10);
    const hashedOTP = await bcrypt.hash(plainOtp, salt);

    user.OTP = hashedOTP;
    user.OTPExpiration = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    user.OTPChecked = false;
    await user.save();

    // Email the plaintext OTP to the user
    await emailService.sendForgotPasswordMail({
      to: normalizedEmail,
      code: plainOtp,
      name: user.name,
      expirationMinutes: 10,
    });

    return {
      message: 'Reset email sent successfully',
    };
  }

  /**
   * Step 2 — checkOTP
   * - Compare the submitted OTP against the stored hash.
   * - Check that the OTP has not expired.
   * - If valid, set OTPChecked = true.
   * - Return success.
   */
  async checkOTP(email: string, otp: string): Promise<{ message: string }> {
    if (!email) {
      throw new Error('Email is required');
    }
    if (!otp) {
      throw new Error('OTP is required');
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await UserModel.findOne({ email: normalizedEmail }).select('+OTP');

    if (!user) {
      throw new Error('User with this email does not exist');
    }

    if (!user.OTP) {
      throw new Error('No OTP found or OTP already used');
    }

    // Check that the OTP has not expired
    if (!user.OTPExpiration || new Date() > new Date(user.OTPExpiration)) {
      throw new Error('OTP has expired');
    }

    // Compare the submitted OTP against the stored hash
    const isMatch = await bcrypt.compare(otp.trim(), user.OTP);
    if (!isMatch) {
      throw new Error('Invalid OTP');
    }

    // If valid, set OTPChecked = true
    user.OTPChecked = true;
    await user.save();

    return {
      message: 'OTP verified successfully',
    };
  }

  /**
   * Step 3 — resetPassword
   * - Validate the new password and confirmation.
   * - First check the validity of OTP (Not the expiration).
   * - Second check that OTP verification succeeded (OTPChecked is true).
   * - Update the password.
   * - Clear OTP, set OTPChecked = false, and set OTPExpiration = null.
   */
  async resetPassword(payload: {
    email: string;
    otp: string;
    newPassword?: string;
    password?: string;
    passwordConfirmation?: string;
    confirmPassword?: string;
  }): Promise<{ message: string }> {
    const { email, otp } = payload;
    const newPassword = payload.newPassword || payload.password;
    const passwordConfirmation = payload.passwordConfirmation || payload.confirmPassword;

    if (!email) {
      throw new Error('Email is required');
    }
    if (!otp) {
      throw new Error('OTP is required');
    }
    if (!newPassword) {
      throw new Error('New password is required');
    }
    if (!passwordConfirmation) {
      throw new Error('Password confirmation is required');
    }
    if (newPassword !== passwordConfirmation) {
      throw new Error('Passwords do not match');
    }
    if (newPassword.length < 6) {
      throw new Error('Password must be at least 6 characters long');
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await UserModel.findOne({ email: normalizedEmail }).select('+password +OTP');

    if (!user) {
      throw new Error('User with this email does not exist');
    }

    if (!user.OTP) {
      throw new Error('No OTP found or OTP already used');
    }

    // First: the validity of OTP (Not the expiration)
    const isMatch = await bcrypt.compare(otp.trim(), user.OTP);
    if (!isMatch) {
      throw new Error('Invalid OTP');
    }

    // Second: require that OTP verification succeeded (OTPChecked is true)
    if (!user.OTPChecked) {
      throw new Error('OTP verification required');
    }

    // Update the password (pre-save hook will hash it and update lastPasswordChange)
    user.password = newPassword;

    // Clear OTP, set OTPChecked = false, and set OTPExpiration = null
    user.OTP = null;
    user.OTPChecked = false;
    user.OTPExpiration = null;

    await user.save();

    return {
      message: 'Password reset successfully',
    };
  }

  /**
   * Alias for sendOTP (backward compatibility)
   */
  async forgetPassword(email: string): Promise<{ message: string }> {
    return this.sendOTP(email);
  }
}

export default new UserService();
