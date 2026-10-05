import React from 'react';

interface WinRateGaugeProps {
  value: number; // 0-100
  size?: number;
}

export const WinRateGauge: React.FC<WinRateGaugeProps> = ({ value, size = 120 }) => {
  const strokeWidth = size * 0.1;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const clampedValue = Math.min(100, Math.max(0, value));
  const strokeDashoffset = circumference - (clampedValue / 100) * circumference;

  let color = '#ef4444'; // red
  if (clampedValue >= 60) color = '#22c55e'; // green
  else if (clampedValue >= 40) color = '#f59e0b'; // amber

  return (
    <div className="flex flex-col items-center justify-center bg-white rounded-xl border border-slate-200 p-4 shadow-sm" style={{ width: size + 40 }}>
      <h3 className="text-sm font-semibold text-slate-800 mb-2 w-full text-center">Win Rate</h3>
      <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
        {/* Background circle */}
        <svg className="absolute transform -rotate-90" width={size} height={size}>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#f1f5f9"
            strokeWidth={strokeWidth}
          />
          {/* Progress circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <div className="absolute flex flex-col items-center">
          <span className="text-2xl font-bold text-slate-800">{Math.round(clampedValue)}%</span>
        </div>
      </div>
    </div>
  );
};
