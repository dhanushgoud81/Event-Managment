import React from 'react';
import { useAdminStats } from '@/hooks/useDashboard';
import { PageLoader } from '@/components/ui/Spinner';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Users, Calendar, Award, IndianRupee } from 'lucide-react';
import { format } from 'date-fns';

export const AdminDashboardPage: React.FC = () => {
  const { data, isLoading } = useAdminStats();

  if (isLoading) return <PageLoader message="Loading overview stats..." />;

  const adminStats = data?.data;
  const stats = adminStats?.stats || {
    totalUsers: 0,
    totalEvents: 0,
    totalRegistrations: 0,
    totalRevenue: 0,
  };

  const recentRegs = adminStats?.recentRegistrations || [];
  const recentPayments = adminStats?.recentPayments || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-surface-900 dark:text-white">Admin Dashboard</h1>
        <p className="text-surface-500">Overview of users activity, ticketing sales, and registrations.</p>
      </div>

      {/* Metrics Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="flex items-center gap-4 border-l-4 border-l-primary-500">
          <div className="p-3 bg-primary-100 rounded-lg text-primary-600">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-surface-400 font-semibold uppercase tracking-wider">Total Users</p>
            <p className="text-2xl font-black mt-0.5">{stats.totalUsers}</p>
          </div>
        </Card>

        <Card className="flex items-center gap-4 border-l-4 border-l-accent-500">
          <div className="p-3 bg-accent-100 rounded-lg text-accent-600">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-surface-400 font-semibold uppercase tracking-wider">Active Events</p>
            <p className="text-2xl font-black mt-0.5">{stats.totalEvents}</p>
          </div>
        </Card>

        <Card className="flex items-center gap-4 border-l-4 border-l-success-500">
          <div className="p-3 bg-success-100 rounded-lg text-success-600">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-surface-400 font-semibold uppercase tracking-wider">Registrations</p>
            <p className="text-2xl font-black mt-0.5">{stats.totalRegistrations}</p>
          </div>
        </Card>

        <Card className="flex items-center gap-4 border-l-4 border-l-warning-500">
          <div className="p-3 bg-warning-100 rounded-lg text-warning-600">
            <IndianRupee className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-surface-400 font-semibold uppercase tracking-wider">Total Revenue</p>
            <p className="text-2xl font-black mt-0.5">₹{stats.totalRevenue}</p>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent registrations */}
        <Card className="space-y-4">
          <h3 className="font-bold text-lg text-surface-900 dark:text-white">Recent Registrations</h3>
          {recentRegs.length === 0 ? (
            <p className="text-sm text-surface-400 text-center py-6">No registrations found.</p>
          ) : (
            <div className="divide-y divide-surface-100 dark:divide-surface-700/50">
              {recentRegs.map((reg) => (
                <div key={reg.id} className="py-3 flex justify-between items-center text-sm">
                  <div>
                    <p className="font-semibold text-surface-900 dark:text-white">
                      {reg.user?.firstName} {reg.user?.lastName}
                    </p>
                    <p className="text-xs text-surface-400 mt-0.5">{reg.event?.name}</p>
                  </div>
                  <Badge variant={reg.status === 'CONFIRMED' ? 'success' : 'warning'}>
                    {reg.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Recent payments */}
        <Card className="space-y-4">
          <h3 className="font-bold text-lg text-surface-900 dark:text-white">Recent Transactions</h3>
          {recentPayments.length === 0 ? (
            <p className="text-sm text-surface-400 text-center py-6">No successful transactions.</p>
          ) : (
            <div className="divide-y divide-surface-100 dark:divide-surface-700/50">
              {recentPayments.map((pay) => (
                <div key={pay.id} className="py-3 flex justify-between items-center text-sm">
                  <div>
                    <p className="font-semibold text-surface-900 dark:text-white">
                      ₹{pay.amount} ({pay.currency})
                    </p>
                    <p className="text-xs text-surface-400 mt-0.5">
                      By: {pay.user?.firstName} {pay.user?.lastName}
                    </p>
                  </div>
                  <span className="text-xs text-surface-400">
                    {format(new Date(pay.createdAt), 'PP p')}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};
