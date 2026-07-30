import { z } from 'zod';

export const updateReferralSettingsSchema = z.object({
  isActive: z.boolean(),
  rewardAmount: z.coerce.number().min(0, 'Reward amount cannot be negative'),
});

export const applyReferralCodeSchema = z.object({
  referralCode: z.string().min(8, 'Referral code must be exactly 8 characters').max(8),
});

export type UpdateReferralSettingsInput = z.infer<typeof updateReferralSettingsSchema>;
export type ApplyReferralCodeInput = z.infer<typeof applyReferralCodeSchema>;
