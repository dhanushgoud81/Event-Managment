import { prisma } from '../config/database';
import { ApiError } from '../utils/api-error';
import { generateRegistrationNumber } from '../utils/generate-code';
import { logAudit } from '../middleware/audit.middleware';
import { RegistrationStatus, FormFieldType, Prisma } from '@prisma/client';
import type { CreateRegistrationInput, ListRegistrationsQuery } from './registration.validator';
import { Request } from 'express';

export class RegistrationService {
  /**
   * Create a new event registration
   */
  async createRegistration(data: CreateRegistrationInput, userId: string, req?: Request) {
    const { eventId, ticketCategoryId, referralCode, idempotencyKey, responses } = data;

    // Check for double submissions using idempotencyKey (if provided)
    if (idempotencyKey) {
      const existing = await prisma.registration.findUnique({
        where: { idempotencyKey },
      });
      if (existing) {
        return existing;
      }
    }

    // Check if user is already registered for this event
    const existingRegistration = await prisma.registration.findUnique({
      where: {
        userId_eventId: { userId, eventId },
      },
    });

    if (existingRegistration) {
      throw ApiError.conflict('You have already registered for this event');
    }

    // Perform database queries and stock validations inside a transaction (oversell protection)
    const result = await prisma.$transaction(async (tx) => {
      // 1. Fetch event
      const event = await tx.event.findUnique({
        where: { id: eventId },
        include: {
          formFields: true,
        },
      });

      if (!event) {
        throw ApiError.notFound('Event not found');
      }

      if (event.status !== 'PUBLISHED') {
        throw ApiError.badRequest('Registration is not open for this event');
      }

      // Check dates
      const now = new Date();
      if (now < event.regStartDate || now > event.regEndDate) {
        throw ApiError.badRequest('Event registration has either not started or is closed');
      }

      // Check event capacity
      if (event.currentCount >= event.maxParticipants) {
        throw ApiError.badRequest('This event is fully booked');
      }

      // 2. Fetch ticket category
      const ticket = await tx.ticketCategory.findUnique({
        where: { id: ticketCategoryId },
      });

      if (!ticket || ticket.eventId !== eventId) {
        throw ApiError.notFound('Ticket category not found');
      }

      if (ticket.status !== 'ACTIVE') {
        throw ApiError.badRequest('This ticket category is currently unavailable');
      }

      // Check sales dates
      if (now < ticket.saleStart || now > ticket.saleEnd) {
        throw ApiError.badRequest('Ticket sales are closed');
      }

      // Check ticket capacity
      if (ticket.soldQuantity >= ticket.maxQuantity) {
        throw ApiError.badRequest('This ticket tier is sold out');
      }

      // 3. Validate dynamic form responses
      const formFields = event.formFields;
      for (const field of formFields) {
        const parsedRules = (field.validationRules as any) || {};
        const parsedOptions = (field.options as any) || [];

        const userResponse = responses.find((r) => r.formFieldId === field.id);

        // Required check
        if (field.isRequired && (!userResponse || (!userResponse.value && !userResponse.fileUrl))) {
          throw ApiError.badRequest(`Field "${field.label}" is required`);
        }

        if (userResponse) {
          const val = userResponse.value;

          // Check enum dropdown options
          if (val && parsedOptions.length > 0) {
            const hasOption = parsedOptions.includes(val);
            if (!hasOption) {
              throw ApiError.badRequest(`Invalid option for field "${field.label}"`);
            }
          }

          // Format checks
          if (val && field.fieldType === FormFieldType.EMAIL) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(val)) {
              throw ApiError.badRequest(`Field "${field.label}" must be a valid email`);
            }
          }

          if (val && field.fieldType === FormFieldType.PHONE) {
            const phoneRegex = /^\+?[1-9]\d{6,14}$/;
            if (!phoneRegex.test(val)) {
              throw ApiError.badRequest(`Field "${field.label}" must be a valid phone number`);
            }
          }
        }
      }

      // Increment ticket sold quantity and event registration count
      await tx.ticketCategory.update({
        where: { id: ticketCategoryId },
        data: { soldQuantity: { increment: 1 } },
      });

      await tx.event.update({
        where: { id: eventId },
        data: { currentCount: { increment: 1 } },
      });

      // Generate unique registration number
      const registrationNumber = generateRegistrationNumber();

      // Create registration (Default PENDING until payment verification)
      const registration = await tx.registration.create({
        data: {
          userId,
          eventId,
          ticketCategoryId,
          registrationNumber,
          amountPaid: ticket.price,
          status: ticket.price.toNumber() === 0 ? RegistrationStatus.CONFIRMED : RegistrationStatus.PENDING,
          idempotencyKey,
          formResponses: {
            create: responses.map((r) => ({
              formFieldId: r.formFieldId,
              value: r.value || null,
              fileUrl: r.fileUrl || null,
            })),
          },
        },
      });

      // If a referral code was passed, validate and link it inside the transaction!
      if (referralCode) {
        const referrer = await tx.user.findUnique({
          where: { referralCode },
        });

        if (referrer && referrer.id !== userId) {
          // Requirement: Referrer MUST have an active/confirmed registration for this specific event to refer others!
          const referrerEventReg = await tx.registration.findFirst({
            where: {
              userId: referrer.id,
              eventId,
              status: { in: [RegistrationStatus.CONFIRMED, RegistrationStatus.PENDING] },
            },
          });

          if (referrerEventReg) {
            // Calculate referral discount amount for this referral action based on Event settings
            let rewardAmount = 0;
            const rewardValue = event.referralRewardValue.toNumber();

            if (event.referralRewardType === 'FIXED') {
              rewardAmount = rewardValue;
            } else if (event.referralRewardType === 'PERCENTAGE') {
              const ticketPrice = ticket.price.toNumber();
              rewardAmount = (ticketPrice * rewardValue) / 100;
            }

            // Create pending Referral tracker linked to this event registration
            await tx.referral.create({
              data: {
                referrerId: referrer.id,
                referredId: userId,
                registrationId: registration.id,
                rewardAmount,
                status: ticket.price.toNumber() === 0 ? 'COMPLETED' : 'PENDING',
              },
            });
          }
        }
      }

      return registration;
    });

    await logAudit(userId, 'Registration', result.id, 'CREATE_REGISTRATION', null, result, req);
    return result;
  }

  /**
   * List all registrations for currently authenticated user
   */
  async listUserRegistrations(userId: string) {
    return prisma.registration.findMany({
      where: { userId },
      include: {
        event: {
          select: { name: true, slug: true, startDate: true, venue: true, bannerUrl: true },
        },
        ticketCategory: {
          select: { name: true, price: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get registration details (auth validation enforced)
   */
  async getRegistrationDetails(id: string, userId: string, isAdmin = false) {
    const registration = await prisma.registration.findUnique({
      where: { id },
      include: {
        event: {
          select: { name: true, slug: true, startDate: true, venue: true, address: true, bannerUrl: true },
        },
        ticketCategory: {
          select: { name: true, price: true },
        },
        formResponses: {
          include: {
            formField: { select: { label: true } },
          },
        },
        qrCode: {
          select: { code: true, qrImageUrl: true, isScanned: true },
        },
      },
    });

    if (!registration) {
      throw ApiError.notFound('Registration details not found');
    }

    // Owner check
    if (!isAdmin && registration.userId !== userId) {
      throw ApiError.forbidden('You are not authorized to view this registration');
    }

    return registration;
  }

  /**
   * Admin list all registrations with filters
   */
  async listAllRegistrations(query: ListRegistrationsQuery) {
    const { page, limit, search, eventId, status, sortBy, sortOrder } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.RegistrationWhereInput = {};

    if (eventId) {
      where.eventId = eventId;
    }

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { registrationNumber: { contains: search, mode: 'insensitive' } },
        {
          user: {
            OR: [
              { email: { contains: search, mode: 'insensitive' } },
              { firstName: { contains: search, mode: 'insensitive' } },
              { lastName: { contains: search, mode: 'insensitive' } },
            ],
          },
        },
      ];
    }

    const [registrations, total] = await Promise.all([
      prisma.registration.findMany({
        where,
        include: {
          user: {
            select: { firstName: true, lastName: true, email: true },
          },
          event: {
            select: { name: true },
          },
          ticketCategory: {
            select: { name: true, price: true },
          },
        },
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
      }),
      prisma.registration.count({ where }),
    ]);

    return { registrations, total, page, limit };
  }
}

export const registrationService = new RegistrationService();
