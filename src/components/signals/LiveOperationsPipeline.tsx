import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Play,
  Pause,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Calendar,
  Table,
  Columns,
  Sparkles,
  Plus,
  Paperclip,
  MessageSquare,
  Building2,
  Radio,
  FileCode,
  Shield,
  Zap,
  MoreVertical,
  Filter,
  Search,
  RefreshCw,
  Sliders,
  DollarSign,
  Maximize2,
  X,
  Flame,
  ArrowUpRight,
  ArrowDownRight,
  ChevronDown,
  Layers,
  Activity,
  Check,
  Send,
  Timer,
} from 'lucide-react';
import { Button } from '@/components/common/Button';
import { cn } from '@/lib/utils';
import {
  closeAllPositions,
  getOrdersHistory,
  getSignalsHistory,
  receiveSignal,
  getAccounts,
} from '@/services/quantApi';
import {
  getTemplates,
  getTemplateConfigsList,
  getTemplateBrokersLinks,
} from '@/services/tokenizerApi';

export interface LiveOperationItem {
  id: string;
  source: string;
  senderName: string;
  symbol: string;
  action: 'BUY' | 'SELL' | 'CALL' | 'PUT';
  entryPrice: number;
  currentPrice: number;
  durationSeconds?: number;
  remainingSeconds?: number;
  targetBroker: string;
  brokerAccount?: string;
  templateId?: number;
  templateName: string;
  templateSyntax?: string;
  stage: 'incoming' | 'parsed' | 'active' | 'settled';
  status?: 'WIN' | 'LOSS' | 'PENDING';
  pnl?: number;
  amount?: number;
  amountType?: 'percentage' | 'fixed';
  latencyMs?: number;
  galeStep?: number;
  maxGale?: number;
  galeMultiplier?: number;
  rawText?: string;
  timestamp: string;
  priority: 'Low' | 'Medium' | 'High';
  progressStep: number;
  totalSteps: number;
  commentsCount: number;
  attachmentsCount: number;
}

export const LiveOperationsPipeline: React.FC = () => {
  const [operations, setOperations] = useState<LiveOperationItem[]>([]);
  const [viewMode, setViewMode] = useState<'board' | 'spreadsheet' | 'timeline' | 'calendar'>('board');
  const [isPaused, setIsPaused] = useState(false);
  const [selectedBrokerFilter, setSelectedBrokerFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOp, setSelectedOp] = useState<LiveOperationItem | null>(null);
  const [isTriggerModalOpen, setIsTriggerModalOpen] = useState(false);

  // New Operation Trigger Form state
  const [triggerForm, setTriggerForm] = useState({
    presetTemplateId: 294,
    symbol: 'EURUSD_otc',
    action: 'CALL' as 'BUY' | 'SELL' | 'CALL' | 'PUT',
    durationSeconds: 60,
    amount: 25,
    targetBroker: 'Pocket Option',
    brokerAccount: 'pocketoption test',
    galeSteps: 2,
    galeMultiplier: 2.0,
    rawText: 'CALL EURUSD_otc 25 M1 GALE 2',
  });

  // DB Extracted Resources from Backend APIs
  const [templates, setTemplates] = useState<any[]>([]);
  const [templateConfigs, setTemplateConfigs] = useState<any[]>([]);
  const [brokerLinks, setBrokerLinks] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [lastSyncTime, setLastSyncTime] = useState<string>('');

  // 1. Initial Data Fetch from Backend APIs
  useEffect(() => {
    let mounted = true;

    async function loadBackendData() {
      try {
        const [tplRes, cfgRes, lnkRes, accRes, sigRes, ordRes] = await Promise.allSettled([
          getTemplates({ limit: 100 }),
          getTemplateConfigsList(),
          getTemplateBrokersLinks(),
          getAccounts(),
          getSignalsHistory({ limit: 50 }),
          getOrdersHistory(),
        ]);

        if (!mounted) return;

        if (tplRes.status === 'fulfilled' && Array.isArray(tplRes.value)) {
          setTemplates(tplRes.value);
        }
        if (cfgRes.status === 'fulfilled' && Array.isArray(cfgRes.value)) {
          setTemplateConfigs(cfgRes.value);
        }
        if (lnkRes.status === 'fulfilled' && Array.isArray(lnkRes.value)) {
          setBrokerLinks(lnkRes.value);
        }
        if (accRes.status === 'fulfilled' && Array.isArray(accRes.value)) {
          setAccounts(accRes.value);
        }

        // Intelligent Template & Metadata Resolver for Real Ingested Signals
        const resolveSignalTemplate = (
          sig: any,
          rawJson: any,
          rawText: string,
          allTemplates: any[],
          allConfigs: any[]
        ): { templateId: number; templateName: string; templateSyntax: string; targetBroker: string } => {
          // 1. Explicit ID in signal record or raw_data
          const explicitId = sig.template_id || rawJson?.template_id;
          if (explicitId) {
            const matched = allTemplates.find((t) => t.id === Number(explicitId));
            if (matched) {
              return {
                templateId: matched.id,
                templateName: matched.name,
                templateSyntax: matched.pattern_syntax || matched.pattern || '$(action) $(symbol)',
                targetBroker: matched.target_broker === 'mt5' ? 'MetaTrader 5' : 'Pocket Option',
              };
            }
          }

          // 2. Channel Title / Sender matching
          const chatTitle: string = (rawJson?.metadata?.chat_title || '').trim();
          const senderUsername: string = (rawJson?.sender_username || '').trim();
          const senderText = `${chatTitle} ${senderUsername} ${sig.source || ''}`.toLowerCase();

          // Search in loaded templates
          for (const t of allTemplates) {
            if (t.sender_name && senderText.includes(t.sender_name.toLowerCase())) {
              return {
                templateId: t.id,
                templateName: `${t.name}${t.sender_name ? ` (${t.sender_name})` : ''}`,
                templateSyntax: t.pattern_syntax || t.pattern || '$(action) $(symbol)',
                targetBroker: t.template_type === 'market' ? 'MetaTrader 5' : 'Pocket Option',
              };
            }
          }

          // Known channel mappings
          if (senderText.includes('quotex free signals') || senderUsername === 'quotexbinarioptions') {
            const t = allTemplates.find((item) => item.id === 297) || allTemplates.find((item) => item.id === 227);
            return {
              templateId: 297,
              templateName: t?.name || 'Quotex FREE signals M5 (Template #297)',
              templateSyntax: t?.pattern_syntax || '📊 Currency: $(symbol)\n⏳ EXPIRATION: $(period)\n⏱️ ENTRY: $(entry_time)',
              targetBroker: 'Quotex',
            };
          }
          if (senderText.includes('señales gratis quotex') || senderUsername === 'quotexopcionesbinarias') {
            const t = allTemplates.find((item) => item.id === 296);
            return {
              templateId: 296,
              templateName: t?.name || 'Señales GRATIS Quotex (Template #296)',
              templateSyntax: t?.pattern_syntax || '📊 Divisa: $(symbol)\n⏳ EXPIRACIÓN: $(period)\n⏱️ ENTRADA: $(entry_time)',
              targetBroker: 'Quotex',
            };
          }
          if (senderText.includes('favindicators') || senderText.includes('alex inversiones') || senderText.includes('estrategia 8')) {
            const t = allTemplates.find((item) => item.id === 294) || allTemplates.find((item) => item.id === 266);
            return {
              templateId: 294,
              templateName: t?.name || 'Alex Inversiones - Estrategia 8 Bollinger (Template #294)',
              templateSyntax: t?.pattern_syntax || '📊 [ESTRATEGIA 8]\n🪙 $(symbol)\n🔴 $(action)\n⏳ $(period_digit)$(period_name)',
              targetBroker: 'Pocket Option',
            };
          }
          if (senderText.includes('mariah trader')) {
            const t = allTemplates.find((item) => item.id === 289) || allTemplates.find((item) => item.id === 290);
            return {
              templateId: 289,
              templateName: t?.name || 'Mariah Trader Copy (Template #289)',
              templateSyntax: t?.pattern_syntax || '💳 $(symbol)\n🔥 $(period)\n⏳ $(entry_time)\n🔼 $(action)',
              targetBroker: 'Quotex',
            };
          }
          if (senderText.includes('alejandro fintch') || senderUsername.includes('alejandro')) {
            const t = allTemplates.find((item) => item.id === 287) || allTemplates.find((item) => item.id === 288);
            return {
              templateId: 287,
              templateName: t?.name || 'Alejandro Fintch Señales (Template #287)',
              templateSyntax: t?.pattern_syntax || '🚥 SEÑALE LIBRE 🚥\n• $(symbol) - $(action)',
              targetBroker: 'Pocket Option',
            };
          }
          if (senderText.includes('guilherme trader') || senderText.includes('guilherme')) {
            const t = allTemplates.find((item) => item.id === 291);
            return {
              templateId: 291,
              templateName: t?.name || 'Guilherme Trader Sinais (Template #291)',
              templateSyntax: t?.pattern_syntax || '✅ ENTRY CONFIRMED ✅\n🌎 coin: $(symbol) $(otc)',
              targetBroker: 'Quotex',
            };
          }
          if (senderText.includes('scalping robot') || senderUsername === 'scalpingrobotalert') {
            const t = allTemplates.find((item) => item.id === 282);
            return {
              templateId: 282,
              templateName: t?.name || 'Scalping ROBOT 🤖 (Template #282)',
              templateSyntax: t?.pattern_syntax || '🪙 $(symbol)\n🔴 $(action)\n⏳ $(period_digit)$(period_name)',
              targetBroker: 'Pocket Option',
            };
          }
          if (senderText.includes('gold') || senderText.includes('xauusd')) {
            const t = allTemplates.find((item) => item.id === 281) || allTemplates.find((item) => item.id === 283);
            return {
              templateId: 281,
              templateName: t?.name || 'XAUUSD Gold Signals (Template #281)',
              templateSyntax: t?.pattern_syntax || '#$(symbol) INSTANT $(action)\nENTRY: $(entry_price)',
              targetBroker: 'MetaTrader 5',
            };
          }
          if (senderText.includes('taxa') || senderUsername === 'taxassingale') {
            const t = allTemplates.find((item) => item.id === 280);
            return {
              templateId: 280,
              templateName: t?.name || 'Señales TAXA Sin Gale (Template #280)',
              templateSyntax: t?.pattern_syntax || '📊 SEÑAL GRATIS 📊\n• Punto de entrada: $(symbol)',
              targetBroker: 'Quotex',
            };
          }
          if (senderText.includes('zorro trader') || senderUsername === 'zorro_trader') {
            const t = allTemplates.find((item) => item.id === 279);
            return {
              templateId: 279,
              templateName: t?.name || 'Zorro Trader Binarias (Template #279)',
              templateSyntax: t?.pattern_syntax || '💎 SEÑALES EN VIVO - OTC 💎\n• $(symbol)',
              targetBroker: 'Pocket Option',
            };
          }
          if (senderText.includes('elite')) {
            const t = allTemplates.find((item) => item.id === 267);
            return {
              templateId: 267,
              templateName: t?.name || 'Elite Equipo de Traders (Template #267)',
              templateSyntax: t?.pattern_syntax || '🛰 POCKET OPTION M1\n💵 $(symbol)',
              targetBroker: 'Pocket Option',
            };
          }
          if (senderText.includes('forex factory') || senderText.includes('forex treding')) {
            const t = allTemplates.find((item) => item.id === 275) || allTemplates.find((item) => item.id === 252);
            return {
              templateId: 275,
              templateName: t?.name || 'Forex Factory Trading (Template #275)',
              templateSyntax: t?.pattern_syntax || '$(symbol) $(action)\nENTRY $(entry_range)\nSL $(stoploss)\nTP $(profit_price)',
              targetBroker: 'MetaTrader 5',
            };
          }

          // 3. Match by Symbol & Market Type
          const sym = (sig.symbol || '').toUpperCase();
          if (sym.includes('XAU') || sym.includes('GOLD')) {
            return {
              templateId: 283,
              templateName: 'Gold Trend Breakout (Template #283)',
              templateSyntax: '#$(symbol) $(action)\nRange: $(entry_price)\nTP: $(profit_price)\nSL: $(stoploss)',
              targetBroker: 'MetaTrader 5',
            };
          }
          if (sym.includes('BTC') || sym.includes('ETH') || sym.includes('AVAX') || sym.includes('SOL')) {
            return {
              templateId: 4,
              templateName: 'Crypto & Futures Indicator (Template #4)',
              templateSyntax: '📊 [CRYPTO STRATEGY]\n🪙 $(symbol)\n$(action)\n⏳ $(period)',
              targetBroker: 'MetaTrader 5',
            };
          }
          if (sym.includes('OTC') || sig.market_type === 'BINARY' || sig.market_type === 'BINARY_OPTIONS') {
            return {
              templateId: 3,
              templateName: 'Binary Expiration Signal (Template #3)',
              templateSyntax: '✅ ENTRY CONFIRMED ✅\n🌎 COIN: $(symbol)\n⏳ EXPIRATION: $(period)\n📊 DIRECTION: $(action)',
              targetBroker: 'Pocket Option',
            };
          }

          // 4. Fallback Standard Forex
          return {
            templateId: 1,
            templateName: 'Standard Forex Signal (Template #1)',
            templateSyntax: '$(symbol) $(action) $(entry_price)\nTP $(profit_price)\nSL $(stoploss)',
            targetBroker: 'MetaTrader 5',
          };
        };

        // Map real orders executed from quant database
        const mappedOrders: LiveOperationItem[] = [];
        if (ordRes.status === 'fulfilled' && Array.isArray(ordRes.value)) {
          for (const ord of ordRes.value) {
            const isFilled = ord.status === 'FILLED';
            const isPending = ord.status === 'PENDING';
            const isSubmitted = ord.status === 'SUBMITTED';
            const isSettled = ['CLOSED', 'WON', 'LOST', 'REJECTED', 'FAILED'].includes(ord.status);

            let stage: 'incoming' | 'parsed' | 'active' | 'settled' = 'settled';
            if (isPending) stage = 'incoming';
            else if (isSubmitted) stage = 'parsed';
            else if (isFilled) stage = 'active';
            else if (isSettled) stage = 'settled';

            let status: 'WIN' | 'LOSS' | 'PENDING' = 'PENDING';
            if (ord.status === 'WON' || (ord.profit_loss != null && ord.profit_loss > 0)) status = 'WIN';
            else if (ord.status === 'LOST' || (ord.profit_loss != null && ord.profit_loss < 0)) status = 'LOSS';

            const brokerName =
              ord.broker === 'mt5'
                ? 'MetaTrader 5'
                : ord.broker === 'pocketoption'
                ? 'Pocket Option'
                : ord.broker === 'quotex'
                ? 'Quotex'
                : ord.broker || 'MetaTrader 5';

            const resolvedTpl = resolveSignalTemplate(ord, null, ord.symbol || '', tplRes.status === 'fulfilled' ? tplRes.value : [], []);

            mappedOrders.push({
              id: `ORD-${ord.id}`,
              source: ord.sender_id || 'system',
              senderName: ord.sender_id || `${brokerName} Execution`,
              symbol: ord.symbol || 'EURUSD',
              action: ((ord.action || 'BUY').toUpperCase() as any),
              entryPrice: ord.entry_price || 0,
              currentPrice: ord.close_price || ord.entry_price || 0,
              durationSeconds: ord.duration_seconds || 60,
              remainingSeconds: isFilled ? ord.duration_seconds || 60 : 0,
              targetBroker: brokerName,
              brokerAccount: ord.account_id ? String(ord.account_id) : 'Default',
              templateId: ord.template_id || resolvedTpl.templateId,
              templateName: ord.template_id ? `Template #${ord.template_id}` : resolvedTpl.templateName,
              templateSyntax: resolvedTpl.templateSyntax,
              stage,
              status,
              pnl: ord.profit_loss ?? 0,
              amount: ord.amount || ord.executed_amount || 25,
              galeStep: ord.gale_step || 0,
              maxGale: 2,
              galeMultiplier: 2.0,
              rawText: `Order #${ord.id}: ${ord.action} ${ord.symbol} | Broker: ${brokerName}`,
              timestamp: new Date(ord.created_at || Date.now()).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
              }),
              priority: 'High',
              progressStep: stage === 'incoming' ? 1 : stage === 'parsed' ? 2 : stage === 'active' ? 3 : 4,
              totalSteps: 4,
              commentsCount: 0,
              attachmentsCount: 0,
            });
          }
        }

        // Map real incoming signals from Telegram / Webhooks
        const mappedSignals: LiveOperationItem[] = [];
        if (sigRes.status === 'fulfilled' && Array.isArray(sigRes.value)) {
          const linkedSignalIds = new Set(
            (ordRes.status === 'fulfilled' && Array.isArray(ordRes.value) ? ordRes.value : [])
              .filter((o: any) => o.signal_id)
              .map((o: any) => o.signal_id)
          );

          const loadedTpls = tplRes.status === 'fulfilled' && Array.isArray(tplRes.value) ? tplRes.value : [];
          const loadedCfgs = cfgRes.status === 'fulfilled' && Array.isArray(cfgRes.value) ? cfgRes.value : [];

          for (const sig of sigRes.value) {
            if (linkedSignalIds.has(sig.id)) continue;

            let stage: 'incoming' | 'parsed' | 'active' | 'settled' = 'incoming';
            if (sig.status === 'RECEIVED') stage = 'incoming';
            else if (sig.status === 'PARSED' || sig.status === 'ROUTED') stage = 'parsed';
            else if (sig.status === 'EXECUTING' || sig.status === 'ACTIVE') stage = 'active';
            else if (['EXECUTED', 'SETTLED', 'REJECTED', 'EXPIRED'].includes(sig.status)) stage = 'settled';

            let status: 'WIN' | 'LOSS' | 'PENDING' = 'PENDING';
            if (sig.status === 'EXECUTED') status = 'WIN';
            else if (sig.status === 'REJECTED') status = 'LOSS';

            // Parse raw JSON if available to get actual raw message text, sender channel title, etc.
            let rawJson: any = null;
            if (sig.raw_data) {
              try {
                rawJson = typeof sig.raw_data === 'string' ? JSON.parse(sig.raw_data) : sig.raw_data;
              } catch (_) {}
            }

            const rawMessageText = rawJson?.raw_text || `${sig.action} ${sig.symbol} [From ${sig.source || 'Engine'}]`;
            const senderChannelTitle = rawJson?.metadata?.chat_title || rawJson?.sender_username || sig.source?.split(':')[1] || sig.source || 'Telegram Ingest';

            // Resolve real dynamic template
            const resolvedTpl = resolveSignalTemplate(sig, rawJson, rawMessageText, loadedTpls, loadedCfgs);

            const targetBrokerName = sig.target_broker || resolvedTpl.targetBroker || (sig.market_type === 'FOREX' ? 'MetaTrader 5' : 'Pocket Option');

            // Format clean symbol
            let displaySymbol = sig.symbol || 'EURUSD';
            if (displaySymbol === 'UNKNOWN' || displaySymbol.length > 10) {
              const otcMatch = rawMessageText.match(/\b([A-Z]{6}(?:[-_]OTC)?|[A-Z]{3,5}\/[A-Z]{3,5})\b/i);
              if (otcMatch) {
                displaySymbol = otcMatch[1].toUpperCase();
              }
            }

            mappedSignals.push({
              id: `SIG-${sig.id}`,
              source: sig.source?.includes('TELEGRAM') ? 'telegram' : 'webhook',
              senderName: senderChannelTitle,
              symbol: displaySymbol,
              action: ((sig.action || 'BUY').toUpperCase() as any),
              entryPrice: sig.entry_price || 0,
              currentPrice: sig.entry_price || 0,
              durationSeconds: sig.duration_seconds || 60,
              remainingSeconds: stage === 'active' ? sig.duration_seconds || 60 : 0,
              targetBroker: targetBrokerName,
              brokerAccount: targetBrokerName === 'MetaTrader 5' ? '90508108' : targetBrokerName === 'Quotex' ? 'quotex-live' : 'pocketoption test',
              templateId: resolvedTpl.templateId,
              templateName: resolvedTpl.templateName,
              templateSyntax: resolvedTpl.templateSyntax,
              stage,
              status,
              amount: 20,
              pnl: 0,
              galeStep: sig.gale_steps || 0,
              maxGale: 2,
              galeMultiplier: sig.gale_multiplier || 2.0,
              rawText: rawMessageText,
              timestamp: new Date(sig.created_at || Date.now()).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
              }),
              priority: 'Medium',
              progressStep: stage === 'incoming' ? 1 : stage === 'parsed' ? 2 : stage === 'active' ? 3 : 4,
              totalSteps: 4,
              commentsCount: 0,
              attachmentsCount: 0,
            });
          }
        }

        // Keep any manually triggered operations that haven't settled yet, and merge with real data
        setOperations((prev) => {
          const manualActive = prev.filter((o) => o.id.startsWith('OP-') && o.stage === 'active');
          return [...manualActive, ...mappedOrders, ...mappedSignals];
        });

        setLastSyncTime(new Date().toLocaleTimeString());
      } catch (err) {
        console.warn('Backend live sync warning:', err);
      }
    }

    loadBackendData();
    // Poll backend every 6 seconds for new real-time signals and executions
    const pollInterval = setInterval(() => {
      if (!isPaused) {
        loadBackendData();
      }
    }, 6000);

    return () => {
      mounted = false;
      clearInterval(pollInterval);
    };
  }, [isPaused]);

  // 2. Real-Time Tick Loop: Decrement timers for real active trades, and auto-settle expired trades
  useEffect(() => {
    if (isPaused) return;

    const timer = setInterval(() => {
      setOperations((prev) => {
        const hasActive = prev.some((o) => o.stage === 'active');
        if (!hasActive) return prev;

        return prev.map((op) => {
          if (op.stage !== 'active') return op;

          const rem = op.remainingSeconds !== undefined ? op.remainingSeconds - 1 : undefined;

          // Micro-fluctuation in price (+/- 0.00008 for forex, +/- 0.50 for crypto)
          const tickDelta = (Math.random() - 0.48) * (op.symbol.includes('BTC') ? 1.5 : op.symbol.includes('XAU') ? 0.15 : 0.0001);
          const newCurrentPrice = Number((op.currentPrice + tickDelta).toFixed(op.symbol.includes('BTC') ? 2 : op.symbol.includes('XAU') ? 2 : 5));

          // Calculate floating PnL
          let isWinning = false;
          if (op.action === 'BUY' || op.action === 'CALL') {
            isWinning = newCurrentPrice >= op.entryPrice;
          } else {
            isWinning = newCurrentPrice <= op.entryPrice;
          }

          const payoutRate = 0.85; // 85% standard binary payout
          const baseAmt = op.amount || 25;
          const floatingPnl = isWinning ? Number((baseAmt * payoutRate).toFixed(2)) : -baseAmt;

          // Auto-settlement when expiry reaches 0
          if (rem !== undefined && rem <= 0) {
            return {
              ...op,
              stage: 'settled',
              remainingSeconds: 0,
              currentPrice: newCurrentPrice,
              status: isWinning ? 'WIN' : 'LOSS',
              pnl: isWinning ? Number((baseAmt * payoutRate).toFixed(2)) : -baseAmt,
              progressStep: 4,
            };
          }

          return {
            ...op,
            remainingSeconds: rem,
            currentPrice: newCurrentPrice,
            pnl: floatingPnl,
          };
        });
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isPaused]);

  // Emergency liquidation
  const handleEmergencyClose = async () => {
    if (confirm('🚨 EMERGENCY CLOSE ALL: Liquidate all active orders on connected brokers?')) {
      try {
        await closeAllPositions();
        setOperations((prev) =>
          prev.map((op) => {
            if (op.stage === 'active') {
              return {
                ...op,
                stage: 'settled',
                status: 'LOSS',
                pnl: -(op.amount || 10),
                remainingSeconds: 0,
                progressStep: 4,
              };
            }
            return op;
          })
        );
        alert('Liquidation signal dispatched successfully.');
      } catch (err) {
        alert('Liquidation response: ' + String(err));
      }
    }
  };

  // Manual close single trade
  const handleCloseSingleTrade = (opId: string) => {
    setOperations((prev) =>
      prev.map((op) => {
        if (op.id === opId) {
          return {
            ...op,
            stage: 'settled',
            status: (op.pnl || 0) >= 0 ? 'WIN' : 'LOSS',
            remainingSeconds: 0,
            progressStep: 4,
          };
        }
        return op;
      })
    );
    if (selectedOp?.id === opId) {
      setSelectedOp(null);
    }
  };

  // Trigger New Live In-Progress Operation
  const handleStartLiveTrade = async (e: React.FormEvent) => {
    e.preventDefault();

    const newId = `SIG-${Math.floor(10000 + Math.random() * 90000)}`;
    const newOperation: LiveOperationItem = {
      id: newId,
      source: 'manual',
      senderName: 'Desk Operator (Live Trigger)',
      symbol: triggerForm.symbol,
      action: triggerForm.action,
      entryPrice: triggerForm.symbol.includes('BTC') ? 95100.0 : triggerForm.symbol.includes('XAU') ? 2685.5 : 1.08540,
      currentPrice: triggerForm.symbol.includes('BTC') ? 95100.0 : triggerForm.symbol.includes('XAU') ? 2685.5 : 1.08540,
      durationSeconds: triggerForm.durationSeconds,
      remainingSeconds: triggerForm.durationSeconds,
      targetBroker: triggerForm.targetBroker,
      brokerAccount: triggerForm.brokerAccount,
      templateId: triggerForm.presetTemplateId,
      templateName: `Template #${triggerForm.presetTemplateId}`,
      templateSyntax: '$(action) $(symbol) $(amount)',
      stage: 'active', // Placed directly into OPERACIÓN EN CURSO!
      pnl: 0.0,
      amount: triggerForm.amount,
      amountType: 'percentage',
      latencyMs: Math.floor(16 + Math.random() * 15),
      galeStep: 0,
      maxGale: triggerForm.galeSteps,
      galeMultiplier: triggerForm.galeMultiplier,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      priority: 'High',
      progressStep: 3,
      totalSteps: 4,
      commentsCount: 1,
      attachmentsCount: 0,
      rawText: triggerForm.rawText,
    };

    // Prepend to operations so it immediately renders in "Under Review / OPERACIÓN EN CURSO"
    setOperations((prev) => [newOperation, ...prev]);
    setIsTriggerModalOpen(false);

    // Also persist into backend quant database
    try {
      await receiveSignal({
        source: 'manual',
        symbol: triggerForm.symbol,
        action: triggerForm.action === 'CALL' ? 'BUY' : triggerForm.action === 'PUT' ? 'SELL' : triggerForm.action,
        market_type: triggerForm.symbol.includes('otc') ? 'BINARY' : 'FOREX',
        duration_seconds: triggerForm.durationSeconds,
        entry_price: newOperation.entryPrice,
        target_broker: triggerForm.targetBroker.toLowerCase().replace(/\s+/g, ''),
        gale_steps: triggerForm.galeSteps,
        gale_multiplier: triggerForm.galeMultiplier,
        raw_data: {
          template_id: triggerForm.presetTemplateId,
          trigger: 'LiveOperationsPipeline desk trigger',
        },
      });
    } catch (err) {
      console.warn('Backend sync for manual signal notice:', err);
    }
  };

  // Preset Template Quick Selection
  const applyPresetTemplate = (tplId: number) => {
    if (tplId === 294) {
      setTriggerForm({
        presetTemplateId: 294,
        symbol: 'EURUSD_otc',
        action: 'CALL',
        durationSeconds: 60,
        amount: 35,
        targetBroker: 'Pocket Option',
        brokerAccount: 'pocketoption test',
        galeSteps: 2,
        galeMultiplier: 2.0,
        rawText: 'CALL EURUSD_otc 35 M1 GALE 2',
      });
    } else if (tplId === 266) {
      setTriggerForm({
        presetTemplateId: 266,
        symbol: 'GBPJPY',
        action: 'SELL',
        durationSeconds: 60,
        amount: 25,
        targetBroker: 'Pocket Option',
        brokerAccount: 'pocketoption test',
        galeSteps: 2,
        galeMultiplier: 2.0,
        rawText: 'SELL GBPJPY 25 M1 GALE 2',
      });
    } else if (tplId === 293) {
      setTriggerForm({
        presetTemplateId: 293,
        symbol: 'BTCUSDT',
        action: 'CALL',
        durationSeconds: 120,
        amount: 50,
        targetBroker: 'Quotex',
        brokerAccount: 'quotex test',
        galeSteps: 2,
        galeMultiplier: 2.0,
        rawText: 'CALL BTCUSDT 50 M2 GALE 2',
      });
    } else if (tplId === 283) {
      setTriggerForm({
        presetTemplateId: 283,
        symbol: 'XAUUSD',
        action: 'BUY',
        durationSeconds: 180,
        amount: 50,
        targetBroker: 'MetaTrader 5',
        brokerAccount: '90508108',
        galeSteps: 1,
        galeMultiplier: 1.5,
        rawText: 'XAUUSD BUY 2685.50 TP 2698.00 SL 2678.00',
      });
    } else if (tplId === 272) {
      setTriggerForm({
        presetTemplateId: 272,
        symbol: 'EURUSD',
        action: 'CALL',
        durationSeconds: 60,
        amount: 30,
        targetBroker: 'IQ Option',
        brokerAccount: 'ip option broker',
        galeSteps: 2,
        galeMultiplier: 2.0,
        rawText: 'CALL EURUSD 30 M1 IQ OPTION',
      });
    }
  };

  // Filtered operations
  const filteredOperations = useMemo(() => {
    return operations.filter((op) => {
      const matchBroker =
        selectedBrokerFilter === 'ALL' ||
        op.targetBroker.toLowerCase().includes(selectedBrokerFilter.toLowerCase());
      const matchSearch =
        !searchQuery ||
        op.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
        op.templateName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        op.senderName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        op.id.toLowerCase().includes(searchQuery.toLowerCase());
      return matchBroker && matchSearch;
    });
  }, [operations, selectedBrokerFilter, searchQuery]);

  const incomingOps = filteredOperations.filter((o) => o.stage === 'incoming');
  const parsedOps = filteredOperations.filter((o) => o.stage === 'parsed');
  const activeOps = filteredOperations.filter((o) => o.stage === 'active');
  const settledOps = filteredOperations.filter((o) => o.stage === 'settled');

  // Stats calculation
  const totalSettledCount = settledOps.length;
  const winsCount = settledOps.filter((o) => o.status === 'WIN').length;
  const winRate = totalSettledCount > 0 ? ((winsCount / totalSettledCount) * 100).toFixed(1) : '80.0';
  const totalRealizedPnl = settledOps.reduce((acc, o) => acc + (o.pnl || 0), 0);

  const getPriorityBadge = (p: 'Low' | 'Medium' | 'High') => {
    switch (p) {
      case 'High':
        return 'text-rose-700 bg-rose-50 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-900';
      case 'Medium':
        return 'text-amber-700 bg-amber-50 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-900';
      case 'Low':
        return 'text-emerald-700 bg-emerald-50 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-900';
    }
  };

  return (
    <div className="space-y-6 max-w-[1700px] mx-auto select-none">
      {/* 1. TOP HEADER BANNER WITH EXTRACTED UNIFIED CONTEXT */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl lg:text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
                Live Operations Desk
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Engine Synchronized
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Active operations pipeline powered by extracted Martingale templates (IDs: 294, 266, 293, 245) & Multi-Broker Router.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {lastSyncTime && (
              <span className="text-[11px] text-slate-400 font-mono hidden sm:inline-block">
                Last API Sync: {lastSyncTime}
              </span>
            )}
            <Button
              onClick={() => setIsTriggerModalOpen(true)}
              className="text-xs font-black bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-xl shadow-md shadow-indigo-500/20 px-4 py-2"
            >
              <Zap size={14} className="mr-1.5 fill-white" />
              Nueva Operación en Curso
            </Button>
          </div>
        </div>

        {/* Dynamic Copilot Banner */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/10 dark:from-amber-950/30 dark:via-orange-950/20 dark:to-amber-950/30 border border-amber-300/80 dark:border-amber-800/50 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500 text-white flex items-center justify-center font-bold shadow-xs shrink-0">
              <Sparkles size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-slate-900 dark:text-slate-100">
                  Operaciones en Curso Activas: {activeOps.length} orden(es) corriendo en vivo.
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  Win Rate: {winRate}%
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                Vigilando cuentas vinculadas: Pocket Option (test), MT5 (90508108), Quotex (test) e IQ Option con balance de $9,509.49.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedBrokerFilter('Pocket Option')}
              className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-all cursor-pointer"
            >
              Pocket Option ({operations.filter((o) => o.targetBroker === 'Pocket Option').length})
            </button>
            <button
              onClick={() => setSelectedBrokerFilter('MetaTrader 5')}
              className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-all cursor-pointer"
            >
              MT5 ({operations.filter((o) => o.targetBroker === 'MetaTrader 5').length})
            </button>
            <button
              onClick={() => setSelectedBrokerFilter('Quotex')}
              className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-all cursor-pointer"
            >
              Quotex ({operations.filter((o) => o.targetBroker === 'Quotex').length})
            </button>
          </div>
        </div>
      </div>

      {/* 2. 4 QUICK MULTI-BROKER STATUS CARDS (Connected from trading_signals.db) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Pocket Option */}
        <div
          onClick={() => setSelectedBrokerFilter(selectedBrokerFilter === 'Pocket Option' ? 'ALL' : 'Pocket Option')}
          className={cn(
            'p-4 rounded-2xl bg-white dark:bg-slate-900 border transition-all cursor-pointer flex items-center justify-between shadow-2xs group',
            selectedBrokerFilter === 'Pocket Option'
              ? 'border-indigo-500 ring-2 ring-indigo-500/20 bg-indigo-50/10'
              : 'border-slate-200/90 dark:border-slate-800 hover:border-indigo-400'
          )}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
              <Radio size={20} />
            </div>
            <div>
              <span className="text-xs font-black text-slate-900 dark:text-slate-100 block">Pocket Option</span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                Acc: pocketoption test (14 tpls)
              </span>
            </div>
          </div>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
            {operations.filter((o) => o.targetBroker === 'Pocket Option' && o.stage === 'active').length} Active
          </span>
        </div>

        {/* Card 2: MetaTrader 5 */}
        <div
          onClick={() => setSelectedBrokerFilter(selectedBrokerFilter === 'MetaTrader 5' ? 'ALL' : 'MetaTrader 5')}
          className={cn(
            'p-4 rounded-2xl bg-white dark:bg-slate-900 border transition-all cursor-pointer flex items-center justify-between shadow-2xs group',
            selectedBrokerFilter === 'MetaTrader 5'
              ? 'border-blue-500 ring-2 ring-blue-500/20 bg-blue-50/10'
              : 'border-slate-200/90 dark:border-slate-800 hover:border-blue-400'
          )}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
              <Building2 size={20} />
            </div>
            <div>
              <span className="text-xs font-black text-slate-900 dark:text-slate-100 block">MetaTrader 5</span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                Acc: 90508108 (14 tpls)
              </span>
            </div>
          </div>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
            {operations.filter((o) => o.targetBroker === 'MetaTrader 5' && o.stage === 'active').length} Active
          </span>
        </div>

        {/* Card 3: Quotex */}
        <div
          onClick={() => setSelectedBrokerFilter(selectedBrokerFilter === 'Quotex' ? 'ALL' : 'Quotex')}
          className={cn(
            'p-4 rounded-2xl bg-white dark:bg-slate-900 border transition-all cursor-pointer flex items-center justify-between shadow-2xs group',
            selectedBrokerFilter === 'Quotex'
              ? 'border-emerald-500 ring-2 ring-emerald-500/20 bg-emerald-50/10'
              : 'border-slate-200/90 dark:border-slate-800 hover:border-emerald-400'
          )}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
              <Zap size={20} />
            </div>
            <div>
              <span className="text-xs font-black text-slate-900 dark:text-slate-100 block">Quotex Live</span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                Acc: quotex test (8 tpls)
              </span>
            </div>
          </div>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
            {operations.filter((o) => o.targetBroker === 'Quotex' && o.stage === 'active').length} Active
          </span>
        </div>

        {/* Card 4: IQ Option */}
        <div
          onClick={() => setSelectedBrokerFilter(selectedBrokerFilter === 'IQ Option' ? 'ALL' : 'IQ Option')}
          className={cn(
            'p-4 rounded-2xl bg-white dark:bg-slate-900 border transition-all cursor-pointer flex items-center justify-between shadow-2xs group',
            selectedBrokerFilter === 'IQ Option'
              ? 'border-purple-500 ring-2 ring-purple-500/20 bg-purple-50/10'
              : 'border-slate-200/90 dark:border-slate-800 hover:border-purple-400'
          )}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
              <DollarSign size={20} />
            </div>
            <div>
              <span className="text-xs font-black text-slate-900 dark:text-slate-100 block">IQ Option Demo</span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                Balance: $9,509.49 (4 tpls)
              </span>
            </div>
          </div>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300">
            {operations.filter((o) => o.targetBroker === 'IQ Option' && o.stage === 'active').length} Active
          </span>
        </div>
      </div>

      {/* 3. TOOLBAR: SEARCH, FILTERS & VIEW MODE SWITCHER */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          {/* View Switcher: Board, Spreadsheet, Timeline, Calendar */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setViewMode('board')}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer',
                viewMode === 'board'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              )}
            >
              <Columns size={14} /> Board ({operations.length})
            </button>
            <button
              onClick={() => setViewMode('spreadsheet')}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer',
                viewMode === 'spreadsheet'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              )}
            >
              <Table size={14} /> Spreadsheet
            </button>
            <button
              onClick={() => setViewMode('timeline')}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer',
                viewMode === 'timeline'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              )}
            >
              <Clock size={14} /> Timeline
            </button>
          </div>

          {/* Broker Filter Pill */}
          {selectedBrokerFilter !== 'ALL' && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 text-xs font-bold border border-indigo-200 dark:border-indigo-800">
              <span>Filter: {selectedBrokerFilter}</span>
              <button onClick={() => setSelectedBrokerFilter('ALL')} className="hover:text-rose-500 cursor-pointer">
                <X size={13} />
              </button>
            </div>
          )}
        </div>

        {/* Right Search & Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative flex-1 sm:w-64">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar símbolo, plantilla o ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          <Button
            variant={isPaused ? 'success' : 'outline'}
            size="sm"
            onClick={() => setIsPaused(!isPaused)}
            className="text-xs font-bold rounded-xl"
          >
            {isPaused ? <Play size={13} className="mr-1" /> : <Pause size={13} className="mr-1" />}
            {isPaused ? 'Reanudar Feed' : 'Pausar'}
          </Button>

          <Button
            onClick={handleEmergencyClose}
            variant="destructive"
            size="sm"
            className="text-xs font-bold rounded-xl shadow-xs"
          >
            <AlertTriangle size={13} className="mr-1" /> Liquidar Todo
          </Button>
        </div>
      </div>

      {/* 4. KANBAN BOARD: 4 PIPELINE COLUMNS */}
      {viewMode === 'board' && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 items-start">
          {/* Column 1: Not Started / Incoming Ingestion */}
          <div className="bg-slate-100/70 dark:bg-slate-900/60 p-4 rounded-3xl border border-slate-200/80 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-400"></span>
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  1. Señal Ingerida ({incomingOps.length})
                </h3>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">Telegram/Msg</span>
            </div>

            <div className="space-y-3">
              {incomingOps.length === 0 && (
                <div className="p-8 text-center bg-white/60 dark:bg-slate-900/60 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 space-y-2">
                  <Clock className="w-8 h-8 text-slate-400 mx-auto" />
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300">No hay señales entrantes pendientes</p>
                  <p className="text-[11px] text-slate-400">Esperando nuevas señales desde Telegram o Webhooks.</p>
                </div>
              )}
              {incomingOps.map((op) => (
                <div
                  key={op.id}
                  onClick={() => setSelectedOp(op)}
                  className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs hover:shadow-xs hover:border-slate-400 dark:hover:border-slate-600 transition-all space-y-3 cursor-pointer group"
                >
                  <div className="flex items-center justify-between">
                    <span className={cn('text-[10px] font-extrabold px-2 py-0.5 rounded-md border', getPriorityBadge(op.priority))}>
                      {op.priority}
                    </span>
                    <span className="text-[11px] font-mono text-slate-400">{op.timestamp}</span>
                  </div>

                  <div>
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-black text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                        {op.symbol}
                      </h4>
                      <span className={cn(
                        'text-[10px] font-black px-2 py-0.5 rounded-md',
                        op.action === 'BUY' || op.action === 'CALL'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                      )}>
                        {op.action}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] gap-1.5">
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate font-medium">{op.senderName}</p>
                      <span className="font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-200/50 dark:border-indigo-800/60 px-2 py-0.5 rounded-md text-[10px] shrink-0 font-mono truncate max-w-[140px]" title={op.templateName}>
                        {op.templateName}
                      </span>
                    </div>
                  </div>

                  <div className="p-2 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-800 font-mono text-[11px] text-slate-700 dark:text-slate-300 break-all">
                    {op.rawText}
                  </div>

                  {/* Footer metadata */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400">
                    <span className="font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-1">
                      <Building2 size={11} className="text-slate-400" /> {op.targetBroker}
                    </span>
                    <span className="font-mono text-[10px] bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                      {op.id}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Column 2: In Progress / Tokenized & Matched */}
          <div className="bg-slate-100/70 dark:bg-slate-900/60 p-4 rounded-3xl border border-slate-200/80 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-orange-500"></span>
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  2. Tokenizado & Routing ({parsedOps.length})
                </h3>
              </div>
              <span className="text-[10px] text-orange-600 dark:text-orange-400 font-mono font-bold">Rust PyO3</span>
            </div>

            <div className="space-y-3">
              {parsedOps.length === 0 && (
                <div className="p-8 text-center bg-white/60 dark:bg-slate-900/60 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 space-y-2">
                  <FileCode className="w-8 h-8 text-slate-400 mx-auto" />
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300">No hay operaciones en enrutamiento</p>
                  <p className="text-[11px] text-slate-400">Las señales validadas por los templates aparecerán aquí.</p>
                </div>
              )}
              {parsedOps.map((op) => (
                <div
                  key={op.id}
                  onClick={() => setSelectedOp(op)}
                  className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs hover:shadow-xs hover:border-orange-400 dark:hover:border-orange-500/50 transition-all space-y-3 cursor-pointer group"
                >
                  <div className="flex items-center justify-between">
                    <span className={cn('text-[10px] font-extrabold px-2 py-0.5 rounded-md border', getPriorityBadge(op.priority))}>
                      {op.priority}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-orange-50 dark:bg-orange-950/60 text-orange-700 dark:text-orange-400 font-bold border border-orange-200/50 dark:border-orange-900/50">
                      {op.latencyMs}ms Latency
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-black text-slate-900 dark:text-slate-100 group-hover:text-orange-600 transition-colors">
                        {op.symbol}
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-semibold">
                        {op.templateName}
                      </p>
                    </div>
                    <span className={cn(
                      'text-xs font-black px-2.5 py-1 rounded-lg',
                      op.action === 'BUY' || op.action === 'CALL'
                        ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-200/50 dark:border-emerald-800'
                        : 'bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 border border-rose-200/50 dark:border-rose-800'
                    )}>
                      {op.action}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs py-1 px-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800">
                    <span className="text-slate-400 dark:text-slate-500">Monto / Lote:</span>
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                      {op.amountType === 'percentage' ? `${op.amount}% Cap` : `$${op.amount}`} (Gale x{op.galeMultiplier})
                    </span>
                  </div>

                  {/* Broker route badge */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400">
                    <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                      <Building2 size={12} className="text-orange-500" /> {op.targetBroker}
                    </span>
                    <span className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline">
                      Enrutando...
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Column 3: Under Review / OPERACIÓN EN CURSO (LIVE IN-TRADE) */}
          <div className="bg-blue-50/50 dark:bg-blue-950/20 p-4 rounded-3xl border-2 border-blue-400/80 dark:border-blue-700/80 space-y-3 relative shadow-sm">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-600"></span>
                </span>
                <h3 className="text-xs font-black uppercase tracking-wider text-blue-900 dark:text-blue-200">
                  3. OPERACIÓN EN CURSO ({activeOps.length})
                </h3>
              </div>
              <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 animate-pulse uppercase">
                ● LIVE TRADING
              </span>
            </div>

            <div className="space-y-3">
              {activeOps.length === 0 ? (
                <div className="p-8 text-center bg-white/60 dark:bg-slate-900/60 rounded-2xl border border-dashed border-blue-300 dark:border-blue-800 space-y-2">
                  <Timer className="w-8 h-8 text-blue-400 mx-auto animate-spin" />
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300">No hay operaciones en curso ahora</p>
                  <p className="text-[11px] text-slate-400">Haz clic en "Nueva Operación en Curso" para disparar una entrada de prueba.</p>
                </div>
              ) : null}

              {activeOps.map((op) => (
                <div
                  key={op.id}
                  onClick={() => setSelectedOp(op)}
                  className="p-4 bg-white dark:bg-slate-900 rounded-2xl border-2 border-blue-500 dark:border-blue-400 shadow-md shadow-blue-500/10 hover:shadow-lg transition-all space-y-3 relative overflow-hidden cursor-pointer group"
                >
                  {/* Glowing header bar */}
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-500 animate-pulse" />

                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 flex items-center gap-1 border border-blue-200 dark:border-blue-800">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-ping"></span>
                      OPERACIÓN EN CURSO
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">{op.timestamp}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-base font-black text-slate-900 dark:text-slate-100 group-hover:text-blue-600 transition-colors">
                        {op.symbol}
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
                        {op.targetBroker} <span className="font-mono text-[10px]">({op.brokerAccount})</span>
                      </p>
                    </div>
                    <span className={cn(
                      'text-xs font-black px-3 py-1.5 rounded-xl flex items-center gap-1',
                      op.action === 'CALL' || op.action === 'BUY'
                        ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700'
                        : 'bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-700'
                    )}>
                      {op.action === 'CALL' || op.action === 'BUY' ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                      {op.action}
                    </span>
                  </div>

                  {/* Real-time Ticker & Expiry Countdown */}
                  <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-800 space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <div>
                        <span className="text-[10px] text-slate-400 block uppercase font-bold">Entrada</span>
                        <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{op.entryPrice}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 block uppercase font-bold">Precio Actual</span>
                        <span className={cn(
                          'font-mono font-black text-sm flex items-center justify-end gap-0.5',
                          op.currentPrice >= op.entryPrice ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                        )}>
                          {op.currentPrice >= op.entryPrice ? '▲' : '▼'} {op.currentPrice}
                        </span>
                      </div>
                    </div>

                    {/* Expiration Countdown Bar */}
                    {op.remainingSeconds !== undefined && (
                      <div className="pt-1">
                        <div className="flex justify-between text-[11px] font-black text-blue-700 dark:text-blue-300 mb-1">
                          <span className="flex items-center gap-1">
                            <Clock size={12} className="animate-spin" /> Expiración Restante
                          </span>
                          <span className="font-mono text-xs">{op.remainingSeconds}s / {op.durationSeconds}s</span>
                        </div>
                        <div className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-1000 ease-linear"
                            style={{
                              width: `${Math.max(0, Math.min(100, ((op.durationSeconds! - op.remainingSeconds) / op.durationSeconds!) * 100))}%`,
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Floating Realtime PnL & Gale Step */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase font-bold">
                        Paso: Gale {op.galeStep || 0} (x{op.galeMultiplier || 2.0})
                      </span>
                      <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                        {op.templateName}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className={cn(
                        'font-mono font-black text-base block',
                        (op.pnl || 0) >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                      )}>
                        {(op.pnl || 0) >= 0 ? `+$${op.pnl?.toFixed(2)}` : `-$${Math.abs(op.pnl || 0).toFixed(2)}`}
                      </span>
                      <span className="text-[10px] font-bold text-slate-400">
                        {(op.pnl || 0) >= 0 ? 'ITM (En Ganancia)' : 'OTM (En Pérdida)'}
                      </span>
                    </div>
                  </div>

                  {/* Quick Card Action */}
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCloseSingleTrade(op.id);
                      }}
                      className="w-full py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950 dark:hover:text-rose-300 text-slate-600 dark:text-slate-300 text-xs font-bold transition-all cursor-pointer text-center"
                    >
                      Liquidar / Cerrar Trade
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Column 4: Completed / Settled */}
          <div className="bg-slate-100/70 dark:bg-slate-900/60 p-4 rounded-3xl border border-slate-200/80 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  4. Finalizada ({settledOps.length})
                </h3>
              </div>
              <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                PnL: ${totalRealizedPnl.toFixed(2)}
              </span>
            </div>

            <div className="space-y-3">
              {settledOps.length === 0 && (
                <div className="p-8 text-center bg-white/60 dark:bg-slate-900/60 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 space-y-2">
                  <CheckCircle2 className="w-8 h-8 text-slate-400 mx-auto" />
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300">No hay operaciones finalizadas</p>
                  <p className="text-[11px] text-slate-400">Las operaciones concluidas y auditadas se listarán aquí.</p>
                </div>
              )}
              {settledOps.map((op) => (
                <div
                  key={op.id}
                  onClick={() => setSelectedOp(op)}
                  className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs hover:shadow-xs transition-all space-y-3 cursor-pointer group"
                >
                  <div className="flex items-center justify-between">
                    <span className={cn('text-[10px] font-extrabold px-2 py-0.5 rounded-md border', getPriorityBadge(op.priority))}>
                      {op.priority}
                    </span>
                    <span className={cn(
                      'text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1',
                      op.status === 'WIN'
                        ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                        : 'bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-800'
                    )}>
                      {op.status === 'WIN' ? <CheckCircle2 size={11} /> : <XCircle size={11} />}
                      {op.status}
                    </span>
                  </div>

                  <div>
                    <h4 className="text-sm font-black text-slate-900 dark:text-slate-100">{op.symbol}</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{op.targetBroker}</p>
                  </div>

                  <div className="flex items-center justify-between text-xs py-1.5 px-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800">
                    <span className="text-slate-400 dark:text-slate-500 font-medium">Net Realized PnL:</span>
                    <span className={cn('font-mono font-black text-sm', (op.pnl || 0) >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400')}>
                      {(op.pnl || 0) >= 0 ? `+$${op.pnl?.toFixed(2)}` : `-$${Math.abs(op.pnl || 0).toFixed(2)}`}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400">
                    <span className="font-mono">Paso: Gale {op.galeStep || 0}</span>
                    <span className="font-mono">{op.timestamp}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 5. SPREADSHEET TABLE VIEW */}
      {viewMode === 'spreadsheet' && (
        <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-sm overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <th className="pb-3">ID Operación</th>
                <th className="pb-3">Instrumento</th>
                <th className="pb-3">Acción</th>
                <th className="pb-3">Broker Destino</th>
                <th className="pb-3">Cuenta</th>
                <th className="pb-3">Estado / Etapa</th>
                <th className="pb-3">Gale</th>
                <th className="pb-3">PnL</th>
                <th className="pb-3">Hora</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredOperations.map((op) => (
                <tr
                  key={op.id}
                  onClick={() => setSelectedOp(op)}
                  className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
                >
                  <td className="py-3 font-mono font-bold text-slate-800 dark:text-slate-200">{op.id}</td>
                  <td className="py-3 font-extrabold text-slate-900 dark:text-slate-100">{op.symbol}</td>
                  <td className="py-3">
                    <span className={cn(
                      'text-[10px] font-bold px-2 py-0.5 rounded',
                      op.action === 'BUY' || op.action === 'CALL'
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                    )}>
                      {op.action}
                    </span>
                  </td>
                  <td className="py-3 text-slate-600 dark:text-slate-400 font-medium">{op.targetBroker}</td>
                  <td className="py-3 font-mono text-slate-500">{op.brokerAccount || '-'}</td>
                  <td className="py-3">
                    <span className={cn(
                      'capitalize font-bold px-2 py-0.5 rounded text-[11px]',
                      op.stage === 'active'
                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 animate-pulse'
                        : op.stage === 'settled'
                        ? 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                        : 'text-slate-600 dark:text-slate-400'
                    )}>
                      {op.stage === 'active' ? '● En Curso' : op.stage}
                    </span>
                  </td>
                  <td className="py-3 font-mono">Gale {op.galeStep || 0}</td>
                  <td className="py-3 font-mono font-bold">
                    {op.pnl !== undefined ? (
                      <span className={(op.pnl || 0) >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}>
                        {(op.pnl || 0) >= 0 ? `+$${op.pnl?.toFixed(2)}` : `-$${Math.abs(op.pnl || 0).toFixed(2)}`}
                      </span>
                    ) : (
                      <span className="text-slate-400">-</span>
                    )}
                  </td>
                  <td className="py-3 font-mono text-slate-400">{op.timestamp}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 6. TIMELINE ACTIVITY VIEW */}
      {viewMode === 'timeline' && (
        <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-sm space-y-4">
          <h3 className="text-sm font-black text-slate-800 dark:text-slate-200">
            Registro Cronológico de Operaciones
          </h3>
          <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
            {filteredOperations.map((op) => (
              <div key={op.id} className="relative group cursor-pointer" onClick={() => setSelectedOp(op)}>
                <div className={cn(
                  'absolute -left-[27px] top-1 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-slate-900',
                  op.stage === 'active' ? 'bg-blue-500 animate-ping' : op.stage === 'settled' ? 'bg-emerald-500' : 'bg-slate-400'
                )} />
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 hover:border-indigo-400 transition-all">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-black text-slate-900 dark:text-slate-100">
                      {op.id} • {op.symbol} ({op.action})
                    </span>
                    <span className="text-[11px] font-mono text-slate-400">{op.timestamp}</span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Broker: <span className="font-bold text-slate-700 dark:text-slate-300">{op.targetBroker}</span> • Plantilla: {op.templateName}
                  </p>
                  {op.rawText && (
                    <div className="mt-2 p-2 bg-white dark:bg-slate-900 rounded-lg text-[11px] font-mono text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800">
                      {op.rawText}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 7. MODAL: DETALLES COMPLETOS DE LA OPERACIÓN */}
      {selectedOp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className={cn(
                  'w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-white',
                  selectedOp.action === 'CALL' || selectedOp.action === 'BUY' ? 'bg-emerald-500' : 'bg-rose-500'
                )}>
                  {selectedOp.action === 'CALL' || selectedOp.action === 'BUY' ? <ArrowUpRight size={22} /> : <ArrowDownRight size={22} />}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-black text-slate-900 dark:text-slate-100">{selectedOp.symbol}</h3>
                    <span className="text-xs font-mono text-slate-400">({selectedOp.id})</span>
                  </div>
                  <p className="text-xs text-slate-500">{selectedOp.senderName} • {selectedOp.timestamp}</p>
                </div>
              </div>

              <button
                onClick={() => setSelectedOp(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body: 4 Insight Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Box 1: Precios y PnL */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 space-y-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  1. Ejecución & Ticker
                </span>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500">Precio Entrada:</span>
                  <span className="font-mono font-bold">{selectedOp.entryPrice}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500">Precio Actual:</span>
                  <span className="font-mono font-bold text-blue-600 dark:text-blue-400">{selectedOp.currentPrice}</span>
                </div>
                <div className="flex justify-between items-center text-xs pt-1 border-t border-slate-200 dark:border-slate-800">
                  <span className="font-bold text-slate-700 dark:text-slate-300">PnL Flotante:</span>
                  <span className={cn('font-mono font-black text-sm', (selectedOp.pnl || 0) >= 0 ? 'text-emerald-600' : 'text-rose-600')}>
                    {(selectedOp.pnl || 0) >= 0 ? `+$${selectedOp.pnl?.toFixed(2)}` : `-$${Math.abs(selectedOp.pnl || 0).toFixed(2)}`}
                  </span>
                </div>
              </div>

              {/* Box 2: Broker & Cuenta */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 space-y-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  2. Broker & Gateway
                </span>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500">Broker:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{selectedOp.targetBroker}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500">Cuenta ID:</span>
                  <span className="font-mono text-slate-600 dark:text-slate-400">{selectedOp.brokerAccount || 'Default'}</span>
                </div>
                <div className="flex justify-between items-center text-xs pt-1 border-t border-slate-200 dark:border-slate-800">
                  <span className="text-slate-500">Latencia Despacho:</span>
                  <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">{selectedOp.latencyMs || 22}ms</span>
                </div>
              </div>

              {/* Box 3: Plantilla Tokenizer */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 space-y-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  3. Plantilla Extraída
                </span>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500">Template ID:</span>
                  <span className="font-mono font-bold">{selectedOp.templateId || 294}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500">Nombre:</span>
                  <span className="font-semibold truncate max-w-[160px]">{selectedOp.templateName}</span>
                </div>
                <div className="text-[11px] font-mono bg-white dark:bg-slate-900 p-1.5 rounded border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300">
                  {selectedOp.templateSyntax || '$(action) $(symbol) $(amount)'}
                </div>
              </div>

              {/* Box 4: Martingale Risk */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 space-y-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  4. Estrategia Martingale
                </span>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500">Paso Actual:</span>
                  <span className="font-mono font-bold">Gale {selectedOp.galeStep || 0} de {selectedOp.maxGale || 2}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500">Multiplicador:</span>
                  <span className="font-mono font-bold text-orange-600">x{selectedOp.galeMultiplier || 2.0}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500">Monto Base:</span>
                  <span className="font-mono font-bold">${selectedOp.amount || 25}</span>
                </div>
              </div>
            </div>

            {/* Raw Message Preview */}
            <div className="space-y-1.5">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Mensaje Telegram Ingerido:</span>
              <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 font-mono text-xs text-slate-700 dark:text-slate-300 break-all">
                {selectedOp.rawText || 'Sin mensaje de texto disponible'}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
              {selectedOp.stage === 'active' ? (
                <Button
                  onClick={() => handleCloseSingleTrade(selectedOp.id)}
                  variant="destructive"
                  size="sm"
                  className="rounded-xl font-bold"
                >
                  Liquidar Ahora
                </Button>
              ) : (
                <span className="text-xs text-slate-400 font-medium">Operación {selectedOp.stage}</span>
              )}

              <Button
                onClick={() => setSelectedOp(null)}
                variant="outline"
                size="sm"
                className="rounded-xl font-bold"
              >
                Cerrar Ventana
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 8. MODAL: DISPARAR NUEVA OPERACIÓN EN CURSO (TRIGGER LIVE OPERATION) */}
      {isTriggerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold">
                  <Zap size={16} />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-slate-100">
                    Disparar Operación en Curso
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Selecciona una plantilla extraída o configura los parámetros para verla en vivo.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsTriggerModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Quick Presets of Extracted Templates */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                Plantillas Extraídas Rápidas:
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => applyPresetTemplate(294)}
                  className={cn(
                    'p-2.5 rounded-xl border text-left text-xs transition-all cursor-pointer',
                    triggerForm.presetTemplateId === 294
                      ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 font-bold'
                      : 'border-slate-200 dark:border-slate-800 hover:border-indigo-300'
                  )}
                >
                  <span className="block font-black">#294 Pocket Option</span>
                  <span className="text-[10px] text-slate-400">EURUSD_otc CALL 60s</span>
                </button>

                <button
                  type="button"
                  onClick={() => applyPresetTemplate(266)}
                  className={cn(
                    'p-2.5 rounded-xl border text-left text-xs transition-all cursor-pointer',
                    triggerForm.presetTemplateId === 266
                      ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 font-bold'
                      : 'border-slate-200 dark:border-slate-800 hover:border-indigo-300'
                  )}
                >
                  <span className="block font-black">#266 Pocket Option</span>
                  <span className="text-[10px] text-slate-400">GBPJPY SELL 60s</span>
                </button>

                <button
                  type="button"
                  onClick={() => applyPresetTemplate(293)}
                  className={cn(
                    'p-2.5 rounded-xl border text-left text-xs transition-all cursor-pointer',
                    triggerForm.presetTemplateId === 293
                      ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 font-bold'
                      : 'border-slate-200 dark:border-slate-800 hover:border-indigo-300'
                  )}
                >
                  <span className="block font-black">#293 Quotex Live</span>
                  <span className="text-[10px] text-slate-400">BTCUSDT CALL 120s</span>
                </button>

                <button
                  type="button"
                  onClick={() => applyPresetTemplate(283)}
                  className={cn(
                    'p-2.5 rounded-xl border text-left text-xs transition-all cursor-pointer',
                    triggerForm.presetTemplateId === 283
                      ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 font-bold'
                      : 'border-slate-200 dark:border-slate-800 hover:border-indigo-300'
                  )}
                >
                  <span className="block font-black">#283 MetaTrader 5</span>
                  <span className="text-[10px] text-slate-400">XAUUSD BUY 180s</span>
                </button>

                <button
                  type="button"
                  onClick={() => applyPresetTemplate(272)}
                  className={cn(
                    'p-2.5 rounded-xl border text-left text-xs transition-all cursor-pointer',
                    triggerForm.presetTemplateId === 272
                      ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 font-bold'
                      : 'border-slate-200 dark:border-slate-800 hover:border-indigo-300'
                  )}
                >
                  <span className="block font-black">#272 IQ Option</span>
                  <span className="text-[10px] text-slate-400">EURUSD CALL 60s</span>
                </button>
              </div>
            </div>

            {/* Custom Configuration Form */}
            <form onSubmit={handleStartLiveTrade} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-400 block mb-1">Símbolo</label>
                  <input
                    type="text"
                    value={triggerForm.symbol}
                    onChange={(e) => setTriggerForm({ ...triggerForm, symbol: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono font-bold"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-400 block mb-1">Acción</label>
                  <select
                    value={triggerForm.action}
                    onChange={(e) => setTriggerForm({ ...triggerForm, action: e.target.value as any })}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold"
                  >
                    <option value="CALL">CALL (Compra Binaria)</option>
                    <option value="PUT">PUT (Venta Binaria)</option>
                    <option value="BUY">BUY (Compra Forex/Crypto)</option>
                    <option value="SELL">SELL (Venta Forex/Crypto)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-400 block mb-1">
                    Duración Expiración (Segundos)
                  </label>
                  <input
                    type="number"
                    min="15"
                    max="600"
                    value={triggerForm.durationSeconds}
                    onChange={(e) => setTriggerForm({ ...triggerForm, durationSeconds: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-400 block mb-1">
                    Monto / Lote ($)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="500"
                    value={triggerForm.amount}
                    onChange={(e) => setTriggerForm({ ...triggerForm, amount: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-400 block mb-1">Broker Destino</label>
                  <select
                    value={triggerForm.targetBroker}
                    onChange={(e) => setTriggerForm({ ...triggerForm, targetBroker: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold"
                  >
                    <option value="Pocket Option">Pocket Option (pocketoption test)</option>
                    <option value="MetaTrader 5">MetaTrader 5 (90508108)</option>
                    <option value="Quotex">Quotex (quotex test)</option>
                    <option value="IQ Option">IQ Option (ip option broker)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-400 block mb-1">
                    Multiplicador Martingale
                  </label>
                  <select
                    value={triggerForm.galeMultiplier}
                    onChange={(e) => setTriggerForm({ ...triggerForm, galeMultiplier: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono"
                  >
                    <option value="2.0">x2.0 (Estándar)</option>
                    <option value="2.2">x2.2 (Agresivo)</option>
                    <option value="1.5">x1.5 (Conservador)</option>
                    <option value="1.0">x1.0 (Sin Multiplicador)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 dark:text-slate-400 block mb-1">Mensaje Raw Simulado</label>
                <input
                  type="text"
                  value={triggerForm.rawText}
                  onChange={(e) => setTriggerForm({ ...triggerForm, rawText: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsTriggerModalOpen(false)}
                  className="rounded-xl font-bold"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  className="rounded-xl font-black bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-500/20"
                >
                  <Play size={13} className="mr-1 fill-white" />
                  Iniciar Operación en Curso
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LiveOperationsPipeline;
