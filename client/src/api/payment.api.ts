import api from './axios';
import type { ApiSuccessResponse, ApiPaginatedResponse, PaginationParams } from '@/types/api.types';
import type { Payment, CreateOrderRequest, CreateOrderResponse, VerifyPaymentRequest, VerifyPaymentResponse, PaymentStatus } from '@/types/payment.types';

export const paymentApi = {
  createOrder: (data: CreateOrderRequest) =>
    api.post<ApiSuccessResponse<CreateOrderResponse>>('/payments/orders', data).then((r) => r.data),

  verifyPayment: (data: VerifyPaymentRequest) =>
    api.post<ApiSuccessResponse<VerifyPaymentResponse>>('/payments/verify', data).then((r) => r.data),

  listPayments: (params?: PaginationParams & { status?: PaymentStatus }) =>
    api.get<ApiPaginatedResponse<Payment>>('/payments', { params }).then((r) => r.data),

  scanCheckIn: (code: string) =>
    api.post<ApiSuccessResponse<{
      success: boolean;
      message: string;
      attendee: string;
      email: string;
      event: string;
      ticket: string;
      scannedAt: string;
    }>>('/payments/scan-checkin', { code }).then((r) => r.data),
};
