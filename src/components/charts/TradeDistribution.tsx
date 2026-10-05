import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

export interface DistributionData {
  name: string;
  value: number;
  color: string;
}

interface TradeDistributionProps {
  data: DistributionData[];
}

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white p-2 border border-slate-200 rounded-lg shadow-md text-sm">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full" style={{ backgroundColor: data.color }}></span>
          <span className="font-medium text-slate-700">{data.name}</span>
          <span className="text-slate-500 font-semibold">{data.value}</span>
        </div>
      </div>
    );
  }
  return null;
};

export const TradeDistribution: React.FC<TradeDistributionProps> = ({ data }) => {
  const total = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="w-full h-[300px] bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-col">
      <h3 className="text-sm font-semibold text-slate-800 mb-2">Trade Distribution</h3>
      <div className="flex-1 relative">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius="60%"
              outerRadius="80%"
              paddingAngle={2}
              dataKey="value"
              stroke="none"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              verticalAlign="bottom" 
              height={36} 
              iconType="circle"
              formatter={(value, entry: any) => <span className="text-sm text-slate-600">{value}</span>}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-8">
          <span className="text-3xl font-bold text-slate-800">{total}</span>
          <span className="text-xs text-slate-500">Total</span>
        </div>
      </div>
    </div>
  );
};
