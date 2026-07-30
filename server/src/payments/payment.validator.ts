import { z } from 'zod';

export const createPaymentOrderSchema = z.object({
  registrationId: z.string().uuid('Invalid registration ID'),
});

export const verifyPaymentSchema = z.object({
  cashfreeOrderId: z.string().min(1, 'Order ID is required'),
  registrationId: z.string().uuid('Invalid registration ID'),
});

export const listPaymentsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  status: z.enum(['PENDING', 'SUCCESSFUL', 'FAILED', 'REFUNDED']).optional(),
  search: z.string().optional(),
  sortBy: z.enum(['createdAt', 'amount']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type CreatePaymentOrderInput = z.infer<typeof createPaymentOrderSchema>;
export type VerifyPaymentInput = z.infer<typeof verifyPaymentSchema>;
export type ListPaymentsQuery = z.infer<typeof listPaymentsQuerySchema>;
