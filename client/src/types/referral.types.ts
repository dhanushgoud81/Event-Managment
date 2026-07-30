import { User } from './auth.types';

export type ReferralStatus = 'PENDING' | 'COMPLETED' | 'REJECTED';
export type WalletTransactionType = 'CREDIT' | 'DEBIT';

export interface WalletTransaction {
  id: string;
  walletId: string;
  referralId?: string | null;
  type: WalletTransactionType;
  amount: number;
  balanceAfter: number;
  description: string;
  createdAt: string;
}

export interface Wallet {
  id: string;
  userId: string;
  balance: number;
  updatedAt: string;
  transactions?: WalletTransaction[];
}

export interface Referral {
  id: string;
  referrerId: string;
  referredId: string;
  registrationId: string;
  rewardAmount: number;
  status: ReferralStatus;
  createdAt: string;
  updatedAt: string;
  referred?: User;
}

export interface ReferralSettings {
  isActive: boolean;
  rewardAmount: number;
}

export interface ApplyReferralRequest {
  referralCode: string;
}

export interface ApplyReferralResponse {
  success: boolean;
  message: string;
  referrerName: string;
  referralCode: string;
}
