import { Registration } from './registration.types';
import { Payment } from './payment.types';
import { User } from './auth.types';

export interface AdminStats {
  stats: {
    totalUsers: number;
    totalEvents: number;
    totalRegistrations: number;
    totalRevenue: number;
  };
  recentRegistrations: Registration[];
  recentPayments: Payment[];
}

export interface UserStats {
  stats: {
    registrationsCount: number;
    walletBalance: number;
    unreadNotificationsCount: number;
  };
  recentNotifications: any[];
  myRegistrations: Registration[];
}

export interface AuditLog {
  id: string;
  userId?: string | null;
  entityType: string;
  entityId: string;
  action: string;
  previousValue?: any;
  updatedValue?: any;
  ipAddress?: string | null;
  userAgent?: string | null;
  createdAt: string;
  user?: User;
}
