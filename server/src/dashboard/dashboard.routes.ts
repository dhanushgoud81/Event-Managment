import { Router } from 'express';
import { dashboardController } from './dashboard.controller';
import { authenticate } from '../middleware/auth.middleware';
import { isAdmin } from '../middleware/rbac.middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

router.get('/user', dashboardController.getUserStats.bind(dashboardController));

router.get('/admin', isAdmin(), dashboardController.getAdminStats.bind(dashboardController));

router.get('/audit-logs', isAdmin(), dashboardController.getAuditLogs.bind(dashboardController));

export default router;
