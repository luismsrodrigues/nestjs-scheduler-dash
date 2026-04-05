import { cn } from '@/lib/utils';

export function Card({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={cn('rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900', className)}>
      {children}
    </div>
  );
}

export function CardHeader({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn('px-5 py-4 border-b border-zinc-200 dark:border-zinc-800', className)}>{children}</div>;
}

export function CardTitle({ className, children }: { className?: string; children: React.ReactNode }) {
  return <h3 className={cn('text-sm font-semibold text-zinc-900 dark:text-zinc-100 tracking-wide', className)}>{children}</h3>;
}

export function CardContent({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn('p-5', className)}>{children}</div>;
}
