import { NotificationType, Prisma } from '@prisma/client';
import { prisma } from '../config/database';
import { ApiError } from '../utils/api-error';

export class NotificationService {
  /**
   * Fetch all notifications for a user (unread first, then read)
   */
  async getNotifications(userId: string) {
    return prisma.notification.findMany({
      where: { userId },
      orderBy: [
        { isRead: 'asc' },
        { createdAt: 'desc' },
      ],
    });
  }

  /**
   * Mark a single notification as read
   */
  async markAsRead(id: string, userId: string) {
    const notification = await prisma.notification.findUnique({
      where: { id },
    });

    if (!notification) {
      throw ApiError.notFound('Notification not found');
    }

    if (notification.userId !== userId) {
      throw ApiError.forbidden('You are not authorized to access this notification');
    }

    return prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });
  }

  /**
   * Mark all user notifications as read in bulk
   */
  async markAllAsRead(userId: string) {
    await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });

    return { message: 'All notifications marked as read' };
  }

  /**
   * Create a system notification (utilised by backend events, payments, referrals)
   */
  async createNotification(
    userId: string,
    title: string,
    message: string,
    type: NotificationType,
    metadata?: any
  ) {
    return prisma.notification.create({
      data: {
        userId,
        title,
        message,
        type,
        metadata: metadata ? (metadata as any) : Prisma.JsonNull,
      },
    });
  }
}

export const notificationService = new NotificationService();
