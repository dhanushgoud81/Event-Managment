import { Router } from 'express';
import { paymentController } from './payment.controller';
import { authenticate } from '../middleware/auth.middleware';
import { isAdmin } from '../middleware/rbac.middleware';
import { validateBody, validateQuery } from '../middleware/validate.middleware';
import { createPaymentOrderSchema, verifyPaymentSchema, listPaymentsQuerySchema } from './payment.validator';
import { z } from 'zod';

const router = Router();

// Public Webhook route for Cashfree
router.post('/webhook', paymentController.handleWebhook.bind(paymentController));

// Protected routes require authentication
router.use(authenticate);

// Orders & Verification
router.post(
  '/orders',
  validateBody(createPaymentOrderSchema),
  paymentController.createOrder.bind(paymentController)
);

router.post(
  '/verify',
  validateBody(verifyPaymentSchema),
  paymentController.verifyPayment.bind(paymentController)
);

// Scan QR Check-in (Admin and Event Managers only)
router.post(
  '/scan-checkin',
  isAdmin(),
  validateBody(z.object({ code: z.string().min(1, 'Check-in code is required') })),
  paymentController.scanCheckIn.bind(paymentController)
);

// Payments Transaction Listing (Admin only)
router.get(
  '/',
  isAdmin(),
  validateQuery(listPaymentsQuerySchema),
  paymentController.listPayments.bind(paymentController)
);

export default router;
