import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '@/api/dashboard.api';
import type { PaginationParams } from '@/types/api.types';

export function useAdminStats() {
  return useQuery({
    queryKey: ['admin-stats'],
    queryFn: () => dashboardApi.getAdminStats(),
  });
}

export function useUserStats() {
  return useQuery({
    queryKey: ['user-stats'],
    queryFn: () => dashboardApi.getUserStats(),
  });
}

export function useAuditLogs(params?: PaginationParams) {
  return useQuery({
    queryKey: ['audit-logs', params],
    queryFn: () => dashboardApi.listAuditLogs(params),
  });
}
