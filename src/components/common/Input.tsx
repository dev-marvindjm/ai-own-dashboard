import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, className, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
    return (
      <div className="space-y-1.5">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-gray-700 dark:text-slate-300">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            'w-full rounded-xl border px-4 py-2.5 text-sm transition-all duration-200',
            'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-gray-400 dark:placeholder:text-slate-500',
            'focus:outline-none focus:ring-2 focus:ring-trading-info/30 focus:border-trading-info',
            error
              ? 'border-trading-loss focus:ring-trading-loss/30 focus:border-trading-loss'
              : 'border-gray-300 dark:border-slate-700 hover:border-gray-400 dark:hover:border-slate-600',
            className
          )}
          {...props}
        />
        {error && <p className="text-xs text-trading-loss mt-1">{error}</p>}
        {hint && !error && <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">{hint}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
