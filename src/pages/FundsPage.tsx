import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/common/Card';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { Modal } from '@/components/common/Modal';
import { useFunds } from '@/hooks/useApi';
import { createFund } from '@/services/quantApi';
import { Wallet, TrendingUp, AlertTriangle, Plus, ShieldCheck, CheckCircle2, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function FundsPage() {
  const { data: funds = [], isLoading, refetch } = useFunds();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [targetAmount, setTargetAmount] = useState('100000');
  const [goalType, setGoalType] = useState('TARGET_CAPITAL');
  const [maxDrawdown, setMaxDrawdown] = useState('5000');
  const [minSampleTrades, setMinSampleTrades] = useState('10');

  const handleCreateFund = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      setErrorMsg('');
      await createFund({
        title,
        description: description || undefined,
        target_amount: parseFloat(targetAmount),
        goal_type: goalType,
        goal_target_value: parseFloat(targetAmount),
        max_drawdown_limit: parseFloat(maxDrawdown),
        min_sample_trades: parseInt(minSampleTrades, 10),
        allowed_brokers: ['mt5', 'quotex', 'pocketoption'],
      });
      setIsModalOpen(false);
      setTitle('');
      setDescription('');
      refetch();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to create fund.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-[1700px] mx-auto select-none">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl lg:text-3xl font-black tracking-tight text-slate-900 dark:text-slate-100">
              Prop Firm & Capital Funds
            </h1>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
              Live Audits
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Manage Prop Firm accounts, milestone capital accumulation, and automated drawdown circuit breakers
          </p>
        </div>

        <Button onClick={() => setIsModalOpen(true)} className="gap-1.5 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-xs">
          <Plus size={14} /> Track New Fund
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {funds.map((fund: any) => {
          const currentBal = parseFloat(fund.current_amount ?? fund.current_balance ?? 0);
          const targetBal = parseFloat(fund.target_amount ?? fund.target_balance ?? fund.goal_target_value ?? 10000);
          const progressPct = targetBal > 0 ? Math.min(100, Math.max(0, (currentBal / targetBal) * 100)) : 0;
          const drawdown = parseFloat(fund.current_drawdown ?? fund.drawdown ?? 0);
          const maxDdLimit = parseFloat(fund.max_drawdown_limit ?? fund.max_drawdown ?? 5);
          const isDrawdownWarning = drawdown > maxDdLimit * 0.7;
          const fundTitle = fund.title || fund.name || 'Prop Fund';
          const fundStatus = (fund.status || 'ACTIVE').toUpperCase();
          const winRate = parseFloat(fund.win_rate_percentage ?? fund.win_rate ?? 0);

          return (
            <Card key={fund.id} className="relative overflow-hidden group rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-2xs bg-white dark:bg-slate-900">
              <div className="p-6 space-y-5">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/60 rounded-2xl text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800">
                      <Wallet size={22} />
                    </div>
                    <div>
                      <CardTitle className="text-base font-black text-slate-900 dark:text-slate-100">{fundTitle}</CardTitle>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{fund.goal_type || 'TARGET_CAPITAL'}</p>
                    </div>
                  </div>
                  <Badge className={cn('text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase', fundStatus === 'ACTIVE' ? 'bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300')}>
                    {fundStatus}
                  </Badge>
                </div>

                {/* Balance Progress */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500 dark:text-slate-400 font-semibold">Current Accumulated</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-slate-100">${currentBal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-3 overflow-hidden">
                    <div
                      className="bg-emerald-500 h-full rounded-full transition-all duration-700"
                      style={{ width: `${Math.max(5, progressPct)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-400 dark:text-slate-500 font-mono">
                    <span>Progress: {progressPct.toFixed(1)}%</span>
                    <span>Target: ${targetBal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                </div>

                {/* Metrics Grid */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-2xl border border-slate-100 dark:border-slate-800">
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 font-semibold mb-1">
                      <TrendingUp size={12} className="text-indigo-600 dark:text-indigo-400" /> Win Rate
                    </div>
                    <div className="text-base font-black text-slate-900 dark:text-slate-100">{winRate.toFixed(1)}%</div>
                  </div>

                  <div className={cn('p-3 rounded-2xl border', isDrawdownWarning ? 'bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300' : 'bg-slate-50 dark:bg-slate-950 border-slate-100 dark:border-slate-800 text-slate-900 dark:text-slate-100')}>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 font-semibold mb-1">
                      <AlertTriangle size={12} className={cn(isDrawdownWarning ? 'text-rose-500' : 'text-slate-400')} /> Current Drawdown
                    </div>
                    <div className="text-base font-black">
                      ${drawdown.toLocaleString()} <span className="text-[10px] text-slate-400 dark:text-slate-500 font-normal">/ max ${maxDdLimit.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <div className="text-[11px] text-slate-400 dark:text-slate-500 flex items-center gap-1.5 pt-1 border-t border-slate-100 dark:border-slate-800">
                  <ShieldCheck size={13} className="text-emerald-500" />
                  <span>Brokers: {(fund.allowed_brokers || ['MT5', 'Quotex']).join(', ')}</span>
                </div>
              </div>
            </Card>
          );
        })}

        {funds.length === 0 && !isLoading && (
          <div className="col-span-full p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500">
            <Wallet size={40} className="mx-auto mb-3 opacity-30" />
            <h3 className="font-bold text-slate-700 dark:text-slate-300">No prop funds configured yet</h3>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Click "Track New Fund" above to add your first prop account evaluation.</p>
          </div>
        )}
      </div>

      {/* Modal Track Fund */}
      {isModalOpen && (
        <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Track New Prop Fund">
          <form onSubmit={handleCreateFund} className="space-y-4 pt-2">
            {errorMsg && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/80 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs rounded-xl font-medium">
                {errorMsg}
              </div>
            )}
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Fund / Prop Firm Name:</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. FTMO 100K Phase 1"
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Target Capital ($):</label>
                <input
                  type="number"
                  required
                  value={targetAmount}
                  onChange={(e) => setTargetAmount(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Max Drawdown Limit ($):</label>
                <input
                  type="number"
                  required
                  value={maxDrawdown}
                  onChange={(e) => setMaxDrawdown(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Goal Metric:</label>
              <select
                value={goalType}
                onChange={(e) => setGoalType(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
              >
                <option value="TARGET_CAPITAL">Target Capital (Monetary Milestone)</option>
                <option value="WIN_RATE_PERCENTAGE">Win Rate Percentage (Accuracy)</option>
                <option value="PROFIT_FACTOR_RATIO">Profit Factor Ratio</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Notes / Description:</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional notes regarding evaluation rules..."
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
                rows={2}
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={isSubmitting} className="bg-indigo-600 text-white font-bold">
                {isSubmitting ? 'Creating...' : 'Create & Track'}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
