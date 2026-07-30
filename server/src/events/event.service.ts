import { prisma } from '../config/database';
import { ApiError } from '../utils/api-error';
import { generateSlug } from '../utils/generate-code';
import { logAudit } from '../middleware/audit.middleware';
import { EventStatus, Prisma } from '@prisma/client';
import type { CreateEventInput, UpdateEventInput, ListEventsQuery } from './event.validator';
import { Request } from 'express';

export class EventService {
  /**
   * Create a new event
   */
  async createEvent(data: CreateEventInput, userId: string, req?: Request) {
    const slug = generateSlug(data.name);

    const event = await prisma.event.create({
      data: {
        ...data,
        slug,
        createdBy: userId,
        status: EventStatus.DRAFT, // Default to DRAFT
      },
    });

    await logAudit(userId, 'Event', event.id, 'CREATE_EVENT', null, event, req);
    return event;
  }

  /**
   * Get public events list (published only) or admin list with filters
   */
  async listEvents(query: ListEventsQuery, isAdmin = false) {
    const { page, limit, search, status, city, isFeatured, sortBy, sortOrder } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.EventWhereInput = {};

    // For public users, only show PUBLISHED events
    if (!isAdmin) {
      where.status = EventStatus.PUBLISHED;
    } else if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { venue: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (city) {
      where.city = { contains: city, mode: 'insensitive' };
    }

    if (isFeatured !== undefined) {
      where.isFeatured = isFeatured;
    }

    const [events, total] = await Promise.all([
      prisma.event.findMany({
        where,
        include: {
          _count: {
            select: {
              registrations: { where: { status: 'CONFIRMED' } },
            },
          },
          ticketCategories: {
            where: { status: 'ACTIVE' },
            select: { price: true },
            orderBy: { price: 'asc' },
            take: 1, // Get the starting ticket price
          },
        },
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
      }),
      prisma.event.count({ where }),
    ]);

    return { events, total, page, limit };
  }

  /**
   * Get event by ID or slug (public details or admin view)
   */
  async getEventByIdOrSlug(idOrSlug: string, userId?: string, isAdmin = false) {
    const isUuid = idOrSlug.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);

    const event = await prisma.event.findFirst({
      where: isUuid ? { id: idOrSlug } : { slug: idOrSlug },
      include: {
        ticketCategories: {
          orderBy: { sortOrder: 'asc' },
        },
        formFields: {
          orderBy: { displayOrder: 'asc' },
        },
        _count: {
          select: {
            registrations: { where: { status: 'CONFIRMED' } },
          },
        },
      },
    });

    if (!event) {
      throw ApiError.notFound('Event not found');
    }

    // Hide unpublished events from public users unless they are the creator or admin
    if (!isAdmin && event.status !== EventStatus.PUBLISHED && event.createdBy !== userId) {
      throw ApiError.forbidden('You do not have permission to view this event');
    }

    return event;
  }

  /**
   * Update an event
   */
  async updateEvent(id: string, data: UpdateEventInput, userId: string, isAdmin = false, req?: Request) {
    const event = await prisma.event.findUnique({
      where: { id },
    });

    if (!event) {
      throw ApiError.notFound('Event not found');
    }

    // Ensure user has permission
    if (!isAdmin && event.createdBy !== userId) {
      throw ApiError.forbidden('You are not authorized to update this event');
    }

    const previousValue = { ...event };

    // Regenerate slug if name changes and it's in draft
    let slug = event.slug;
    if (data.name && event.status === EventStatus.DRAFT) {
      slug = generateSlug(data.name);
    }

    const updatedEvent = await prisma.event.update({
      where: { id },
      data: {
        ...data,
        slug,
      },
    });

    await logAudit(userId, 'Event', id, 'UPDATE_EVENT', previousValue, updatedEvent, req);
    return updatedEvent;
  }

  /**
   * Change event status (publish, cancel, close, archive)
   */
  async changeStatus(id: string, status: EventStatus, userId: string, isAdmin = false, req?: Request) {
    const event = await prisma.event.findUnique({
      where: { id },
      include: {
        ticketCategories: true,
      },
    });

    if (!event) {
      throw ApiError.notFound('Event not found');
    }

    if (!isAdmin && event.createdBy !== userId) {
      throw ApiError.forbidden('You are not authorized to update this event');
    }

    // Validation for publishing
    if (status === EventStatus.PUBLISHED) {
      if (event.ticketCategories.length === 0) {
        throw ApiError.badRequest('Cannot publish event without ticket categories');
      }
    }

    const updatedEvent = await prisma.event.update({
      where: { id },
      data: { status },
    });

    await logAudit(
      userId,
      'Event',
      id,
      `CHANGE_EVENT_STATUS_${status}`,
      { status: event.status },
      { status },
      req
    );

    return updatedEvent;
  }

  /**
   * Delete an event (only draft events can be deleted, otherwise archive/cancel)
   */
  async deleteEvent(id: string, userId: string, isAdmin = false, req?: Request) {
    const event = await prisma.event.findUnique({
      where: { id },
    });

    if (!event) {
      throw ApiError.notFound('Event not found');
    }

    if (!isAdmin && event.createdBy !== userId) {
      throw ApiError.forbidden('You are not authorized to delete this event');
    }

    if (event.status !== EventStatus.DRAFT && !isAdmin) {
      throw ApiError.badRequest('Only draft events can be deleted. Cancel or Archive instead.');
    }

    await prisma.event.delete({
      where: { id },
    });

    await logAudit(userId, 'Event', id, 'DELETE_EVENT', event, null, req);
    return { message: 'Event deleted successfully' };
  }
}

export const eventService = new EventService();
