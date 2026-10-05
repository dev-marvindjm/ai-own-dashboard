import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center bg-white rounded-2xl border border-gray-100 shadow-sm w-full h-full min-h-[300px]">
      <div className="h-16 w-16 bg-gray-50 rounded-2xl flex items-center justify-center mb-4 text-gray-400">
        <Icon size={32} strokeWidth={1.5} />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-sm text-gray-500 max-w-sm mb-6">{description}</p>
      {action && (
        <button
          onClick={action.onClick}
          className="px-4 py-2 bg-trading-info text-white rounded-lg font-medium text-sm hover:bg-blue-600 transition-colors shadow-sm"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
