import { Request, Response, NextFunction } from 'express';
import { userService } from './user.service';
import { ApiResponse } from '../utils/api-response';

export class UserController {
  /**
   * GET /api/users/me
   */
  async getProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await userService.getProfile(req.user!.userId);
      return ApiResponse.success(res, user, 'Profile retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/users/me
   */
  async updateProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await userService.updateProfile(req.user!.userId, req.body, req);
      return ApiResponse.success(res, user, 'Profile updated successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/users
   */
  async listUsers(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await userService.listUsers(req.query as any);
      return ApiResponse.paginated(
        res,
        result.users,
        result.total,
        result.page,
        result.limit,
        'Users retrieved successfully'
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/users/:id
   */
  async getUserById(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await userService.getUserById(req.params.id as string);
      return ApiResponse.success(res, user, 'User retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/users/:id/role
   */
  async updateUserRole(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await userService.updateUserRole(
        req.params.id as string,
        req.body,
        req.user!.userId,
        req
      );
      return ApiResponse.success(res, user, 'User role updated successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/users/:id/status
   */
  async updateUserStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await userService.updateUserStatus(
        req.params.id as string,
        req.body,
        req.user!.userId,
        req
      );
      return ApiResponse.success(res, user, 'User status updated successfully');
    } catch (error) {
      next(error);
    }
  }
}

export const userController = new UserController();
