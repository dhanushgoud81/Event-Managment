import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { paymentApi } from '@/api/payment.api';
import toast from 'react-hot-toast';
import { getErrorMessage } from '@/api/axios';
import type { CreateOrderRequest, VerifyPaymentRequest, PaymentStatus } from '@/types/payment.types';
import type { PaginationParams } from '@/types/api.types';

export function usePayments(params?: PaginationParams & { status?: PaymentStatus }) {
  return useQuery({
    queryKey: ['payments', params],
    queryFn: () => paymentApi.listPayments(params),
  });
}

export function useCreatePaymentOrder() {
  return useMutation({
    mutationFn: (data: CreateOrderRequest) => paymentApi.createOrder(data),
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}

export function useVerifyPayment() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: (data: VerifyPaymentRequest) => paymentApi.verifyPayment(data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['my-registrations'] });
      queryClient.invalidateQueries({ queryKey: ['registrations'] });
      toast.success(response.data.message);
      navigate(`/dashboard/my-tickets`);
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}

export function useScanCheckIn() {
  return useMutation({
    mutationFn: (code: string) => paymentApi.scanCheckIn(code),
    onSuccess: (response) => {
      toast.success(response.data.message);
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}
