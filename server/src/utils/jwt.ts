import jwt, { JwtPayload, SignOptions } from 'jsonwebtoken';
import { config } from '../config';
import { UserRole } from '@prisma/client';

export interface TokenPayload {
  userId: string;
  email: string;
  role: UserRole;
}

export interface DecodedToken extends JwtPayload, TokenPayload {}

export function generateAccessToken(payload: TokenPayload): string {
  const options: SignOptions = {
    expiresIn: config.jwt.accessExpiry as any,
    issuer: config.appName,
    subject: payload.userId,
  };

  return jwt.sign(payload, config.jwt.accessSecret, options);
}

export function generateRefreshToken(payload: TokenPayload): string {
  const options: SignOptions = {
    expiresIn: config.jwt.refreshExpiry as any,
    issuer: config.appName,
    subject: payload.userId,
  };

  return jwt.sign(payload, config.jwt.refreshSecret, options);
}

export function verifyAccessToken(token: string): DecodedToken {
  return jwt.verify(token, config.jwt.accessSecret, {
    issuer: config.appName,
  }) as DecodedToken;
}

export function verifyRefreshToken(token: string): DecodedToken {
  return jwt.verify(token, config.jwt.refreshSecret, {
    issuer: config.appName,
  }) as DecodedToken;
}

export function decodeToken(token: string): DecodedToken | null {
  try {
    return jwt.decode(token) as DecodedToken;
  } catch {
    return null;
  }
}

/**
 * Parse expiry string (e.g., "15m", "7d", "1h") to milliseconds
 */
export function parseExpiry(expiry: string): number {
  const match = expiry.match(/^(\d+)([smhd])$/);
  if (!match) throw new Error(`Invalid expiry format: ${expiry}`);

  const value = parseInt(match[1], 10);
  const unit = match[2];

  const multipliers: Record<string, number> = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
  };

  return value * multipliers[unit];
}
