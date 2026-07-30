import api from './axios';
import type { ApiSuccessResponse } from '@/types/api.types';
import type { FormField } from '@/types/event.types';
import type { CreateFormFieldRequest, UpdateFormFieldRequest, ReorderFieldsRequest } from '@/types/form.types';

export const formApi = {
  listFormFields: (eventId: string) =>
    api.get<ApiSuccessResponse<FormField[]>>(`/events/${eventId}/form-fields`).then((r) => r.data),

  createFormField: (eventId: string, data: CreateFormFieldRequest) =>
    api.post<ApiSuccessResponse<FormField>>(`/events/${eventId}/form-fields`, data).then((r) => r.data),

  updateFormField: (eventId: string, id: string, data: UpdateFormFieldRequest) =>
    api.put<ApiSuccessResponse<FormField>>(`/events/${eventId}/form-fields/${id}`, data).then((r) => r.data),

  deleteFormField: (eventId: string, id: string) =>
    api.delete<ApiSuccessResponse<null>>(`/events/${eventId}/form-fields/${id}`).then((r) => r.data),

  reorderFields: (eventId: string, data: ReorderFieldsRequest) =>
    api.patch<ApiSuccessResponse<null>>(`/events/${eventId}/form-fields/reorder`, data).then((r) => r.data),
};
