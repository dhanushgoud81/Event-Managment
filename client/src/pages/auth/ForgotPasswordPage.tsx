import React from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useForgotPassword } from '@/hooks/useAuth';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';

const schema = z.object({
  email: z.string().email('Please enter a valid email'),
});

type ForgotPasswordForm = z.infer<typeof schema>;

export const ForgotPasswordPage: React.FC = () => {
  const mutation = useForgotPassword();
  const [isSubmitted, setIsSubmitted] = React.useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordForm>({
    resolver: zodResolver(schema),
  });

  const onSubmit = (data: ForgotPasswordForm) => {
    mutation.mutate(data, {
      onSuccess: () => setIsSubmitted(true),
    });
  };

  if (isSubmitted) {
    return (
      <div className="text-center">
        <div className="w-16 h-16 rounded-full bg-success-100 flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-8 h-8 text-success-500" />
        </div>
        <h2 className="text-2xl font-bold text-surface-900 dark:text-white">
          Check your email
        </h2>
        <p className="mt-3 text-surface-500 max-w-sm mx-auto">
          If an account exists with that email, we've sent a password reset link. Check your inbox and spam folder.
        </p>
        <Link to="/login" className="mt-6 inline-block">
          <Button variant="secondary" leftIcon={<ArrowLeft className="w-4 h-4" />}>
            Back to login
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl sm:text-3xl font-bold text-surface-900 dark:text-white">
        Forgot your password?
      </h2>
      <p className="mt-2 text-surface-500">
        No worries! Enter your email and we'll send you a reset link.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-5">
        <Input
          label="Email Address"
          type="email"
          placeholder="you@example.com"
          leftIcon={<Mail className="w-4 h-4" />}
          error={errors.email?.message}
          {...register('email')}
        />

        <Button
          type="submit"
          fullWidth
          size="lg"
          isLoading={mutation.isPending}
        >
          Send Reset Link
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-surface-500">
        <Link
          to="/login"
          className="font-semibold text-primary-600 hover:text-primary-500 transition-colors inline-flex items-center gap-1"
        >
          <ArrowLeft className="w-3 h-3" /> Back to login
        </Link>
      </p>
    </div>
  );
};
