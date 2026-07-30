import { Router } from 'express';
import { authController } from './auth.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validateBody } from '../middleware/validate.middleware';
import { authLimiter, sensitiveLimiter } from '../middleware/rate-limiter.middleware';
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
} from './auth.validator';

const router = Router();

// Public routes (with rate limiting)
router.post(
  '/register',
  authLimiter,
  validateBody(registerSchema),
  authController.register.bind(authController)
);

router.post(
  '/login',
  authLimiter,
  validateBody(loginSchema),
  authController.login.bind(authController)
);

router.post(
  '/refresh-token',
  authController.refreshToken.bind(authController)
);

router.post(
  '/forgot-password',
  sensitiveLimiter,
  validateBody(forgotPasswordSchema),
  authController.forgotPassword.bind(authController)
);

router.post(
  '/reset-password',
  sensitiveLimiter,
  validateBody(resetPasswordSchema),
  authController.resetPassword.bind(authController)
);

router.get(
  '/verify-email/:token',
  authController.verifyEmail.bind(authController)
);

// Protected routes
router.post(
  '/logout',
  authenticate,
  authController.logout.bind(authController)
);

router.post(
  '/change-password',
  authenticate,
  validateBody(changePasswordSchema),
  authController.changePassword.bind(authController)
);

export default router;
