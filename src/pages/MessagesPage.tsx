import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { Card, CardContent } from '@/components/common/Card';
import { Badge } from '@/components/common/Badge';
import { Input } from '@/components/common/Input';
import { Button } from '@/components/common/Button';
import { Modal } from '@/components/common/Modal';
import { TokenViewer, Token } from '@/components/signals/TokenViewer';
import { getTelegramMessages, getWhatsAppMessages } from '@/services/rustApi';
import { tokenizeText } from '@/services/tokenizerApi';
import {
  Search,
  Filter,
  MessageCircle,
  Clock,
  RefreshCw,
  Radio,
  CheckCircle,
  Ban,
  Send,
  Tag,
  Sparkles,
  ArrowRight,
  ExternalLink,
  Shield,
  Key,
  Smartphone,
  LogOut,
  Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  TelegramSessionData,
  getStoredTelegramSession,
  clearTelegramSession,
  connectTelegramDemoSession,
} from '@/services/telegramSessionService';
import { TelegramLoginModal } from '@/components/telegram/TelegramLoginModal';

interface MessagesPageProps {
  network: 'Telegram' | 'WhatsApp';
}

export default function MessagesPage({ network }: MessagesPageProps) {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [selectedChannel, setSelectedChannel] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Quick tokens modal state
  const [quickModalMsg, setQuickModalMsg] = useState<any | null>(null);
  const [quickTokens, setQuickTokens] = useState<Token[]>([]);
  const [isTokenizingQuick, setIsTokenizingQuick] = useState(false);

  // Telegram session state
  const [tgSession, setTgSession] = useState<TelegramSessionData | null>(getStoredTelegramSession());
  const [isTgModalOpen, setIsTgModalOpen] = useState(false);

  useEffect(() => {
    const handleTgUpdate = () => {
      setTgSession(getStoredTelegramSession());
    };
    window.addEventListener('telegram-session-updated', handleTgUpdate);
    return () => window.removeEventListener('telegram-session-updated', handleTgUpdate);
  }, []);

  const fetchMessages = useCallback(async () => {
    try {
      setIsRefreshing(true);
      const data = network === 'Telegram' ? await getTelegramMessages() : await getWhatsAppMessages();
      if (Array.isArray(data)) {
        setMessages(data);
      }
    } catch (err) {
      console.error(`Error fetching ${network} messages:`, err);
    } finally {
      setIsRefreshing(false);
    }
  }, [network]);

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 10000); // 10s auto-refresh
    return () => clearInterval(interval);
  }, [fetchMessages]);

  const channels = useMemo(() => {
    const map = new Map<string, { count: number; id: string }>();
    messages.forEach((msg) => {
      const title = msg.metadata_json?.chat_title || msg.sender_username || `ID: ${msg.sender_id}`;
      const existing = map.get(title);
      if (existing) {
        existing.count += 1;
      } else {
        map.set(title, { count: 1, id: msg.sender_id });
      }
    });
    return Array.from(map.entries()).map(([title, val]) => ({
      title,
      count: val.count,
      id: val.id,
    }));
  }, [messages]);

  const filteredMessages = useMemo(() => {
    return messages.filter((msg) => {
      const channelTitle = msg.metadata_json?.chat_title || msg.sender_username || `ID: ${msg.sender_id}`;
      const status = (msg.delivery_status || msg.status || '').toUpperCase();
      const rawText = (msg.raw_text || '').toLowerCase();
      const senderId = String(msg.sender_id || '').toLowerCase();

      const matchesSearch =
        !search ||
        rawText.includes(search.toLowerCase()) ||
        channelTitle.toLowerCase().includes(search.toLowerCase()) ||
        senderId.includes(search.toLowerCase());

      const matchesChannel = !selectedChannel || channelTitle === selectedChannel;
      const matchesStatus = !selectedStatus || status === selectedStatus;

      return matchesSearch && matchesChannel && matchesStatus;
    });
  }, [messages, search, selectedChannel, selectedStatus]);

  const getStatusBadge = (status: string) => {
    const s = (status || '').toUpperCase();
    switch (s) {
      case 'EMITTED':
      case 'MATCHED':
      case 'DELIVERED':
        return { label: s, color: 'bg-emerald-500 text-white', icon: CheckCircle };
      case 'BLOCKED':
        return { label: 'BLOCKED', color: 'bg-rose-500 text-white', icon: Ban };
      case 'NEW':
      case 'RECEIVED':
        return { label: s, color: 'bg-blue-500 text-white', icon: Radio };
      default:
        return { label: s || 'PROCESSED', color: 'bg-slate-500 text-white', icon: Send };
    }
  };

  const handleOpenQuickTokens = async (msg: any) => {
    setQuickModalMsg(msg);
    setIsTokenizingQuick(true);
    try {
      const res = await tokenizeText({ text: msg.raw_text });
      setQuickTokens(res.tokens || []);
    } catch (err) {
      console.error('Quick tokenize failed:', err);
    } finally {
      setIsTokenizingQuick(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-theme(spacing.16))] overflow-hidden bg-slate-50 dark:bg-[#0a0a0f]">
      {/* Sidebar Channels */}
      <div className="w-80 border-r border-slate-200 dark:border-slate-800 flex flex-col bg-white dark:bg-[#0a0a0f]">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
          <div>
            <h2 className="font-bold text-base flex items-center gap-2 text-slate-900 dark:text-white">
              <MessageCircle size={18} className="text-indigo-600" /> {network} Ingestion
            </h2>
            <p className="text-[11px] text-slate-500">{channels.length} active channels detected</p>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={fetchMessages}
            disabled={isRefreshing}
            className="p-1 h-8 w-8 text-slate-500 hover:text-indigo-600"
          >
            <RefreshCw size={14} className={cn(isRefreshing && 'animate-spin text-indigo-600')} />
          </Button>
        </div>

        {/* Telegram Session Status in Sidebar (if Telegram network) */}
        {network === 'Telegram' && (
          <div className="p-3 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/70 dark:bg-slate-900/50">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className={cn(
                    'w-2.5 h-2.5 rounded-full shrink-0',
                    tgSession ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
                  )}
                />
                <div className="truncate text-xs">
                  <span className="font-bold text-slate-800 dark:text-slate-200 block truncate">
                    {tgSession ? tgSession.username || tgSession.phone : 'Sesión Desconectada'}
                  </span>
                  <span className="text-[10px] text-slate-500">
                    {tgSession ? `MTProto • ${tgSession.pingMs}ms` : 'Requiere iniciar sesión'}
                  </span>
                </div>
              </div>

              <Button
                size="sm"
                variant={tgSession ? 'outline' : 'primary'}
                onClick={() => setIsTgModalOpen(true)}
                className={cn(
                  'h-7 px-2 text-[11px] rounded-lg shrink-0 font-bold cursor-pointer',
                  tgSession
                    ? 'border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                    : 'bg-sky-600 hover:bg-sky-700 text-white'
                )}
              >
                {tgSession ? 'Sesión' : 'Conectar'}
              </Button>
            </div>
          </div>
        )}

        {/* All Channels filter */}
        <div className="p-3 border-b border-slate-100 dark:border-slate-800/60">
          <div
            onClick={() => setSelectedChannel(null)}
            className={cn(
              'p-2.5 rounded-xl cursor-pointer transition-all flex justify-between items-center text-xs font-bold',
              selectedChannel === null
                ? 'bg-indigo-50 text-indigo-900 dark:bg-indigo-950/40 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800'
                : 'text-slate-600 hover:bg-slate-50 dark:hover:bg-slate-900'
            )}
          >
            <span>All Channels & Feeds</span>
            <Badge className="bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-[10px]">
              {messages.length}
            </Badge>
          </div>
        </div>

        {/* Channels List */}
        <div className="p-3 flex-1 overflow-y-auto space-y-1">
          {channels.map((ch, i) => (
            <div
              key={i}
              onClick={() => setSelectedChannel(selectedChannel === ch.title ? null : ch.title)}
              className={cn(
                'p-2.5 rounded-xl cursor-pointer transition-all flex justify-between items-center text-xs',
                selectedChannel === ch.title
                  ? 'bg-indigo-50 text-indigo-900 dark:bg-indigo-950/40 dark:text-indigo-300 font-bold border border-indigo-200 dark:border-indigo-800'
                  : 'hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-700 dark:text-slate-300'
              )}
            >
              <div className="truncate mr-2">
                <p className="truncate font-medium">{ch.title}</p>
                <p className="text-[10px] text-slate-400">ID: {ch.id}</p>
              </div>
              <Badge className="bg-blue-500/10 text-blue-600 border border-blue-200 dark:border-blue-900 text-[10px] shrink-0 font-bold">
                {ch.count}
              </Badge>
            </div>
          ))}

          {channels.length === 0 && (
            <div className="p-4 text-center text-xs text-slate-400">
              No channels ingested yet.
            </div>
          )}
        </div>
      </div>

      {/* Main Feed */}
      <div className="flex-1 flex flex-col h-full bg-[#f8f9fc] dark:bg-slate-950">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-wrap gap-3 justify-between items-center shadow-xs z-10">
          <div className="relative w-80 sm:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <Input
              placeholder="Search text, pair, chat or ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 text-xs rounded-xl"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-medium">
              Showing {filteredMessages.length} of {messages.length} messages
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchMessages}
              disabled={isRefreshing}
              className="gap-1.5 text-xs rounded-xl"
            >
              <RefreshCw size={13} className={cn(isRefreshing && 'animate-spin')} />
              Refresh
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Telegram MTProto Session Connection Card */}
          {network === 'Telegram' && (
            <div className="max-w-4xl p-4 rounded-2xl border transition-all shadow-xs bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800">
              {tgSession ? (
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-500">
                      <Send size={20} className="-ml-0.5 mt-0.5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900 dark:text-white">
                          Sesión de Telegram MTProto Activa
                        </span>
                        <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
                          🟢 CONECTADO
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {tgSession.firstName ? `${tgSession.firstName} (${tgSession.username})` : tgSession.username} • {tgSession.phone} • Latencia: <span className="font-mono text-emerald-500 font-bold">{tgSession.pingMs}ms</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsTgModalOpen(true)}
                      className="text-xs rounded-xl border-slate-300 dark:border-slate-700 font-bold cursor-pointer"
                    >
                      <Key size={13} className="mr-1.5 text-sky-500" /> Gestionar Sesión
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => { clearTelegramSession(); setTgSession(null); }}
                      className="text-xs rounded-xl text-rose-500 hover:bg-rose-500/10 cursor-pointer"
                    >
                      <LogOut size={13} className="mr-1" /> Salir
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-wrap items-center justify-between gap-4 p-1">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-500 shrink-0 mt-0.5">
                      <Send size={20} className="-ml-0.5 mt-0.5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900 dark:text-white">
                          Inicio de Sesión en Telegram Pendiente
                        </span>
                        <Badge className="bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 text-[10px] font-bold">
                          DESCONECTADO
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xl leading-relaxed">
                        Conecta tu cuenta de Telegram (Teléfono + Código SMS, QR o StringSession) para escuchar señales en vivo y ejecutar órdenes automáticas.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      onClick={() => {
                        const demo = connectTelegramDemoSession();
                        setTgSession(demo);
                      }}
                      variant="outline"
                      className="text-xs rounded-xl border-indigo-500/40 text-indigo-500 hover:bg-indigo-500/10 font-bold cursor-pointer"
                    >
                      <Zap size={13} className="mr-1 text-amber-500" /> Demo (1 Clic)
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => setIsTgModalOpen(true)}
                      className="bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-xl cursor-pointer shadow-md shadow-sky-600/20"
                    >
                      <Smartphone size={13} className="mr-1.5" /> Iniciar Sesión en Telegram
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {filteredMessages.map((msg) => {
            const badge = getStatusBadge(msg.delivery_status || msg.status);
            const Icon = badge.icon;
            const channelName = msg.metadata_json?.chat_title || msg.sender_username || `Sender ${msg.sender_id}`;
            const timeFormatted = new Date(msg.created_at || msg.timestamp).toLocaleString();

            return (
              <Card key={msg.id} className="max-w-4xl hover:shadow-md transition-shadow rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900">
                <CardContent className="p-5">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-sm text-slate-900 dark:text-slate-100">
                          {channelName}
                        </span>
                        {msg.sender_username && (
                          <span className="text-xs text-indigo-600 font-mono">@{msg.sender_username}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                        <span>Msg ID: {msg.external_message_id || msg.id}</span>
                        <span>•</span>
                        <span>Sender ID: {msg.sender_id}</span>
                      </div>
                    </div>
                    <Badge className={cn('uppercase text-[10px] font-extrabold px-2.5 py-0.5 rounded-full flex items-center gap-1', badge.color)}>
                      <Icon size={11} /> {badge.label}
                    </Badge>
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl my-3 font-mono text-xs whitespace-pre-wrap text-slate-800 dark:text-slate-200 border border-slate-100 dark:border-slate-800/80 leading-relaxed select-text">
                    {msg.raw_text}
                  </div>

                  {/* Actions & Timestamps Footer */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800/50">
                    <div className="flex items-center gap-2 text-[11px] text-slate-400">
                      <Clock size={12} /> {timeFormatted}
                      {msg.delivery_status === 'EMITTED' && (
                        <span className="text-emerald-600 font-semibold flex items-center gap-1 ml-2">
                          <CheckCircle size={12} /> Forwarded to Quant Engine
                        </span>
                      )}
                      {msg.delivery_status === 'BLOCKED' && (
                        <span className="text-rose-600 font-semibold flex items-center gap-1 ml-2">
                          <Ban size={12} /> Filtered by Policy Rule
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleOpenQuickTokens(msg)}
                        className="text-xs h-8 px-2.5 rounded-xl border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:text-indigo-600 gap-1.5 cursor-pointer font-bold"
                      >
                        <Sparkles size={12} className="text-amber-500" /> Quick Tokens
                      </Button>

                      <Button
                        size="sm"
                        onClick={() =>
                          navigate('/tokens', {
                            state: {
                              text: msg.raw_text,
                              channel: channelName,
                              sender: msg.sender_username || msg.sender_id,
                            },
                          })
                        }
                        className="text-xs h-8 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white gap-1.5 font-bold shadow-2xs cursor-pointer"
                      >
                        <Tag size={12} /> Tokenize & Create Template
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}

          {filteredMessages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-96 text-slate-400 space-y-4">
              <MessageCircle size={48} className="opacity-20" />
              <p className="text-sm font-semibold">No messages match your criteria.</p>
              {search && (
                <Button size="sm" variant="outline" onClick={() => setSearch('')} className="text-xs">
                  Clear Search
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* QUICK TOKENS MODAL DIRECTLY IN MESSAGES */}
      {quickModalMsg && (
        <Modal
          isOpen={!!quickModalMsg}
          onClose={() => setQuickModalMsg(null)}
          title={`Lexical Analysis: ${quickModalMsg.metadata_json?.chat_title || quickModalMsg.sender_username || 'Telegram Signal'}`}
          size="xl"
        >
          <div className="space-y-4">
            <div className="p-3 bg-slate-50 dark:bg-slate-950 font-mono text-xs rounded-xl border border-slate-200 dark:border-slate-800 whitespace-pre-wrap">
              {quickModalMsg.raw_text}
            </div>

            {isTokenizingQuick ? (
              <div className="p-8 text-center text-xs text-slate-500">
                <RefreshCw size={20} className="animate-spin text-indigo-600 mx-auto mb-2" />
                Executing native Rust lexer on message text...
              </div>
            ) : (
              <TokenViewer
                tokens={quickTokens}
                onTokensChange={(updated) => setQuickTokens(updated)}
              />
            )}

            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <span className="text-xs text-slate-500">
                Ready to register this template to active trading slots?
              </span>

              <Button
                onClick={() => {
                  const raw = quickModalMsg.raw_text;
                  const ch = quickModalMsg.metadata_json?.chat_title || quickModalMsg.sender_username || 'Signal';
                  const s = quickModalMsg.sender_username || quickModalMsg.sender_id;
                  setQuickModalMsg(null);
                  navigate('/tokens', { state: { text: raw, channel: ch, sender: s } });
                }}
                className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl gap-1.5 h-9 px-4"
              >
                Open in Tokenizer Lab & Register Template <ArrowRight size={13} />
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Telegram Session Login & Management Modal */}
      <TelegramLoginModal
        isOpen={isTgModalOpen}
        onClose={() => setIsTgModalOpen(false)}
        onConnected={(newSession) => {
          setTgSession(newSession);
          setIsTgModalOpen(false);
        }}
      />
    </div>
  );
}
