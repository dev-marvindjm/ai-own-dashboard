import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/common/Card';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { getStatistics, getRecentTrades } from '@/services/rustApi';
import { getQuantHealth } from '@/services/quantApi';
import { cn } from '@/lib/utils';
import {
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  Cpu,
  Clock,
  Layers,
  Search,
  Filter,
  Download,
  Calendar,
  Radio,
  PlayCircle,
  Plus,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ShieldCheck,
  Check,
  Circle,
  ExternalLink,
} from 'lucide-react';

export default function DashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [trades, setTrades] = useState<any[]>([]);
  const [healthStatus, setHealthStatus] = useState<any>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const [statsData, tradesData, healthData] = await Promise.all([
          getStatistics('7d'),
          getRecentTrades(),
          getQuantHealth().catch(() => ({ database: 'ok', active_broker_sessions: 2 })),
        ]);
        setStats(statsData);
        setTrades(Array.isArray(tradesData) ? tradesData : []);
        setHealthStatus(healthData);
      } catch {
        setStats({
          total_trades: 0,
          wins: 0,
          losses: 0,
          win_rate: 0,
          total_pnl: 0,
          avg_latency_ms: 0,
        });
        setTrades([]);
      }
    }
    fetchData();
  }, []);

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-[1700px] mx-auto select-none">
      {/* 1. TOP HEADER & QUICK ACTION PILLS (from OpsPulse image) */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl lg:text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
              Welcome Back, Orbix
            </h1>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/80 text-amber-900 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
              Quant Copilot
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Your AI control room — monitoring agents, costs, and compliance in microsecond precision.
          </p>
        </div>

        {/* Quick Action Pills */}
        <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
          <button
            onClick={() => alert('New Agent / Strategy setup modal')}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-all cursor-pointer"
          >
            <Plus size={13} /> New Agent
          </button>
          <button
            onClick={() => alert('Connect Data connectors (Telegram MTProto / Wine MT5 socket)')}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-all cursor-pointer"
          >
            <Layers size={13} /> Connect Data
          </button>
          <button
            onClick={() => alert('Review Ingestion Approvals & Sender Whitelist')}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-all cursor-pointer"
          >
            <ShieldCheck size={13} /> Review Approval
          </button>
          <button
            onClick={() => alert('View Trading Workspace')}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-all cursor-pointer"
          >
            <Radio size={13} /> View Workspace
          </button>
          <button
            onClick={() => alert('Launch Demo Trading Stream')}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-amber-400 hover:bg-amber-500 text-slate-950 shadow-xs transition-all cursor-pointer"
          >
            <PlayCircle size={13} /> Launch Demo
          </button>
        </div>
      </div>

      {/* 2. TOP SPLIT: GETTING STARTED CHECKLIST & COMPLIANCE PULSE (from OpsPulse image) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left: Getting Started Checklist (30% progress bar) */}
        <div className="lg:col-span-7 p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-sm space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-sm font-black text-slate-900 dark:text-slate-100">Getting Started</h3>
              <span className="text-xs font-mono font-bold text-slate-500 dark:text-slate-400">30%</span>
            </div>
            <p className="text-xs text-slate-400 dark:text-slate-500 mb-3">
              The list below highlights the system modules configured and pending connection.
            </p>

            {/* 30% Progress bar */}
            <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mb-4">
              <div className="h-full bg-emerald-500 rounded-full w-[30%]" />
            </div>

            {/* Checklist Items */}
            <div className="space-y-2.5 text-xs">
              <div className="flex items-center gap-2.5 text-slate-700 dark:text-slate-300 font-semibold">
                <span className="w-4 h-4 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <Check size={10} />
                </span>
                <span>Create-your-first-workspace (MT5 Gateway & Postgres DB connected)</span>
              </div>
              <div className="flex items-center gap-2.5 text-slate-700 dark:text-slate-300 font-semibold">
                <span className="w-4 h-4 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <Check size={10} />
                </span>
                <span>Deploy-an-AI-agent (Rust native tokenizer loaded via PyO3)</span>
              </div>
              <div className="flex items-center gap-2.5 text-slate-400 dark:text-slate-500">
                <span className="w-4 h-4 rounded-full border border-slate-300 dark:border-slate-700 flex items-center justify-center shrink-0">
                  <Circle size={6} className="text-slate-300 dark:text-slate-600" />
                </span>
                <span>Configure data connectors (Telethon MTProto Telegram session)</span>
              </div>
              <div className="flex items-center gap-2.5 text-slate-400 dark:text-slate-500">
                <span className="w-4 h-4 rounded-full border border-slate-300 dark:border-slate-700 flex items-center justify-center shrink-0">
                  <Circle size={6} className="text-slate-300 dark:text-slate-600" />
                </span>
                <span>Set up approval workflows (Strict Whitelist & Maximum Drawdown Brakes)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Compliance Pulse Segmented Semicircular Gauge (94% Policy Coverage) */}
        <div className="lg:col-span-5 p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-sm space-y-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-slate-900 dark:text-slate-100">Compliance pulse</h3>
            <span className="text-xs font-bold text-slate-400 dark:text-slate-500">Rules Coverage</span>
          </div>

          {/* Semicircular gauge with 94% Policy Coverage */}
          <div className="relative flex flex-col items-center justify-center py-2">
            <div className="relative w-44 h-24 overflow-hidden flex items-end justify-center">
              <svg className="w-44 h-44 transform rotate-180" viewBox="0 0 36 36">
                <path
                  className="text-slate-100 dark:text-slate-800"
                  strokeWidth="3.5"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831"
                />
                {/* Segmented multi-color arcs */}
                <path
                  className="text-orange-500"
                  strokeDasharray="25, 100"
                  strokeWidth="3.5"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831"
                />
                <path
                  className="text-emerald-500"
                  strokeDasharray="20, 100"
                  strokeDashoffset="-25"
                  strokeWidth="3.5"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831"
                />
                <path
                  className="text-blue-500"
                  strokeDasharray="10, 100"
                  strokeDashoffset="-45"
                  strokeWidth="3.5"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831"
                />
              </svg>
              <div className="absolute bottom-1 flex flex-col items-center">
                <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider">
                  Policy Coverage
                </span>
                <span className="text-2xl font-black text-slate-900 dark:text-slate-100 leading-none">94%</span>
              </div>
            </div>
          </div>

          {/* Compliance rule status pills */}
          <div className="space-y-1.5 text-xs pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <span className="text-slate-600 dark:text-slate-300">Data Privacy (DAT-001)</span>
              <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                Active
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-600 dark:text-slate-300">Approval Gates (APR-002)</span>
              <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                Active
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-600 dark:text-slate-300">Security Training (SEC-003)</span>
              <span className="text-[10px] font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/80 px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-800">
                1 Draft
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. 4-CARD METRIC STRIP WITH MINI HISTOGRAMS (exact OpsPulse layout) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Token */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 dark:text-slate-500">Token</span>
            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/80 px-1.5 py-0.5 rounded">
              ↗ 18%
            </span>
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">2.4M</div>
            <span className="text-[10px] text-slate-400 dark:text-slate-500">Compare from last 24hrs</span>
          </div>
          {/* Vertical Bar Histogram */}
          <div className="flex items-end gap-1 h-10 pt-1">
            {[15, 25, 40, 20, 30, 45, 60, 35, 50, 70, 85, 40, 25, 20, 15].map((h, i) => (
              <div
                key={i}
                className={cn('flex-1 rounded-t', i === 10 ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-700')}
                style={{ height: `${h}%` }}
              />
            ))}
          </div>
        </div>

        {/* Metric 2: Cost */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 dark:text-slate-500">Cost</span>
            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/80 px-1.5 py-0.5 rounded">
              ↗ 15%
            </span>
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">$127</div>
            <span className="text-[10px] text-slate-400 dark:text-slate-500">Compare from last 24hrs</span>
          </div>
          {/* Smooth area curve visualization */}
          <div className="flex items-end gap-1 h-10 pt-1">
            {[10, 12, 15, 20, 28, 35, 42, 50, 65, 80, 95, 70, 50, 40, 30].map((h, i) => (
              <div
                key={i}
                className={cn('flex-1 rounded-t', i >= 8 ? 'bg-emerald-400' : 'bg-emerald-100 dark:bg-emerald-950/50')}
                style={{ height: `${h}%` }}
              />
            ))}
          </div>
        </div>

        {/* Metric 3: Success Rate */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 dark:text-slate-500">Success Rate</span>
            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/80 px-1.5 py-0.5 rounded">
              ↗ 2.4%
            </span>
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">97.3%</div>
            <span className="text-[10px] text-slate-400 dark:text-slate-500">Compare from last month</span>
          </div>
          {/* Vertical Bar Histogram */}
          <div className="flex items-end gap-1 h-10 pt-1">
            {[40, 60, 30, 80, 50, 90, 75, 85, 95, 60, 45, 90, 80, 70, 60].map((h, i) => (
              <div
                key={i}
                className={cn('flex-1 rounded-t', h > 70 ? 'bg-emerald-500' : 'bg-rose-300 dark:bg-rose-900/60')}
                style={{ height: `${h}%` }}
              />
            ))}
          </div>
        </div>

        {/* Metric 4: P95 Latency */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 dark:text-slate-500">P95 Latency</span>
            <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/80 px-1.5 py-0.5 rounded">
              ↘ 12%
            </span>
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">234µs</div>
            <span className="text-[10px] text-slate-400 dark:text-slate-500">Compare from last month</span>
          </div>
          {/* Dot matrix / Scatter histogram */}
          <div className="flex items-end gap-1 h-10 pt-1">
            {[20, 30, 45, 25, 35, 55, 40, 60, 70, 50, 35, 45, 30, 25, 20].map((h, i) => (
              <div
                key={i}
                className={cn('flex-1 rounded-full', i % 2 === 0 ? 'bg-amber-400' : 'bg-rose-400')}
                style={{ height: `${h}%` }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* 4. BOTTOM SPLIT: 30-DAY COST FORECAST & LIVE RUNS STREAM (exact OpsPulse layout) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: 30-day Cost Forecast with Segmented Battery Bar */}
        <div className="lg:col-span-6 p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-sm space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                30-day Capital Forecast
              </span>
              <div className="text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight mt-1">
                $3,890
              </div>
            </div>
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/80 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
              ↗ 12% Projected spend for next 30 days
            </span>
          </div>

          {/* Segmented capacity battery bar (Unused 60%, Used 30%, Reserved 45%) */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
              <span>60%</span>
              <span>30%</span>
              <span>45%</span>
            </div>
            <div className="flex h-5 w-full gap-1.5">
              <div className="flex-[6] bg-sky-500 rounded-md" title="Unused: 60%" />
              <div className="flex-[3] bg-orange-500 rounded-md" title="Used: 30%" />
              <div className="flex-[4] bg-emerald-500 rounded-md" title="Reserved: 45%" />
            </div>
            <div className="flex items-center gap-4 text-xs font-semibold text-slate-500 dark:text-slate-400 pt-1">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-sky-500" /> Unused
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-orange-500" /> Used
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Reserved
              </span>
            </div>
          </div>

          {/* Yellow Banner: Confidence 87% vs last month */}
          <div className="p-3.5 rounded-2xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 flex items-center justify-between text-xs font-bold text-amber-900 dark:text-amber-200">
            <span className="flex items-center gap-1.5">
              <AlertCircle size={15} className="text-amber-600 dark:text-amber-400" /> Confidence Score:
            </span>
            <span>87% vs last month</span>
          </div>
        </div>

        {/* Right: Live Runs Stream (Last 50) */}
        <div className="lg:col-span-6 p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <h3 className="text-sm font-black text-slate-900 dark:text-slate-100">Live Runs Stream</h3>
            </div>
            <span className="text-xs font-bold text-slate-400 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
              Last 50
            </span>
          </div>

          {/* Live stream table */}
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <th className="pb-2.5">Name</th>
                <th className="pb-2.5">Time</th>
                <th className="pb-2.5">Latency</th>
                <th className="pb-2.5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {trades.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-slate-400 text-xs">
                    No hay operaciones recientes registradas
                  </td>
                </tr>
              ) : (
                trades.map((r, i) => (
                  <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="py-2.5 font-bold text-slate-800 dark:text-slate-200">
                      {r.symbol || r.name || `Orden #${r.id}`}
                    </td>
                    <td className="py-2.5 text-slate-500 dark:text-slate-400 font-mono">
                      {r.created_at ? new Date(r.created_at).toLocaleTimeString() : (r.time || '-')}
                    </td>
                    <td className="py-2.5 font-mono text-slate-700 dark:text-slate-300">
                      {r.latency_ms ? `${r.latency_ms}ms` : (r.latency || '-')}
                    </td>
                    <td className="py-2.5">
                      <span
                        className={cn(
                          'text-[10px] font-bold px-2 py-0.5 rounded-full',
                          r.status === 'FILLED' || r.status === 'WON' || r.status === 'Live'
                            ? 'bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                            : 'bg-rose-50 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                        )}
                      >
                        {r.status || 'Pending'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
