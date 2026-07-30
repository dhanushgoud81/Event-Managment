import { Request, Response, NextFunction } from 'express';
import { registrationService } from './registration.service';
import { ApiResponse } from '../utils/api-response';

export class RegistrationController {
  /**
   * POST /api/registrations
   */
  async createRegistration(req: Request, res: Response, next: NextFunction) {
    try {
      const registration = await registrationService.createRegistration(
        req.body,
        req.user!.userId,
        req
      );

      return ApiResponse.created(res, registration, 'Registration submitted successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/registrations/my
   */
  async listMyRegistrations(req: Request, res: Response, next: NextFunction) {
    try {
      const registrations = await registrationService.listUserRegistrations(req.user!.userId);
      return ApiResponse.success(res, registrations, 'My registrations retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/registrations/:id
   */
  async getRegistration(req: Request, res: Response, next: NextFunction) {
    try {
      const isAdmin = ['SUPER_ADMIN', 'ADMIN', 'EVENT_MANAGER'].includes(req.user!.role);
      const registration = await registrationService.getRegistrationDetails(
        req.params.id as string,
        req.user!.userId,
        isAdmin
      );

      return ApiResponse.success(res, registration, 'Registration retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/registrations
   */
  async listAllRegistrations(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await registrationService.listAllRegistrations(req.query as any);
      return ApiResponse.paginated(
        res,
        result.registrations,
        result.total,
        result.page,
        result.limit,
        'Registrations retrieved successfully'
      );
    } catch (error) {
      next(error);
    }
  }
}

export const registrationController = new RegistrationController();
