import { Router } from 'express';
import { notificationController } from './notification.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

router.get('/', notificationController.getNotifications.bind(notificationController));

router.patch('/read-all', notificationController.markAllAsRead.bind(notificationController));

router.patch('/:id/read', notificationController.markAsRead.bind(notificationController));

export default router;
