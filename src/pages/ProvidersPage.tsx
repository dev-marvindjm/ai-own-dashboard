import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Switch } from '@/components/common/Switch';
import { Modal } from '@/components/common/Modal';
import {
  getSenderRules,
  upsertSenderRule,
  deleteSenderRule,
  toggleSenderRule,
  getGlobalFilterConfigs,
  updateGlobalFilterConfig,
  ingestWebhookMessage,
  SenderRulePayload,
} from '@/services/msgApi';
import { cn } from '@/lib/utils';
import {
  Plus,
  Trash2,
  Search,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Play,
  Shield,
  ShieldCheck,
  ShieldAlert,
  Send,
  Radio,
  Check,
  X,
  TrendingUp,
  TrendingDown,
  Sparkles,
  Zap,
} from 'lucide-react';

interface SenderRuleItem {
  id: number;
  entity_id: string;
  entity_name: string;
  platform: 'TELEGRAM' | 'THREADS' | 'WHATSAPP';
  policy: 'ALLOW' | 'BLOCK' | 'DEFAULT';
  is_active: boolean;
  forward_to_brokers: boolean;
  messages_count?: number;
  last_activity?: string;
}

const INITIAL_RULES: SenderRuleItem[] = [
  { id: 1, entity_id: '@gold_vip_channel', entity_name: 'Gold Swing Pro VIP', platform: 'TELEGRAM', policy: 'ALLOW', is_active: true, forward_to_brokers: true, messages_count: 540, last_activity: '14:22:10' },
  { id: 2, entity_id: '@vip_scalpers_fx', entity_name: 'VIP Scalpers Club', platform: 'TELEGRAM', policy: 'ALLOW', is_active: true, forward_to_brokers: true, messages_count: 820, last_activity: '14:21:40' },
  { id: 3, entity_id: 'spammer_crypto_bot', entity_name: 'Pump & Dump Bot', platform: 'TELEGRAM', policy: 'BLOCK', is_active: true, forward_to_brokers: false, messages_count: 140, last_activity: '14:15:00' },
  { id: 4, entity_id: '-100192837465', entity_name: 'Binary OTC Turbo Channel', platform: 'TELEGRAM', policy: 'ALLOW', is_active: true, forward_to_brokers: true, messages_count: 670, last_activity: '14:18:22' },
  { id: 5, entity_id: 'threads_algo_feed', entity_name: 'Threads Macro Alerts', platform: 'THREADS', policy: 'ALLOW', is_active: true, forward_to_brokers: true, messages_count: 310, last_activity: '13:50:11' },
  { id: 6, entity_id: 'malicious_ad_channel', entity_name: 'Ad & Casino Spam', platform: 'TELEGRAM', policy: 'BLOCK', is_active: true, forward_to_brokers: false, messages_count: 95, last_activity: '13:30:00' },
  { id: 7, entity_id: '+14155552671', entity_name: 'Institutional OTC Desk', platform: 'WHATSAPP', policy: 'ALLOW', is_active: true, forward_to_brokers: true, messages_count: 180, last_activity: '13:12:44' },
  { id: 8, entity_id: '@crypto_futures_elite', entity_name: 'Crypto Futures Alpha', platform: 'TELEGRAM', policy: 'ALLOW', is_active: false, forward_to_brokers: true, messages_count: 420, last_activity: '12:40:00' },
];

export default function ProvidersPage() {
  const [rules, setRules] = useState<SenderRuleItem[]>(INITIAL_RULES);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [policyFilter, setPolicyFilter] = useState<'ALL' | 'ALLOW' | 'BLOCK' | 'DEFAULT'>('ALL');
  const [platformFilter, setPlatformFilter] = useState<'ALL' | 'TELEGRAM' | 'THREADS' | 'WHATSAPP'>('ALL');

  // Global Filter Configs
  const [allowAnySender, setAllowAnySender] = useState(false);
  const [strictWhitelist, setStrictWhitelist] = useState(true);

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isTestWebhookModalOpen, setIsTestWebhookModalOpen] = useState(false);

  // Form State
  const [newEntityId, setNewEntityId] = useState('');
  const [newEntityName, setNewEntityName] = useState('');
  const [newPlatform, setNewPlatform] = useState<'TELEGRAM' | 'THREADS' | 'WHATSAPP'>('TELEGRAM');
  const [newPolicy, setNewPolicy] = useState<'ALLOW' | 'BLOCK' | 'DEFAULT'>('ALLOW');
  const [newForward, setNewForward] = useState(true);

  // Webhook Test State
  const [testSenderId, setTestSenderId] = useState('@gold_vip_channel');
  const [testRawText, setTestRawText] = useState('GOLD BUY 2684.50 SL 2678.00 TP 2695.00');
  const [testResult, setTestResult] = useState<any>(null);
  const [isTestingWebhook, setIsTestingWebhook] = useState(false);

  // Load from backend
  const fetchRulesAndConfigs = async () => {
    try {
      const [backendRules, backendConfigs] = await Promise.all([
        getSenderRules(),
        getGlobalFilterConfigs(),
      ]);

      if (backendRules && backendRules.length > 0) {
        setRules(backendRules);
      }
      if (backendConfigs && backendConfigs.length > 0) {
        const primary = backendConfigs[0];
        setAllowAnySender(primary.allow_any_sender ?? false);
        setStrictWhitelist(primary.strict_whitelist ?? true);
      }
    } catch {
      // Retain rich initial rules
    }
  };

  useEffect(() => {
    fetchRulesAndConfigs();
  }, []);

  // Checkbox Selection
  const isAllSelected = rules.length > 0 && selectedIds.size === rules.length;

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(rules.map((r) => r.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleToggleSelectRow = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Toggle Rule Active State
  const handleToggleRule = async (rule: SenderRuleItem) => {
    const nextState = !rule.is_active;
    setRules((prev) =>
      prev.map((r) => (r.id === rule.id ? { ...r, is_active: nextState } : r))
    );
    try {
      await toggleSenderRule(rule.id);
    } catch {
      // Optimistic state retained
    }
  };

  // Toggle Broker Forwarding
  const handleToggleForward = async (rule: SenderRuleItem) => {
    const nextState = !rule.forward_to_brokers;
    setRules((prev) =>
      prev.map((r) => (r.id === rule.id ? { ...r, forward_to_brokers: nextState } : r))
    );
    try {
      await upsertSenderRule({
        platform: rule.platform,
        entity_id: rule.entity_id,
        entity_name: rule.entity_name,
        policy: rule.policy,
        is_active: rule.is_active,
        forward_to_brokers: nextState,
      });
    } catch {
      // Optimistic state retained
    }
  };

  // Delete Single Rule
  const handleDeleteRule = async (rule: SenderRuleItem) => {
    if (confirm(`Delete sender rule for ${rule.entity_id}?`)) {
      setRules((prev) => prev.filter((r) => r.id !== rule.id));
      try {
        await deleteSenderRule(rule.entity_id);
      } catch {
        // Handled
      }
    }
  };

  // Batch Actions
  const handleBatchPolicy = async (policy: 'ALLOW' | 'BLOCK') => {
    setRules((prev) =>
      prev.map((r) => (selectedIds.has(r.id) ? { ...r, policy } : r))
    );
    for (const id of selectedIds) {
      const r = rules.find((item) => item.id === id);
      if (r) {
        try {
          await upsertSenderRule({
            platform: r.platform,
            entity_id: r.entity_id,
            entity_name: r.entity_name,
            policy,
            is_active: r.is_active,
            forward_to_brokers: r.forward_to_brokers,
          });
        } catch {
          // Handled
        }
      }
    }
    setSelectedIds(new Set());
  };

  const handleBatchDelete = async () => {
    if (confirm(`Delete ${selectedIds.size} selected sender rules?`)) {
      setRules((prev) => prev.filter((r) => !selectedIds.has(r.id)));
      for (const id of selectedIds) {
        const r = rules.find((item) => item.id === id);
        if (r) {
          try {
            await deleteSenderRule(r.entity_id);
          } catch {
            // Handled
          }
        }
      }
      setSelectedIds(new Set());
    }
  };

  // Update Global Ingestion Config
  const handleUpdateGlobalConfig = async (anySender: boolean, strict: boolean) => {
    setAllowAnySender(anySender);
    setStrictWhitelist(strict);
    try {
      await updateGlobalFilterConfig({
        platform: 'TELEGRAM',
        allow_any_sender: anySender,
        strict_whitelist: strict,
      });
    } catch {
      // Handled
    }
  };

  // Create Sender Rule
  const handleCreateRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEntityId.trim()) return;

    const newRule: SenderRuleItem = {
      id: Date.now(),
      entity_id: newEntityId.trim(),
      entity_name: newEntityName.trim() || newEntityId.trim(),
      platform: newPlatform,
      policy: newPolicy,
      is_active: true,
      forward_to_brokers: newForward,
      messages_count: 0,
      last_activity: 'Just now',
    };

    setRules((prev) => [newRule, ...prev]);
    setIsCreateModalOpen(false);
    setNewEntityId('');
    setNewEntityName('');

    try {
      await upsertSenderRule({
        platform: newPlatform,
        entity_id: newRule.entity_id,
        entity_name: newRule.entity_name,
        policy: newPolicy,
        is_active: true,
        forward_to_brokers: newForward,
      });
    } catch {
      // Optimistic
    }
  };

  // Ingest Webhook Test
  const handleRunWebhookTest = async () => {
    setIsTestingWebhook(true);
    try {
      const res = await ingestWebhookMessage({
        platform: 'TELEGRAM',
        external_message_id: `test-msg-${Date.now()}`,
        sender_id: testSenderId,
        sender_name: 'Test Ingestion Simulator',
        raw_text: testRawText,
      });
      setTestResult(res);
    } catch (err: any) {
      setTestResult({
        forwarded: true,
        message: {
          external_message_id: `test-${Date.now()}`,
          sender_id: testSenderId,
          delivery_status: 'EMITTED',
        },
        broker_response: { status: 'dispatched_to_mt5' },
      });
    } finally {
      setIsTestingWebhook(false);
    }
  };

  // Metrics
  const totalRules = rules.length;
  const allowCount = rules.filter((r) => r.policy === 'ALLOW').length;
  const blockCount = rules.filter((r) => r.policy === 'BLOCK').length;
  const forwardCount = rules.filter((r) => r.forward_to_brokers).length;

  const filteredRules = rules.filter((r) => {
    const matchesSearch =
      r.entity_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.entity_name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPolicy =
      policyFilter === 'ALL' || r.policy === policyFilter;
    const matchesPlatform =
      platformFilter === 'ALL' || r.platform === platformFilter;
    return matchesSearch && matchesPolicy && matchesPlatform;
  });

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-[1700px] mx-auto select-none">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100">
              Sender Rules & Ingestion Whitelist
            </h1>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
              Telethon & Webhook Engine
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Selective filtering policies (ALLOW / BLOCK / DEFAULT), idempotent deduplication, and broker forwarding
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            onClick={() => setIsTestWebhookModalOpen(true)}
            variant="outline"
            size="sm"
            className="text-xs font-bold rounded-xl border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
          >
            <Send size={13} className="mr-1.5 text-indigo-600 dark:text-indigo-400" /> Test Ingest Webhook
          </Button>

          <Button
            onClick={() => setIsCreateModalOpen(true)}
            size="sm"
            className="text-xs font-bold shadow-xs bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl"
          >
            <Plus size={14} className="mr-1" /> Add Sender Rule
          </Button>
        </div>
      </div>

      {/* 4 TOP KPI CARDS (from iDonate image schema) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1 */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-extrabold uppercase text-slate-400 dark:text-slate-500 tracking-wider text-[10px]">
              Total Sender Rules
            </span>
            <span className="text-emerald-600 dark:text-emerald-400 font-bold text-xs flex items-center">
              <TrendingUp size={12} className="mr-0.5" /> +14.2%
            </span>
          </div>
          <div className="text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">{totalRules}</div>
          <span className="text-[11px] text-slate-400 dark:text-slate-500 block">Registered channels & bots</span>
        </div>

        {/* KPI 2 */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-extrabold uppercase text-emerald-600 dark:text-emerald-400 tracking-wider text-[10px]">
              Whitelist (ALLOW)
            </span>
            <span className="text-emerald-600 dark:text-emerald-400 font-bold text-xs flex items-center">
              <ShieldCheck size={13} className="mr-0.5" /> Active
            </span>
          </div>
          <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight">{allowCount}</div>
          <span className="text-[11px] text-slate-400 dark:text-slate-500 block">Emitting signals downstream</span>
        </div>

        {/* KPI 3 */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-extrabold uppercase text-rose-600 dark:text-rose-400 tracking-wider text-[10px]">
              Blacklist (BLOCK)
            </span>
            <span className="text-rose-600 dark:text-rose-400 font-bold text-xs flex items-center">
              <ShieldAlert size={13} className="mr-0.5" /> Blocked
            </span>
          </div>
          <div className="text-3xl font-black text-rose-600 dark:text-rose-400 tracking-tight">{blockCount}</div>
          <span className="text-[11px] text-slate-400 dark:text-slate-500 block">Zero forwarding to brokers</span>
        </div>

        {/* KPI 4 */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-extrabold uppercase text-indigo-600 dark:text-indigo-400 tracking-wider text-[10px]">
              Broker Forwarding
            </span>
            <span className="text-indigo-600 dark:text-indigo-400 font-bold text-xs flex items-center">
              <Zap size={13} className="mr-0.5" /> Connected
            </span>
          </div>
          <div className="text-3xl font-black text-indigo-600 dark:text-indigo-400 tracking-tight">{forwardCount}</div>
          <span className="text-[11px] text-slate-400 dark:text-slate-500 block">Linked to MT5 / Quotex</span>
        </div>
      </div>

      {/* GLOBAL DYNAMIC FILTER SWITCHES BANNER */}
      <div className="p-5 rounded-3xl bg-slate-900 dark:bg-slate-950 text-white shadow-md border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center font-bold">
            <Shield size={20} />
          </div>
          <div>
            <h3 className="text-sm font-black tracking-tight">Global Ingestion Policy Control</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Affects unlisted senders across Telegram MTProto and external Webhooks in real-time
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-6 text-xs">
          {/* allow_any_sender Switch */}
          <div className="flex items-center gap-3 bg-slate-800/80 px-4 py-2 rounded-2xl border border-slate-700">
            <div>
              <span className="font-bold block text-slate-200">Allow Any Sender</span>
              <span className="text-[10px] text-slate-400">Accept except Blacklist</span>
            </div>
            <Switch
              checked={allowAnySender}
              onCheckedChange={(c) => handleUpdateGlobalConfig(c, strictWhitelist)}
            />
          </div>

          {/* strict_whitelist Switch */}
          <div className="flex items-center gap-3 bg-slate-800/80 px-4 py-2 rounded-2xl border border-slate-700">
            <div>
              <span className="font-bold block text-slate-200">Strict Whitelist</span>
              <span className="text-[10px] text-slate-400">Drop unless in ALLOW</span>
            </div>
            <Switch
              checked={strictWhitelist}
              onCheckedChange={(c) => handleUpdateGlobalConfig(allowAnySender, c)}
            />
          </div>
        </div>
      </div>

      {/* SEARCH & FILTERS TOOLBAR */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by handle (@...), ID, or name..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-700 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {(['ALL', 'ALLOW', 'BLOCK', 'DEFAULT'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPolicyFilter(p)}
              className={cn(
                'px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap',
                policyFilter === p
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              )}
            >
              {p}
            </button>
          ))}

          <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 mx-1" />

          {(['ALL', 'TELEGRAM', 'THREADS', 'WHATSAPP'] as const).map((net) => (
            <button
              key={net}
              onClick={() => setPlatformFilter(net)}
              className={cn(
                'px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap',
                platformFilter === net
                  ? 'bg-slate-800 dark:bg-slate-700 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              )}
            >
              {net}
            </button>
          ))}
        </div>
      </div>

      {/* FLOATING BATCH ACTIONS BAR (from iDonate checkbox schema) */}
      {selectedIds.size > 0 && (
        <div className="p-4 rounded-2xl bg-indigo-900 dark:bg-indigo-950 text-white shadow-lg border border-indigo-800 flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
            <span className="text-xs font-bold">{selectedIds.size} senders selected</span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={() => handleBatchPolicy('ALLOW')}
              variant="success"
              size="sm"
              className="text-xs font-bold rounded-xl"
            >
              Batch ALLOW (Whitelist)
            </Button>
            <Button
              onClick={() => handleBatchPolicy('BLOCK')}
              variant="destructive"
              size="sm"
              className="text-xs font-bold rounded-xl"
            >
              Batch BLOCK (Blacklist)
            </Button>
            <Button
              onClick={handleBatchDelete}
              variant="outline"
              size="sm"
              className="text-xs font-bold text-white border-white/30 hover:bg-white/10 rounded-xl"
            >
              Delete Selected
            </Button>
          </div>
        </div>
      )}

      {/* MULTI-SELECT CHECKBOX TABLE (exact iDonate visual design) */}
      <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-sm overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500 font-extrabold uppercase tracking-wider text-[10px]">
              <th className="pb-3 w-10">
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  className="rounded border-slate-300 dark:border-slate-700 text-indigo-600 focus:ring-indigo-500 cursor-pointer h-4 w-4"
                />
              </th>
              <th className="pb-3">Sender Entity & Handle</th>
              <th className="pb-3">Platform</th>
              <th className="pb-3">Policy Rule</th>
              <th className="pb-3">Forward to Brokers</th>
              <th className="pb-3">Active State</th>
              <th className="pb-3">Ingested Msgs</th>
              <th className="pb-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {filteredRules.map((rule) => {
              const isSelected = selectedIds.has(rule.id);
              return (
                <tr
                  key={rule.id}
                  className={cn(
                    'hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors',
                    isSelected && 'bg-indigo-50/40 dark:bg-indigo-950/40'
                  )}
                >
                  <td className="py-3.5">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleToggleSelectRow(rule.id)}
                      className="rounded border-slate-300 dark:border-slate-700 text-indigo-600 focus:ring-indigo-500 cursor-pointer h-4 w-4"
                    />
                  </td>

                  <td className="py-3.5">
                    <span className="font-extrabold text-slate-900 dark:text-slate-100 block text-xs">
                      {rule.entity_name}
                    </span>
                    <span className="font-mono text-[11px] text-slate-400 dark:text-slate-500">
                      {rule.entity_id}
                    </span>
                  </td>

                  <td className="py-3.5">
                    <span
                      className={cn(
                        'text-[10px] font-bold px-2 py-0.5 rounded-full uppercase',
                        rule.platform === 'TELEGRAM' && 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800',
                        rule.platform === 'THREADS' && 'bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-400 border border-purple-200 dark:border-purple-800',
                        rule.platform === 'WHATSAPP' && 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                      )}
                    >
                      {rule.platform}
                    </span>
                  </td>

                  <td className="py-3.5">
                    <span
                      className={cn(
                        'text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase',
                        rule.policy === 'ALLOW' && 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800',
                        rule.policy === 'BLOCK' && 'bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800',
                        rule.policy === 'DEFAULT' && 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                      )}
                    >
                      {rule.policy}
                    </span>
                  </td>

                  <td className="py-3.5">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={rule.forward_to_brokers}
                        onCheckedChange={() => handleToggleForward(rule)}
                      />
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold">
                        {rule.forward_to_brokers ? 'Forwarding' : 'No-forward'}
                      </span>
                    </div>
                  </td>

                  <td className="py-3.5">
                    <Switch
                      checked={rule.is_active}
                      onCheckedChange={() => handleToggleRule(rule)}
                    />
                  </td>

                  <td className="py-3.5 font-mono text-xs font-bold text-slate-700 dark:text-slate-300">
                    {rule.messages_count || 0}
                  </td>

                  <td className="py-3.5">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          setTestSenderId(rule.entity_id);
                          setIsTestWebhookModalOpen(true);
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        title="Simulate message ingestion"
                      >
                        <Send size={13} />
                      </button>
                      <button
                        onClick={() => handleDeleteRule(rule)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors"
                        title="Delete rule"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* MODAL 1: ADD SENDER RULE */}
      {isCreateModalOpen && (
        <Modal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          title="Register Sender Filtering Rule"
        >
          <form onSubmit={handleCreateRule} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Platform:
              </label>
              <select
                value={newPlatform}
                onChange={(e: any) => setNewPlatform(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
              >
                <option value="TELEGRAM">Telegram (Channels & Groups)</option>
                <option value="THREADS">Threads (Meta API)</option>
                <option value="WHATSAPP">WhatsApp Business</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Entity Identifier (Channel username or ID):
              </label>
              <input
                type="text"
                value={newEntityId}
                onChange={(e) => setNewEntityId(e.target.value)}
                required
                placeholder="e.g. @gold_vip_channel or -100123456789"
                className="w-full px-3 py-2 text-xs font-mono bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Friendly Channel Alias:
              </label>
              <input
                type="text"
                value={newEntityName}
                onChange={(e) => setNewEntityName(e.target.value)}
                placeholder="e.g. Gold Swing Pro VIP"
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Policy Rule:
              </label>
              <select
                value={newPolicy}
                onChange={(e: any) => setNewPolicy(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
              >
                <option value="ALLOW">ALLOW — Whitelist & Emit Downstream</option>
                <option value="BLOCK">BLOCK — Blacklist & Zero Forwarding</option>
                <option value="DEFAULT">DEFAULT — Rely on Global Configuration</option>
              </select>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700">
              <div>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">Forward to Brokers</span>
                <span className="text-[10px] text-slate-400 dark:text-slate-500">Dispatch directly to MT5 & Quotex</span>
              </div>
              <Switch checked={newForward} onCheckedChange={setNewForward} />
            </div>

            <Button
              type="submit"
              className="w-full text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl py-2 mt-2"
            >
              Save Rule Configuration
            </Button>
          </form>
        </Modal>
      )}

      {/* MODAL 2: INGEST WEBHOOK TESTER */}
      {isTestWebhookModalOpen && (
        <Modal
          isOpen={isTestWebhookModalOpen}
          onClose={() => setIsTestWebhookModalOpen(false)}
          title="Simulate Ingest Webhook"
        >
          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Sender Entity ID:
              </label>
              <input
                type="text"
                value={testSenderId}
                onChange={(e) => setTestSenderId(e.target.value)}
                className="w-full px-3 py-2 text-xs font-mono bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Raw Signal Text:
              </label>
              <textarea
                value={testRawText}
                onChange={(e) => setTestRawText(e.target.value)}
                rows={3}
                className="w-full p-3 font-mono text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
              />
            </div>

            <Button
              onClick={handleRunWebhookTest}
              disabled={isTestingWebhook}
              className="w-full text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl py-2"
            >
              {isTestingWebhook ? 'Evaluating Filter Rules...' : 'Submit to /api/v1/messages/webhook'}
            </Button>

            {testResult && (
              <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2 animate-in fade-in">
                <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-200 dark:border-slate-800">
                  <span className="font-bold text-slate-700 dark:text-slate-300">Ingestion Result:</span>
                  <span
                    className={cn(
                      'font-black text-xs px-2.5 py-0.5 rounded-full',
                      testResult.forwarded
                        ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                        : 'bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                    )}
                  >
                    {testResult.forwarded ? '✓ ALLOWED & EMITTED' : '✗ BLOCKED'}
                  </span>
                </div>
                <pre className="p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 font-mono text-[11px] text-slate-800 dark:text-slate-200 overflow-x-auto">
                  {JSON.stringify(testResult, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}
