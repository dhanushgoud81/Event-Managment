import { Request, Response, NextFunction } from 'express';
import { formService } from './form.service';
import { ApiResponse } from '../utils/api-response';

export class FormController {
  /**
   * POST /api/events/:eventId/form-fields
   */
  async createFormField(req: Request, res: Response, next: NextFunction) {
    try {
      const field = await formService.createFormField(
        req.params.eventId as string,
        req.body,
        req.user!.userId,
        req
      );

      return ApiResponse.created(res, field, 'Form field created successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/events/:eventId/form-fields
   */
  async listFormFields(req: Request, res: Response, next: NextFunction) {
    try {
      const fields = await formService.listFormFields(req.params.eventId as string);
      return ApiResponse.success(res, fields, 'Form fields retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/events/:eventId/form-fields/:id
   */
  async updateFormField(req: Request, res: Response, next: NextFunction) {
    try {
      const field = await formService.updateFormField(
        req.params.id as string,
        req.body,
        req.user!.userId,
        req
      );

      return ApiResponse.success(res, field, 'Form field updated successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/events/:eventId/form-fields/:id
   */
  async deleteFormField(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await formService.deleteFormField(
        req.params.id as string,
        req.user!.userId,
        req
      );

      return ApiResponse.success(res, null, result.message);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/events/:eventId/form-fields/reorder
   */
  async reorderFields(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await formService.reorderFields(
        req.params.eventId as string,
        req.body,
        req.user!.userId,
        req
      );

      return ApiResponse.success(res, null, result.message);
    } catch (error) {
      next(error);
    }
  }
}

export const formController = new FormController();
