import { Request, Response, NextFunction } from 'express';
import { dashboardService } from './dashboard.service';
import { ApiResponse } from '../utils/api-response';

export class DashboardController {
  /**
   * GET /api/dashboard/admin
   */
  async getAdminStats(req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await dashboardService.getAdminStats();
      return ApiResponse.success(res, stats, 'Admin dashboard stats retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/dashboard/user
   */
  async getUserStats(req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await dashboardService.getUserStats(req.user!.userId);
      return ApiResponse.success(res, stats, 'User dashboard stats retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/dashboard/audit-logs
   */
  async getAuditLogs(req: Request, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const search = (req.query.search as string) || undefined;

      const result = await dashboardService.getAuditLogs({ page, limit, search });

      return ApiResponse.paginated(
        res,
        result.logs,
        result.total,
        result.page,
        result.limit,
        'Audit logs retrieved successfully'
      );
    } catch (error) {
      next(error);
    }
  }
}

export const dashboardController = new DashboardController();
