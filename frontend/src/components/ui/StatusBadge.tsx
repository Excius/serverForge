import { cn } from '@/lib/utils';

export type ServerStatus = 'running' | 'starting' | 'stopping' | 'stopped' | 'error' | 'unknown';

interface StatusBadgeProps {
  status: ServerStatus;
  className?: string;
  showText?: boolean;
}

export function StatusBadge({ status, className, showText = true }: StatusBadgeProps) {
  const configs: Record<ServerStatus, { bg: string; border: string; text: string; dot: string; pulse?: string }> = {
    running: {
      bg: 'bg-emerald-950/60',
      border: 'border-emerald-500/30',
      text: 'text-emerald-400',
      dot: 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]',
      pulse: 'animate-pulse',
    },
    starting: {
      bg: 'bg-sky-950/60',
      border: 'border-sky-500/30',
      text: 'text-sky-400',
      dot: 'bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.8)]',
      pulse: 'animate-ping',
    },
    stopping: {
      bg: 'bg-amber-950/60',
      border: 'border-amber-500/30',
      text: 'text-amber-400',
      dot: 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]',
      pulse: 'animate-pulse',
    },
    stopped: {
      bg: 'bg-zinc-900/80',
      border: 'border-zinc-700/50',
      text: 'text-zinc-400',
      dot: 'bg-zinc-500',
    },
    error: {
      bg: 'bg-rose-950/60',
      border: 'border-rose-500/30',
      text: 'text-rose-400',
      dot: 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.8)]',
      pulse: 'animate-pulse',
    },
    unknown: {
      bg: 'bg-zinc-900/60',
      border: 'border-zinc-800',
      text: 'text-zinc-500',
      dot: 'bg-zinc-600',
    },
  };

  const config = configs[status] || configs.unknown;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-semibold border uppercase tracking-wider backdrop-blur-sm select-none',
        config.bg,
        config.border,
        config.text,
        className
      )}
    >
      <span className="relative flex h-2 w-2 items-center justify-center">
        {config.pulse && (
          <span
            className={cn(
              'absolute inline-flex h-full w-full rounded-full opacity-75',
              config.dot,
              config.pulse
            )}
          />
        )}
        <span className={cn('relative inline-flex rounded-full h-2 w-2', config.dot)} />
      </span>
      {showText && <span>{status}</span>}
    </span>
  );
}
