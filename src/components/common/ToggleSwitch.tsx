import { cn } from '@/lib/utils';

interface ToggleSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
}

export function ToggleSwitch({ checked, onChange, label, disabled }: ToggleSwitchProps) {
  return (
    <label className={cn("flex items-center cursor-pointer", disabled && "opacity-50 cursor-not-allowed")}>
      <div className="relative">
        <input
          type="checkbox"
          className="sr-only"
          checked={checked}
          onChange={(e) => !disabled && onChange(e.target.checked)}
          disabled={disabled}
        />
        <div 
          className={cn(
            "block w-10 h-6 rounded-full transition-colors duration-200 ease-in-out",
            checked ? "bg-trading-win" : "bg-gray-200"
          )}
        />
        <div 
          className={cn(
            "absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform duration-200 ease-in-out shadow-sm",
            checked ? "transform translate-x-4" : ""
          )}
        />
      </div>
      {label && <span className="ml-3 text-sm font-medium text-gray-700">{label}</span>}
    </label>
  );
}
