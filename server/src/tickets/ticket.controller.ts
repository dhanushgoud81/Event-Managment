import { Request, Response, NextFunction } from 'express';
import { ticketService } from './ticket.service';
import { ApiResponse } from '../utils/api-response';

export class TicketController {
  /**
   * POST /api/events/:eventId/tickets
   */
  async createTicket(req: Request, res: Response, next: NextFunction) {
    try {
      const ticket = await ticketService.createTicket(
        req.params.eventId as string,
        req.body,
        req.user!.userId,
        req
      );

      return ApiResponse.created(res, ticket, 'Ticket category created successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/events/:eventId/tickets
   */
  async listTickets(req: Request, res: Response, next: NextFunction) {
    try {
      const tickets = await ticketService.listTickets(req.params.eventId as string);
      return ApiResponse.success(res, tickets, 'Tickets retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/events/:eventId/tickets/:id
   */
  async updateTicket(req: Request, res: Response, next: NextFunction) {
    try {
      const ticket = await ticketService.updateTicket(
        req.params.id as string,
        req.body,
        req.user!.userId,
        req
      );

      return ApiResponse.success(res, ticket, 'Ticket category updated successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/events/:eventId/tickets/:id
   */
  async deleteTicket(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await ticketService.deleteTicket(
        req.params.id as string,
        req.user!.userId,
        req
      );

      return ApiResponse.success(res, null, result.message);
    } catch (error) {
      next(error);
    }
  }
}

export const ticketController = new TicketController();
