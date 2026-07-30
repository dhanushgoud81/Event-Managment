import { Router } from 'express';
import { eventController } from './event.controller';
import { authenticate, optionalAuth } from '../middleware/auth.middleware';
import { isAdmin } from '../middleware/rbac.middleware';
import { validateBody, validateQuery, validateParams } from '../middleware/validate.middleware';
import { upload } from '../services/file-upload.service';
import { z } from 'zod';
import {
  createEventSchema,
  updateEventSchema,
  listEventsQuerySchema,
} from './event.validator';
import ticketRoutes from '../tickets/ticket.routes';
import formRoutes from '../forms/form.routes';

const router = Router();

// Mount nested routes under events
router.use('/:eventId/tickets', ticketRoutes);
router.use('/:eventId/form-fields', formRoutes);

// Public routes (with optional auth to check roles if logged in)
router.get(
  '/',
  optionalAuth,
  validateQuery(listEventsQuerySchema),
  eventController.listEvents.bind(eventController)
);

router.get(
  '/:idOrSlug',
  optionalAuth,
  eventController.getEvent.bind(eventController)
);

// Protected routes (Admin/Organizer only)
router.post(
  '/',
  authenticate,
  isAdmin(),
  upload.single('banner'),
  validateBody(createEventSchema),
  eventController.createEvent.bind(eventController)
);

router.put(
  '/:id',
  authenticate,
  isAdmin(),
  upload.single('banner'),
  validateBody(updateEventSchema),
  eventController.updateEvent.bind(eventController)
);

router.patch(
  '/:id/status',
  authenticate,
  isAdmin(),
  validateBody(z.object({ status: z.string() })),
  eventController.changeStatus.bind(eventController)
);

router.delete(
  '/:id',
  authenticate,
  isAdmin(),
  eventController.deleteEvent.bind(eventController)
);

export default router;
