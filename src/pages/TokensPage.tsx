import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { TokenViewer, Token, getPlaceholderForKind } from '@/components/signals/TokenViewer';
import {
  tokenizeText,
  getTemplates,
  createTemplate,
  TokenizeResponse,
} from '@/services/tokenizerApi';
import {
  Play,
  Tag,
  Sparkles,
  Cpu,
  Clock,
  CheckCircle2,
  Copy,
  ExternalLink,
  Layers,
  ArrowRight,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const SAMPLE_PRESETS = [
  {
    label: 'Forex MT5 with SL/TP',
    text: 'EURUSD BUY 1.0850\nTP 1.0900\nSL 1.0800',
  },
  {
    label: 'PocketOption / Quotex OTC Binary',
    text: '🛰 POCKET OPTION M1\n\n💷 EURUSD-OTC\n💎 M1\n⌚️ 14:07:00\n🔽 PUT GALE 1',
  },
  {
    label: 'Gold Scalp',
    text: 'GOLD NOW SELL 2684.50\nTP1 2680.00\nTP2 2675.00\nSL 2692.00',
  },
];

export default function TokensPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Incoming text from location.state or query param ?text=
  const incomingText = (location.state as any)?.text || searchParams.get('text') || '';
  const incomingChannel = (location.state as any)?.channel || searchParams.get('channel') || '';
  const incomingSender = (location.state as any)?.sender || searchParams.get('sender') || '';

  const [inputText, setInputText] = useState(incomingText || SAMPLE_PRESETS[0]?.text || '');
  const [tokenizeResult, setTokenizeResult] = useState<TokenizeResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [templates, setTemplates] = useState<any[]>([]);

  // Template creation form state
  const [templateName, setTemplateName] = useState(
    incomingChannel ? `${incomingChannel} Pattern` : 'Custom Signal Pattern'
  );
  const [templateSection, setTemplateSection] = useState('A-Forex MT5');
  const [templateSlot, setTemplateSlot] = useState('Auto');
  const [templateType, setTemplateType] = useState<'market' | 'binary'>('market');
  const [templatePriority, setTemplatePriority] = useState(110);
  const [isCreatingTemplate, setIsCreatingTemplate] = useState(false);
  const [createdSuccess, setCreatedSuccess] = useState<any>(null);

  // Load existing templates for reference
  useEffect(() => {
    async function loadInitialTemplates() {
      try {
        const data = await getTemplates({ limit: 48 });
        setTemplates(data || []);
      } catch (err) {
        console.error('Error fetching templates for tokenizer lab:', err);
      }
    }
    loadInitialTemplates();
  }, []);

  const handleTokenize = useCallback(async (textToTokenize?: string) => {
    const text = (textToTokenize ?? inputText).trim();
    if (!text) return;
    setLoading(true);
    try {
      const res = await tokenizeText({ text });
      setTokenizeResult(res);

      // Auto-detect template type if binary tokens detected
      if (res.entities?.is_binary || text.toLowerCase().includes('gale') || text.toLowerCase().includes('otc')) {
        setTemplateType('binary');
        setTemplateSection('B-Binary Turbo');
      } else if (text.toLowerCase().includes('gold') || text.toLowerCase().includes('xau') || text.toLowerCase().includes('us30') || text.toLowerCase().includes('nas100')) {
        setTemplateSection('D-Commodities');
        setTemplateType('market');
      } else if (text.toLowerCase().includes('btc') || text.toLowerCase().includes('eth') || text.toLowerCase().includes('usdt')) {
        setTemplateSection('C-Crypto Scalp');
        setTemplateType('market');
      } else {
        setTemplateSection('A-Forex MT5');
        setTemplateType('market');
      }

      // Auto-name if symbol detected
      if (res.entities?.symbol) {
        const prefix = incomingChannel ? `${incomingChannel} ` : '';
        setTemplateName(`${prefix}${res.entities.symbol} ${res.entities.action || 'Signal'}`);
      }
    } catch (err: any) {
      alert(`Tokenizer error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [inputText, incomingChannel]);

  // Execute tokenization on mount if incoming text was passed from messages
  useEffect(() => {
    if (incomingText) {
      handleTokenize(incomingText);
    }
  }, [incomingText, handleTokenize]);

  // Dynamically build syntax pattern from current tokens
  const derivedPatternSyntax = useMemo(() => {
    if (!tokenizeResult?.tokens || tokenizeResult.tokens.length === 0) return '';
    const linesMap: Record<number, Token[]> = {};
    tokenizeResult.tokens.forEach((t: Token) => {
      const line = t.line ?? 0;
      if (!linesMap[line]) linesMap[line] = [];
      linesMap[line]!.push(t);
    });

    const sortedLines = Object.entries(linesMap).sort(([a], [b]) => Number(a) - Number(b));
    return sortedLines
      .map(([_, lineTokens]) => {
        const sorted = [...lineTokens].sort((a, b) => a.start - b.start);
        return sorted
          .map((t) => {
            const ph = getPlaceholderForKind(t.kind);
            return ph ? ph : t.value;
          })
          .join(' ');
      })
      .join('\n');
  }, [tokenizeResult?.tokens]);

  const [customSyntax, setCustomSyntax] = useState<string>('');

  useEffect(() => {
    if (derivedPatternSyntax) {
      setCustomSyntax(derivedPatternSyntax);
    }
  }, [derivedPatternSyntax]);

  // Handle saving the generated template directly into /templates
  const handleSaveToTemplates = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customSyntax.trim() || !templateName.trim()) return;

    setIsCreatingTemplate(true);
    setCreatedSuccess(null);

    // Compute slot code if 'Auto'
    let resolvedSlot = templateSlot;
    if (resolvedSlot === 'Auto') {
      const prefix = templateSection.startsWith('A') ? 'A' : templateSection.startsWith('B') ? 'B' : templateSection.startsWith('C') ? 'C' : 'D';
      resolvedSlot = `${prefix}${templates.length + 1}`;
    }

    try {
      const newTemplate = await createTemplate({
        name: templateName.trim(),
        pattern_syntax: customSyntax.trim(),
        template_type: templateType,
        section: templateSection,
        code_slot: resolvedSlot,
        sender_name: incomingChannel || incomingSender || 'Message Feed',
        priority: Number(templatePriority) || 110,
        is_active: true,
        win_rate: 82.5,
        latency_us: tokenizeResult?.processing_time_us || 28,
        signals_count: 1,
        quality_score: 90,
      });

      setCreatedSuccess(newTemplate);
      // Reload templates list
      const updatedList = await getTemplates({ limit: 48 });
      setTemplates(updatedList);
    } catch (err: any) {
      alert(`Error saving template: ${err.message}`);
    } finally {
      setIsCreatingTemplate(false);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-[1700px] mx-auto select-none">
      {/* Top Banner if redirected from Telegram / WhatsApp */}
      {incomingText && (
        <div className="p-4 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold shadow-xs">
              <Zap size={20} />
            </div>
            <div>
              <span className="text-xs font-bold text-indigo-700 dark:text-indigo-300 uppercase tracking-wider block">
                Incoming Ingestion Signal
              </span>
              <p className="text-sm font-extrabold text-slate-800 dark:text-slate-100">
                Message from {incomingChannel || 'Feed'} {incomingSender ? `(@${incomingSender})` : ''}
              </p>
            </div>
          </div>
          <Badge className="bg-indigo-600 text-white font-bold text-xs py-1 px-3 rounded-full self-start sm:self-auto">
            Ready for Lexical Labeling & Template Registration
          </Badge>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            Rust Tokenizer & Lexer Lab
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
              AST Engine
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time native Rust lexical tokenization, semantic entity extraction, and instant template synthesis for <span className="font-mono text-indigo-600 font-bold">/templates</span>
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {SAMPLE_PRESETS.map((preset, idx) => (
            <button
              key={idx}
              onClick={() => {
                setInputText(preset.text);
                handleTokenize(preset.text);
              }}
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-bold hover:border-indigo-500 transition-colors text-slate-700 dark:text-slate-300 cursor-pointer shadow-2xs"
            >
              {preset.label}
            </button>
          ))}
          <Button
            onClick={() => navigate('/templates')}
            variant="outline"
            size="sm"
            className="text-xs font-bold rounded-xl border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 gap-1.5"
          >
            Go to Templates <ArrowRight size={13} />
          </Button>
        </div>
      </div>

      {/* Main 2-column Layout: Input Raw Text vs Token Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Input Text Area */}
        <div className="lg:col-span-5 space-y-4">
          <Card className="flex flex-col border border-slate-200/90 dark:border-slate-800 shadow-sm rounded-3xl overflow-hidden bg-white dark:bg-slate-900">
            <CardHeader className="pb-3 flex flex-row items-center justify-between border-b border-slate-100 dark:border-slate-800">
              <CardTitle className="text-sm font-extrabold flex items-center gap-2 text-slate-900 dark:text-slate-100">
                <Cpu size={16} className="text-indigo-600" /> Raw Signal Text
              </CardTitle>
              <span className="text-[11px] text-slate-400 font-mono">Input Buffer</span>
            </CardHeader>
            <CardContent className="p-5 flex flex-col gap-4">
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                rows={9}
                placeholder="Paste raw signal text here (e.g. EURUSD BUY 1.0850 SL 1.0800 TP 1.0900)..."
                className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-950 p-4 text-xs font-mono shadow-inner focus:outline-none focus:ring-2 focus:ring-indigo-500/20 resize-none leading-relaxed text-slate-900 dark:text-slate-100"
              />
              <Button
                onClick={() => handleTokenize()}
                disabled={loading || !inputText.trim()}
                className="w-full gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 rounded-xl shadow-xs cursor-pointer"
              >
                <Play size={15} /> {loading ? 'Tokenizing in Rust Engine...' : 'Execute Lexical Tokenizer'}
              </Button>
            </CardContent>
          </Card>

          {/* Quick Guidance Card */}
          <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200">
              <ShieldCheck size={14} className="text-indigo-600" />
              <span>Why Syntactic Templates?</span>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Templates match tokens in exact grammatical positions with sub-millisecond Rust AST traversal. This is significantly safer and faster than heuristic parsing.
            </p>
          </div>
        </div>

        {/* Right Column: Lexical Token Flow with Interactive Labeling */}
        <div className="lg:col-span-7 space-y-4">
          {!tokenizeResult ? (
            <Card className="h-[460px] flex flex-col items-center justify-center border border-slate-200/90 dark:border-slate-800 shadow-sm rounded-3xl bg-white dark:bg-slate-900 p-8 text-center text-slate-400">
              <Tag size={44} className="text-slate-300 dark:text-slate-700 mb-3" />
              <h3 className="font-extrabold text-base text-slate-700 dark:text-slate-300">Ready to Tokenize</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm">
                Paste signal text on the left and click "Execute Lexical Tokenizer" to inspect tokens and assign semantic variables.
              </p>
            </Card>
          ) : (
            <div className="space-y-4">
              {/* Token Viewer with interactive tagging */}
              <TokenViewer
                tokens={tokenizeResult.tokens as Token[]}
                onTokensChange={(updated) =>
                  setTokenizeResult((prev) => (prev ? { ...prev, tokens: updated } : null))
                }
              />

              {/* Extracted Entities Mini-Audit */}
              {tokenizeResult.entities && (
                <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 space-y-2.5 shadow-sm">
                  <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-100 dark:border-slate-800">
                    <span className="font-extrabold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <Sparkles size={14} className="text-emerald-500" /> Extracted Entities
                    </span>
                    <span className="font-mono text-slate-400 text-[11px]">
                      ⚡ {tokenizeResult.processing_time_us} µs
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
                    <div className="p-2 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-800">
                      <span className="text-[10px] text-slate-400 block">SYMBOL</span>
                      <strong className="text-indigo-600 dark:text-indigo-400">{tokenizeResult.entities.symbol || 'N/A'}</strong>
                    </div>
                    <div className="p-2 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-800">
                      <span className="text-[10px] text-slate-400 block">ACTION</span>
                      <strong className="text-emerald-600 dark:text-emerald-400">{tokenizeResult.entities.action || 'N/A'}</strong>
                    </div>
                    <div className="p-2 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-800">
                      <span className="text-[10px] text-slate-400 block">ENTRY</span>
                      <strong className="text-blue-600 dark:text-blue-400">
                        {tokenizeResult.entities.entry_prices?.[0] || tokenizeResult.entities.entry_price || 'N/A'}
                      </strong>
                    </div>
                    <div className="p-2 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-800">
                      <span className="text-[10px] text-slate-400 block">STOP LOSS</span>
                      <strong className="text-rose-600 dark:text-rose-400">{tokenizeResult.entities.stoploss || 'N/A'}</strong>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* SYNTACTIC TEMPLATE CREATOR FOR /templates */}
      {tokenizeResult && (
        <Card className="border-2 border-indigo-500/30 dark:border-indigo-500/20 rounded-3xl bg-white dark:bg-slate-900 shadow-md overflow-hidden">
          <CardHeader className="p-6 pb-3 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-base font-black flex items-center gap-2 text-slate-900 dark:text-slate-100">
                <Layers size={18} className="text-indigo-600" /> Synthesize & Register Signal Template
              </CardTitle>
              <p className="text-xs text-slate-500 mt-0.5">
                Automatically converted from tokenized variables. This template will directly power matcher slots in <span className="font-mono text-indigo-600 font-bold">/templates</span>.
              </p>
            </div>

            {createdSuccess && (
              <div className="flex items-center gap-2 p-2 px-3 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold animate-in fade-in">
                <CheckCircle2 size={15} className="text-emerald-600" />
                <span>Saved as slot {createdSuccess.code_slot}!</span>
                <Button
                  size="sm"
                  onClick={() => navigate('/templates')}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-7 py-0 px-2.5 rounded-lg ml-2"
                >
                  View in /templates <ExternalLink size={12} className="ml-1" />
                </Button>
              </div>
            )}
          </CardHeader>

          <CardContent className="p-6">
            <form onSubmit={handleSaveToTemplates} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300 block mb-1.5">
                    Template Label:
                  </label>
                  <input
                    type="text"
                    value={templateName}
                    onChange={(e) => setTemplateName(e.target.value)}
                    required
                    placeholder="e.g. VIP Scalper EURUSD M1"
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-bold text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300 block mb-1.5">
                    Target Section:
                  </label>
                  <select
                    value={templateSection}
                    onChange={(e) => {
                      setTemplateSection(e.target.value);
                      if (e.target.value.includes('Binary')) {
                        setTemplateType('binary');
                      } else {
                        setTemplateType('market');
                      }
                    }}
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-bold text-slate-900 dark:text-slate-100"
                  >
                    <option value="A-Forex MT5">A-Forex MT5</option>
                    <option value="B-Binary Turbo">B-Binary Turbo</option>
                    <option value="C-Crypto Scalp">C-Crypto Scalp</option>
                    <option value="D-Commodities">D-Commodities</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300 block mb-1.5">
                    Slot Assignment:
                  </label>
                  <select
                    value={templateSlot}
                    onChange={(e) => setTemplateSlot(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-bold text-slate-900 dark:text-slate-100 font-mono"
                  >
                    <option value="Auto">Auto (Next Available Slot)</option>
                    <optgroup label="Section A (Forex)">
                      {Array.from({ length: 12 }, (_, i) => `A${i + 1}`).map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </optgroup>
                    <optgroup label="Section B (Binary)">
                      {Array.from({ length: 12 }, (_, i) => `B${i + 1}`).map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </optgroup>
                    <optgroup label="Section C (Crypto)">
                      {Array.from({ length: 12 }, (_, i) => `C${i + 1}`).map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </optgroup>
                    <optgroup label="Section D (Commodities)">
                      {Array.from({ length: 12 }, (_, i) => `D${i + 1}`).map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </optgroup>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300 block mb-1.5">
                    Engine Type:
                  </label>
                  <select
                    value={templateType}
                    onChange={(e) => setTemplateType(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-bold text-slate-900 dark:text-slate-100"
                  >
                    <option value="market">Market / MT5 Execution</option>
                    <option value="binary">Binary Options Expiration</option>
                  </select>
                </div>
              </div>

              {/* Syntactic Pattern Textarea */}
              <div>
                <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300 block mb-1.5">
                  Pattern Syntax Definition:
                </label>
                <textarea
                  value={customSyntax}
                  onChange={(e) => setCustomSyntax(e.target.value)}
                  rows={4}
                  required
                  className="w-full p-4 font-mono text-xs bg-slate-900 text-indigo-300 rounded-2xl border border-slate-800 shadow-inner focus:outline-none focus:ring-2 focus:ring-indigo-500/30 whitespace-pre-wrap leading-relaxed"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Placeholders recognized by Rust engine: <code className="text-indigo-600 font-bold">$(symbol)</code>, <code className="text-amber-500 font-bold">$(otc)</code>, <code className="text-indigo-600 font-bold">$(action)</code>, <code className="text-indigo-600 font-bold">$(entry)</code>, <code className="text-indigo-600 font-bold">$(sl)</code>, <code className="text-indigo-600 font-bold">$(tp)</code>, <code className="text-indigo-600 font-bold">$(timeframe)</code>, <code className="text-indigo-600 font-bold">$(expiration)</code>, <code className="text-indigo-600 font-bold">$(gale)</code>, <code className="text-indigo-600 font-bold">$(time)</code>, <code className="text-zinc-500 font-bold">$(dismiss)</code>
                </span>
              </div>

              {/* Submit Button */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                <span className="text-xs text-slate-500">
                  Will register active template and enable instant matching in live slots
                </span>

                <Button
                  type="submit"
                  disabled={isCreatingTemplate || !customSyntax.trim()}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-xl font-extrabold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm cursor-pointer flex items-center justify-center gap-2"
                >
                  <Sparkles size={15} />
                  {isCreatingTemplate ? 'Saving in Database...' : 'Register in /templates'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Existing Registered Templates Grid */}
      <div className="pt-4 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-black tracking-tight text-slate-900 dark:text-white">
              Currently Registered Templates ({templates.length})
            </h2>
            <p className="text-xs text-slate-400">Live operational slots in the trading engine</p>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => navigate('/templates')}
            className="text-xs font-bold rounded-xl border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200"
          >
            Manage Matrix <ArrowRight size={13} className="ml-1" />
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {templates.slice(0, 8).map((tpl) => (
            <Card key={tpl.id} className="border border-slate-200/90 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900 p-4 space-y-2 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="font-mono font-black text-xs px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                  {tpl.code_slot || `ID-${tpl.id}`}
                </span>
                <Badge className={cn('text-[10px] font-bold', tpl.is_active ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-600')}>
                  {tpl.is_active ? 'ACTIVE' : 'INACTIVE'}
                </Badge>
              </div>
              <div>
                <h4 className="font-extrabold text-xs text-slate-900 dark:text-slate-100 truncate">{tpl.name}</h4>
                <span className="text-[10px] text-slate-400 font-mono block">{tpl.section || 'General'}</span>
              </div>
              <pre className="text-[10px] font-mono p-2 bg-slate-50 dark:bg-slate-950 rounded-lg text-slate-700 dark:text-slate-300 truncate">
                {tpl.pattern_syntax}
              </pre>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
