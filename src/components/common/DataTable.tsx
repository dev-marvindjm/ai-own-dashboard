import { useState } from 'react';
import { cn } from '@/lib/utils';
import { ChevronDown, ChevronUp, ChevronsUpDown } from 'lucide-react';

export interface Column<T = any> {
  key?: string;
  name?: string;
  header?: string;
  accessorKey?: string;
  sortable?: boolean;
  render?: (row: T) => React.ReactNode;
  cell?: (row: T) => React.ReactNode;
}

export interface DataTableProps<T = any> {
  columns: Column<T>[];
  data: T[];
  selectable?: boolean;
  onSelect?: (selectedRows: T[]) => void;
  emptyMessage?: React.ReactNode;
  className?: string;
}

export function DataTable<T extends Record<string, any>>({
  columns,
  data,
  selectable,
  onSelect,
  emptyMessage = 'No data available',
  className,
}: DataTableProps<T>) {
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string | number>>(new Set());

  const getColKey = (col: Column<T>, idx: number): string => {
    return col.key || col.accessorKey || `col_${idx}`;
  };

  const getColTitle = (col: Column<T>): string => {
    return col.name || col.header || '';
  };

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedData = [...data].sort((a, b) => {
    if (!sortConfig) return 0;
    const aVal = a[sortConfig.key];
    const bVal = b[sortConfig.key];
    if (aVal === bVal) return 0;
    if (aVal === null || aVal === undefined) return 1;
    if (bVal === null || bVal === undefined) return -1;
    if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

  const toggleAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      const allIds = new Set(data.map((d, i) => (d.id !== undefined ? d.id : i)));
      setSelectedIds(allIds);
      onSelect?.(data);
    } else {
      setSelectedIds(new Set());
      onSelect?.([]);
    }
  };

  const toggleRow = (row: T, idx: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const rowId = row.id !== undefined ? row.id : idx;
    const newSelected = new Set(selectedIds);
    if (e.target.checked) {
      newSelected.add(rowId);
    } else {
      newSelected.delete(rowId);
    }
    setSelectedIds(newSelected);
    onSelect?.(data.filter((d, i) => newSelected.has(d.id !== undefined ? d.id : i)));
  };

  if (data.length === 0) {
    return (
      <div className={cn('w-full bg-white rounded-2xl shadow-sm border border-slate-200/80 flex items-center justify-center p-12 text-slate-400 font-medium', className)}>
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className={cn('w-full bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200/80 dark:border-slate-800 overflow-hidden', className)}>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
          <thead className="bg-slate-50/75 dark:bg-slate-950/60 border-b border-slate-200/80 dark:border-slate-800 text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 font-semibold">
            <tr>
              {selectable && (
                <th className="px-5 py-4 w-12 text-center">
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    checked={selectedIds.size === data.length && data.length > 0}
                    onChange={toggleAll}
                  />
                </th>
              )}
              {columns.map((col, idx) => {
                const colKey = getColKey(col, idx);
                const isSorted = sortConfig?.key === colKey;
                return (
                  <th
                    key={colKey}
                    className={cn(
                      'px-5 py-4 select-none',
                      col.sortable && 'cursor-pointer hover:bg-slate-100/70 dark:hover:bg-slate-800/70 transition-colors'
                    )}
                    onClick={() => col.sortable && handleSort(colKey)}
                  >
                    <div className="flex items-center space-x-1.5">
                      <span>{getColTitle(col)}</span>
                      {col.sortable && (
                        <span className="text-slate-400">
                          {isSorted ? (
                            sortConfig.direction === 'asc' ? (
                              <ChevronUp size={14} className="text-indigo-600 dark:text-indigo-400" />
                            ) : (
                              <ChevronDown size={14} className="text-indigo-600 dark:text-indigo-400" />
                            )
                          ) : (
                            <ChevronsUpDown size={14} className="opacity-40" />
                          )}
                        </span>
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {sortedData.map((row, i) => {
              const rowId = row.id !== undefined ? row.id : i;
              const isSelected = selectedIds.has(rowId);
              return (
                <tr
                  key={rowId}
                  className={cn(
                    'transition-colors duration-150',
                    isSelected ? 'bg-indigo-50/40 dark:bg-indigo-950/30 hover:bg-indigo-50/60 dark:hover:bg-indigo-950/50' : 'hover:bg-slate-50/70 dark:hover:bg-slate-800/50'
                  )}
                >
                  {selectable && (
                    <td className="px-5 py-3.5 w-12 text-center">
                      <input
                        type="checkbox"
                        className="w-4 h-4 rounded border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                        checked={isSelected}
                        onChange={(e) => toggleRow(row, i, e)}
                      />
                    </td>
                  )}
                  {columns.map((col, idx) => {
                    const colKey = getColKey(col, idx);
                    const renderFn = col.render || col.cell;
                    return (
                      <td key={colKey} className="px-5 py-3.5 whitespace-nowrap">
                        {renderFn ? renderFn(row) : (row[colKey] ?? '-')}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
