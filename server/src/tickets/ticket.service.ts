import { prisma } from '../config/database';
import { ApiError } from '../utils/api-error';
import { logAudit } from '../middleware/audit.middleware';
import type { CreateTicketInput, UpdateTicketInput } from './ticket.validator';
import { Request } from 'express';

export class TicketService {
  /**
   * Add a new ticket category to an event
   */
  async createTicket(eventId: string, data: CreateTicketInput, userId: string, req?: Request) {
    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      throw ApiError.notFound('Event not found');
    }

    // Check permissions (creator or admin)
    const isAdmin = req?.user && ['SUPER_ADMIN', 'ADMIN'].includes(req.user.role);
    if (!isAdmin && event.createdBy !== userId) {
      throw ApiError.forbidden('You are not authorized to add tickets to this event');
    }

    const ticket = await prisma.ticketCategory.create({
      data: {
        ...data,
        eventId,
      },
    });

    await logAudit(userId, 'TicketCategory', ticket.id, 'CREATE_TICKET_CATEGORY', null, ticket, req);
    return ticket;
  }

  /**
   * Get all ticket categories for an event
   */
  async listTickets(eventId: string) {
    const tickets = await prisma.ticketCategory.findMany({
      where: { eventId },
      orderBy: { sortOrder: 'asc' },
    });

    return tickets;
  }

  /**
   * Update a ticket category
   */
  async updateTicket(id: string, data: UpdateTicketInput, userId: string, req?: Request) {
    const ticket = await prisma.ticketCategory.findUnique({
      where: { id },
      include: { event: true },
    });

    if (!ticket) {
      throw ApiError.notFound('Ticket category not found');
    }

    // Check permissions
    const isAdmin = req?.user && ['SUPER_ADMIN', 'ADMIN'].includes(req.user.role);
    if (!isAdmin && ticket.event.createdBy !== userId) {
      throw ApiError.forbidden('You are not authorized to update this ticket');
    }

    const previousValue = { ...ticket };
    delete (previousValue as any).event; // Clean object

    const updatedTicket = await prisma.ticketCategory.update({
      where: { id },
      data,
    });

    await logAudit(userId, 'TicketCategory', id, 'UPDATE_TICKET_CATEGORY', previousValue, updatedTicket, req);
    return updatedTicket;
  }

  /**
   * Delete a ticket category
   */
  async deleteTicket(id: string, userId: string, req?: Request) {
    const ticket = await prisma.ticketCategory.findUnique({
      where: { id },
      include: {
        event: true,
        _count: {
          select: { registrations: true },
        },
      },
    });

    if (!ticket) {
      throw ApiError.notFound('Ticket category not found');
    }

    // Check permissions
    const isAdmin = req?.user && ['SUPER_ADMIN', 'ADMIN'].includes(req.user.role);
    if (!isAdmin && ticket.event.createdBy !== userId) {
      throw ApiError.forbidden('You are not authorized to delete this ticket');
    }

    // Prevent deletion if registrations exist for this ticket category
    if (ticket._count.registrations > 0) {
      throw ApiError.badRequest(
        'Cannot delete ticket category because it has active registrations. Disable it instead.'
      );
    }

    await prisma.ticketCategory.delete({
      where: { id },
    });

    await logAudit(userId, 'TicketCategory', id, 'DELETE_TICKET_CATEGORY', ticket, null, req);
    return { message: 'Ticket category deleted successfully' };
  }
}

export const ticketService = new TicketService();
