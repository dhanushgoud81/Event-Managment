import api from './axios';
import type { ApiSuccessResponse, ApiPaginatedResponse, PaginationParams } from '@/types/api.types';
import type { Registration, CreateRegistrationRequest, RegistrationStatus } from '@/types/registration.types';

export const registrationApi = {
  createRegistration: (data: CreateRegistrationRequest) =>
    api.post<ApiSuccessResponse<Registration>>('/registrations', data).then((r) => r.data),

  listMyRegistrations: () =>
    api.get<ApiSuccessResponse<Registration[]>>('/registrations/my').then((r) => r.data),

  getRegistration: (id: string) =>
    api.get<ApiSuccessResponse<Registration>>(`/registrations/${id}`).then((r) => r.data),

  listAllRegistrations: (params?: PaginationParams & { eventId?: string; status?: RegistrationStatus }) =>
    api.get<ApiPaginatedResponse<Registration>>('/registrations', { params }).then((r) => r.data),
};
