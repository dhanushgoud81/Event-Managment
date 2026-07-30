import api from './axios';
import type { ApiSuccessResponse } from '@/types/api.types';

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  metadata?: any;
  createdAt: string;
}

export const notificationApi = {
  listNotifications: () =>
    api.get<ApiSuccessResponse<Notification[]>>('/notifications').then((r) => r.data),

  markAsRead: (id: string) =>
    api.patch<ApiSuccessResponse<Notification>>(`/notifications/${id}/read`).then((r) => r.data),

  markAllAsRead: () =>
    api.patch<ApiSuccessResponse<null>>('/notifications/read-all').then((r) => r.data),
};
