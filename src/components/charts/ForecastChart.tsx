import React from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';

export interface ForecastItem {
  period: string;
  actualPnL: number;
  targetPnL: number;
  signalsCount: number;
}

interface ForecastChartProps {
  data?: ForecastItem[];
  title?: string;
  subtitle?: string;
}

const defaultData: ForecastItem[] = [
  { period: 'Mon', actualPnL: 1420, targetPnL: 1200, signalsCount: 42 },
  { period: 'Tue', actualPnL: 2150, targetPnL: 1500, signalsCount: 58 },
  { period: 'Wed', actualPnL: 1890, targetPnL: 1600, signalsCount: 49 },
  { period: 'Thu', actualPnL: 3200, targetPnL: 2000, signalsCount: 71 },
  { period: 'Fri', actualPnL: 2750, targetPnL: 2200, signalsCount: 65 },
  { period: 'Sat', actualPnL: 1980, targetPnL: 1800, signalsCount: 38 },
  { period: 'Sun', actualPnL: 3450, targetPnL: 2400, signalsCount: 82 },
];

export const ForecastChart: React.FC<ForecastChartProps> = ({
  data = defaultData,
  title = 'PnL Forecast & Target Realization',
  subtitle = 'Actual vs projected trading performance',
}) => {
  return (
    <div className="flex flex-col h-full bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 justify-between">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h3 className="text-sm font-bold text-slate-800 tracking-tight">{title}</h3>
          <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200">
            7 Days View
          </span>
        </div>
      </div>

      <div className="w-full h-[220px] my-2">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis
              dataKey="period"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: '#64748b' }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: '#64748b' }}
              tickFormatter={(v) => `$${v}`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#ffffff',
                borderRadius: '12px',
                border: '1px solid #e2e8f0',
                boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
                fontSize: '12px',
              }}
              formatter={(value: any, name: any) => [
                `$${Number(value).toLocaleString()}`,
                name === 'actualPnL' ? 'Actual PnL' : 'Target PnL',
              ]}
            />
            <Legend
              verticalAlign="top"
              align="right"
              iconType="circle"
              wrapperStyle={{ fontSize: '11px', paddingBottom: '10px' }}
            />
            <Bar
              dataKey="actualPnL"
              name="Actual Realized PnL"
              fill="#6366f1"
              radius={[6, 6, 0, 0]}
              barSize={18}
            />
            <Line
              type="monotone"
              dataKey="targetPnL"
              name="Target Benchmark"
              stroke="#10b981"
              strokeWidth={2.5}
              strokeDasharray="4 4"
              dot={{ r: 3, fill: '#10b981' }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs text-slate-500">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
          <span>Week Total: <strong className="text-slate-800">$16,840</strong></span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          <span>Target Attainment: <strong className="text-emerald-600">127.4%</strong></span>
        </div>
      </div>
    </div>
  );
};

export default ForecastChart;
