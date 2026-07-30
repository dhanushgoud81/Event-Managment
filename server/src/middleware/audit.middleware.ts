import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { logger } from '../utils/logger';

interface AuditOptions {
  entityType: string;
  action: string;
  getEntityId?: (req: Request) => string;
  getPreviousValue?: (req: Request) => Promise<any>;
}

/**
 * Audit logging middleware factory
 * Records user actions with before/after values
 */
export function audit(options: AuditOptions) {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    // Store the original res.json to capture the response
    const originalJson = _res.json.bind(_res);
    let previousValue: any = null;

    try {
      // Capture previous value before the operation
      if (options.getPreviousValue) {
        previousValue = await options.getPreviousValue(req);
      }
    } catch (error) {
      logger.warn({ error }, 'Failed to capture previous value for audit');
    }

    // Override res.json to capture the response and create audit log
    _res.json = function (body: any) {
      // Create audit log asynchronously (don't block the response)
      if (req.user && _res.statusCode >= 200 && _res.statusCode < 300) {
        const entityId = options.getEntityId
          ? options.getEntityId(req)
          : req.params.id || body?.data?.id || 'unknown';

        createAuditLog({
          userId: req.user.userId,
          entityType: options.entityType,
          entityId: String(entityId),
          action: options.action,
          previousValue,
          updatedValue: body?.data || req.body,
          ipAddress: req.ip || req.headers['x-forwarded-for']?.toString() || null,
          userAgent: req.headers['user-agent'] || null,
        }).catch((err) => {
          logger.error({ err }, 'Failed to create audit log');
        });
      }

      return originalJson(body);
    };

    next();
  };
}

async function createAuditLog(data: {
  userId: string;
  entityType: string;
  entityId: string;
  action: string;
  previousValue: any;
  updatedValue: any;
  ipAddress: string | null;
  userAgent: string | null;
}): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId: data.userId,
        entityType: data.entityType,
        entityId: data.entityId,
        action: data.action,
        previousValue: data.previousValue,
        updatedValue: data.updatedValue,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
      },
    });
  } catch (error) {
    logger.error({ error }, 'Failed to write audit log to database');
  }
}

/**
 * Direct audit log creation (for use outside middleware)
 */
export async function logAudit(
  userId: string | null,
  entityType: string,
  entityId: string,
  action: string,
  previousValue?: any,
  updatedValue?: any,
  req?: Request
): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId,
        entityType,
        entityId,
        action,
        previousValue: previousValue || null,
        updatedValue: updatedValue || null,
        ipAddress: req?.ip || null,
        userAgent: req?.headers['user-agent'] || null,
      },
    });
  } catch (error) {
    logger.error({ error }, 'Failed to write audit log');
  }
}
