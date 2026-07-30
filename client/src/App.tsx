import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ToastProvider } from '@/components/ui/Toast';
import { PageLoader } from '@/components/ui/Spinner';

// Layouts
import { PublicLayout } from '@/layouts/PublicLayout';
import { AuthLayout } from '@/layouts/AuthLayout';
import { DashboardLayout } from '@/layouts/DashboardLayout';

// Route Guards
import { ProtectedRoute, PublicOnlyRoute } from '@/components/ProtectedRoute';

// Public Pages
import { HomePage } from '@/pages/public/HomePage';

// Auth Pages
import { LoginPage } from '@/pages/auth/LoginPage';
import { RegisterPage } from '@/pages/auth/RegisterPage';
import { ForgotPasswordPage } from '@/pages/auth/ForgotPasswordPage';
import { ResetPasswordPage } from '@/pages/auth/ResetPasswordPage';
import { VerifyEmailPage } from '@/pages/auth/VerifyEmailPage';

// Phase 2 Pages
import { EventsPage } from '@/pages/public/EventsPage';
import { EventDetailPage } from '@/pages/public/EventDetailPage';
import { AboutPage } from '@/pages/public/AboutPage';
import { ContactPage } from '@/pages/public/ContactPage';
import { EventsListPage } from '@/pages/admin/EventsListPage';
import { CreateEventPage } from '@/pages/admin/CreateEventPage';
import { EditEventPage } from '@/pages/admin/EditEventPage';
import { TicketManagementPage } from '@/pages/admin/TicketManagementPage';

// Phase 3 Pages
import { FormBuilderPage } from '@/pages/admin/FormBuilderPage';
import { RegistrationPage } from '@/pages/user/RegistrationPage';

// Phase 4 Pages
import { MyTicketsPage } from '@/pages/user/MyTicketsPage';
import { QRCodesPage } from '@/pages/user/QRCodesPage';
import { PaymentsPage } from '@/pages/user/PaymentsPage';
import { PaymentsListPage } from '@/pages/admin/PaymentsListPage';

// Phase 5 Pages
import { WalletPage } from '@/pages/user/WalletPage';
import { ReferralsPage } from '@/pages/user/ReferralsPage';
import { NotificationsPage } from '@/pages/user/NotificationsPage';

// Phase 6 Pages
import { UserDashboardPage } from '@/pages/user/UserDashboardPage';
import { AdminDashboardPage } from '@/pages/admin/AdminDashboardPage';
import { AuditLogsPage } from '@/pages/admin/AuditLogsPage';
import { SettingsPage } from '@/pages/admin/SettingsPage';

// Query Client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000,
    },
    mutations: {
      retry: 0,
    },
  },
});

// Placeholder components for dashboard pages (will be built in later phases)
const DashboardPlaceholder: React.FC<{ title: string }> = ({ title }) => (
  <div className="flex items-center justify-center min-h-[50vh]">
    <div className="text-center">
      <h2 className="text-2xl font-bold text-surface-900 dark:text-white mb-2">{title}</h2>
      <p className="text-surface-500">Coming in Phase 2-6</p>
    </div>
  </div>
);

const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ToastProvider />

        <Routes>
          {/* ─── Public Routes ─────────────── */}
          <Route element={<PublicLayout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/events" element={<EventsPage />} />
            <Route path="/events/:id" element={<EventDetailPage />} />
            <Route
              path="/events/:id/register"
              element={
                <ProtectedRoute>
                  <RegistrationPage />
                </ProtectedRoute>
              }
            />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/verify-email" element={<VerifyEmailPage />} />
          </Route>

          {/* ─── Auth Routes ───────────────── */}
          <Route
            element={
              <PublicOnlyRoute>
                <AuthLayout />
              </PublicOnlyRoute>
            }
          >
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
          </Route>

          {/* ─── User Dashboard Routes ─────── */}
          <Route
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/dashboard" element={<UserDashboardPage />} />
            <Route path="/dashboard/my-events" element={<DashboardPlaceholder title="My Events" />} />
            <Route path="/dashboard/my-tickets" element={<MyTicketsPage />} />
            <Route path="/dashboard/payments" element={<PaymentsPage />} />
            <Route path="/dashboard/qr-codes" element={<QRCodesPage />} />
            <Route path="/dashboard/referrals" element={<ReferralsPage />} />
            <Route path="/dashboard/wallet" element={<WalletPage />} />
            <Route path="/dashboard/notifications" element={<NotificationsPage />} />
            <Route path="/dashboard/profile" element={<DashboardPlaceholder title="Profile" />} />
            <Route path="/dashboard/settings" element={<DashboardPlaceholder title="Settings" />} />
          </Route>

          {/* ─── Admin Dashboard Routes ────── */}
          <Route
            element={
              <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN', 'EVENT_MANAGER']}>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
            <Route path="/admin/events" element={<EventsListPage />} />
            <Route path="/admin/events/create" element={<CreateEventPage />} />
            <Route path="/admin/events/:id/edit" element={<EditEventPage />} />
            <Route path="/admin/events/:id/tickets" element={<TicketManagementPage />} />
            <Route path="/admin/events/:id/form-builder" element={<FormBuilderPage />} />
             <Route path="/admin/registrations" element={<DashboardPlaceholder title="Registrations" />} />
            <Route path="/admin/payments" element={<PaymentsListPage />} />
            <Route path="/admin/users" element={<DashboardPlaceholder title="Users" />} />
             <Route path="/admin/reports" element={<DashboardPlaceholder title="Reports" />} />
            <Route path="/admin/audit-logs" element={<AuditLogsPage />} />
            <Route path="/admin/settings" element={<SettingsPage />} />
          </Route>

          {/* ─── 404 ──────────────────────── */}
          <Route
            path="*"
            element={
              <div className="min-h-screen flex items-center justify-center bg-surface-50 dark:bg-surface-950">
                <div className="text-center">
                  <h1 className="text-6xl font-black gradient-text mb-4">404</h1>
                  <p className="text-xl text-surface-500 mb-8">Page not found</p>
                  <a href="/" className="btn-primary btn-lg">
                    Go Home
                  </a>
                </div>
              </div>
            }
          />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export default App;
