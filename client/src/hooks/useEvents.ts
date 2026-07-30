import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { eventApi } from '@/api/event.api';
import toast from 'react-hot-toast';
import { getErrorMessage } from '@/api/axios';
import type { PaginationParams } from '@/types/api.types';
import type { EventStatus } from '@/types/event.types';

export function useEvents(params?: PaginationParams & { status?: EventStatus; city?: string; isFeatured?: boolean }) {
  return useQuery({
    queryKey: ['events', params],
    queryFn: () => eventApi.listEvents(params),
    staleTime: 5 * 60 * 1000,
  });
}

export function useEvent(idOrSlug: string) {
  return useQuery({
    queryKey: ['events', idOrSlug],
    queryFn: () => eventApi.getEvent(idOrSlug),
    enabled: !!idOrSlug,
  });
}

export function useCreateEvent() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: (data: FormData) => eventApi.createEvent(data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      toast.success('Event created successfully');
      navigate(`/admin/events/${response.data.id}/tickets`); // Navigate to tickets step
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}

export function useUpdateEvent(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: FormData) => eventApi.updateEvent(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['events', id] });
      toast.success('Event updated successfully');
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}

export function useChangeEventStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: EventStatus }) =>
      eventApi.changeStatus(id, status),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['events', variables.id] });
      toast.success(`Event status changed to ${variables.status}`);
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}

export function useDeleteEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => eventApi.deleteEvent(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      toast.success('Event deleted successfully');
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}
