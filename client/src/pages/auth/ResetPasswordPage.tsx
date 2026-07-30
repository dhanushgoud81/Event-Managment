import React from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useResetPassword } from '@/hooks/useAuth';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Lock, ArrowLeft } from 'lucide-react';

const schema = z
  .object({
    password: z
      .string()
      .min(8, 'At least 8 characters')
      .regex(/[A-Z]/, 'Must contain an uppercase letter')
      .regex(/[a-z]/, 'Must contain a lowercase letter')
      .regex(/[0-9]/, 'Must contain a number')
      .regex(/[^A-Za-z0-9]/, 'Must contain a special character'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type ResetForm = z.infer<typeof schema>;

export const ResetPasswordPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const mutation = useResetPassword();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetForm>({
    resolver: zodResolver(schema),
  });

  const onSubmit = (data: ResetForm) => {
    mutation.mutate({ token, ...data });
  };

  if (!token) {
    return (
      <div className="text-center">
        <h2 className="text-2xl font-bold text-surface-900 dark:text-white">
          Invalid Reset Link
        </h2>
        <p className="mt-3 text-surface-500">
          This password reset link is invalid or has expired.
        </p>
        <Link to="/forgot-password" className="mt-6 inline-block">
          <Button variant="primary">Request New Link</Button>
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl sm:text-3xl font-bold text-surface-900 dark:text-white">
        Reset your password
      </h2>
      <p className="mt-2 text-surface-500">
        Enter your new password below.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-5">
        <Input
          label="New Password"
          type="password"
          placeholder="Create a new password"
          leftIcon={<Lock className="w-4 h-4" />}
          error={errors.password?.message}
          hint="Min 8 chars with uppercase, lowercase, number & special character"
          {...register('password')}
        />

        <Input
          label="Confirm New Password"
          type="password"
          placeholder="Confirm your new password"
          leftIcon={<Lock className="w-4 h-4" />}
          error={errors.confirmPassword?.message}
          {...register('confirmPassword')}
        />

        <Button
          type="submit"
          fullWidth
          size="lg"
          isLoading={mutation.isPending}
        >
          Reset Password
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
