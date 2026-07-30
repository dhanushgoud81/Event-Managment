import { Request, Response, NextFunction } from 'express';
import { referralService } from './referral.service';
import { ApiResponse } from '../utils/api-response';

export class ReferralController {
  /**
   * GET /api/referrals/wallet
   */
  async getWallet(req: Request, res: Response, next: NextFunction) {
    try {
      const wallet = await referralService.getWallet(req.user!.userId);
      return ApiResponse.success(res, wallet, 'Wallet details retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/referrals/my
   */
  async listMyReferrals(req: Request, res: Response, next: NextFunction) {
    try {
      const referrals = await referralService.getReferralsByUser(req.user!.userId);
      return ApiResponse.success(res, referrals, 'Referrals retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/referrals/apply
   */
  async applyReferralCode(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await referralService.applyReferralCode(req.body, req.user!.userId, req);
      return ApiResponse.success(res, result, result.message);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/referrals/settings
   */
  async getSettings(req: Request, res: Response, next: NextFunction) {
    try {
      const settings = await referralService.getReferralSettings();
      return ApiResponse.success(res, settings, 'Referral settings retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/referrals/settings
   */
  async updateSettings(req: Request, res: Response, next: NextFunction) {
    try {
      const settings = await referralService.updateReferralSettings(
        req.body,
        req.user!.userId,
        req
      );

      return ApiResponse.success(res, settings, 'Referral settings updated successfully');
    } catch (error) {
      next(error);
    }
  }
}

export const referralController = new ReferralController();
