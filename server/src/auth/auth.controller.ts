import { Request, Response, NextFunction } from 'express';
import { authService } from './auth.service';
import { ApiResponse } from '../utils/api-response';
import { config } from '../config';
import { parseExpiry } from '../utils/jwt';
import { CookieOptions } from 'express';

const getRefreshTokenCookieOptions = (): CookieOptions => ({
  httpOnly: true,
  secure: config.isProd,
  sameSite: 'strict',
  maxAge: parseExpiry(config.jwt.refreshExpiry),
  path: '/',
});

export class AuthController {
  /**
   * POST /api/auth/register
   */
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.register(
        req.body,
        req.ip
      );

      return ApiResponse.created(res, result.user, result.message);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/auth/login
   */
  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.login(
        req.body,
        req.ip,
        req.headers['user-agent']
      );

      // Set refresh token as HttpOnly cookie
      res.cookie('refreshToken', result.refreshToken, getRefreshTokenCookieOptions());

      // Don't send refresh token in JSON response
      const { refreshToken, ...responsePayload } = result;

      return ApiResponse.success(res, responsePayload, 'Login successful');
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/auth/logout
   */
  async logout(req: Request, res: Response, next: NextFunction) {
    try {
      const refreshToken = req.cookies.refreshToken;
      
      if (refreshToken) {
        await authService.logout(refreshToken, req.user!.userId);
      }

      // Clear the cookie regardless
      res.clearCookie('refreshToken', { path: '/' });

      return ApiResponse.success(res, null, 'Logged out successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/auth/refresh-token
   */
  async refreshToken(req: Request, res: Response, next: NextFunction) {
    try {
      const refreshToken = req.cookies.refreshToken;
      
      if (!refreshToken) {
        return res.status(401).json({ success: false, message: 'Refresh token missing' });
      }

      const result = await authService.refreshAccessToken(refreshToken);

      // Set new refresh token as HttpOnly cookie
      res.cookie('refreshToken', result.refreshToken, getRefreshTokenCookieOptions());

      // Don't send refresh token in JSON response
      const { refreshToken: _, ...responsePayload } = result;

      return ApiResponse.success(res, responsePayload, 'Token refreshed successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/auth/forgot-password
   */
  async forgotPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.forgotPassword(req.body);

      return ApiResponse.success(res, null, result.message);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/auth/reset-password
   */
  async resetPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.resetPassword(req.body);

      return ApiResponse.success(res, null, result.message);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/auth/verify-email/:token
   */
  async verifyEmail(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.verifyEmail(req.params.token as string);

      return ApiResponse.success(res, null, result.message);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/auth/change-password
   */
  async changePassword(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.changePassword(req.user!.userId, req.body);

      return ApiResponse.success(res, null, result.message);
    } catch (error) {
      next(error);
    }
  }
}

export const authController = new AuthController();
