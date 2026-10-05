import { cn } from '@/lib/utils';
import { LucideIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface KpiCardProps {
  title: string;
  value: string;
  trend?: number;
  icon: LucideIcon;
  color: 'green' | 'red' | 'blue' | 'amber' | 'purple';
  subtitle?: string;
}

const colorMap = {
  green: 'bg-trading-win text-trading-win ring-trading-win/20',
  red: 'bg-trading-loss text-trading-loss ring-trading-loss/20',
  blue: 'bg-trading-info text-trading-info ring-trading-info/20',
  amber: 'bg-trading-pending text-trading-pending ring-trading-pending/20',
  purple: 'bg-trading-template text-trading-template ring-trading-template/20',
};

const borderMap = {
  green: 'border-l-trading-win',
  red: 'border-l-trading-loss',
  blue: 'border-l-trading-info',
  amber: 'border-l-trading-pending',
  purple: 'border-l-trading-template',
};

export function KpiCard({ title, value, trend, icon: Icon, color, subtitle }: KpiCardProps) {
  const isPositive = trend && trend > 0;
  const isNegative = trend && trend < 0;

  return (
    <div className={cn(
      'bg-white rounded-xl shadow-sm border border-gray-100 p-5 relative overflow-hidden flex flex-col',
      'border-l-4',
      borderMap[color]
    )}>
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-sm font-medium text-gray-500 mb-1">{title}</h3>
          <div className="text-2xl font-bold text-gray-900">{value}</div>
        </div>
        <div className={cn(
          'p-2 rounded-xl ring-4 flex items-center justify-center bg-opacity-10 shrink-0',
          colorMap[color].split(' ')[0] + '/10',
          colorMap[color].split(' ')[1]
        )}>
          <Icon size={20} />
        </div>
      </div>
      
      {(trend !== undefined || subtitle) && (
        <div className="mt-auto flex items-center text-sm">
          {trend !== undefined && (
            <div className={cn(
              "flex items-center font-medium mr-2",
              isPositive ? "text-trading-win" : isNegative ? "text-trading-loss" : "text-gray-500"
            )}>
              {isPositive ? <TrendingUp size={16} className="mr-1" /> : isNegative ? <TrendingDown size={16} className="mr-1" /> : <Minus size={16} className="mr-1" />}
              {Math.abs(trend)}%
            </div>
          )}
          {subtitle && <span className="text-gray-400">{subtitle}</span>}
        </div>
      )}
    </div>
  );
}
