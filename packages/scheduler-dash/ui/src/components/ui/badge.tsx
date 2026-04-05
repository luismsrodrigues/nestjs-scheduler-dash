import { cn } from '@/lib/utils';

type Variant = 'completed' | 'failed' | 'running' | 'queued' | 'stopped' | 'default';

const variants: Record<Variant, string> = {
  completed: 'bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 border-emerald-500/20',
  failed:    'bg-red-500/10 text-red-500 dark:text-red-400 border-red-500/20',
  running:   'bg-amber-500/10 text-amber-500 dark:text-amber-400 border-amber-500/20',
  queued:    'bg-blue-500/10 text-blue-500 dark:text-blue-400 border-blue-500/20',
  stopped:   'bg-zinc-500/10 text-zinc-500 dark:text-zinc-400 border-zinc-500/20',
  default:   'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700',
};

interface BadgeProps {
  variant?: Variant;
  children: React.ReactNode;
  className?: string;
}

export function Badge({ variant = 'default', children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-mono font-medium border',
        variants[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}
