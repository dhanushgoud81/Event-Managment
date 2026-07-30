import api from './axios';
import type { ApiSuccessResponse, ApiPaginatedResponse, PaginationParams } from '@/types/api.types';
import type { User, UpdateProfileRequest } from '@/types/auth.types';

export const userApi = {
  getProfile: () =>
    api.get<ApiSuccessResponse<User>>('/users/me').then((r) => r.data),

  updateProfile: (data: UpdateProfileRequest) =>
    api.put<ApiSuccessResponse<User>>('/users/me', data).then((r) => r.data),

  listUsers: (params?: PaginationParams & { role?: string; isActive?: string }) =>
    api.get<ApiPaginatedResponse<User>>('/users', { params }).then((r) => r.data),

  getUserById: (id: string) =>
    api.get<ApiSuccessResponse<User>>(`/users/${id}`).then((r) => r.data),

  updateUserRole: (id: string, role: string) =>
    api.patch<ApiSuccessResponse<User>>(`/users/${id}/role`, { role }).then((r) => r.data),

  updateUserStatus: (id: string, isActive: boolean) =>
    api.patch<ApiSuccessResponse<User>>(`/users/${id}/status`, { isActive }).then((r) => r.data),
};
