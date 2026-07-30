import { prisma } from '../config/database';
import { ApiError } from '../utils/api-error';
import { config } from '../config';
import { logAudit } from '../middleware/audit.middleware';
import { qrService } from '../tickets/qr.service';
import { generateOrderId } from '../utils/generate-code';
import { PaymentStatus, RegistrationStatus, WalletTransactionType, Prisma } from '@prisma/client';
import type { CreateRazorpayOrderInput, VerifyPaymentInput, ListPaymentsQuery } from './payment.validator';
import { Request } from 'express';
import crypto from 'crypto';

// In case Razorpay API keys are missing, we simulate Razorpay sandbox payments in development mode
const isRazorpayMocked = !config.razorpay.keyId || !config.razorpay.keySecret;

export class PaymentService {
  /**
   * Create a Razorpay Order for a registration
   */
  async createOrder(data: CreateRazorpayOrderInput, userId: string, req?: Request) {
    const { registrationId } = data;

    const registration = await prisma.registration.findUnique({
      where: { id: registrationId },
      include: {
        event: { select: { name: true } },
        ticketCategory: { select: { name: true, price: true } },
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

    let razorpayOrderId = `order_mock_${crypto.randomBytes(8).toString('hex')}`;
    let receipt = `receipt_${registration.registrationNumber}`;

    if (!isRazorpayMocked) {
      try {
        const Razorpay = require('razorpay');
        const razorpay = new Razorpay({
          key_id: config.razorpay.keyId,
          key_secret: config.razorpay.keySecret,
        });

        const options = {
          amount: Math.round(price * 100), // Amount in paise
          currency: 'INR',
          receipt,
          notes: {
            registrationId,
            userId,
          },
        };

        const order = await razorpay.orders.create(options);
        razorpayOrderId = order.id;
      } catch (err: any) {
        throw ApiError.badRequest(`Razorpay order creation failed: ${err.message}`);
      }
    }

    // Create payment transaction record in database
    const payment = await prisma.payment.create({
      data: {
        orderId: generateOrderId(),
        registrationId,
        userId,
        amount: price,
        razorpayOrderId,
        status: PaymentStatus.PENDING,
      },
    });

    await logAudit(userId, 'Payment', payment.id, 'CREATE_PAYMENT_ORDER', null, payment, req);

    return {
      paymentId: payment.id,
      razorpayOrderId,
      amount: price,
      currency: 'INR',
      keyId: config.razorpay.keyId || 'mock_key_id',
      isMock: isRazorpayMocked,
      registration,
    };
  }

  /**
   * Verify Razorpay Payment Signature
   */
  async verifyPayment(data: VerifyPaymentInput, userId: string, req?: Request) {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature, registrationId } = data;

    const payment = await prisma.payment.findFirst({
      where: { razorpayOrderId, registrationId },
    });

    if (!payment) {
      throw ApiError.notFound('Payment transaction not found');
    }

    if (payment.status === PaymentStatus.SUCCESSFUL) {
      return { success: true, message: 'Payment already verified' };
    }

    // Verify signature
    if (!isRazorpayMocked) {
      const text = `${razorpayOrderId}|${razorpayPaymentId}`;
      const generated_signature = crypto
        .createHmac('sha256', config.razorpay.keySecret)
        .update(text)
        .digest('hex');

      if (generated_signature !== razorpaySignature) {
        // Mark payment as failed in db
        await prisma.payment.update({
          where: { id: payment.id },
          data: { status: PaymentStatus.FAILED, razorpayPaymentId },
        });
        throw ApiError.badRequest('Invalid payment signature verification failed');
      }
    }

    // Update payment, registration, wallet, and generate QR code in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update payment
      const updatedPayment = await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: PaymentStatus.SUCCESSFUL,
          razorpayPaymentId,
          razorpaySignature: isRazorpayMocked ? 'mock_sig' : razorpaySignature,
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
