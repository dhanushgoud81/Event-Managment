import React from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRegister } from '@/hooks/useAuth';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Mail, Lock, User, Phone, Gift } from 'lucide-react';

const registerSchema = z
  .object({
    firstName: z.string().min(2, 'At least 2 characters').max(50),
    lastName: z.string().min(2, 'At least 2 characters').max(50),
    email: z.string().email('Please enter a valid email'),
    phone: z.string().regex(/^\+?[1-9]\d{6,14}$/, 'Invalid phone number').optional().or(z.literal('')),
    password: z
      .string()
      .min(8, 'At least 8 characters')
      .regex(/[A-Z]/, 'Must contain an uppercase letter')
      .regex(/[a-z]/, 'Must contain a lowercase letter')
      .regex(/[0-9]/, 'Must contain a number')
      .regex(/[^A-Za-z0-9]/, 'Must contain a special character'),
    confirmPassword: z.string(),
    referralCode: z.string().optional().or(z.literal('')),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type RegisterForm = z.infer<typeof registerSchema>;

export const RegisterPage: React.FC = () => {
  const registerMutation = useRegister();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = (data: RegisterForm) => {
    registerMutation.mutate({
      ...data,
      phone: data.phone || undefined,
      referralCode: data.referralCode || undefined,
    });
  };

  return (
    <div>
      <h2 className="text-2xl sm:text-3xl font-bold text-surface-900 dark:text-white">
        Create your account
      </h2>
      <p className="mt-2 text-surface-500">
        Join EventHub and start discovering events
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="First Name"
            placeholder="John"
            leftIcon={<User className="w-4 h-4" />}
            error={errors.firstName?.message}
            required
            {...register('firstName')}
          />
          <Input
            label="Last Name"
            placeholder="Doe"
            error={errors.lastName?.message}
            required
            {...register('lastName')}
          />
        </div>

        <Input
          label="Email Address"
          type="email"
          placeholder="you@example.com"
          leftIcon={<Mail className="w-4 h-4" />}
          error={errors.email?.message}
          required
          {...register('email')}
        />

        <Input
          label="Phone Number"
          type="tel"
          placeholder="+91XXXXXXXXXX"
          leftIcon={<Phone className="w-4 h-4" />}
          error={errors.phone?.message}
          hint="Optional"
          {...register('phone')}
        />

        <Input
          label="Password"
          type="password"
          placeholder="Create a strong password"
          leftIcon={<Lock className="w-4 h-4" />}
          error={errors.password?.message}
          hint="Min 8 chars with uppercase, lowercase, number & special character"
          required
          {...register('password')}
        />

        <Input
          label="Confirm Password"
          type="password"
          placeholder="Confirm your password"
          leftIcon={<Lock className="w-4 h-4" />}
          error={errors.confirmPassword?.message}
          required
          {...register('confirmPassword')}
        />

        <Input
          label="Referral Code"
          placeholder="Enter referral code (optional)"
          leftIcon={<Gift className="w-4 h-4" />}
          error={errors.referralCode?.message}
          hint="Got a code from a friend? Enter it here!"
          {...register('referralCode')}
        />

        <Button
          type="submit"
          fullWidth
          size="lg"
          isLoading={registerMutation.isPending}
          className="mt-2"
        >
          Create Account
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-surface-500">
        Already have an account?{' '}
        <Link
          to="/login"
          className="font-semibold text-primary-600 hover:text-primary-500 transition-colors"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
};
