import React from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'indigo' | 'emerald' | 'amber' | 'rose' | 'outline' | 'purple';
}

export function Badge({ className, variant = 'default', children, ...props }: BadgeProps) {
  const variants = {
    default: 'bg-zinc-800/80 text-zinc-300 border-zinc-700/60',
    indigo: 'bg-indigo-950/70 text-indigo-300 border-indigo-500/30',
    emerald: 'bg-emerald-950/70 text-emerald-300 border-emerald-500/30',
    amber: 'bg-amber-950/70 text-amber-300 border-amber-500/30',
    rose: 'bg-rose-950/70 text-rose-300 border-rose-500/30',
    purple: 'bg-purple-950/70 text-purple-300 border-purple-500/30',
    outline: 'bg-transparent text-zinc-400 border-zinc-700',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border transition-colors',
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
