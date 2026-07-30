import React from 'react';
import { useNotifications, useMarkNotificationRead, useMarkAllNotificationsRead } from '@/hooks/useNotifications';
import { PageLoader } from '@/components/ui/Spinner';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Bell, BellOff, CheckCheck, Inbox } from 'lucide-react';
import { format } from 'date-fns';

export const NotificationsPage: React.FC = () => {
  const { data, isLoading } = useNotifications();
  const readMutation = useMarkNotificationRead();
  const readAllMutation = useMarkAllNotificationsRead();

  if (isLoading) return <PageLoader message="Loading inbox..." />;

  const notifications = data?.data || [];
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-surface-900 dark:text-white">Notification Center</h1>
          <p className="text-surface-500">Stay updated on ticket verifications, registration status, and promotions.</p>
        </div>

        {unreadCount > 0 && (
          <Button
            size="sm"
            variant="outline"
            leftIcon={<CheckCheck className="w-4 h-4" />}
            onClick={() => readAllMutation.mutate()}
            disabled={readAllMutation.isPending}
          >
            Mark all as read
          </Button>
        )}
      </div>

      {notifications.length === 0 ? (
        <Card className="text-center py-12 flex flex-col items-center justify-center space-y-3">
          <div className="w-12 h-12 bg-surface-100 rounded-full flex items-center justify-center text-surface-400">
            <Inbox className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold">Your inbox is clean</h3>
          <p className="text-surface-500">You don't have any notifications at the moment.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {notifications.map((n) => (
            <Card
              key={n.id}
              onClick={() => !n.isRead && readMutation.mutate(n.id)}
              className={`flex items-start gap-4 transition-all relative border-l-4 ${
                n.isRead
                  ? 'border-l-surface-200 opacity-70 bg-white dark:bg-surface-800'
                  : 'border-l-primary-500 bg-primary-50/5 cursor-pointer hover:bg-primary-50/10'
              }`}
            >
              <div className="flex-1 space-y-1">
                <div className="flex justify-between items-start gap-4">
                  <h4 className={`font-bold text-sm ${n.isRead ? 'text-surface-700' : 'text-surface-900 dark:text-white'}`}>
                    {n.title}
                  </h4>
                  <span className="text-3xs text-surface-400 uppercase tracking-wider flex-shrink-0 mt-0.5">
                    {format(new Date(n.createdAt), 'PP p')}
                  </span>
                </div>
                <p className="text-sm text-surface-500 leading-relaxed">{n.message}</p>
              </div>

              {!n.isRead && (
                <span className="w-2.5 h-2.5 rounded-full bg-primary-500 absolute top-4 right-4 flex-shrink-0 animate-pulse" />
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
