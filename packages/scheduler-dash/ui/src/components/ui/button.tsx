import { cn } from '@/lib/utils';
import { ButtonHTMLAttributes } from 'react';

type Variant = 'default' | 'ghost' | 'destructive' | 'outline';
type Size = 'sm' | 'md' | 'icon';

const variants: Record<Variant, string> = {
  default:     'bg-teal-500 hover:bg-teal-400 text-zinc-950 font-semibold',
  ghost:       'bg-transparent hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100',
  destructive: 'bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20',
  outline:     'bg-transparent border border-zinc-300 dark:border-zinc-700 hover:border-zinc-400 dark:hover:border-zinc-500 text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100',
};

const sizes: Record<Size, string> = {
  sm:   'px-3 py-1.5 text-xs h-7',
  md:   'px-4 py-2 text-sm h-9',
  icon: 'w-8 h-8 p-0 flex items-center justify-center',
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

export function Button({ variant = 'default', size = 'md', className, children, ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center gap-1.5 rounded transition-all duration-150 cursor-pointer',
        'disabled:opacity-40 disabled:cursor-not-allowed',
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
