import rateLimit from 'express-rate-limit';
import { config } from '../config';
import { logger } from '../utils/logger';

/**
 * General API rate limiter
 * 100 requests per 15 minutes
 */
export const generalLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests, please try again later',
  },
  handler: (_req, res, _next, options) => {
    logger.warn({ ip: _req.ip }, 'Rate limit exceeded');
    res.status(429).json(options.message);
  },
  keyGenerator: (req) => {
    return req.ip || req.headers['x-forwarded-for']?.toString() || 'unknown';
  },
});

/**
 * Auth endpoints rate limiter (stricter)
 * 5 requests per 15 minutes
 */
export const authLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.authMax,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again later',
  },
  handler: (_req, res, _next, options) => {
    logger.warn({ ip: _req.ip, path: _req.path }, 'Auth rate limit exceeded');
    res.status(429).json(options.message);
  },
  keyGenerator: (req) => {
    return `auth:${req.ip || req.headers['x-forwarded-for']?.toString() || 'unknown'}`;
  },
});

/**
 * Sensitive operations rate limiter
 * 3 requests per 15 minutes (password reset, etc.)
 */
export const sensitiveLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests for this operation, please try again later',
  },
  keyGenerator: (req) => {
    return `sensitive:${req.ip || 'unknown'}:${req.path}`;
  },
});

/**
 * Payment operations rate limiter
 * 10 requests per 15 minutes
 */
export const paymentLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many payment requests, please try again later',
  },
  keyGenerator: (req) => {
    return `payment:${req.user?.userId || req.ip || 'unknown'}`;
  },
});
