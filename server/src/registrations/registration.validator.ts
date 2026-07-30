import { z } from 'zod';

export const createRegistrationSchema = z.object({
  eventId: z.string().uuid('Invalid event ID'),
  ticketCategoryId: z.string().uuid('Invalid ticket category ID'),
  referralCode: z.string().max(8).optional().nullable(),
  idempotencyKey: z.string().optional(),
  responses: z.array(
    z.object({
      formFieldId: z.string().uuid('Invalid form field ID'),
      value: z.string().optional().nullable(),
      fileUrl: z.string().url('Invalid file URL').optional().nullable(),
    })
  ),
});

export const listRegistrationsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  search: z.string().optional(),
  eventId: z.string().uuid().optional(),
  status: z.enum(['PENDING', 'CONFIRMED', 'CANCELLED', 'REFUNDED']).optional(),
  sortBy: z.enum(['createdAt', 'amountPaid']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type CreateRegistrationInput = z.infer<typeof createRegistrationSchema>;
export type ListRegistrationsQuery = z.infer<typeof listRegistrationsQuerySchema>;
