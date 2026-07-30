import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { ApiError } from '../utils/api-error';
import { logger } from '../utils/logger';
import { Prisma } from '@prisma/client';

/**
 * Global error handler middleware
 * Must be registered LAST in the middleware chain
 */
export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Already sent response
  if (res.headersSent) {
    return;
  }

  // ApiError (operational errors)
  if (err instanceof ApiError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
      ...(err.errors && { errors: err.errors }),
    });
    return;
  }

  // Zod validation errors
  if (err instanceof ZodError) {
    const errors: Record<string, string[]> = {};
    err.errors.forEach((e) => {
      const path = e.path.join('.');
      if (!errors[path]) errors[path] = [];
      errors[path].push(e.message);
    });

    res.status(422).json({
      success: false,
      message: 'Validation failed',
      errors,
    });
    return;
  }

  // Prisma errors
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    handlePrismaError(err, res);
    return;
  }

  if (err instanceof Prisma.PrismaClientValidationError) {
    logger.error({ error: err.message }, 'Prisma validation error');
    res.status(400).json({
      success: false,
      message: 'Invalid data provided',
    });
    return;
  }

  // JWT errors
  if (err.name === 'TokenExpiredError') {
    res.status(401).json({
      success: false,
      message: 'Token has expired',
    });
    return;
  }

  if (err.name === 'JsonWebTokenError') {
    res.status(401).json({
      success: false,
      message: 'Invalid token',
    });
    return;
  }

  // Multer errors (file upload)
  if (err.name === 'MulterError') {
    const multerErr = err as any;
    let message = 'File upload error';
    if (multerErr.code === 'LIMIT_FILE_SIZE') {
      message = 'File size exceeds the maximum allowed limit';
    } else if (multerErr.code === 'LIMIT_UNEXPECTED_FILE') {
      message = 'Unexpected file field';
    }
    res.status(400).json({
      success: false,
      message,
    });
    return;
  }

  // Unexpected errors
  logger.error(
    {
      error: err.message,
      stack: err.stack,
      path: req.path,
      method: req.method,
      ip: req.ip,
    },
    '❌ Unhandled error'
  );

  res.status(500).json({
    success: false,
    message:
      process.env.NODE_ENV === 'production'
        ? 'An unexpected error occurred'
        : err.message,
  });
}

function handlePrismaError(
  err: Prisma.PrismaClientKnownRequestError,
  res: Response
): void {
  switch (err.code) {
    case 'P2002': {
      // Unique constraint violation
      const target = (err.meta?.target as string[]) || [];
      const field = target.length > 0 ? target.join(', ') : 'field';
      res.status(409).json({
        success: false,
        message: `A record with this ${field} already exists`,
      });
      return;
    }
    case 'P2003': {
      // Foreign key constraint violation
      res.status(400).json({
        success: false,
        message: 'Referenced record does not exist',
      });
      return;
    }
    case 'P2025': {
      // Record not found
      res.status(404).json({
        success: false,
        message: 'Record not found',
      });
      return;
    }
    default: {
      logger.error({ code: err.code, meta: err.meta }, 'Prisma error');
      res.status(500).json({
        success: false,
        message: 'A database error occurred',
      });
    }
  }
}
