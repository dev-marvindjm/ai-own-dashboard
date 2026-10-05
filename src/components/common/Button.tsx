import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

const sizeMap = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base',
  icon: 'p-2 w-9 h-9 flex items-center justify-center text-sm',
};

const variantMap = {
  primary: 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm shadow-indigo-200 dark:shadow-none',
  secondary: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700',
  success: 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm shadow-emerald-200 dark:shadow-none',
  danger: 'bg-rose-600 text-white hover:bg-rose-700 shadow-sm shadow-rose-200 dark:shadow-none',
  destructive: 'bg-rose-600 text-white hover:bg-rose-700 shadow-sm shadow-rose-200 dark:shadow-none',
  ghost: 'bg-transparent text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100',
  outline: 'bg-transparent border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800',
};

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof variantMap;
  size?: keyof typeof sizeMap;
  icon?: LucideIcon;
  children?: React.ReactNode;
}

export function Button({
  variant = 'primary',
  size = 'md',
  icon: Icon,
  className,
  children,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-all duration-200 cursor-pointer',
        'focus:outline-none focus:ring-2 focus:ring-indigo-500/30',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        variantMap[variant] || variantMap.primary,
        sizeMap[size] || sizeMap.md,
        className
      )}
      disabled={disabled}
      {...props}
    >
      {Icon && <Icon className="w-4 h-4 shrink-0" />}
      {children}
    </button>
  );
}
