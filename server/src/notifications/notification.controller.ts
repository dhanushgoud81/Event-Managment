import { Request, Response, NextFunction } from 'express';
import { notificationService } from './notification.service';
import { ApiResponse } from '../utils/api-response';

export class NotificationController {
  /**
   * GET /api/notifications
   */
  async getNotifications(req: Request, res: Response, next: NextFunction) {
    try {
      const notifications = await notificationService.getNotifications(req.user!.userId);
      return ApiResponse.success(res, notifications, 'Notifications retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/notifications/:id/read
   */
  async markAsRead(req: Request, res: Response, next: NextFunction) {
    try {
      const notification = await notificationService.markAsRead(
        req.params.id as string,
        req.user!.userId
      );

      return ApiResponse.success(res, notification, 'Notification marked as read');
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/notifications/read-all
   */
  async markAllAsRead(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await notificationService.markAllAsRead(req.user!.userId);
      return ApiResponse.success(res, null, result.message);
    } catch (error) {
      next(error);
    }
  }
}

export const notificationController = new NotificationController();
