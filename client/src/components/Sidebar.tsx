import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@/store/auth.store';
import { useUIStore } from '@/store/ui.store';
import { clsx } from 'clsx';
import {
  LayoutDashboard,
  Calendar,
  Users,
  Ticket,
  CreditCard,
  FileText,
  Settings,
  BarChart3,
  Gift,
  Wallet,
  Bell,
  User,
  Shield,
  ClipboardList,
  FormInput,
  ChevronLeft,
  Sparkles,
  QrCode,
  X,
} from 'lucide-react';

interface NavItem {
  path: string;
  label: string;
  icon: React.ElementType;
}

const adminNavItems: NavItem[] = [
  { path: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/admin/events', label: 'Events', icon: Calendar },
  { path: '/admin/registrations', label: 'Registrations', icon: ClipboardList },
  { path: '/admin/payments', label: 'Payments', icon: CreditCard },
  { path: '/admin/users', label: 'Users', icon: Users },
  { path: '/admin/reports', label: 'Reports', icon: BarChart3 },
  { path: '/admin/audit-logs', label: 'Audit Logs', icon: FileText },
  { path: '/admin/settings', label: 'Settings', icon: Settings },
];

const userNavItems: NavItem[] = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/dashboard/my-events', label: 'My Events', icon: Calendar },
  { path: '/dashboard/my-tickets', label: 'My Tickets', icon: Ticket },
  { path: '/dashboard/payments', label: 'Payments', icon: CreditCard },
  { path: '/dashboard/qr-codes', label: 'QR Codes', icon: QrCode },
  { path: '/dashboard/referrals', label: 'Referrals', icon: Gift },
  { path: '/dashboard/wallet', label: 'Wallet', icon: Wallet },
  { path: '/dashboard/notifications', label: 'Notifications', icon: Bell },
  { path: '/dashboard/profile', label: 'Profile', icon: User },
];

export const Sidebar: React.FC = () => {
  const user = useAuthStore((s) => s.user);
  const { isSidebarCollapsed, toggleSidebarCollapse, isSidebarOpen, setSidebarOpen } = useUIStore();
  const location = useLocation();

  const isAdmin = user && ['SUPER_ADMIN', 'ADMIN', 'EVENT_MANAGER'].includes(user.role);
  const navItems = isAdmin ? adminNavItems : userNavItems;

  return (
    <>
      {/* Mobile overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="lg:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside
        className={clsx(
          'fixed lg:sticky top-0 left-0 z-50 lg:z-auto h-screen',
          'bg-white dark:bg-surface-900 border-r border-surface-200 dark:border-surface-700',
          'transition-all duration-300 ease-in-out flex flex-col',
          isSidebarCollapsed ? 'w-[72px]' : 'w-64',
          // Mobile: translate off-screen
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-surface-200 dark:border-surface-700">
          {!isSidebarCollapsed && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-lg gradient-text">EventHub</span>
            </div>
          )}
          <button
            onClick={() => {
              if (window.innerWidth < 1024) {
                setSidebarOpen(false);
              } else {
                toggleSidebarCollapse();
              }
            }}
            className="p-1.5 rounded-lg text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
          >
            {window.innerWidth < 1024 ? (
              <X className="w-5 h-5" />
            ) : (
              <ChevronLeft
                className={clsx(
                  'w-5 h-5 transition-transform',
                  isSidebarCollapsed && 'rotate-180'
                )}
              />
            )}
          </button>
        </div>

        {/* Nav Items */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {isAdmin && !isSidebarCollapsed && (
            <div className="px-3 mb-2">
              <span className="text-2xs font-semibold uppercase tracking-wider text-surface-400">
                Administration
              </span>
            </div>
          )}

          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => {
                  if (window.innerWidth < 1024) setSidebarOpen(false);
                }}
                className={clsx(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group relative',
                  isActive
                    ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400'
                    : 'text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800 hover:text-surface-900 dark:hover:text-surface-200',
                  isSidebarCollapsed && 'justify-center'
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="sidebar-active"
                    className="absolute inset-0 bg-primary-50 dark:bg-primary-900/30 rounded-xl"
                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                  />
                )}
                <item.icon className={clsx('w-5 h-5 flex-shrink-0 relative z-10', isActive && 'text-primary-500')} />
                {!isSidebarCollapsed && (
                  <span className="relative z-10">{item.label}</span>
                )}

                {/* Tooltip for collapsed sidebar */}
                {isSidebarCollapsed && (
                  <div className="absolute left-full ml-2 px-2 py-1 bg-surface-900 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50">
                    {item.label}
                  </div>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* User info at bottom */}
        {user && !isSidebarCollapsed && (
          <div className="p-4 border-t border-surface-200 dark:border-surface-700">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white text-xs font-bold">
                {user.firstName[0]}{user.lastName[0]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-surface-900 dark:text-surface-100 truncate">
                  {user.firstName} {user.lastName}
                </p>
                <p className="text-xs text-surface-500 truncate">{user.role.replace('_', ' ')}</p>
              </div>
            </div>
          </div>
        )}
      </aside>
    </>
  );
};
