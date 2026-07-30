import api from './axios';
import type { ApiSuccessResponse, ApiPaginatedResponse, PaginationParams } from '@/types/api.types';
import type { AdminStats, UserStats, AuditLog } from '@/types/dashboard.types';

export const dashboardApi = {
  getAdminStats: () =>
    api.get<ApiSuccessResponse<AdminStats>>('/dashboard/admin').then((r) => r.data),

  getUserStats: () =>
    api.get<ApiSuccessResponse<UserStats>>('/dashboard/user').then((r) => r.data),

  listAuditLogs: (params?: PaginationParams) =>
    api.get<ApiPaginatedResponse<AuditLog>>('/dashboard/audit-logs', { params }).then((r) => r.data),
};
