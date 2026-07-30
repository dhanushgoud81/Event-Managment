import { Registration } from './registration.types';
import { User } from './auth.types';

export type PaymentStatus = 'PENDING' | 'SUCCESSFUL' | 'FAILED' | 'REFUNDED';

export interface Payment {
  id: string;
  registrationId: string;
  userId: string;
  orderId: string;
  razorpayOrderId?: string | null;
  razorpayPaymentId?: string | null;
  razorpaySignature?: string | null;
  amount: number;
  currency: string;
  status: PaymentStatus;
  method?: string | null;
  refundId?: string | null;
  refundAmount?: number | null;
  refundReason?: string | null;
  createdAt: string;
  updatedAt: string;
  user?: User;
  registration?: Registration;
}

export interface CreateOrderRequest {
  registrationId: string;
}

export interface CreateOrderResponse {
  paymentId: string;
  cashfreeOrderId: string;
  paymentSessionId: string;
  amount: number;
  originalPrice?: number;
  referralDiscountApplied?: number;
  isFreeWithDiscount?: boolean;
  currency: string;
  environment: 'TEST' | 'PRODUCTION';
  isMock: boolean;
  registration: Registration;
}

export interface VerifyPaymentRequest {
  cashfreeOrderId: string;
  registrationId: string;
}

export interface VerifyPaymentResponse {
  success: boolean;
  message: string;
  registration: Registration;
}
