import React, { useState, useMemo } from 'react';
import { Tag, Check, X, Sparkles, Plus, Copy, CheckCheck, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface Token {
  kind: string;
  value: string;
  start: number;
  end: number;
  line: number;
}

export interface TokenTagOption {
  kind: string;
  placeholder: string;
  label: string;
  badgeColor: string;
  description: string;
}

export const AVAILABLE_TOKEN_TAGS: TokenTagOption[] = [
  { kind: 'SYMBOL', placeholder: '$(symbol)', label: 'Symbol / Asset', badgeColor: 'bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800', description: 'Asset or Currency Pair (e.g. EURUSD, GOLD, BTCUSDT)' },
  { kind: 'OTC', placeholder: '$(otc)', label: 'OTC Market', badgeColor: 'bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800', description: 'Over-The-Counter market indicator for binary options (e.g. OTC, -OTC, _otc)' },
  { kind: 'ACTION', placeholder: '$(action)', label: 'Action Direction', badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800', description: 'Order direction (BUY, SELL, CALL, PUT, LONG, SHORT)' },
  { kind: 'PRICE_ENTRY', placeholder: '$(entry)', label: 'Entry Price', badgeColor: 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800', description: 'Execution price (e.g. 1.0850, 2684.50)' },
  { kind: 'SL', placeholder: '$(sl)', label: 'Stop Loss', badgeColor: 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800', description: 'Stop loss boundary (e.g. 1.0800, 2678.00)' },
  { kind: 'TP', placeholder: '$(tp)', label: 'Take Profit', badgeColor: 'bg-teal-100 text-teal-800 border-teal-300 dark:bg-teal-950/60 dark:text-teal-300 dark:border-teal-800', description: 'Take profit target (e.g. 1.0900, 2695.00)' },
  { kind: 'TIMEFRAME', placeholder: '$(timeframe)', label: 'Timeframe', badgeColor: 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800', description: 'Bar interval (e.g. M1, M5, M15, 1H)' },
  { kind: 'EXPIRATION', placeholder: '$(expiration)', label: 'Expiration', badgeColor: 'bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-950/60 dark:text-orange-300 dark:border-orange-800', description: 'Binary expiration time (e.g. 1min, 5min, S30)' },
  { kind: 'GALE', placeholder: '$(gale)', label: 'Martingale / Gale', badgeColor: 'bg-pink-100 text-pink-800 border-pink-300 dark:bg-pink-950/60 dark:text-pink-300 dark:border-pink-800', description: 'Recovery step (e.g. 1, 2, GALE 1)' },
  { kind: 'TIME', placeholder: '$(time)', label: 'Execution Time', badgeColor: 'bg-cyan-100 text-cyan-800 border-cyan-300 dark:bg-cyan-950/60 dark:text-cyan-300 dark:border-cyan-800', description: 'Scheduled clock time (e.g. 14:07:00)' },
  { kind: 'ENTRY_RANGE', placeholder: '$(entry_range)', label: 'Entry Range', badgeColor: 'bg-indigo-100 text-indigo-800 border-indigo-300 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-800', description: 'Entry zone (e.g. 4086.0 - 4089.0)' },
  { kind: 'DISMISS', placeholder: '$(dismiss)', label: 'Dismiss / Skip Variable', badgeColor: 'bg-zinc-200 text-zinc-700 border-zinc-400 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-600', description: 'Omit variable or non-operational info (e.g. channel links, random noise)' },
  { kind: 'TEXT', placeholder: '', label: 'Plain Literal Text', badgeColor: 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700', description: 'Keep as fixed syntax literal keyword' },
];

export const getTokenColor = (kind: string) => {
  const norm = kind.toUpperCase();
  if (norm.includes('BUY')) return 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300';
  if (norm.includes('SELL')) return 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950/60 dark:text-rose-300';
  if (norm === 'ACTION') return 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300';
  if (norm === 'SYMBOL') return 'bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-950/60 dark:text-purple-300';
  if (norm === 'OTC') return 'bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300';
  if (norm === 'PRICE_ENTRY') return 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950/60 dark:text-blue-300';
  if (norm === 'SL') return 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950/60 dark:text-rose-300';
  if (norm === 'TP') return 'bg-teal-100 text-teal-800 border-teal-300 dark:bg-teal-950/60 dark:text-teal-300';
  if (norm === 'TIMEFRAME') return 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300';
  if (norm === 'EXPIRATION') return 'bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-950/60 dark:text-orange-300';
  if (norm === 'GALE') return 'bg-pink-100 text-pink-800 border-pink-300 dark:bg-pink-950/60 dark:text-pink-300';
  if (norm === 'TIME') return 'bg-cyan-100 text-cyan-800 border-cyan-300 dark:bg-cyan-950/60 dark:text-cyan-300';
  if (norm === 'ENTRY_RANGE') return 'bg-indigo-100 text-indigo-800 border-indigo-300 dark:bg-indigo-950/60 dark:text-indigo-300';
  if (norm === 'DISMISS') return 'bg-zinc-200 text-zinc-700 border-zinc-400 dark:bg-zinc-800 dark:text-zinc-300';
  if (norm === 'EMOJI') return 'bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-950/60 dark:text-yellow-300';
  if (norm === 'PUNCTUATION') return 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400';
  return 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300';
};

export const getPlaceholderForKind = (kind: string): string => {
  const norm = kind.toUpperCase();
  if (norm === 'SYMBOL') return '$(symbol)';
  if (norm === 'OTC') return '$(otc)';
  if (norm === 'ACTION' || norm === 'ACTION_BUY' || norm === 'ACTION_SELL') return '$(action)';
  if (norm === 'PRICE_ENTRY') return '$(entry)';
  if (norm === 'SL') return '$(sl)';
  if (norm === 'TP') return '$(tp)';
  if (norm === 'TIMEFRAME') return '$(timeframe)';
  if (norm === 'EXPIRATION') return '$(expiration)';
  if (norm === 'GALE') return '$(gale)';
  if (norm === 'TIME') return '$(time)';
  if (norm === 'ENTRY_RANGE') return '$(entry_range)';
  if (norm === 'DISMISS' || norm === 'VARIABLE' || norm === 'IGNORE') return '$(dismiss)';
  return '';
};

export interface TokenViewerProps {
  tokens: Token[];
  onTokensChange?: (updatedTokens: Token[]) => void;
  onSelectToken?: (token: Token) => void;
  rawText?: string;
}

export const TokenViewer: React.FC<TokenViewerProps> = ({
  tokens,
  onTokensChange,
  onSelectToken,
  rawText,
}) => {
  const [selectedToken, setSelectedToken] = useState<Token | null>(null);
  const [customTag, setCustomTag] = useState('');
  const [copied, setCopied] = useState(false);

  // Group tokens by line
  const lines = useMemo(() => {
    const map: Record<number, Token[]> = {};
    tokens.forEach((token) => {
      const lineIndex = token.line ?? 0;
      if (!map[lineIndex]) {
        map[lineIndex] = [];
      }
      map[lineIndex]!.push(token);
    });
    return map;
  }, [tokens]);

  // Construct pattern syntax automatically
  const generatedSyntax = useMemo(() => {
    const sortedLines = Object.entries(lines).sort(([a], [b]) => Number(a) - Number(b));
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
  }, [lines]);

  const handleSelectToken = (token: Token) => {
    setSelectedToken(token);
    onSelectToken?.(token);
  };

  const handleAssignTag = (targetTag: TokenTagOption) => {
    if (!selectedToken) return;
    const updated = tokens.map((t) => {
      if (t === selectedToken || (t.start === selectedToken.start && t.end === selectedToken.end)) {
        return {
          ...t,
          kind: targetTag.kind,
        };
      }
      return t;
    });

    const newSelected = updated.find((t) => t.start === selectedToken.start && t.end === selectedToken.end) || null;
    setSelectedToken(newSelected);
    onTokensChange?.(updated);
  };

  const handleAssignCustom = () => {
    if (!selectedToken || !customTag.trim()) return;
    const cleanKind = customTag.trim().toUpperCase().replace(/[^A-Z0-9_]/g, '_');
    const updated = tokens.map((t) => {
      if (t === selectedToken || (t.start === selectedToken.start && t.end === selectedToken.end)) {
        return {
          ...t,
          kind: cleanKind,
        };
      }
      return t;
    });

    const newSelected = updated.find((t) => t.start === selectedToken.start && t.end === selectedToken.end) || null;
    setSelectedToken(newSelected);
    setCustomTag('');
    onTokensChange?.(updated);
  };

  const handleCopySyntax = () => {
    navigator.clipboard.writeText(generatedSyntax);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-sm space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Tag size={16} className="text-indigo-600" /> Lexical Token Flow
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Click any parsed chip to view semantic byte spans & assign grammar tokens
          </p>
        </div>

        {selectedToken && (
          <div className="flex items-center gap-2 text-xs bg-indigo-50/70 dark:bg-indigo-950/40 p-2 rounded-xl border border-indigo-200 dark:border-indigo-800">
            <span className="font-bold text-indigo-700 dark:text-indigo-300 uppercase">
              {selectedToken.kind}
            </span>
            <span className="font-mono text-slate-400 text-[11px]">
              [{selectedToken.start}:{selectedToken.end}]
            </span>
            <span className="font-mono bg-white dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-slate-100">
              "{selectedToken.value}"
            </span>
            {getPlaceholderForKind(selectedToken.kind) && (
              <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold text-[11px] bg-emerald-50 dark:bg-emerald-950/50 px-1.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                → {getPlaceholderForKind(selectedToken.kind)}
              </span>
            )}
            <button
              onClick={() => setSelectedToken(null)}
              className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              title="Close picker"
            >
              <X size={13} />
            </button>
          </div>
        )}
      </div>

      {/* FLOATING / INLINE TAGGING PALETTE (When a token is selected) */}
      {selectedToken && (
        <div className="p-4 bg-slate-50 dark:bg-slate-950/80 rounded-2xl border-2 border-indigo-500/30 dark:border-indigo-500/20 shadow-md space-y-3 animate-in fade-in zoom-in-95 duration-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Sparkles size={14} className="text-indigo-600" />
              <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                Select Semantic Variable for "{selectedToken.value}":
              </span>
            </div>
            <span className="text-[11px] text-slate-400">Click to convert into syntactical pattern slot</span>
          </div>

          {/* Quick Available Tag Chips */}
          <div className="flex flex-wrap gap-2">
            {AVAILABLE_TOKEN_TAGS.map((tag) => {
              const isCurrent = selectedToken.kind.toUpperCase() === tag.kind;
              return (
                <button
                  key={tag.kind}
                  onClick={() => handleAssignTag(tag)}
                  className={cn(
                    'px-2.5 py-1.5 rounded-xl border text-xs font-semibold cursor-pointer transition-all flex items-center gap-1.5 shadow-2xs hover:scale-102 active:scale-98',
                    tag.badgeColor,
                    isCurrent && 'ring-2 ring-indigo-600 ring-offset-1 font-black shadow-xs'
                  )}
                  title={tag.description}
                >
                  {isCurrent && <Check size={12} className="stroke-3" />}
                  <span>{tag.label}</span>
                  {tag.placeholder && (
                    <code className="text-[10px] font-mono opacity-80 bg-black/5 dark:bg-white/10 px-1 py-0.2 rounded">
                      {tag.placeholder}
                    </code>
                  )}
                </button>
              );
            })}
          </div>

          {/* Custom Tag Input */}
          <div className="flex items-center gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
            <span className="text-xs text-slate-500">Custom Tag:</span>
            <input
              type="text"
              value={customTag}
              onChange={(e) => setCustomTag(e.target.value)}
              placeholder="e.g. SL_TRAILING, INDICATOR_RSI..."
              className="px-2.5 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAssignCustom();
              }}
            />
            <button
              onClick={handleAssignCustom}
              disabled={!customTag.trim()}
              className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold disabled:opacity-40 transition-colors cursor-pointer"
            >
              Apply Tag
            </button>
          </div>
        </div>
      )}

      {/* TOKEN FLOW MATRIX BY LINE */}
      <div className="flex flex-col gap-2.5 font-mono text-xs">
        {Object.entries(lines).sort(([a], [b]) => Number(a) - Number(b)).map(([lineNum, lineTokens]) => (
          <div
            key={lineNum}
            className="flex flex-wrap items-center gap-2 p-3 bg-slate-50/80 dark:bg-slate-950/40 rounded-xl border border-slate-200/60 dark:border-slate-800/60"
          >
            <span className="text-[11px] font-bold text-slate-400 w-6 select-none text-right pr-2 border-r border-slate-200 dark:border-slate-800">
              {lineNum}
            </span>
            <div className="flex flex-wrap gap-2 items-center flex-1">
              {lineTokens.sort((a, b) => a.start - b.start).map((token, idx) => {
                const isSelected = selectedToken === token || (selectedToken?.start === token.start && selectedToken?.end === token.end);
                const placeholder = getPlaceholderForKind(token.kind);
                return (
                  <button
                    type="button"
                    key={`${token.start}-${idx}`}
                    onClick={() => handleSelectToken(token)}
                    className={cn(
                      'relative px-2.5 py-1 rounded-xl border text-xs font-medium cursor-pointer transition-all hover:scale-105 active:scale-95 shadow-xs flex items-center gap-1.5',
                      getTokenColor(token.kind),
                      isSelected && 'ring-2 ring-indigo-500 ring-offset-2 scale-105 font-bold shadow-md'
                    )}
                    title={`Click to re-tag: ${token.kind} [${token.start}-${token.end}]`}
                  >
                    <span>{token.value}</span>
                    {placeholder && (
                      <span className="text-[9px] font-bold font-mono px-1 py-0.2 rounded bg-black/10 dark:bg-white/15">
                        {placeholder}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* LIVE SYNTACTIC PATTERN SYNTAX PREVIEW */}
      <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-2">
        <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
          <span className="flex items-center gap-1.5">
            <Sparkles size={14} className="text-emerald-500" /> Syntactic Grammar Pattern (for /templates):
          </span>
          <button
            onClick={handleCopySyntax}
            className="flex items-center gap-1 px-2 py-0.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-[11px] text-slate-500 cursor-pointer"
          >
            {copied ? <CheckCheck size={12} className="text-emerald-600" /> : <Copy size={12} />}
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
        <pre className="p-3 bg-slate-900 text-indigo-300 font-mono text-xs rounded-xl border border-slate-800 whitespace-pre-wrap break-all shadow-inner">
          {generatedSyntax || 'No tokens yet.'}
        </pre>
      </div>
    </div>
  );
};

export default TokenViewer;
