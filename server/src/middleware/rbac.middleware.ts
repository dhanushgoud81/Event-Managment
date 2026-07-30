import { Request, Response, NextFunction } from 'express';
import { UserRole } from '@prisma/client';
import { ApiError } from '../utils/api-error';

/**
 * Role-based access control middleware factory
 * Usage: authorize(UserRole.ADMIN, UserRole.SUPER_ADMIN)
 */
export function authorize(...allowedRoles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(ApiError.unauthorized('Authentication required'));
      return;
    }

    if (!allowedRoles.includes(req.user.role as UserRole)) {
      next(ApiError.forbidden('You do not have permission to access this resource'));
      return;
    }

    next();
  };
}

/**
 * Check if user is a super admin
 */
export function isSuperAdmin() {
  return authorize(UserRole.SUPER_ADMIN);
}

/**
 * Check if user is an admin or super admin
 */
export function isAdmin() {
  return authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.EVENT_MANAGER);
}

/**
 * Check if user is accessing their own resource or is an admin
 */
export function isOwnerOrAdmin(userIdParam = 'id') {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(ApiError.unauthorized('Authentication required'));
      return;
    }

    const resourceUserId = req.params[userIdParam];
    const isOwner = req.user.userId === resourceUserId;
    const isAdminUser = ([UserRole.SUPER_ADMIN, UserRole.ADMIN] as UserRole[]).includes(
      req.user.role as UserRole
    );

    if (!isOwner && !isAdminUser) {
      next(ApiError.forbidden('You can only access your own resources'));
      return;
    }

    next();
  };
}
