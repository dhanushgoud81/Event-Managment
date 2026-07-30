import React from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useVerifyEmail } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { CheckCircle, XCircle, Mail } from 'lucide-react';

export const VerifyEmailPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const verifyMutation = useVerifyEmail();
  const [hasVerified, setHasVerified] = React.useState(false);

  React.useEffect(() => {
    if (token && !hasVerified) {
      setHasVerified(true);
      verifyMutation.mutate(token);
    }
  }, [token]);

  // No token — show info page
  if (!token) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center mx-auto mb-6">
            <Mail className="w-8 h-8 text-primary-500" />
          </div>
          <h2 className="text-2xl font-bold text-surface-900 dark:text-white">
            Check Your Email
          </h2>
          <p className="mt-3 text-surface-500">
            We've sent a verification link to your email address. Click the link
            to verify your account.
          </p>
          <Link to="/login" className="mt-6 inline-block">
            <Button variant="primary">Go to Login</Button>
          </Link>
        </div>
      </div>
    );
  }

  // Verifying
  if (verifyMutation.isPending) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <Spinner size="xl" className="mx-auto mb-4" />
          <p className="text-surface-500">Verifying your email...</p>
        </div>
      </div>
    );
  }

  // Success
  if (verifyMutation.isSuccess) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 rounded-full bg-success-100 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-8 h-8 text-success-500" />
          </div>
          <h2 className="text-2xl font-bold text-surface-900 dark:text-white">
            Email Verified! 🎉
          </h2>
          <p className="mt-3 text-surface-500">
            Your email has been verified successfully. You can now login to your account.
          </p>
          <Link to="/login" className="mt-6 inline-block">
            <Button variant="primary">Continue to Login</Button>
          </Link>
        </div>
      </div>
    );
  }

  // Error
  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 rounded-full bg-danger-100 flex items-center justify-center mx-auto mb-6">
          <XCircle className="w-8 h-8 text-danger-500" />
        </div>
        <h2 className="text-2xl font-bold text-surface-900 dark:text-white">
          Verification Failed
        </h2>
        <p className="mt-3 text-surface-500">
          This verification link is invalid or has expired. Please request a new one.
        </p>
        <Link to="/login" className="mt-6 inline-block">
          <Button variant="primary">Go to Login</Button>
        </Link>
      </div>
    </div>
  );
};
