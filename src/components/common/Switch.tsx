import { cn } from '@/lib/utils';

export interface SwitchProps {
  checked: boolean;
  onCheckedChange?: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
  className?: string;
}

export function Switch({ checked, onCheckedChange, label, disabled, className }: SwitchProps) {
  return (
    <label
      className={cn(
        'inline-flex items-center gap-2.5 cursor-pointer select-none',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
    >
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => !disabled && onCheckedChange?.(!checked)}
        className={cn(
          'relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 cursor-pointer',
          'focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:ring-offset-2',
          checked ? 'bg-emerald-500' : 'bg-slate-300'
        )}
      >
        <span
          className={cn(
            'pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-md transition-transform duration-200',
            checked ? 'translate-x-5' : 'translate-x-0'
          )}
        />
      </button>
      {label && <span className="text-sm font-medium text-slate-700">{label}</span>}
    </label>
  );
}
