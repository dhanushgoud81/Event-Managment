import { Router } from 'express';
import { referralController } from './referral.controller';
import { authenticate } from '../middleware/auth.middleware';
import { isAdmin } from '../middleware/rbac.middleware';
import { validateBody } from '../middleware/validate.middleware';
import { updateReferralSettingsSchema, applyReferralCodeSchema } from './referral.validator';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Wallet & User Referrals
router.get('/wallet', referralController.getWallet.bind(referralController));
router.get('/my', referralController.listMyReferrals.bind(referralController));
router.post(
  '/apply',
  validateBody(applyReferralCodeSchema),
  referralController.applyReferralCode.bind(referralController)
);

// Admin Referral Settings
router.get('/settings', isAdmin(), referralController.getSettings.bind(referralController));
router.put(
  '/settings',
  isAdmin(),
  validateBody(updateReferralSettingsSchema),
  referralController.updateSettings.bind(referralController)
);

export default router;
