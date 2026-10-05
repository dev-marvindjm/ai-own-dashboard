import { cn } from '@/lib/utils';

interface ProgressBarProps {
  value: number;
  color: 'green' | 'red' | 'blue' | 'amber' | 'purple';
  label?: string;
  showPercent?: boolean;
}

const colorMap = {
  green: 'bg-trading-win',
  red: 'bg-trading-loss',
  blue: 'bg-trading-info',
  amber: 'bg-trading-pending',
  purple: 'bg-trading-template',
};

export function ProgressBar({ value, color, label, showPercent }: ProgressBarProps) {
  const clampedValue = Math.min(100, Math.max(0, value));

  return (
    <div className="w-full">
      {(label || showPercent) && (
        <div className="flex justify-between items-center mb-1.5 text-sm">
          {label && <span className="font-medium text-gray-700">{label}</span>}
          {showPercent && <span className="text-gray-500">{clampedValue.toFixed(0)}%</span>}
        </div>
      )}
      <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all duration-500 ease-out", colorMap[color])}
          style={{ width: `${clampedValue}%` }}
        />
      </div>
    </div>
  );
}
