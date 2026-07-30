import { prisma } from '../config/database';
import { ApiError } from '../utils/api-error';
import { hashPassword, comparePassword, hashToken, generateSecureToken } from '../utils/hash';
import { generateReferralCode } from '../utils/generate-code';
import { sendVerificationEmail, sendPasswordResetEmail } from '../utils/email';
import { config } from '../config';
import { logger } from '../utils/logger';
import { logAudit } from '../middleware/audit.middleware';
import { tokenService } from './token.service';
import type {
  RegisterInput,
  LoginInput,
  ForgotPasswordInput,
  ResetPasswordInput,
  ChangePasswordInput,
} from './auth.validator';

export class AuthService {
  /**
   * Register a new user
   */
  async register(data: RegisterInput, ipAddress?: string) {
    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw ApiError.conflict('An account with this email already exists');
    }

    // Validate referral code if provided
    let referrerId: string | null = null;
    if (data.referralCode) {
      const referrer = await prisma.user.findUnique({
        where: { referralCode: data.referralCode },
      });

      if (!referrer) {
        throw ApiError.badRequest('Invalid referral code');
      }

      referrerId = referrer.id;
    }

    // Hash password
    const passwordHash = await hashPassword(data.password);

    // Generate unique referral code
    let referralCode = generateReferralCode();
    let codeExists = await prisma.user.findUnique({ where: { referralCode } });
    while (codeExists) {
      referralCode = generateReferralCode();
      codeExists = await prisma.user.findUnique({ where: { referralCode } });
    }

    // Generate email verification token
    const emailVerifyToken = generateSecureToken();
    const emailVerifyExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Create user with wallet in a transaction
    const user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          email: data.email,
          passwordHash,
          firstName: data.firstName,
          lastName: data.lastName,
          phone: data.phone,
          referralCode,
          emailVerifyToken: hashToken(emailVerifyToken),
          emailVerifyExpiry,
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          referralCode: true,
          emailVerified: true,
          createdAt: true,
        },
      });

      // Create wallet for the user
      await tx.wallet.create({
        data: {
          userId: newUser.id,
          balance: 0,
        },
      });

      return newUser;
    });

    // Send verification email (async, don't block)
    sendVerificationEmail(data.email, data.firstName, emailVerifyToken).catch((err) => {
      logger.error({ err, email: data.email }, 'Failed to send verification email');
    });

    // Log audit
    await logAudit(user.id, 'User', user.id, 'REGISTER', null, {
      email: user.email,
      referralCode: data.referralCode || null,
    });

    logger.info({ userId: user.id, email: user.email }, 'New user registered');

    return {
      user,
      message: 'Registration successful. Please check your email to verify your account.',
    };
  }

  /**
   * Login user
   */
  async login(data: LoginInput, ipAddress?: string, userAgent?: string) {
    const user = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (!user) {
      throw ApiError.unauthorized('Invalid email or password');
    }

    // Check if account is locked
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      const remainingMinutes = Math.ceil(
        (user.lockedUntil.getTime() - Date.now()) / (60 * 1000)
      );
      throw ApiError.tooManyRequests(
        `Account is locked. Try again in ${remainingMinutes} minutes`
      );
    }

    // Check if account is active
    if (!user.isActive) {
      throw ApiError.unauthorized('Account has been deactivated. Contact support.');
    }

    // Verify password
    const isPasswordValid = await comparePassword(data.password, user.passwordHash);

    if (!isPasswordValid) {
      // Increment failed attempts
      const newAttempts = user.failedLoginAttempts + 1;
      const updateData: any = { failedLoginAttempts: newAttempts };

      if (newAttempts >= config.security.maxLoginAttempts) {
        updateData.lockedUntil = new Date(
          Date.now() + config.security.lockTimeMinutes * 60 * 1000
        );
        logger.warn({ email: data.email, attempts: newAttempts }, 'Account locked due to failed attempts');
      }

      await prisma.user.update({
        where: { id: user.id },
        data: updateData,
      });

      const remaining = config.security.maxLoginAttempts - newAttempts;
      if (remaining > 0) {
        throw ApiError.unauthorized(
          `Invalid email or password. ${remaining} attempt(s) remaining`
        );
      } else {
        throw ApiError.tooManyRequests(
          `Account locked due to too many failed attempts. Try again in ${config.security.lockTimeMinutes} minutes`
        );
      }
    }

    // Reset failed attempts on successful login
    await prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginAttempts: 0,
        lockedUntil: null,
        lastLoginAt: new Date(),
      },
    });

    // Generate tokens via TokenService
    const tokens = await tokenService.generateTokenPair(
      { id: user.id, email: user.email, role: user.role, isActive: user.isActive },
      ipAddress,
      userAgent
    );

    // Log audit
    await logAudit(user.id, 'User', user.id, 'LOGIN', null, {
      ip: ipAddress,
      userAgent,
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        referralCode: user.referralCode,
        emailVerified: user.emailVerified,
        avatarUrl: user.avatarUrl,
      },
      ...tokens,
    };
  }

  /**
   * Logout user — revoke refresh token
   */
  async logout(refreshToken: string, userId: string) {
    await tokenService.revokeToken(refreshToken, userId);
    await logAudit(userId, 'User', userId, 'LOGOUT');
    return { message: 'Logged out successfully' };
  }

  /**
   * Refresh access token
   */
  async refreshAccessToken(refreshToken: string) {
    return tokenService.refreshAccessToken(refreshToken);
  }

  /**
   * Forgot password — send reset email
   */
  async forgotPassword(data: ForgotPasswordInput) {
    const user = await prisma.user.findUnique({
      where: { email: data.email },
    });

    // Always return success (don't reveal if email exists)
    if (!user) {
      return { message: 'If the email exists, a password reset link has been sent' };
    }

    const resetToken = generateSecureToken();
    const resetExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetToken: hashToken(resetToken),
        passwordResetExpiry: resetExpiry,
      },
    });

    // Send reset email
    sendPasswordResetEmail(data.email, user.firstName, resetToken).catch((err) => {
      logger.error({ err, email: data.email }, 'Failed to send password reset email');
    });

    await logAudit(user.id, 'User', user.id, 'FORGOT_PASSWORD', null, {
      email: data.email,
    });

    return { message: 'If the email exists, a password reset link has been sent' };
  }

  /**
   * Reset password using token
   */
  async resetPassword(data: ResetPasswordInput) {
    const tokenHash = hashToken(data.token);

    const user = await prisma.user.findFirst({
      where: {
        passwordResetToken: tokenHash,
        passwordResetExpiry: { gt: new Date() },
      },
    });

    if (!user) {
      throw ApiError.badRequest('Invalid or expired reset token');
    }

    const newPasswordHash = await hashPassword(data.password);

    await prisma.$transaction(async (tx) => {
      // Update password
      await tx.user.update({
        where: { id: user.id },
        data: {
          passwordHash: newPasswordHash,
          passwordResetToken: null,
          passwordResetExpiry: null,
          failedLoginAttempts: 0,
          lockedUntil: null,
        },
      });

      // Revoke all refresh tokens
      await tokenService.revokeAllTokensForUser(user.id, tx);
    });

    await logAudit(user.id, 'User', user.id, 'RESET_PASSWORD');

    return { message: 'Password has been reset successfully. Please login with your new password.' };
  }

  /**
   * Verify email
   */
  async verifyEmail(token: string) {
    const tokenHash = hashToken(token);

    const user = await prisma.user.findFirst({
      where: {
        emailVerifyToken: tokenHash,
        emailVerifyExpiry: { gt: new Date() },
      },
    });

    if (!user) {
      throw ApiError.badRequest('Invalid or expired verification token');
    }

    if (user.emailVerified) {
      return { message: 'Email is already verified' };
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        emailVerifyToken: null,
        emailVerifyExpiry: null,
      },
    });

    await logAudit(user.id, 'User', user.id, 'VERIFY_EMAIL');

    return { message: 'Email verified successfully' };
  }

  /**
   * Change password (authenticated)
   */
  async changePassword(userId: string, data: ChangePasswordInput) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw ApiError.notFound('User not found');
    }

    const isCurrentPasswordValid = await comparePassword(
      data.currentPassword,
      user.passwordHash
    );

    if (!isCurrentPasswordValid) {
      throw ApiError.badRequest('Current password is incorrect');
    }

    const newPasswordHash = await hashPassword(data.newPassword);

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: { passwordHash: newPasswordHash },
      });

      // Revoke all refresh tokens except current session
      await tokenService.revokeAllTokensForUser(userId, tx);
    });

    await logAudit(userId, 'User', userId, 'CHANGE_PASSWORD');

    return { message: 'Password changed successfully. Please login again.' };
  }
}

export const authService = new AuthService();
