import { Request, Response, NextFunction } from 'express';
import { paymentService } from './payment.service';
import { qrService } from '../tickets/qr.service';
import { ApiResponse } from '../utils/api-response';

export class PaymentController {
  /**
   * POST /api/payments/orders
   */
  async createOrder(req: Request, res: Response, next: NextFunction) {
    try {
      const order = await paymentService.createOrder(req.body, req.user!.userId, req);
      return ApiResponse.success(res, order, 'Cashfree order created successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/payments/verify
   */
  async verifyPayment(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await paymentService.verifyPayment(req.body, req.user!.userId, req);
      return ApiResponse.success(res, result, 'Payment verified successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/payments/webhook
   */
  async handleWebhook(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await paymentService.processWebhook(req.body);
      return res.status(200).json(result);
    } catch (error) {
      // Always return 200 to Cashfree webhook so it doesn't retry infinitely on error
      return res.status(200).json({ status: 'error', received: true });
    }
  }

  /**
   * GET /api/payments
   */
  async listPayments(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await paymentService.listPayments(req.query as any);
      return ApiResponse.paginated(
        res,
        result.payments,
        result.total,
        result.page,
        result.limit,
        'Payments retrieved successfully'
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/payments/scan-checkin (Admins and managers scanning tickets at door)
   */
  async scanCheckIn(req: Request, res: Response, next: NextFunction) {
    try {
      const { code } = req.body;
      const checkin = await qrService.scanQRCode(code as string, req.user!.userId, req);
      return ApiResponse.success(res, checkin, checkin.message);
    } catch (error) {
      next(error);
    }
  }
}

export const paymentController = new PaymentController();
