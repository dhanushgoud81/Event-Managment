import { z } from 'zod';
import { EventStatus } from '@prisma/client';

export const eventBaseSchema = z.object({
  name: z
    .string()
    .min(3, 'Event name must be at least 3 characters')
    .max(100, 'Event name must not exceed 100 characters')
    .trim(),
  description: z
    .string()
    .min(10, 'Description must be at least 10 characters')
    .trim(),
  bannerUrl: z.string().url('Invalid banner URL').optional().nullable(),
  venue: z.string().min(3, 'Venue is required').trim(),
  address: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  state: z.string().optional().nullable(),
  country: z.string().optional().nullable(),
  startDate: z.string().transform((val) => new Date(val)),
  endDate: z.string().transform((val) => new Date(val)),
  regStartDate: z.string().transform((val) => new Date(val)),
  regEndDate: z.string().transform((val) => new Date(val)),
  maxParticipants: z.coerce.number().int().positive('Maximum participants must be a positive number'),
  organizerName: z.string().optional().nullable(),
  organizerEmail: z.string().email('Invalid email format').optional().or(z.literal('')).nullable(),
  organizerPhone: z.string().optional().nullable(),
  organizerWebsite: z.string().url('Invalid website URL').optional().or(z.literal('')).nullable(),
  contactEmail: z.string().email('Invalid email format').optional().or(z.literal('')).nullable(),
  contactPhone: z.string().optional().nullable(),
  tags: z
    .union([
      z.array(z.string()),
      z.string().transform((val) => {
        try {
          const parsed = JSON.parse(val);
          return Array.isArray(parsed) ? parsed : [val];
        } catch {
          return val ? val.split(',').map((t) => t.trim()).filter(Boolean) : [];
        }
      }),
    ])
    .default([]),
  isFeatured: z
    .union([
      z.boolean(),
      z.string().transform((val) => val === 'true'),
    ])
    .default(false),
  referralRewardType: z.enum(['FIXED', 'PERCENTAGE']).default('FIXED'),
  referralRewardValue: z.coerce.number().min(0, 'Reward value must be non-negative').default(0),
  maxReferralDiscountPercent: z.coerce
    .number()
    .min(0, 'Max discount must be at least 0%')
    .max(100, 'Max discount cannot exceed 100%')
    .default(100),
});

// Refinement logic for creation (all dates are required)
export const createEventSchema = eventBaseSchema.refine((data) => {
  return data.startDate < data.endDate;
}, {
  message: 'End date must be after start date',
  path: ['endDate'],
}).refine((data) => {
  return data.regStartDate < data.regEndDate;
}, {
  message: 'Registration end date must be after registration start date',
  path: ['regEndDate'],
}).refine((data) => {
  return data.regEndDate <= data.startDate;
}, {
  message: 'Registration must close before the event starts',
  path: ['regEndDate'],
});

// Since update fields are optional, Zod transform will output Date | undefined
// Let's define updateEventBaseSchema as partial of the base, and extend status
export const updateEventBaseSchema = eventBaseSchema.partial().extend({
  status: z.nativeEnum(EventStatus).optional(),
});

// Refinement for update (only validates relationship if both dates are present)
export const updateEventSchema = updateEventBaseSchema.refine((data) => {
  if (data.startDate && data.endDate) {
    return data.startDate < data.endDate;
  }
  return true;
}, {
  message: 'End date must be after start date',
  path: ['endDate'],
}).refine((data) => {
  if (data.regStartDate && data.regEndDate) {
    return data.regStartDate < data.regEndDate;
  }
  return true;
}, {
  message: 'Registration end date must be after registration start date',
  path: ['regEndDate'],
}).refine((data) => {
  const regEnd = data.regEndDate;
  const start = data.startDate;
  if (regEnd && start) {
    return regEnd <= start;
  }
  return true;
}, {
  message: 'Registration must close before the event starts',
  path: ['regEndDate'],
});

export const listEventsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  search: z.string().optional(),
  status: z.nativeEnum(EventStatus).optional(),
  city: z.string().optional(),
  isFeatured: z
    .string()
    .transform((val) => val === 'true')
    .optional(),
  sortBy: z.enum(['startDate', 'createdAt', 'name', 'maxParticipants']).default('startDate'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

export type CreateEventInput = z.infer<typeof createEventSchema>;
export type UpdateEventInput = z.infer<typeof updateEventSchema>;
export type ListEventsQuery = z.infer<typeof listEventsQuerySchema>;
