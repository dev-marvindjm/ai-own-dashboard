import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: string;
  variant?: 'default' | 'dot' | 'outline';
}

export function StatusBadge({ status, variant = 'default' }: StatusBadgeProps) {
  const normalizedStatus = status.toLowerCase().trim();
  
  let colorClass = 'bg-gray-100 text-gray-700 border-gray-200';
  let dotClass = 'bg-gray-500';
  
  if (['active', 'live', 'connected', 'win', 'emitted'].includes(normalizedStatus)) {
    colorClass = 'bg-trading-win/10 text-trading-win border-trading-win/20';
    dotClass = 'bg-trading-win';
  } else if (['blocked', 'loss', 'error', 'failed'].includes(normalizedStatus)) {
    colorClass = 'bg-trading-loss/10 text-trading-loss border-trading-loss/20';
    dotClass = 'bg-trading-loss';
  } else if (['pending', 'parsed', 'paused'].includes(normalizedStatus)) {
    colorClass = 'bg-trading-pending/10 text-trading-pending border-trading-pending/20';
    dotClass = 'bg-trading-pending';
  } else if (['in_use', 'executed_demo'].includes(normalizedStatus)) {
    colorClass = 'bg-trading-info/10 text-trading-info border-trading-info/20';
    dotClass = 'bg-trading-info';
  }

  if (variant === 'outline') {
    return (
      <span className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border bg-transparent', colorClass.replace(/bg-.*\/10/, ''))}>
        {status}
      </span>
    );
  }

  return (
    <span className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border', colorClass)}>
      {variant === 'dot' && (
        <span className={cn('mr-1.5 h-1.5 w-1.5 rounded-full', dotClass)} aria-hidden="true" />
      )}
      {status}
    </span>
  );
}
