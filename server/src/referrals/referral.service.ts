import { prisma } from '../config/database';
import { ApiError } from '../utils/api-error';
import { logAudit } from '../middleware/audit.middleware';
import type { UpdateReferralSettingsInput, ApplyReferralCodeInput } from './referral.validator';
import { Request } from 'express';

export class ReferralService {
  /**
   * Get wallet balance and transactions for a user
   */
  async getWallet(userId: string) {
    let wallet = await prisma.wallet.findUnique({
      where: { userId },
      include: {
        transactions: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    // If wallet doesn't exist, create it dynamically (lazy initialization)
    if (!wallet) {
      wallet = await prisma.wallet.create({
        data: {
          userId,
          balance: 0,
        },
        include: {
          transactions: true,
        },
      });
    }

    return wallet;
  }

  /**
   * Get list of referrals made by a user (referred users and completed status)
   */
  async getReferralsByUser(userId: string) {
    return prisma.referral.findMany({
      where: { referrerId: userId },
      include: {
        referred: {
          select: { firstName: true, lastName: true, email: true, createdAt: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Apply referral code to current user (validates code correctness)
   */
  async applyReferralCode(data: ApplyReferralCodeInput, userId: string, req?: Request) {
    const { referralCode } = data;

    // Check if referral settings are active
    const refSettingRecord = await prisma.systemSetting.findUnique({
      where: { key: 'referral_settings' },
    });
    const settingValue = refSettingRecord ? (refSettingRecord.value as any) : null;
    if (!settingValue || !settingValue.isActive) {
      throw ApiError.badRequest('Referral program is currently disabled');
    }

    // Find referrer
    const referrer = await prisma.user.findUnique({
      where: { referralCode },
    });

    if (!referrer) {
      throw ApiError.notFound('Referrer code not found');
    }

    if (referrer.id === userId) {
      throw ApiError.badRequest('You cannot refer yourself');
    }

    // Check if user has already registered for any events (referral only valid for new signups)
    const hasRegistrations = await prisma.registration.count({
      where: { userId },
    });
    if (hasRegistrations > 0) {
      throw ApiError.badRequest('Referral codes are only valid for new accounts with no previous registrations');
    }

    await logAudit(userId, 'User', userId, 'APPLY_REFERRAL_CODE_VALIDATION', null, { referralCode }, req);

    return {
      success: true,
      message: 'Referral code is valid! Code will be applied at ticket checkout.',
      referrerName: `${referrer.firstName} ${referrer.lastName}`,
      referralCode,
    };
  }

  /**
   * Admin: Get system-wide referral settings
   */
  async getReferralSettings() {
    const record = await prisma.systemSetting.findUnique({
      where: { key: 'referral_settings' },
    });

    if (!record) {
      return { isActive: false, rewardAmount: 50 };
    }

    return record.value;
  }

  /**
   * Admin: Update system-wide referral settings
   */
  async updateReferralSettings(data: UpdateReferralSettingsInput, userId: string, req?: Request) {
    const previous = await this.getReferralSettings();

    const record = await prisma.systemSetting.upsert({
      where: { key: 'referral_settings' },
      update: {
        value: data as any,
      },
      create: {
        key: 'referral_settings',
        value: data as any,
      },
    });

    await logAudit(userId, 'SystemSetting', record.id, 'UPDATE_REFERRAL_SETTINGS', previous, data, req);
    return record.value;
  }
}

export const referralService = new ReferralService();
