import { Request, Response, NextFunction } from 'express';
import { eventService } from './event.service';
import { ApiResponse } from '../utils/api-response';
import { EventStatus } from '@prisma/client';
import { fileUploadService } from '../services/file-upload.service';

export class EventController {
  /**
   * POST /api/events
   */
  async createEvent(req: Request, res: Response, next: NextFunction) {
    try {
      const bannerUrl = req.file ? fileUploadService.getFileUrl(req.file.filename) : undefined;
      const event = await eventService.createEvent(
        {
          ...req.body,
          tags: typeof req.body.tags === 'string' ? JSON.parse(req.body.tags) : req.body.tags,
          bannerUrl,
        },
        req.user!.userId,
        req
      );

      return ApiResponse.created(res, event, 'Event created successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/events
   */
  async listEvents(req: Request, res: Response, next: NextFunction) {
    try {
      const isAdmin = req.user ? ['SUPER_ADMIN', 'ADMIN', 'EVENT_MANAGER'].includes(req.user.role) : false;
      const result = await eventService.listEvents(req.query as any, isAdmin);

      return ApiResponse.paginated(
        res,
        result.events,
        result.total,
        result.page,
        result.limit,
        'Events retrieved successfully'
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/events/:idOrSlug
   */
  async getEvent(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId;
      const isAdmin = req.user ? ['SUPER_ADMIN', 'ADMIN', 'EVENT_MANAGER'].includes(req.user.role) : false;
      const event = await eventService.getEventByIdOrSlug(
        req.params.idOrSlug as string,
        userId,
        isAdmin
      );

      return ApiResponse.success(res, event, 'Event retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/events/:id
   */
  async updateEvent(req: Request, res: Response, next: NextFunction) {
    try {
      const bannerUrl = req.file ? fileUploadService.getFileUrl(req.file.filename) : undefined;
      const event = await eventService.updateEvent(
        req.params.id as string,
        {
          ...req.body,
          ...(req.body.tags && {
            tags: typeof req.body.tags === 'string' ? JSON.parse(req.body.tags) : req.body.tags,
          }),
          ...(bannerUrl && { bannerUrl }),
        },
        req.user!.userId,
        ['SUPER_ADMIN', 'ADMIN'].includes(req.user!.role),
        req
      );

      return ApiResponse.success(res, event, 'Event updated successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/events/:id/status
   */
  async changeStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { status } = req.body;
      const event = await eventService.changeStatus(
        req.params.id as string,
        status as EventStatus,
        req.user!.userId,
        ['SUPER_ADMIN', 'ADMIN'].includes(req.user!.role),
        req
      );

      return ApiResponse.success(res, event, `Event status changed to ${status}`);
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/events/:id
   */
  async deleteEvent(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await eventService.deleteEvent(
        req.params.id as string,
        req.user!.userId,
        ['SUPER_ADMIN', 'ADMIN'].includes(req.user!.role),
        req
      );

      return ApiResponse.success(res, null, result.message);
    } catch (error) {
      next(error);
    }
  }
}

export const eventController = new EventController();
