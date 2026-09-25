import React from 'react';
import { cn } from '@/lib/utils';

export function Table({ className, ...props }: React.TableHTMLAttributes<HTMLTableElement>) {
  return (
    <div className="w-full overflow-x-auto rounded-xl border border-white/10 bg-zinc-900/40 backdrop-blur-md shadow-xl">
      <table className={cn('w-full text-left text-sm text-zinc-300 border-collapse', className)} {...props} />
    </div>
  );
}

export function TableHeader({ className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return <thead className={cn('bg-zinc-950/80 border-b border-white/10 text-xs font-semibold text-zinc-400 uppercase tracking-wider', className)} {...props} />;
}

export function TableRow({ className, ...props }: React.HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr
      className={cn(
        'border-b border-white/5 transition-colors duration-150 hover:bg-zinc-800/40 last:border-b-0',
        className
      )}
      {...props}
    />
  );
}

export function TableHead({ className, ...props }: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return <th className={cn('px-6 py-4 font-semibold text-zinc-300', className)} {...props} />;
}

export function TableBody({ className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return <tbody className={cn('divide-y divide-white/5', className)} {...props} />;
}

export function TableCell({ className, ...props }: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return <td className={cn('px-6 py-4 align-middle text-zinc-200', className)} {...props} />;
}
