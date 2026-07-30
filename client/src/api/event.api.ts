import api from './axios';
import type { ApiSuccessResponse, ApiPaginatedResponse, PaginationParams } from '@/types/api.types';
import type { Event, CreateEventRequest, UpdateEventRequest, EventStatus } from '@/types/event.types';

export const eventApi = {
  listEvents: (params?: PaginationParams & { status?: EventStatus; city?: string; isFeatured?: boolean }) =>
    api.get<ApiPaginatedResponse<Event>>('/events', { params }).then((r) => r.data),

  getEvent: (idOrSlug: string) =>
    api.get<ApiSuccessResponse<Event>>(`/events/${idOrSlug}`).then((r) => r.data),

  createEvent: (data: FormData) =>
    api
      .post<ApiSuccessResponse<Event>>('/events', data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((r) => r.data),

  updateEvent: (id: string, data: FormData) =>
    api
      .put<ApiSuccessResponse<Event>>(`/events/${id}`, data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((r) => r.data),

  changeStatus: (id: string, status: EventStatus) =>
    api.patch<ApiSuccessResponse<Event>>(`/events/${id}/status`, { status }).then((r) => r.data),

  deleteEvent: (id: string) =>
    api.delete<ApiSuccessResponse<null>>(`/events/${id}`).then((r) => r.data),
};
