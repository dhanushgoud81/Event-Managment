import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, DecodedToken } from '../utils/jwt';
import { ApiError } from '../utils/api-error';
import { prisma } from '../config/database';
import { logger } from '../utils/logger';

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: DecodedToken & { id: string };
    }
  }
}

/**
 * Authentication middleware - verifies JWT access token
 */
export async function authenticate(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw ApiError.unauthorized('Access token is required');
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      throw ApiError.unauthorized('Access token is required');
    }

    // Verify the token
    const decoded = verifyAccessToken(token);

    // Verify user still exists and is active
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        role: true,
        isActive: true,
        emailVerified: true,
      },
    });

    if (!user) {
      throw ApiError.unauthorized('User not found');
    }

    if (!user.isActive) {
      throw ApiError.unauthorized('Account has been deactivated');
    }

    // Attach user to request
    req.user = {
      ...decoded,
      id: user.id,
    };

    next();
  } catch (error: any) {
    if (error instanceof ApiError) {
      next(error);
      return;
    }

    if (error.name === 'TokenExpiredError') {
      next(ApiError.unauthorized('Access token has expired'));
      return;
    }

    if (error.name === 'JsonWebTokenError') {
      next(ApiError.unauthorized('Invalid access token'));
      return;
    }

    logger.error({ error }, 'Authentication error');
    next(ApiError.unauthorized('Authentication failed'));
  }
}

/**
 * Optional authentication - sets user if token is valid, but doesn't require it
 */
export async function optionalAuth(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.split(' ')[1];
    if (!token) return next();

    const decoded = verifyAccessToken(token);

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, email: true, role: true, isActive: true },
    });

    if (user && user.isActive) {
      req.user = { ...decoded, id: user.id };
    }

    next();
  } catch {
    // Silently ignore invalid tokens in optional auth
    next();
  }
}
