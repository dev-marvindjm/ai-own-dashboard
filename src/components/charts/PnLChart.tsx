import React from 'react';
import {
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

export interface PnLData {
  date: string;
  pnl: number;
  volume?: number;
}

interface PnLChartProps {
  data: PnLData[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const pnlValue = payload.find((p: any) => p.dataKey === 'pnl')?.value;
    const volValue = payload.find((p: any) => p.dataKey === 'volume')?.value;
    
    return (
      <div className="bg-white p-3 border border-slate-200 rounded-lg shadow-md text-sm">
        <p className="font-medium text-slate-700 mb-1">{label}</p>
        {pnlValue !== undefined && (
          <p className={pnlValue >= 0 ? 'text-green-600' : 'text-red-600'}>
            PnL: ${pnlValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </p>
        )}
        {volValue !== undefined && (
          <p className="text-slate-500">
            Volume: {volValue.toLocaleString()}
          </p>
        )}
      </div>
    );
  }
  return null;
};

export const PnLChart: React.FC<PnLChartProps> = ({ data }) => {
  return (
    <div className="w-full h-[300px] bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
      <h3 className="text-sm font-semibold text-slate-800 mb-4">Cumulative PnL</h3>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="colorPnL" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
          <XAxis 
            dataKey="date" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fontSize: 12, fill: '#64748b' }} 
            dy={10}
          />
          <YAxis 
            yAxisId="left" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fontSize: 12, fill: '#64748b' }}
            tickFormatter={(value) => `$${value}`}
          />
          <YAxis 
            yAxisId="right" 
            orientation="right" 
            axisLine={false} 
            tickLine={false} 
            hide={true} 
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar yAxisId="right" dataKey="volume" fill="#f1f5f9" radius={[4, 4, 0, 0]} />
          <Line 
            yAxisId="left"
            type="monotone" 
            dataKey="pnl" 
            stroke="#22c55e" 
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 6, fill: '#22c55e', stroke: '#fff', strokeWidth: 2 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};
