import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@/store/auth.store';
import { useUIStore } from '@/store/ui.store';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { Dropdown, DropdownItem, DropdownDivider } from '@/components/ui/Dropdown';
import {
  Menu,
  X,
  Sparkles,
  LogOut,
  User,
  Settings,
  LayoutDashboard,
  ChevronDown,
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const location = useLocation();
  const { isAuthenticated, user } = useAuthStore();
  const { isMobileMenuOpen, toggleMobileMenu, closeMobileMenu } = useUIStore();

  const navLinks = [
    { path: '/', label: 'Home' },
    { path: '/events', label: 'Events' },
    { path: '/about', label: 'About' },
    { path: '/contact', label: 'Contact' },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="sticky top-0 z-40 bg-white/80 dark:bg-surface-900/80 backdrop-blur-xl border-b border-surface-200/50 dark:border-surface-700/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link
            to="/"
            className="flex items-center gap-2 font-bold text-xl"
            onClick={closeMobileMenu}
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="gradient-text hidden sm:block">EventHub</span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive(link.path)
                    ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400'
                    : 'text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-surface-100 hover:bg-surface-100 dark:hover:bg-surface-800'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Auth Section */}
          <div className="hidden md:flex items-center gap-3">
            {isAuthenticated && user ? (
              <Dropdown
                trigger={
                  <div className="flex items-center gap-2 px-2 py-1.5 rounded-xl hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors cursor-pointer">
                    <Avatar
                      src={user.avatarUrl}
                      name={`${user.firstName} ${user.lastName}`}
                      size="sm"
                    />
                    <span className="text-sm font-medium text-surface-700 dark:text-surface-300">
                      {user.firstName}
                    </span>
                    <ChevronDown className="w-4 h-4 text-surface-400" />
                  </div>
                }
              >
                <div className="px-3 py-2 border-b border-surface-200 dark:border-surface-700">
                  <p className="text-sm font-semibold text-surface-900 dark:text-surface-100">
                    {user.firstName} {user.lastName}
                  </p>
                  <p className="text-xs text-surface-500">{user.email}</p>
                </div>
                <Link to={['SUPER_ADMIN', 'ADMIN', 'EVENT_MANAGER'].includes(user.role) ? '/admin/dashboard' : '/dashboard'}>
                  <DropdownItem icon={<LayoutDashboard className="w-4 h-4" />}>
                    Dashboard
                  </DropdownItem>
                </Link>
                <Link to="/dashboard/profile">
                  <DropdownItem icon={<User className="w-4 h-4" />}>
                    Profile
                  </DropdownItem>
                </Link>
                <Link to="/dashboard/settings">
                  <DropdownItem icon={<Settings className="w-4 h-4" />}>
                    Settings
                  </DropdownItem>
                </Link>
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
            ) : (
              <>
                <Link to="/login">
                  <Button variant="ghost" size="sm">
                    Log In
                  </Button>
                </Link>
                <Link to="/register">
                  <Button variant="primary" size="sm">
                    Get Started
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2 rounded-lg text-surface-600 hover:bg-surface-100 dark:hover:bg-surface-800"
            onClick={toggleMobileMenu}
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900"
          >
            <div className="px-4 py-4 space-y-1">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={closeMobileMenu}
                  className={`block px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive(link.path)
                      ? 'bg-primary-50 text-primary-600'
                      : 'text-surface-600 hover:bg-surface-100'
                  }`}
                >
                  {link.label}
                </Link>
              ))}

              <div className="pt-3 mt-3 border-t border-surface-200 dark:border-surface-700 space-y-2">
                {isAuthenticated ? (
                  <Link to="/dashboard" onClick={closeMobileMenu}>
                    <Button variant="primary" fullWidth>
                      Dashboard
                    </Button>
                  </Link>
                ) : (
                  <>
                    <Link to="/login" onClick={closeMobileMenu}>
                      <Button variant="secondary" fullWidth>
                        Log In
                      </Button>
                    </Link>
                    <Link to="/register" onClick={closeMobileMenu}>
                      <Button variant="primary" fullWidth>
                        Get Started
                      </Button>
                    </Link>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};
