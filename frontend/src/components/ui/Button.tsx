import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost' | 'glass';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  icon?: React.ReactNode;
}

export function Button({
  className,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  icon,
  children,
  disabled,
  ...props
}: ButtonProps) {
  const baseStyles =
    'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] select-none gap-2';

  const variants = {
    primary:
      'bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-lg shadow-indigo-600/25 border border-indigo-400/30 hover:shadow-indigo-500/40',
    secondary:
      'bg-zinc-800/80 hover:bg-zinc-700/80 text-zinc-100 border border-zinc-700/60 shadow-sm hover:border-zinc-600',
    outline:
      'bg-transparent hover:bg-zinc-800/60 text-zinc-300 border border-zinc-700 hover:text-white hover:border-zinc-500',
    danger:
      'bg-rose-600/90 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/20 border border-rose-500/30',
    ghost:
      'bg-transparent hover:bg-zinc-800/50 text-zinc-400 hover:text-zinc-100',
    glass:
      'glass-panel hover:bg-zinc-800/70 text-zinc-200 border border-white/10 hover:border-white/20 shadow-md',
  };

  const sizes = {
    sm: 'text-xs px-3 py-1.5 h-8',
    md: 'text-sm px-4 py-2 h-10',
    lg: 'text-base px-6 py-2.5 h-12',
  };

  return (
    <button
      className={cn(baseStyles, variants[variant], sizes[size], className)}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin text-current shrink-0" />
      ) : (
        icon && <span className="shrink-0">{icon}</span>
      )}
      {children}
    </button>
  );
}
