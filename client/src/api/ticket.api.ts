import api from './axios';
import type { ApiSuccessResponse } from '@/types/api.types';
import type { TicketCategory, CreateTicketRequest, UpdateTicketRequest } from '@/types/event.types';

export const ticketApi = {
  listTickets: (eventId: string) =>
    api.get<ApiSuccessResponse<TicketCategory[]>>(`/events/${eventId}/tickets`).then((r) => r.data),

  createTicket: (eventId: string, data: CreateTicketRequest) =>
    api.post<ApiSuccessResponse<TicketCategory>>(`/events/${eventId}/tickets`, data).then((r) => r.data),

  updateTicket: (eventId: string, id: string, data: UpdateTicketRequest) =>
    api.put<ApiSuccessResponse<TicketCategory>>(`/events/${eventId}/tickets/${id}`, data).then((r) => r.data),

  deleteTicket: (eventId: string, id: string) =>
    api.delete<ApiSuccessResponse<null>>(`/events/${eventId}/tickets/${id}`).then((r) => r.data),
};
