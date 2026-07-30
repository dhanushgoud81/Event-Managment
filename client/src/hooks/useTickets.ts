import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ticketApi } from '@/api/ticket.api';
import toast from 'react-hot-toast';
import { getErrorMessage } from '@/api/axios';
import type { CreateTicketRequest, UpdateTicketRequest } from '@/types/event.types';

export function useTickets(eventId: string) {
  return useQuery({
    queryKey: ['events', eventId, 'tickets'],
    queryFn: () => ticketApi.listTickets(eventId),
    enabled: !!eventId,
  });
}

export function useCreateTicket(eventId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateTicketRequest) => ticketApi.createTicket(eventId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events', eventId, 'tickets'] });
      queryClient.invalidateQueries({ queryKey: ['events', eventId] });
      toast.success('Ticket category added successfully');
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}

export function useUpdateTicket(eventId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTicketRequest }) =>
      ticketApi.updateTicket(eventId, id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events', eventId, 'tickets'] });
      queryClient.invalidateQueries({ queryKey: ['events', eventId] });
      toast.success('Ticket category updated successfully');
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}

export function useDeleteTicket(eventId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => ticketApi.deleteTicket(eventId, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events', eventId, 'tickets'] });
      queryClient.invalidateQueries({ queryKey: ['events', eventId] });
      toast.success('Ticket category deleted successfully');
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}
