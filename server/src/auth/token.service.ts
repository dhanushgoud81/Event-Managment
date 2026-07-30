import { prisma } from '../config/database';
import { ApiError } from '../utils/api-error';
import { hashToken } from '../utils/hash';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  parseExpiry,
  TokenPayload,
} from '../utils/jwt';
import { config } from '../config';
import { logger } from '../utils/logger';

export class TokenService {
  /**
   * Generates a new access and refresh token pair, and stores the refresh token in the DB.
   */
  async generateTokenPair(
    user: { id: string; email: string; role: any; isActive: boolean },
    ipAddress?: string,
    userAgent?: string
  ) {
    if (!user.isActive) {
      throw ApiError.unauthorized('Account has been deactivated');
    }

    const tokenPayload: TokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    // Store refresh token hash in DB
    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: hashToken(refreshToken),
        deviceInfo: userAgent || null,
        ipAddress: ipAddress || null,
        expiresAt: new Date(Date.now() + parseExpiry(config.jwt.refreshExpiry)),
      },
    });

    return {
      accessToken,
      refreshToken,
    };
  }

  /**
   * Refreshes an access token using a valid refresh token.
   */
  async refreshAccessToken(refreshToken: string) {
    // Verify the refresh token
    let decoded;
    try {
      decoded = verifyRefreshToken(refreshToken);
    } catch {
      throw ApiError.unauthorized('Invalid or expired refresh token');
    }

    const tokenHash = hashToken(refreshToken);

    // Find the stored token
    const storedToken = await prisma.refreshToken.findFirst({
      where: {
        userId: decoded.userId,
        tokenHash,
        isRevoked: false,
        expiresAt: { gt: new Date() },
      },
    });

    if (!storedToken) {
      // Token reuse detected — revoke all tokens for this user
      await this.revokeAllTokensForUser(decoded.userId);

      logger.warn(
        { userId: decoded.userId },
        '⚠️ Refresh token reuse detected — all tokens revoked'
      );
      throw ApiError.unauthorized('Token has been revoked. Please login again.');
    }

    // Revoke the old refresh token (rotation)
    await prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: { isRevoked: true },
    });

    // Get current user data
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, email: true, role: true, isActive: true },
    });

    if (!user) {
      throw ApiError.unauthorized('User not found');
    }

    // Generate new token pair with same deviceInfo/ipAddress as the original token
    return this.generateTokenPair(user, storedToken.ipAddress || undefined, storedToken.deviceInfo || undefined);
  }

  /**
   * Revokes a specific refresh token.
   */
  async revokeToken(refreshToken: string, userId: string) {
    const tokenHash = hashToken(refreshToken);

    await prisma.refreshToken.updateMany({
      where: {
        userId,
        tokenHash,
        isRevoked: false,
      },
      data: {
        isRevoked: true,
      },
    });
  }

  /**
   * Revokes all refresh tokens for a user.
   */
  async revokeAllTokensForUser(userId: string, tx?: any) {
    const dbClient = tx || prisma;
    await dbClient.refreshToken.updateMany({
      where: { userId },
      data: { isRevoked: true },
    });
  }
}

export const tokenService = new TokenService();
