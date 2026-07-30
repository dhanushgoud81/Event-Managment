import { Router } from 'express';
import { ticketController } from './ticket.controller';
import { authenticate } from '../middleware/auth.middleware';
import { isAdmin } from '../middleware/rbac.middleware';
import { validateBody } from '../middleware/validate.middleware';
import { createTicketSchema, updateTicketSchema } from './ticket.validator';

const router = Router({ mergeParams: true }); // Enable mergeParams to access eventId

// Public route to view tickets
router.get('/', ticketController.listTickets.bind(ticketController));

// Protected routes (Admin/Organizer only)
router.post(
  '/',
  authenticate,
  isAdmin(),
  validateBody(createTicketSchema),
  ticketController.createTicket.bind(ticketController)
);

router.put(
  '/:id',
  authenticate,
  isAdmin(),
  validateBody(updateTicketSchema),
  ticketController.updateTicket.bind(ticketController)
);

router.delete(
  '/:id',
  authenticate,
  isAdmin(),
  ticketController.deleteTicket.bind(ticketController)
);

export default router;
