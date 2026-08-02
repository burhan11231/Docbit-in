import React from 'react';
import { cn } from '../../lib/utils';

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
};

export function Button({ className, variant = 'primary', size = 'md', ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none',
        {
          'bg-slate-900 text-white hover:bg-slate-800': variant === 'primary',
          'bg-slate-100 text-slate-900 hover:bg-slate-200': variant === 'secondary',
          'border border-slate-200 bg-transparent hover:bg-slate-100': variant === 'outline',
          'bg-transparent hover:bg-slate-100': variant === 'ghost',
          'bg-red-600 text-white hover:bg-red-700': variant === 'danger',
          'h-9 px-3 text-sm': size === 'sm',
          'h-10 px-4 py-2': size === 'md',
          'h-11 px-8': size === 'lg',
        },
        className
      )}
      {...props}
    />
  );
}
