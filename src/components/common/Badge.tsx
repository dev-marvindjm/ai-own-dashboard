import { cn } from '@/lib/utils';

const variants: Record<string, string> = {
  default: 'bg-gray-100 dark:bg-slate-800 text-gray-800 dark:text-slate-200',
  success: 'bg-green-50 dark:bg-green-950/40 text-trading-win border border-green-200 dark:border-green-800',
  danger: 'bg-red-50 dark:bg-red-950/40 text-trading-loss border border-red-200 dark:border-red-800',
  warning: 'bg-amber-50 dark:bg-amber-950/40 text-trading-pending border border-amber-200 dark:border-amber-800',
  info: 'bg-blue-50 dark:bg-blue-950/40 text-trading-info border border-blue-200 dark:border-blue-800',
  purple: 'bg-purple-50 dark:bg-purple-950/40 text-trading-template border border-purple-200 dark:border-purple-800',
  outline: 'bg-transparent border border-gray-300 dark:border-slate-700 text-gray-600 dark:text-slate-300',
};

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: keyof typeof variants;
  children: React.ReactNode;
}

export function Badge({ variant = 'default', className, children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium',
        variants[variant] || variants.default,
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
