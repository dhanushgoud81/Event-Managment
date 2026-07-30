import { prisma } from '../config/database';
import { ApiError } from '../utils/api-error';
import { logAudit } from '../middleware/audit.middleware';
import { Prisma, UserRole } from '@prisma/client';
import type {
  UpdateProfileInput,
  UpdateUserRoleInput,
  UpdateUserStatusInput,
  ListUsersQuery,
} from './user.validator';
import { Request } from 'express';

// Fields to select for user responses (exclude sensitive data)
const userSelect = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  phone: true,
  avatarUrl: true,
  role: true,
  referralCode: true,
  emailVerified: true,
  isActive: true,
  lastLoginAt: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.UserSelect;

export class UserService {
  /**
   * Get current user profile
   */
  async getProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        ...userSelect,
        wallet: {
          select: { balance: true },
        },
        _count: {
          select: {
            registrations: true,
            referralsMade: { where: { status: 'COMPLETED' } },
          },
        },
      },
    });

    if (!user) {
      throw ApiError.notFound('User not found');
    }

    return user;
  }

  /**
   * Update user profile
   */
  async updateProfile(userId: string, data: UpdateProfileInput, req?: Request) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: userSelect,
    });

    if (!user) {
      throw ApiError.notFound('User not found');
    }

    const previousValue = { ...user };

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data,
      select: userSelect,
    });

    await logAudit(userId, 'User', userId, 'UPDATE_PROFILE', previousValue, data, req);

    return updatedUser;
  }

  /**
   * Update user avatar
   */
  async updateAvatar(userId: string, avatarUrl: string) {
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { avatarUrl },
      select: userSelect,
    });

    return updatedUser;
  }

  /**
   * List users (admin)
   */
  async listUsers(query: ListUsersQuery) {
    const { page, limit, search, role, isActive, sortBy, sortOrder } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.UserWhereInput = {};

    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
      ];
    }

    if (role) {
      where.role = role as UserRole;
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          ...userSelect,
          _count: {
            select: {
              registrations: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
      }),
      prisma.user.count({ where }),
    ]);

    return { users, total, page, limit };
  }

  /**
   * Get user by ID (admin)
   */
  async getUserById(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        ...userSelect,
        wallet: {
          select: { balance: true },
        },
        _count: {
          select: {
            registrations: true,
            payments: true,
            referralsMade: true,
          },
        },
      },
    });

    if (!user) {
      throw ApiError.notFound('User not found');
    }

    return user;
  }

  /**
   * Update user role (super admin)
   */
  async updateUserRole(userId: string, data: UpdateUserRoleInput, adminId: string, req?: Request) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: userSelect,
    });

    if (!user) {
      throw ApiError.notFound('User not found');
    }

    if (user.role === UserRole.SUPER_ADMIN) {
      throw ApiError.forbidden('Cannot change the role of a Super Admin');
    }

    const previousRole = user.role;

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { role: data.role as UserRole },
      select: userSelect,
    });

    await logAudit(adminId, 'User', userId, 'UPDATE_ROLE', { role: previousRole }, { role: data.role }, req);

    return updatedUser;
  }

  /**
   * Toggle user status (admin)
   */
  async updateUserStatus(
    userId: string,
    data: UpdateUserStatusInput,
    adminId: string,
    req?: Request
  ) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: userSelect,
    });

    if (!user) {
      throw ApiError.notFound('User not found');
    }

    if (user.role === UserRole.SUPER_ADMIN) {
      throw ApiError.forbidden('Cannot deactivate a Super Admin');
    }

    const previousStatus = user.isActive;

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { isActive: data.isActive },
      select: userSelect,
    });

    // If deactivating, revoke all refresh tokens
    if (!data.isActive) {
      await prisma.refreshToken.updateMany({
        where: { userId },
        data: { isRevoked: true },
      });
    }

    await logAudit(
      adminId,
      'User',
      userId,
      data.isActive ? 'ACTIVATE_USER' : 'DEACTIVATE_USER',
      { isActive: previousStatus },
      { isActive: data.isActive },
      req
    );

    return updatedUser;
  }
}

export const userService = new UserService();
