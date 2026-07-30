import { prisma } from '../config/database';
import { ApiError } from '../utils/api-error';
import { config } from '../config';
import { logAudit } from '../middleware/audit.middleware';
import { qrService } from '../tickets/qr.service';
import { generateOrderId } from '../utils/generate-code';
import { PaymentStatus, RegistrationStatus, WalletTransactionType, Prisma } from '@prisma/client';
import type { CreatePaymentOrderInput, VerifyPaymentInput, ListPaymentsQuery } from './payment.validator';
import { Request } from 'express';
import axios from 'axios';
import crypto from 'crypto';

const isCashfreeConfigured = !!(config.cashfree.clientId && config.cashfree.clientSecret);

export class PaymentService {
  /**
   * Create a Cashfree Order for a registration
   */
  async createOrder(data: CreatePaymentOrderInput, userId: string, req?: Request) {
    const { registrationId } = data;

    const registration = await prisma.registration.findUnique({
      where: { id: registrationId },
      include: {
        event: { select: { name: true } },
        ticketCategory: { select: { name: true, price: true } },
        user: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
      },
    });

    if (!registration) {
      throw ApiError.notFound('Registration not found');
    }

    if (registration.userId !== userId) {
      throw ApiError.forbidden('You are not authorized to pay for this registration');
    }

    if (registration.status !== RegistrationStatus.PENDING) {
      throw ApiError.badRequest('This registration is not pending payment');
    }

    const price = registration.amountPaid.toNumber();
    if (price <= 0) {
      throw ApiError.badRequest('Free tickets do not require a payment order');
    }

    const cashfreeOrderId = `order_${crypto.randomBytes(8).toString('hex')}`;
    let paymentSessionId = `session_mock_${crypto.randomBytes(8).toString('hex')}`;
    const isMock = !isCashfreeConfigured;

    if (isCashfreeConfigured) {
      try {
        const returnUrl = `${config.appUrl}/dashboard/payments?regId=${registrationId}&order_id=${cashfreeOrderId}`;
        const phone = registration.user.phone || '9999999999';
        const customerName = `${registration.user.firstName} ${registration.user.lastName}`.trim() || 'Attendee';

        const cashfreeResponse = await axios.post(
          `${config.cashfree.baseUrl}/orders`,
          {
            order_id: cashfreeOrderId,
            order_amount: price,
            order_currency: 'INR',
            customer_details: {
              customer_id: registration.user.id,
              customer_email: registration.user.email,
              customer_name: customerName,
              customer_phone: phone,
            },
            order_meta: {
              return_url: returnUrl,
              notify_url: `${config.apiUrl}/api/payments/webhook`,
            },
          },
          {
            headers: {
              'x-client-id': config.cashfree.clientId,
              'x-client-secret': config.cashfree.clientSecret,
              'x-api-version': '2023-08-01',
              'Content-Type': 'application/json',
            },
          }
        );

        paymentSessionId = cashfreeResponse.data.payment_session_id;
      } catch (err: any) {
        const errorMsg = err.response?.data?.message || err.message;
        throw ApiError.badRequest(`Cashfree order creation failed: ${errorMsg}`);
      }
    }

    // Create payment transaction record in database
    const payment = await prisma.payment.create({
      data: {
        orderId: generateOrderId(),
        registrationId,
        userId,
        amount: price,
        razorpayOrderId: cashfreeOrderId, // stored in existing DB schema field
        status: PaymentStatus.PENDING,
      },
    });

    await logAudit(userId, 'Payment', payment.id, 'CREATE_PAYMENT_ORDER', null, payment, req);

    return {
      paymentId: payment.id,
      cashfreeOrderId,
      paymentSessionId,
      amount: price,
      currency: 'INR',
      environment: config.cashfree.env,
      isMock,
      registration,
    };
  }

  /**
   * Verify Cashfree Payment Status
   */
  async verifyPayment(data: VerifyPaymentInput, userId: string, req?: Request) {
    const { cashfreeOrderId, registrationId } = data;

    const payment = await prisma.payment.findFirst({
      where: { razorpayOrderId: cashfreeOrderId, registrationId },
    });

    if (!payment) {
      throw ApiError.notFound('Payment transaction not found');
    }

    if (payment.status === PaymentStatus.SUCCESSFUL) {
      return { success: true, message: 'Payment already verified' };
    }

    let isSuccessful = false;
    let paymentIdFromGateway = `pay_mock_${crypto.randomBytes(6).toString('hex')}`;
    let paymentMethod = 'CASHFREE';

    if (isCashfreeConfigured) {
      try {
        const response = await axios.get(
          `${config.cashfree.baseUrl}/orders/${cashfreeOrderId}/payments`,
          {
            headers: {
              'x-client-id': config.cashfree.clientId,
              'x-client-secret': config.cashfree.clientSecret,
              'x-api-version': '2023-08-01',
              'Content-Type': 'application/json',
            },
          }
        );

        const payments = response.data;
        if (Array.isArray(payments) && payments.length > 0) {
          const successfulPayment = payments.find((p: any) => p.payment_status === 'SUCCESS');
          if (successfulPayment) {
            isSuccessful = true;
            paymentIdFromGateway = successfulPayment.cf_payment_id?.toString() || paymentIdFromGateway;
            paymentMethod = successfulPayment.payment_group || paymentMethod;
          } else {
            const latestPayment = payments[0];
            const status = latestPayment.payment_status || 'FAILED';
            const message = latestPayment.payment_message || `Payment ${status.toLowerCase()}`;
            
            await prisma.payment.update({
              where: { id: payment.id },
              data: { status: PaymentStatus.FAILED, razorpayPaymentId: latestPayment.cf_payment_id?.toString() },
            });
            
            throw ApiError.badRequest(`Payment status: ${status} (${message})`);
          }
        } else {
          // User closed checkout modal or dropped before attempting payment
          throw ApiError.badRequest('Payment was cancelled or dropped before completion.');
        }
      } catch (err: any) {
        if (err instanceof ApiError) throw err;
        const errorMsg = err.response?.data?.message || err.message;
        throw ApiError.badRequest(`Cashfree verification error: ${errorMsg}`);
      }
    } else {
      // Mock mode
      isSuccessful = true;
    }

    if (!isSuccessful) {
      throw ApiError.badRequest('Payment verification failed');
    }

    // Update payment, registration, wallet, and generate QR code in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update payment
      const updatedPayment = await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: PaymentStatus.SUCCESSFUL,
          razorpayPaymentId: paymentIdFromGateway,
          method: paymentMethod,
        },
      });

      // Update registration status to CONFIRMED
      const updatedReg = await tx.registration.update({
        where: { id: registrationId },
        data: {
          status: RegistrationStatus.CONFIRMED,
        },
      });

      // Find referral record for this signup
      const referral = await tx.referral.findFirst({
        where: { referredId: userId, status: 'PENDING' },
      });

      if (referral) {
        // Fetch reward setting configuration from SystemSetting
        const refSettingRecord = await tx.systemSetting.findUnique({
          where: { key: 'referral_settings' },
        });
        const settingValue = refSettingRecord ? (refSettingRecord.value as any) : null;

        if (settingValue && settingValue.isActive) {
          const rewardAmount = Number(settingValue.rewardAmount || 0);

          // Increment referrer wallet balance
          const referrerWallet = await tx.wallet.findUnique({
            where: { userId: referral.referrerId },
          });

          if (referrerWallet) {
            const newBalance = referrerWallet.balance.toNumber() + rewardAmount;

            await tx.wallet.update({
              where: { userId: referral.referrerId },
              data: { balance: newBalance },
            });

            // Log referral rewards transaction details
            await tx.walletTransaction.create({
              data: {
                walletId: referrerWallet.id,
                amount: rewardAmount,
                type: WalletTransactionType.CREDIT,
                balanceAfter: newBalance,
                description: `Reward for referring user ${userId}`,
              },
            });

            // Update referral status to COMPLETED
            await tx.referral.update({
              where: { id: referral.id },
              data: {
                status: 'COMPLETED',
                rewardAmount: rewardAmount,
              },
            });
          }
        }
      }

      return { payment: updatedPayment, registration: updatedReg };
    });

    // Generate QR code for the confirmed registration
    await qrService.generateQRCode(registrationId);

    await logAudit(userId, 'Payment', payment.id, 'VERIFY_PAYMENT_SUCCESS', payment, result.payment, req);

    return {
      success: true,
      message: 'Payment verified and ticket confirmed successfully!',
      registration: result.registration,
    };
  }

  /**
   * Cashfree Webhook Processor
   */
  async processWebhook(payload: any) {
    // Optionally log to system settings or audit log
    const eventType = payload.type || payload.event || 'UNKNOWN';
    const data = payload.data || payload;

    if (data && data.order && data.order.order_id) {
      const cashfreeOrderId = data.order.order_id;
      const paymentStatus = data.payment?.payment_status;

      if (paymentStatus === 'SUCCESS') {
        const payment = await prisma.payment.findFirst({
          where: { razorpayOrderId: cashfreeOrderId },
        });

        if (payment && payment.status !== PaymentStatus.SUCCESSFUL) {
          await prisma.$transaction(async (tx) => {
            await tx.payment.update({
              where: { id: payment.id },
              data: {
                status: PaymentStatus.SUCCESSFUL,
                razorpayPaymentId: data.payment?.cf_payment_id?.toString(),
              },
            });

            await tx.registration.update({
              where: { id: payment.registrationId },
              data: { status: RegistrationStatus.CONFIRMED },
            });
          });

          await qrService.generateQRCode(payment.registrationId);
        }
      }
    }

    return { status: 'success', received: true, eventType };
  }

  /**
   * Admin list all payment transactions
   */
  async listPayments(query: ListPaymentsQuery) {
    const { page, limit, status, search, sortBy, sortOrder } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.PaymentWhereInput = {};

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { razorpayOrderId: { contains: search, mode: 'insensitive' } },
        { razorpayPaymentId: { contains: search, mode: 'insensitive' } },
        {
          user: {
            OR: [
              { email: { contains: search, mode: 'insensitive' } },
              { firstName: { contains: search, mode: 'insensitive' } },
              { lastName: { contains: search, mode: 'insensitive' } },
            ],
          },
        },
      ];
    }

    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where,
        include: {
          user: {
            select: { firstName: true, lastName: true, email: true },
          },
          registration: {
            include: {
              event: { select: { name: true } },
            },
          },
        },
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
      }),
      prisma.payment.count({ where }),
    ]);

    return { payments, total, page, limit };
  }
}

export const paymentService = new PaymentService();
