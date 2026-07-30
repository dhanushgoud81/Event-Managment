import { Router } from 'express';
import { registrationController } from './registration.controller';
import { authenticate } from '../middleware/auth.middleware';
import { isAdmin } from '../middleware/rbac.middleware';
import { validateBody, validateQuery } from '../middleware/validate.middleware';
import { createRegistrationSchema, listRegistrationsQuerySchema } from './registration.validator';

const router = Router();

// All routes require authentication
router.use(authenticate);

router.post(
  '/',
  validateBody(createRegistrationSchema),
  registrationController.createRegistration.bind(registrationController)
);

router.get('/my', registrationController.listMyRegistrations.bind(registrationController));

router.get('/:id', registrationController.getRegistration.bind(registrationController));

// Admin registrations view
router.get(
  '/',
  isAdmin(),
  validateQuery(listRegistrationsQuerySchema),
  registrationController.listAllRegistrations.bind(registrationController)
);

export default router;
