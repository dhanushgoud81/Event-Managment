import React from 'react';
import { clsx } from 'clsx';

type BadgeVariant = 'primary' | 'success' | 'warning' | 'danger' | 'surface' | 'custom';
type BadgeSize = 'sm' | 'md';

interface BadgeProps {
  variant?: BadgeVariant;
  size?: BadgeSize;
  dot?: boolean;
  className?: string;
  children: React.ReactNode;
}

const variantClasses: Record<BadgeVariant, string> = {
  primary: 'badge-primary',
  success: 'badge-success',
  warning: 'badge-warning',
  danger: 'badge-danger',
  surface: 'badge-surface',
  custom: '',
};

const sizeClasses: Record<BadgeSize, string> = {
  sm: 'text-2xs px-2 py-0.5',
  md: 'text-xs px-2.5 py-0.5',
};

export const Badge: React.FC<BadgeProps> = ({
  variant = 'primary',
  size = 'md',
  dot = false,
  className,
  children,
}) => {
  return (
    <span
      className={clsx(
        'badge',
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
    >
      {dot && (
        <span
          className={clsx(
            'w-1.5 h-1.5 rounded-full',
            variant === 'success' && 'bg-success-500',
            variant === 'warning' && 'bg-warning-500',
            variant === 'danger' && 'bg-danger-500',
            variant === 'primary' && 'bg-primary-500',
            variant === 'surface' && 'bg-surface-500'
          )}
        />
      )}
      {children}
    </span>
  );
};

// Status-specific badge helpers
export const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const statusMap: Record<string, { variant: BadgeVariant; label: string }> = {
    DRAFT: { variant: 'surface', label: 'Draft' },
    PUBLISHED: { variant: 'success', label: 'Published' },
    CLOSED: { variant: 'warning', label: 'Closed' },
    CANCELLED: { variant: 'danger', label: 'Cancelled' },
    ARCHIVED: { variant: 'surface', label: 'Archived' },
    ACTIVE: { variant: 'success', label: 'Active' },
    INACTIVE: { variant: 'surface', label: 'Inactive' },
    SOLD_OUT: { variant: 'danger', label: 'Sold Out' },
    PENDING: { variant: 'warning', label: 'Pending' },
    CONFIRMED: { variant: 'success', label: 'Confirmed' },
    REFUNDED: { variant: 'danger', label: 'Refunded' },
    CREATED: { variant: 'surface', label: 'Created' },
    SUCCESSFUL: { variant: 'success', label: 'Successful' },
    FAILED: { variant: 'danger', label: 'Failed' },
    COMPLETED: { variant: 'success', label: 'Completed' },
    REJECTED: { variant: 'danger', label: 'Rejected' },
  };

  const config = statusMap[status] || { variant: 'surface' as BadgeVariant, label: status };

  return (
    <Badge variant={config.variant} dot>
      {config.label}
    </Badge>
  );
};
