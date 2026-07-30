import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from '@/components/Sidebar';
import { useUIStore } from '@/store/ui.store';
import { useAuthStore } from '@/store/auth.store';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Dropdown, DropdownItem, DropdownDivider } from '@/components/ui/Dropdown';
import {
  Menu,
  Bell,
  Search,
  LogOut,
  User,
  Settings,
  ChevronDown,
  Moon,
  Sun,
} from 'lucide-react';
import { clsx } from 'clsx';

export const DashboardLayout: React.FC = () => {
  const { isSidebarCollapsed, setSidebarOpen, theme, setTheme } = useUIStore();
  const { user } = useAuthStore();
  const location = useLocation();

  // Get page title from path
  const getPageTitle = () => {
    const segment = location.pathname.split('/').pop() || 'dashboard';
    return segment
      .split('-')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  };

  return (
    <div className="min-h-screen flex bg-surface-50 dark:bg-surface-950">
      <Sidebar />

      <div className={clsx('flex-1 flex flex-col min-h-screen transition-all duration-300')}>
        {/* Top Header */}
        <header className="sticky top-0 z-30 bg-white/80 dark:bg-surface-900/80 backdrop-blur-xl border-b border-surface-200/50 dark:border-surface-700/50">
          <div className="flex items-center justify-between px-4 lg:px-6 h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 rounded-lg text-surface-600 hover:bg-surface-100 dark:hover:bg-surface-800"
              >
                <Menu className="w-5 h-5" />
              </button>

              <div>
                <h1 className="text-lg font-bold text-surface-900 dark:text-surface-100">
                  {getPageTitle()}
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Theme toggle */}
              <button
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="p-2 rounded-lg text-surface-500 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
              >
                {theme === 'dark' ? (
                  <Sun className="w-5 h-5" />
                ) : (
                  <Moon className="w-5 h-5" />
                )}
              </button>

              {/* Notifications */}
              <button className="p-2 rounded-lg text-surface-500 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors relative">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-danger-500 rounded-full" />
              </button>

              {/* User menu */}
              {user && (
                <Dropdown
                  trigger={
                    <div className="flex items-center gap-2 px-2 py-1.5 rounded-xl hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors cursor-pointer">
                      <Avatar
                        src={user.avatarUrl}
                        name={`${user.firstName} ${user.lastName}`}
                        size="sm"
                      />
                      <ChevronDown className="w-4 h-4 text-surface-400 hidden sm:block" />
                    </div>
                  }
                >
                  <div className="px-3 py-2 border-b border-surface-200 dark:border-surface-700">
                    <p className="text-sm font-semibold">{user.firstName} {user.lastName}</p>
                    <p className="text-xs text-surface-500">{user.email}</p>
                  </div>
                  <DropdownItem icon={<User className="w-4 h-4" />}>
                    Profile
                  </DropdownItem>
                  <DropdownItem icon={<Settings className="w-4 h-4" />}>
                    Settings
                  </DropdownItem>
                  <DropdownDivider />
                  <DropdownItem
                    icon={<LogOut className="w-4 h-4" />}
                    danger
                    onClick={() => {
                      useAuthStore.getState().logout();
                      window.location.href = '/login';
                    }}
                  >
                    Logout
                  </DropdownItem>
                </Dropdown>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
