import api from './axios';
import type { ApiSuccessResponse } from '@/types/api.types';
import type { Wallet, Referral, ReferralSettings, ApplyReferralRequest, ApplyReferralResponse } from '@/types/referral.types';

export const referralApi = {
  getWallet: () =>
    api.get<ApiSuccessResponse<Wallet>>('/referrals/wallet').then((r) => r.data),

  listMyReferrals: () =>
    api.get<ApiSuccessResponse<Referral[]>>('/referrals/my').then((r) => r.data),

  applyReferralCode: (data: ApplyReferralRequest) =>
    api.post<ApiSuccessResponse<ApplyReferralResponse>>('/referrals/apply', data).then((r) => r.data),

  getSettings: () =>
    api.get<ApiSuccessResponse<ReferralSettings>>('/referrals/settings').then((r) => r.data),

  updateSettings: (data: ReferralSettings) =>
    api.put<ApiSuccessResponse<ReferralSettings>>('/referrals/settings', data).then((r) => r.data),
};
