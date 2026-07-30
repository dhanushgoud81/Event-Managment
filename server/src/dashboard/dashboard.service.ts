import { prisma } from '../config/database';
import { PaymentStatus, RegistrationStatus } from '@prisma/client';

export class DashboardService {
  /**
   * Get reporting stats for Super Admin and Admins
   */
  async getAdminStats() {
    const [
      totalUsers,
      totalEvents,
      totalRegistrations,
      paymentsSummary,
      recentRegistrations,
      recentPayments,
    ] = await Promise.all([
      // Count total users
      prisma.user.count(),
      // Count active/published events
      prisma.event.count({
        where: { status: 'PUBLISHED' },
      }),
      // Count total registrations
      prisma.registration.count(),
      // Sum successful payment amounts
      prisma.payment.aggregate({
        where: { status: PaymentStatus.SUCCESSFUL },
        _sum: {
          amount: true,
        },
      }),
      // Get recent registration logs
      prisma.registration.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { firstName: true, lastName: true, email: true } },
          event: { select: { name: true } },
        },
      }),
      // Get recent successful payment transactions
      prisma.payment.findMany({
        where: { status: PaymentStatus.SUCCESSFUL },
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { firstName: true, lastName: true } },
        },
      }),
    ]);

    const totalRevenue = paymentsSummary._sum.amount?.toNumber() || 0;

    return {
      stats: {
        totalUsers,
        totalEvents,
        totalRegistrations,
        totalRevenue,
      },
      recentRegistrations,
      recentPayments,
    };
  }

  /**
   * Get user dashboard dashboard summary stats
   */
  async getUserStats(userId: string) {
    const [registrationsCount, walletRecord, recentNotifications, myRegistrations] =
      await Promise.all([
        // Number of event registrations
        prisma.registration.count({
          where: { userId },
        }),
        // Wallet balance
        prisma.wallet.findUnique({
          where: { userId },
          select: { balance: true },
        }),
        // Recent notifications
        prisma.notification.findMany({
          where: { userId, isRead: false },
          take: 5,
          orderBy: { createdAt: 'desc' },
        }),
        // List of registered tickets
        prisma.registration.findMany({
          where: { userId },
          take: 3,
          orderBy: { createdAt: 'desc' },
          include: {
            event: { select: { name: true, startDate: true, venue: true } },
            ticketCategory: { select: { name: true } },
          },
        }),
      ]);

    const walletBalance = walletRecord?.balance?.toNumber() || 0;

    return {
      stats: {
        registrationsCount,
        walletBalance,
        unreadNotificationsCount: recentNotifications.length,
      },
      recentNotifications,
      myRegistrations,
    };
  }

  /**
   * Admin view for system audit log auditing
   */
  async getAuditLogs(query: { page: number; limit: number; search?: string }) {
    const { page, limit, search } = query;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (search) {
      where.OR = [
        { action: { contains: search, mode: 'insensitive' } },
        { entityType: { contains: search, mode: 'insensitive' } },
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

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: {
          user: {
            select: { firstName: true, lastName: true, email: true },
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.auditLog.count({ where }),
    ]);

    return { logs, total, page, limit };
  }
}

export const dashboardService = new DashboardService();
