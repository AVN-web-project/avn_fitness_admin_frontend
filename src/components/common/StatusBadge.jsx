import React from 'react';
import { getStatusConfig } from '../../utils/formatStatus.js';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export const StatusBadge = ({ status, customLabel, size = 'sm', className = '' }) => {
  const config = getStatusConfig(status);
  const label = customLabel || config.label;

  const variantStyles = {
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800',
    warning: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800',
    danger: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800',
    info: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800',
    default: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
  };

  const sizeStyles = {
    xs: 'text-[10px] px-1.5 py-0.5',
    sm: 'text-xs px-2.5 py-0.5 font-medium',
    md: 'text-sm px-3 py-1 font-medium',
  };

  return (
    <span
      className={twMerge(
        clsx(
          'inline-flex items-center rounded-full border tracking-wide uppercase font-semibold',
          sizeStyles[size],
          variantStyles[config.variant] || variantStyles.default,
          className
        )
      )}
    >
      <span className={clsx(
        'w-1.5 h-1.5 rounded-full mr-1.5',
        config.variant === 'success' && 'bg-emerald-500',
        config.variant === 'warning' && 'bg-amber-500',
        config.variant === 'danger' && 'bg-rose-500',
        config.variant === 'info' && 'bg-blue-500',
        config.variant === 'default' && 'bg-slate-400'
      )} />
      {label}
    </span>
  );
};

export default StatusBadge;
