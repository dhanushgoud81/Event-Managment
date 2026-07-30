import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { registrationApi } from '@/api/registration.api';
import toast from 'react-hot-toast';
import { getErrorMessage } from '@/api/axios';
import type { CreateRegistrationRequest, RegistrationStatus } from '@/types/registration.types';
import type { PaginationParams } from '@/types/api.types';

export function useRegistrations(params?: PaginationParams & { eventId?: string; status?: RegistrationStatus }) {
  return useQuery({
    queryKey: ['registrations', params],
    queryFn: () => registrationApi.listAllRegistrations(params),
  });
}

export function useMyRegistrations() {
  return useQuery({
    queryKey: ['my-registrations'],
    queryFn: () => registrationApi.listMyRegistrations(),
  });
}

export function useRegistration(id: string) {
  return useQuery({
    queryKey: ['registrations', id],
    queryFn: () => registrationApi.getRegistration(id),
    enabled: !!id,
  });
}

export function useCreateRegistration() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: (data: CreateRegistrationRequest) => registrationApi.createRegistration(data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['my-registrations'] });
      queryClient.invalidateQueries({ queryKey: ['events', response.data.eventId] });
      toast.success('Registration submitted!');

      // If event ticket is free, go straight to QR confirmation. Otherwise, proceed to payment (Phase 4)
      if (response.data.amountPaid == 0) {
        navigate(`/dashboard/my-tickets`);
      } else {
        // Redirection to payment page (will update in Phase 4)
        navigate(`/dashboard/payments`);
      }
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}
