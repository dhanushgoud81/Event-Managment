import React from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useLogin } from '@/hooks/useAuth';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Mail, Lock } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});

type LoginForm = z.infer<typeof loginSchema>;

export const LoginPage: React.FC = () => {
  const loginMutation = useLogin();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = (data: LoginForm) => {
    loginMutation.mutate(data);
  };

  return (
    <div>
      <h2 className="text-2xl sm:text-3xl font-bold text-surface-900 dark:text-white">
        Welcome back
      </h2>
      <p className="mt-2 text-surface-500">
        Sign in to your account to continue
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

        <Input
          label="Password"
          type="password"
          placeholder="Enter your password"
          leftIcon={<Lock className="w-4 h-4" />}
          error={errors.password?.message}
          {...register('password')}
        />

        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              className="w-4 h-4 rounded border-surface-300 text-primary-500 focus:ring-primary-500"
            />
            <span className="text-sm text-surface-600">Remember me</span>
          </label>

          <Link
            to="/forgot-password"
            className="text-sm font-medium text-primary-600 hover:text-primary-500 transition-colors"
          >
            Forgot password?
          </Link>
        </div>

        <Button
          type="submit"
          fullWidth
          size="lg"
          isLoading={loginMutation.isPending}
        >
          Sign In
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-surface-500">
        Don't have an account?{' '}
        <Link
          to="/register"
          className="font-semibold text-primary-600 hover:text-primary-500 transition-colors"
        >
          Create one
        </Link>
      </p>
    </div>
  );
};
