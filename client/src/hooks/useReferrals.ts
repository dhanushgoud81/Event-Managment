import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { referralApi } from '@/api/referral.api';
import toast from 'react-hot-toast';
import { getErrorMessage } from '@/api/axios';
import type { ReferralSettings, ApplyReferralRequest } from '@/types/referral.types';

export function useWallet() {
  return useQuery({
    queryKey: ['wallet'],
    queryFn: () => referralApi.getWallet(),
  });
}

export function useMyReferrals() {
  return useQuery({
    queryKey: ['my-referrals'],
    queryFn: () => referralApi.listMyReferrals(),
  });
}

export function useApplyReferral() {
  return useMutation({
    mutationFn: (data: ApplyReferralRequest) => referralApi.applyReferralCode(data),
    onSuccess: (response) => {
      toast.success(response.data.message);
      // Store referral code in localStorage so RegistrationPage can access it during checkout!
      localStorage.setItem('applied_referral_code', response.data.referralCode);
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}

export function useReferralSettings() {
  return useQuery({
    queryKey: ['referral-settings'],
    queryFn: () => referralApi.getSettings(),
  });
}

export function useUpdateReferralSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ReferralSettings) => referralApi.updateSettings(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['referral-settings'] });
      toast.success('Referral settings updated successfully');
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}
