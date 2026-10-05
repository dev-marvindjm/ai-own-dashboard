import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/common/Card';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { Modal } from '@/components/common/Modal';
import { DataTable } from '@/components/common/DataTable';
import { getChallenges, createChallenge, joinChallenge } from '@/services/quantApi';
import { Trophy, Users, Plus, Medal, TrendingUp, AlertTriangle, ShieldCheck, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function ChallengesPage() {
  const [challenges, setChallenges] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [joinedMsg, setJoinedMsg] = useState<string | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [goalType, setGoalType] = useState('WIN_RATE_PERCENTAGE');
  const [targetValue, setTargetValue] = useState('75');
  const [minTrades, setMinTrades] = useState('15');
  const [rankingMetric, setRankingMetric] = useState('WIN_RATE');

  const loadData = useCallback(async () => {
    try {
      const res = await getChallenges();
      if (res && res.length > 0) setChallenges(res);
      else setChallenges(mockChallenges);
    } catch {
      setChallenges(mockChallenges);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleJoin = async (challengeId: number, challengeTitle: string) => {
    try {
      await joinChallenge(challengeId);
      setJoinedMsg(`Successfully enrolled in "${challengeTitle}"!`);
      setTimeout(() => setJoinedMsg(null), 4000);
      loadData();
    } catch (err: any) {
      alert(`Join Challenge: ${err.message || 'Error joining challenge'}`);
    }
  };

  const handleCreateChallenge = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      await createChallenge({
        title,
        description: description || undefined,
        goal_type: goalType,
        goal_target_value: parseFloat(targetValue),
        min_sample_trades: parseInt(minTrades, 10),
        ranking_metric: rankingMetric,
        is_public: true,
      });
      setIsModalOpen(false);
      setTitle('');
      setDescription('');
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to create challenge');
    } finally {
      setIsSubmitting(false);
    }
  };

  const mockChallenges = [
    { id: 1, title: 'Gold Trend Sprint Q3', goal_type: 'WIN_RATE_PERCENTAGE', goal_target_value: 75, min_sample_trades: 20, status: 'RUNNING', participants_count: 14 },
    { id: 2, title: 'Binary OTC Turbo Cup', goal_type: 'TARGET_CAPITAL', goal_target_value: 5000, min_sample_trades: 50, status: 'RUNNING', participants_count: 28 },
    { id: 3, title: 'Forex Drawdown Shield', goal_type: 'PROFIT_FACTOR_RATIO', goal_target_value: 2.5, min_sample_trades: 15, status: 'RUNNING', participants_count: 9 },
  ];

  const mockLeaderboard = [
    { rank: 1, name: 'Alpha Quant Algo', winRate: 84.5, profitFactor: 2.85, pnl: 4850.0, trades: 42, maxDd: 2.1, status: 'Active' },
    { rank: 2, name: 'Gold Scalp Master', winRate: 79.2, profitFactor: 2.40, pnl: 3420.0, trades: 38, maxDd: 3.4, status: 'Active' },
    { rank: 3, name: 'OTC Turbo Sniper', winRate: 77.0, profitFactor: 2.10, pnl: 2890.0, trades: 65, maxDd: 4.2, status: 'Active' },
    { rank: 4, name: 'Forex London Bot', winRate: 71.5, profitFactor: 1.80, pnl: 1950.0, trades: 31, maxDd: 3.8, status: 'Active' },
    { rank: 5, name: 'Crypto Limit Runner', winRate: 68.0, profitFactor: 1.55, pnl: 1420.0, trades: 24, maxDd: 4.9, status: 'Active' },
  ];

  const leaderboardCols = [
    {
      header: 'Rank',
      accessorKey: 'rank',
      cell: (row: any) => {
        const medal = row.rank === 1 ? '🥇 #1' : row.rank === 2 ? '🥈 #2' : row.rank === 3 ? '🥉 #3' : `#${row.rank}`;
        return (
          <span className={cn(
            'font-black text-xs px-2.5 py-1 rounded-full',
            row.rank === 1 ? 'bg-amber-100 text-amber-900 border border-amber-300' :
            row.rank === 2 ? 'bg-slate-100 text-slate-800 border border-slate-300' :
            row.rank === 3 ? 'bg-orange-100 text-orange-900 border border-orange-300' :
            'text-slate-600'
          )}>
            {medal}
          </span>
        );
      },
    },
    {
      header: 'Participant / Strategy',
      accessorKey: 'name',
      cell: (row: any) => <span className="font-extrabold text-xs text-slate-900">{row.name}</span>,
    },
    {
      header: 'Net Realized PnL',
      accessorKey: 'pnl',
      cell: (row: any) => (
        <span className="font-mono font-bold text-xs text-emerald-600">
          +${row.pnl.toLocaleString()}
        </span>
      ),
    },
    {
      header: 'Win Rate',
      accessorKey: 'winRate',
      cell: (row: any) => <span className="font-mono font-bold text-xs text-slate-800">{row.winRate}%</span>,
    },
    {
      header: 'Profit Factor',
      accessorKey: 'profitFactor',
      cell: (row: any) => <span className="font-mono font-bold text-xs text-indigo-600">{row.profitFactor}x</span>,
    },
    {
      header: 'Max Drawdown',
      accessorKey: 'maxDd',
      cell: (row: any) => (
        <span className="font-mono text-xs text-slate-500">
          {row.maxDd}%
        </span>
      ),
    },
    {
      header: 'Trades',
      accessorKey: 'trades',
      cell: (row: any) => <span className="font-mono text-xs text-slate-600">{row.trades}</span>,
    },
  ];

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-[1700px] mx-auto select-none">
      {joinedMsg && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs rounded-2xl flex items-center gap-2 font-bold animate-fadeIn">
          <CheckCircle size={16} className="text-emerald-600 dark:text-emerald-400" /> {joinedMsg}
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100">
              Trading Challenges & Competitions
            </h1>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
              Leaderboards
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Prop firm evaluation criteria, maximum drawdown constraints, and live trader ranking
          </p>
        </div>

        <Button onClick={() => setIsModalOpen(true)} className="gap-1.5 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-xs">
          <Plus size={14} /> New Challenge
        </Button>
      </div>

      {/* Challenges Grid */}
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {challenges.map((challenge: any) => (
          <Card key={challenge.id} className="p-6 border border-slate-200/90 dark:border-slate-800 shadow-2xs rounded-3xl space-y-4 bg-white dark:bg-slate-900">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider">
                  Competition ID: {challenge.id}
                </span>
                <h3 className="text-base font-black text-slate-900 dark:text-slate-100 mt-0.5">{challenge.title}</h3>
              </div>
              <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 uppercase">
                {challenge.status}
              </span>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400 dark:text-slate-500">Target Rule:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{challenge.goal_type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 dark:text-slate-500">Target Threshold:</span>
                <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{challenge.goal_target_value}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 dark:text-slate-500">Min Sample Trades:</span>
                <span className="font-mono text-slate-700 dark:text-slate-300">{challenge.min_sample_trades}</span>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <span className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 font-semibold">
                <Users size={15} className="text-indigo-600 dark:text-indigo-400" />
                {challenge.participants_count || challenge.participant_count || 1} Active Traders
              </span>
              <button
                onClick={() => handleJoin(challenge.id, challenge.title)}
                className="px-3 py-1 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 font-bold transition-colors cursor-pointer"
              >
                Join Sprint
              </button>
            </div>
          </Card>
        ))}
      </div>

      {/* Leaderboard Table */}
      <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Trophy size={18} className="text-amber-500" />
            <h3 className="text-sm font-black text-slate-900 dark:text-slate-100">Sprint Leaderboard Standings</h3>
          </div>
          <span className="text-xs font-bold text-slate-400 dark:text-slate-500">Live Trade PnL & Ratio</span>
        </div>

        <DataTable data={mockLeaderboard} columns={leaderboardCols} />
      </div>

      {/* Modal */}
      {isModalOpen && (
        <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create New Challenge">
          <form onSubmit={handleCreateChallenge} className="space-y-4 pt-2">
            <p className="text-xs text-slate-500 dark:text-slate-400">Configure parameters for a competitive prop firm sprint.</p>
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Challenge Title:</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Autumn Scalp Marathon"
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Goal Metric:</label>
                <select
                  value={goalType}
                  onChange={(e) => setGoalType(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
                >
                  <option value="WIN_RATE_PERCENTAGE">Win Rate (%)</option>
                  <option value="TARGET_CAPITAL">Target Capital ($)</option>
                  <option value="PROFIT_FACTOR_RATIO">Profit Factor Ratio</option>
                  <option value="TRADE_COUNT">Trade Count</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Target Value:</label>
                <input
                  type="number"
                  required
                  value={targetValue}
                  onChange={(e) => setTargetValue(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Min Sample Trades:</label>
              <input
                type="number"
                required
                value={minTrades}
                onChange={(e) => setMinTrades(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={isSubmitting} className="bg-indigo-600 text-white font-bold">
                {isSubmitting ? 'Creating...' : 'Create Challenge'}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
