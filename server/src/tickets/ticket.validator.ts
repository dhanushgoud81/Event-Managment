import { z } from 'zod';
import { TicketStatus } from '@prisma/client';

export const ticketBaseSchema = z.object({
  name: z
    .string()
    .min(2, 'Ticket name must be at least 2 characters')
    .max(50, 'Ticket name must not exceed 50 characters')
    .trim(),
  description: z.string().max(200).optional().nullable(),
  price: z.coerce.number().min(0, 'Price cannot be negative'),
  maxQuantity: z.coerce.number().int().positive('Quantity must be positive'),
  saleStart: z.string().transform((val) => new Date(val)),
  saleEnd: z.string().transform((val) => new Date(val)),
  status: z.nativeEnum(TicketStatus).default(TicketStatus.ACTIVE),
  sortOrder: z.coerce.number().int().default(0),
});

export const createTicketSchema = ticketBaseSchema.refine((data) => {
  return data.saleStart < data.saleEnd;
}, {
  message: 'Sale end date must be after sale start date',
  path: ['saleEnd'],
});

export const updateTicketBaseSchema = ticketBaseSchema.partial();

export const updateTicketSchema = updateTicketBaseSchema.refine((data) => {
  if (data.saleStart && data.saleEnd) {
    return data.saleStart < data.saleEnd;
  }
  return true;
}, {
  message: 'Sale end date must be after sale start date',
  path: ['saleEnd'],
});

export type CreateTicketInput = z.infer<typeof createTicketSchema>;
export type UpdateTicketInput = z.infer<typeof updateTicketSchema>;
