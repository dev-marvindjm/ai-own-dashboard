import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { Card } from '@/components/common/Card';
import { LiveOperationsPipeline } from '@/components/signals/LiveOperationsPipeline';
import { SignalFeed } from '@/components/signals/SignalFeed';
import { useMetrics } from '@/hooks/useApi';
import { cn } from '@/lib/utils';
import {
  Layers,
  Briefcase,
  MessageSquare,
  Code,
  Target,
  Wallet,
  ArrowRight,
  TrendingUp,
  Activity,
  CheckCircle,
  Clock,
  Zap,
  BookOpen,
  Columns,
  Compass,
} from 'lucide-react';

export default function ExplorePage() {
  const { data: metrics, isLoading } = useMetrics();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'pipeline' | 'hub'>('pipeline');

  const navCards = [
    { title: 'Templates Matrix', desc: 'Manage regex signal templates, hot slots & syntax tags', icon: Layers, path: '/templates', color: 'text-indigo-600 bg-indigo-50 border-indigo-100' },
    { title: 'Brokers & Accounts', desc: 'Connect MT5, Quotex, PocketOption & IQ Option', icon: Briefcase, path: '/brokers', color: 'text-emerald-600 bg-emerald-50 border-emerald-100' },
    { title: 'Senders & Whitelist', desc: 'Configure ALLOW / BLOCK policies and allow_any_sender switch', icon: MessageSquare, path: '/providers', color: 'text-blue-600 bg-blue-50 border-blue-100' },
    { title: 'Rust Tokenizer Lab', desc: 'Native microsecond lexical tester & PyO3 entity extractor', icon: Code, path: '/tokens', color: 'text-purple-600 bg-purple-50 border-purple-100' },
    { title: 'Funds & Targets', desc: 'Track cumulative capital pools, win rate & drawdown limits', icon: Wallet, path: '/funds', color: 'text-amber-600 bg-amber-50 border-amber-100' },
    { title: 'Challenges Leaderboard', desc: 'Prop firm competitions, leaderboard ranking & winner history', icon: Target, path: '/challenges', color: 'text-rose-600 bg-rose-50 border-rose-100' },
  ];

  const strategyArticles = [
    { title: 'Martingale Multiplier Sizing Guide', category: 'Risk Management', readTime: '5 min read', desc: 'How to calculate 0 to 6 steps progression while respecting broker payout percentages.' },
    { title: 'Sub-50ms Telegram Signal Routing', category: 'Architecture', readTime: '4 min read', desc: 'Grammers client integration to Rust PyO3 tokenizer and MT5 socket dispatch.' },
    { title: 'Prop Firm Drawdown Protection Rules', category: 'Challenges', readTime: '7 min read', desc: 'Configuring hard stop-loss limits to prevent milestone forfeiture.' },
  ];

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-[1700px] mx-auto select-none">
      {/* Top Tab Switcher */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
          <button
            onClick={() => setActiveTab('pipeline')}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer',
              activeTab === 'pipeline'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            )}
          >
            <Columns size={15} /> Live Operations Pipeline
          </button>
          <button
            onClick={() => setActiveTab('hub')}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer',
              activeTab === 'hub'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            )}
          >
            <Compass size={15} /> System Overview Hub
          </button>
        </div>

        <span className="text-xs text-slate-400 dark:text-slate-500 font-mono">
          Host: {typeof window !== 'undefined' ? window.location.host : '192.168.0.100:3000'}
        </span>
      </div>

      {activeTab === 'pipeline' ? (
        /* Primary Live Operations Kanban Board */
        <LiveOperationsPipeline />
      ) : (
        /* Secondary System Navigation Hub & Playbooks */
        <div className="space-y-6">
          {/* KPI Strip */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="p-5 border-l-4 border-l-indigo-500 border border-slate-200/90 dark:border-slate-800 shadow-sm flex flex-col justify-between bg-white dark:bg-slate-900">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
                <span>Total Parsed Signals</span>
                <span className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                  <Activity size={16} />
                </span>
              </div>
              <div className="my-2">
                <div className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
                  {isLoading ? '-' : metrics?.total_signals?.toLocaleString() || '1,248'}
                </div>
                <div className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Across active Telegram channels</div>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-bold">
                <TrendingUp size={13} /> +18.4% vs last week
              </div>
            </Card>

            <Card className="p-5 border-l-4 border-l-emerald-500 border border-slate-200/90 dark:border-slate-800 shadow-sm flex flex-col justify-between bg-white dark:bg-slate-900">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
                <span>Win Rate Ratio</span>
                <span className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                  <CheckCircle size={16} />
                </span>
              </div>
              <div className="my-2">
                <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight">
                  {isLoading ? '-' : metrics?.win_rate || 79.4}%
                </div>
                <div className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Sub-optimal threshold 60%</div>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-bold">
                <TrendingUp size={13} /> +3.2% performance
              </div>
            </Card>

            <Card className="p-5 border-l-4 border-l-amber-500 border border-slate-200/90 dark:border-slate-800 shadow-sm flex flex-col justify-between bg-white dark:bg-slate-900">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
                <span>Net Realized PnL</span>
                <span className="p-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
                  <Wallet size={16} />
                </span>
              </div>
              <div className="my-2">
                <div className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
                  {isLoading ? '-' : `$${(metrics?.total_pnl || 18450).toLocaleString()}`}
                </div>
                <div className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Accumulated trading funds</div>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-bold">
                <TrendingUp size={13} /> +$2,410 today
              </div>
            </Card>

            <Card className="p-5 border-l-4 border-l-purple-500 border border-slate-200/90 dark:border-slate-800 shadow-sm flex flex-col justify-between bg-white dark:bg-slate-900">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
                <span>Average Latency</span>
                <span className="p-1.5 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
                  <Clock size={16} />
                </span>
              </div>
              <div className="my-2">
                <div className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
                  38.2 ms
                </div>
                <div className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Socket to Wine MT5 bridge</div>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-indigo-600 dark:text-indigo-400 font-bold">
                <Zap size={13} /> Sub-50ms execution
              </div>
            </Card>
          </div>

          {/* Module Nav Grid + Live Feed */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-7 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-slate-800 dark:text-slate-200 tracking-tight">System Navigation Modules</h2>
                <span className="text-xs text-slate-400 dark:text-slate-500">Select a subsystem to manage</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {navCards.map((card, idx) => (
                  <Card
                    key={idx}
                    className="cursor-pointer hover:shadow-md transition-all hover:border-indigo-300 dark:hover:border-indigo-600 group p-5 border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900"
                    onClick={() => navigate(card.path)}
                  >
                    <div className="flex items-start justify-between">
                      <div className={cn('p-2.5 rounded-xl border', card.color)}>
                        <card.icon className="h-5 w-5" />
                      </div>
                      <ArrowRight className="h-4 w-4 text-slate-400 dark:text-slate-500 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 group-hover:translate-x-1 transition-all" />
                    </div>
                    <h3 className="text-base font-bold text-slate-800 dark:text-slate-200 mt-3">{card.title}</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">{card.desc}</p>
                  </Card>
                ))}
              </div>

              {/* Strategy Documentation Cards */}
              <div className="pt-2">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <BookOpen size={16} className="text-indigo-600 dark:text-indigo-400" /> Operational Playbooks & Guides
                  </h3>
                  <span className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold cursor-pointer hover:underline">View All</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {strategyArticles.map((art, idx) => (
                    <div key={idx} className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 mb-1">
                          <span>{art.category}</span>
                          <span className="text-slate-400 dark:text-slate-500">{art.readTime}</span>
                        </div>
                        <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-snug line-clamp-2">{art.title}</h4>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">{art.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right: Live SSE Signal Feed Stream */}
            <div className="lg:col-span-5 h-[560px]">
              <SignalFeed />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
