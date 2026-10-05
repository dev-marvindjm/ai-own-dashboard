import React from 'react';

interface SpeedometerGaugeProps {
  score: number; // 0 to 100
  title?: string;
  subtitle?: string;
  reliability?: string;
  profitFactor?: string;
  avgLatency?: string;
  size?: number;
}

export const SpeedometerGauge: React.FC<SpeedometerGaugeProps> = ({
  score = 84,
  title = 'Execution Quality Score',
  subtitle = 'Real-time algorithm & broker health',
  reliability = '99.8%',
  profitFactor = '2.84',
  avgLatency = '38ms',
  size = 280,
}) => {
  const clampedScore = Math.max(0, Math.min(100, score));

  // Angles for semi-circle: 180 degrees (from 180 to 360 / -180 to 0)
  // 0% -> -180deg (left), 100% -> 0deg (right)
  const angle = -180 + (clampedScore / 100) * 180;

  // Rating label
  let statusText = 'Optimal Execution';
  let statusColor = 'text-emerald-600 bg-emerald-50 border-emerald-200';
  if (clampedScore < 40) {
    statusText = 'Critical Risk';
    statusColor = 'text-rose-600 bg-rose-50 border-rose-200';
  } else if (clampedScore < 70) {
    statusText = 'Moderate Performance';
    statusColor = 'text-amber-600 bg-amber-50 border-amber-200';
  }

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 justify-between">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h3 className="text-sm font-bold text-slate-800 tracking-tight">{title}</h3>
          <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
        </div>
        <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border ${statusColor}`}>
          {statusText}
        </span>
      </div>

      {/* SVG Semi-Circle Speedometer */}
      <div className="relative flex flex-col items-center justify-center my-4">
        <svg width={size} height={size * 0.58} viewBox="0 0 200 115" className="overflow-visible">
          <defs>
            <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#ef4444" />
              <stop offset="35%" stopColor="#f59e0b" />
              <stop offset="70%" stopColor="#22c55e" />
              <stop offset="100%" stopColor="#10b981" />
            </linearGradient>
            <filter id="needleGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#0f172a" floodOpacity="0.25" />
            </filter>
          </defs>

          {/* Background Track Arc */}
          <path
            d="M 20 100 A 80 80 0 0 1 180 100"
            fill="none"
            stroke="#f1f5f9"
            strokeWidth="16"
            strokeLinecap="round"
          />

          {/* Colored Arc */}
          <path
            d="M 20 100 A 80 80 0 0 1 180 100"
            fill="none"
            stroke="url(#gaugeGradient)"
            strokeWidth="16"
            strokeLinecap="round"
            strokeDasharray="251.2"
            strokeDashoffset="0"
          />

          {/* Scale Ticks */}
          <line x1="20" y1="100" x2="26" y2="100" stroke="#94a3b8" strokeWidth="2" />
          <line x1="100" y1="20" x2="100" y2="26" stroke="#94a3b8" strokeWidth="2" />
          <line x1="180" y1="100" x2="174" y2="100" stroke="#94a3b8" strokeWidth="2" />

          {/* Needle Pointer */}
          <g transform={`rotate(${angle}, 100, 100)`} filter="url(#needleGlow)" className="transition-transform duration-1000 ease-out">
            <line x1="100" y1="100" x2="165" y2="100" stroke="#0f172a" strokeWidth="3.5" strokeLinecap="round" />
            <circle cx="100" cy="100" r="7" fill="#0f172a" />
            <circle cx="100" cy="100" r="3" fill="#ffffff" />
          </g>
        </svg>

        {/* Center Score readout */}
        <div className="text-center -mt-3">
          <div className="text-3xl font-extrabold text-slate-800 tracking-tight">{clampedScore}<span className="text-lg text-slate-400 font-semibold">/100</span></div>
          <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Health Rating</div>
        </div>
      </div>

      {/* KPI Breakout Metrics */}
      <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-100">
        <div className="text-center p-2 rounded-xl bg-slate-50/80 border border-slate-100">
          <span className="text-[10px] uppercase font-semibold text-slate-400 block">Reliability</span>
          <span className="text-sm font-bold text-slate-800">{reliability}</span>
        </div>
        <div className="text-center p-2 rounded-xl bg-slate-50/80 border border-slate-100">
          <span className="text-[10px] uppercase font-semibold text-slate-400 block">Profit Factor</span>
          <span className="text-sm font-bold text-emerald-600">{profitFactor}</span>
        </div>
        <div className="text-center p-2 rounded-xl bg-slate-50/80 border border-slate-100">
          <span className="text-[10px] uppercase font-semibold text-slate-400 block">Avg Latency</span>
          <span className="text-sm font-bold text-indigo-600">{avgLatency}</span>
        </div>
      </div>
    </div>
  );
};

export default SpeedometerGauge;
