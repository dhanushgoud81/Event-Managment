import React from 'react';
import { clsx } from 'clsx';
import { motion } from 'framer-motion';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeClasses = {
  sm: 'w-4 h-4',
  md: 'w-8 h-8',
  lg: 'w-12 h-12',
  xl: 'w-16 h-16',
};

export const Spinner: React.FC<SpinnerProps> = ({ size = 'md', className }) => {
  return (
    <div className={clsx('relative', sizeClasses[size], className)}>
      <motion.div
        className="absolute inset-0 rounded-full border-2 border-primary-200 dark:border-primary-900"
      />
      <motion.div
        className="absolute inset-0 rounded-full border-2 border-transparent border-t-primary-500"
        animate={{ rotate: 360 }}
        transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
      />
    </div>
  );
};

interface PageLoaderProps {
  message?: string;
}

export const PageLoader: React.FC<PageLoaderProps> = ({ message = 'Loading...' }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <Spinner size="xl" />
      <p className="text-surface-500 text-sm animate-pulse">{message}</p>
    </div>
  );
};
