import { Router } from 'express';
import { userController } from './user.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorize, isSuperAdmin, isAdmin } from '../middleware/rbac.middleware';
import { validateBody, validateQuery } from '../middleware/validate.middleware';
import {
  updateProfileSchema,
  updateUserRoleSchema,
  updateUserStatusSchema,
  listUsersQuerySchema,
} from './user.validator';

const router = Router();

// All routes require authentication
router.use(authenticate);

// User profile routes
router.get('/me', userController.getProfile.bind(userController));

router.put(
  '/me',
  validateBody(updateProfileSchema),
  userController.updateProfile.bind(userController)
);

// Admin routes
router.get(
  '/',
  isAdmin(),
  validateQuery(listUsersQuerySchema),
  userController.listUsers.bind(userController)
);

router.get(
  '/:id',
  isAdmin(),
  userController.getUserById.bind(userController)
);

router.patch(
  '/:id/role',
  isSuperAdmin(),
  validateBody(updateUserRoleSchema),
  userController.updateUserRole.bind(userController)
);

router.patch(
  '/:id/status',
  isSuperAdmin(),
  validateBody(updateUserStatusSchema),
  userController.updateUserStatus.bind(userController)
);

export default router;
