import React from 'react';
import { useUserStats } from '@/hooks/useDashboard';
import { useAuthStore } from '@/store/auth.store';
import { PageLoader } from '@/components/ui/Spinner';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Calendar, Wallet, Bell, Clock, Compass } from 'lucide-react';
import { format } from 'date-fns';

export const UserDashboardPage: React.FC = () => {
  const { user } = useAuthStore();
  const { data, isLoading } = useUserStats();

  if (isLoading) return <PageLoader message="Loading dashboard overview..." />;

  const userStats = data?.data;
  const stats = userStats?.stats || {
    registrationsCount: 0,
    walletBalance: 0,
    unreadNotificationsCount: 0,
  };

  const registrations = userStats?.myRegistrations || [];
  const notifications = userStats?.recentNotifications || [];

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div>
        <h1 className="text-2xl font-bold text-surface-900 dark:text-white">
          Welcome back, {user?.firstName}!
        </h1>
        <p className="text-surface-500">Track and manage your upcoming events and referral reward wallet.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="flex items-center gap-4">
          <div className="p-3 bg-primary-100 text-primary-600 rounded-lg">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-surface-400 font-semibold uppercase tracking-wider">My Tickets</p>
            <p className="text-2xl font-black mt-0.5">{stats.registrationsCount}</p>
          </div>
        </Card>

        <Card className="flex items-center gap-4">
          <div className="p-3 bg-success-100 text-success-600 rounded-lg">
            <Wallet className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-surface-400 font-semibold uppercase tracking-wider">Wallet Balance</p>
            <p className="text-2xl font-black mt-0.5">₹{stats.walletBalance}</p>
          </div>
        </Card>

        <Card className="flex items-center gap-4">
          <div className="p-3 bg-warning-100 text-warning-600 rounded-lg">
            <Bell className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-surface-400 font-semibold uppercase tracking-wider">New Alerts</p>
            <p className="text-2xl font-black mt-0.5">{stats.unreadNotificationsCount}</p>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Registered tickets */}
        <Card className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-lg text-surface-900 dark:text-white">My Registrations</h3>
            <a href="/dashboard/my-tickets" className="text-xs text-primary-500 font-semibold hover:underline">
              View all
            </a>
          </div>

          {registrations.length === 0 ? (
            <div className="text-center py-8 space-y-2">
              <Compass className="w-8 h-8 text-surface-300 mx-auto" />
              <p className="text-sm text-surface-400">You haven't registered for any events yet.</p>
              <a href="/events" className="btn-primary btn-xs mt-1.5 px-3 py-1 rounded">
                Browse Events
              </a>
            </div>
          ) : (
            <div className="divide-y divide-surface-100 dark:divide-surface-700/50">
              {registrations.map((reg) => (
                <div key={reg.id} className="py-3 flex justify-between items-center text-sm">
                  <div>
                    <p className="font-bold text-surface-800 dark:text-white truncate max-w-[200px]">
                      {reg.event?.name}
                    </p>
                    <p className="text-xs text-surface-400 flex items-center gap-1 mt-0.5">
                      <Clock className="w-3.5 h-3.5" />
                      {reg.event?.startDate ? format(new Date(reg.event.startDate), 'PP') : ''}
                    </p>
                  </div>
                  <Badge variant={reg.status === 'CONFIRMED' ? 'success' : 'warning'}>
                    {reg.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Notifications */}
        <Card className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-lg text-surface-900 dark:text-white">Recent Activity</h3>
            <a href="/dashboard/notifications" className="text-xs text-primary-500 font-semibold hover:underline">
              Inbox
            </a>
          </div>

          {notifications.length === 0 ? (
            <p className="text-sm text-surface-400 text-center py-8">No new activity alerts.</p>
          ) : (
            <div className="space-y-3">
              {notifications.map((n) => (
                <div key={n.id} className="bg-surface-50 dark:bg-surface-850 p-3 rounded-lg text-xs leading-relaxed">
                  <div className="flex justify-between font-bold text-surface-800 dark:text-white">
                    <span>{n.title}</span>
                    <span className="text-4xs text-surface-400">{format(new Date(n.createdAt), 'PP')}</span>
                  </div>
                  <p className="text-surface-500 mt-1">{n.message}</p>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};
