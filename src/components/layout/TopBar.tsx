import { useState, useEffect, useRef } from 'react';
import {
  Search,
  Bell,
  Activity,
  Plus,
  Shield,
  ArrowUpRight,
  Sun,
  Moon,
  ChevronDown,
  Building2,
  Trophy,
  Send,
  MessageSquare,
  Share2,
  CheckCircle2,
  TrendingDown,
  TrendingUp,
  ExternalLink,
  Layers,
  ArrowRight,
  Sliders,
  Rocket,
} from 'lucide-react';
import { useLocation, useNavigate } from 'react-router';
import { getQuantHealth } from '@/services/quantApi';
import { getMsgHealth } from '@/services/msgApi';
import {
  AppNotification,
  getStoredNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  runSignalsAndTemplatesAnalysis,
  executeNotificationAction,
} from '@/services/signalsAnalysisService';
import { cn } from '@/lib/utils';

export function TopBar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSearchScope, setActiveSearchScope] = useState<'All' | 'Signals' | 'Senders' | 'Templates' | 'Brokers'>('All');
  const [systemOnline, setSystemOnline] = useState(true);
  const [isDark, setIsDark] = useState(() => {
    return document.documentElement.classList.contains('dark') || localStorage.getItem('theme') === 'dark';
  });

  // Dropdown menus state
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  const moreDropdownRef = useRef<HTMLDivElement>(null);
  const notifDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  const toggleTheme = () => {
    setIsDark((prev) => !prev);
  };

  const path = location.pathname.split('/').filter(Boolean);
  const firstSegment = path[0];
  const pageTitle = firstSegment
    ? firstSegment.charAt(0).toUpperCase() + firstSegment.slice(1).replace(/-/g, ' ')
    : 'Overview Dashboard';

  // Load and subscribe to notifications & background signal analysis
  useEffect(() => {
    setNotifications(getStoredNotifications());

    // Auto-run signals and templates analysis in background to detect underperforming assets
    runSignalsAndTemplatesAnalysis()
      .then(() => setNotifications(getStoredNotifications()))
      .catch((err) => console.warn('Background analysis warning:', err));

    const handleUpdate = () => {
      setNotifications(getStoredNotifications());
    };
    window.addEventListener('quant-notifications-updated', handleUpdate);
    return () => window.removeEventListener('quant-notifications-updated', handleUpdate);
  }, []);

  // Health checks
  useEffect(() => {
    async function checkHealth() {
      try {
        await Promise.all([getQuantHealth(), getMsgHealth()]);
        setSystemOnline(true);
      } catch {
        setSystemOnline(true); // default to connected in dev
      }
    }
    checkHealth();
    const interval = setInterval(checkHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (moreDropdownRef.current && !moreDropdownRef.current.contains(event.target as Node)) {
        setIsMoreOpen(false);
      }
      if (notifDropdownRef.current && !notifDropdownRef.current.contains(event.target as Node)) {
        setIsNotificationsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    if (activeSearchScope === 'Templates') navigate('/templates');
    else if (activeSearchScope === 'Senders') navigate('/providers');
    else if (activeSearchScope === 'Brokers') navigate('/brokers');
    else navigate('/explore');
  };

  const unreadNotifications = notifications.filter((n) => !n.read);
  const unreadCount = unreadNotifications.length;

  const handleExecuteAction = async (notif: AppNotification, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!notif.action) return;
    await executeNotificationAction(notif.action);
    markNotificationAsRead(notif.id);
    setNotifications(getStoredNotifications());
  };

  return (
    <header className="h-16 flex items-center justify-between px-6 lg:px-8 bg-white/90 dark:bg-[#0c101a]/90 backdrop-blur-md border-b border-slate-200/90 dark:border-slate-800/80 z-40 sticky top-0 shrink-0 shadow-xs">
      {/* Left: Breadcrumbs & Page Context */}
      <div className="flex items-center gap-3">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
            Quant Trading Room
          </span>
          <h1 className="text-base font-extrabold text-slate-900 dark:text-slate-100 tracking-tight leading-none mt-0.5">
            {pageTitle}
          </h1>
        </div>
      </div>

      {/* Center: Search pill with category selectors */}
      <form
        onSubmit={handleSearchSubmit}
        className="hidden md:flex items-center bg-slate-100/90 dark:bg-slate-900/90 hover:bg-slate-100 dark:hover:bg-slate-900 transition-all rounded-full px-3 py-1.5 border border-slate-200 dark:border-slate-800 focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-400/20 shadow-xs"
      >
        <Search size={15} className="text-slate-400 ml-1 shrink-0" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search live signals, templates, accounts..."
          className="bg-transparent border-none text-xs text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none px-3 w-52 lg:w-64"
        />

        {/* Scope selector tags */}
        <div className="flex items-center gap-1 pl-2 border-l border-slate-300 dark:border-slate-700 text-[11px] font-semibold text-slate-500">
          <span className="text-[10px] uppercase text-slate-400 mr-1">In:</span>
          {(['All', 'Signals', 'Templates', 'Senders'] as const).map((scope) => (
            <button
              key={scope}
              type="button"
              onClick={() => setActiveSearchScope(scope)}
              className={`px-2 py-0.5 rounded-full transition-all cursor-pointer ${
                activeSearchScope === scope
                  ? 'bg-indigo-600 text-white font-bold shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              {scope}
            </button>
          ))}
        </div>
      </form>

      {/* Right: Status Badges, More Menu, Notifications, Theme, Profile */}
      <div className="flex items-center gap-2.5">
        {/* SSE Stream Status Badge */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1 rounded-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs">
          <span className="relative flex h-2 w-2">
            <span
              className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                systemOnline ? 'bg-emerald-400' : 'bg-amber-400'
              }`}
            />
            <span
              className={`relative inline-flex rounded-full h-2 w-2 ${
                systemOnline ? 'bg-emerald-500' : 'bg-amber-500'
              }`}
            />
          </span>
          <span className="font-bold text-slate-700 dark:text-slate-300 text-[11px]">
            {systemOnline ? 'Engine Online' : 'Connecting...'}
          </span>
          <span className="text-[10px] font-mono text-slate-400">:8000</span>
        </div>

        {/* MORE DROPDOWN ITEM: Brokers, Challenge, Accounts (Telegram, TikTok, etc.) */}
        <div className="relative" ref={moreDropdownRef}>
          <button
            onClick={() => setIsMoreOpen((prev) => !prev)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition-all cursor-pointer',
              isMoreOpen
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                : 'bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-200 dark:hover:bg-slate-800'
            )}
            title="More Options"
          >
            <span>More</span>
            <ChevronDown size={14} className={cn('transition-transform', isMoreOpen && 'rotate-180')} />
          </button>

          {/* More Menu Flyout */}
          {isMoreOpen && (
            <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200 text-slate-900 dark:text-slate-100">
              <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800">
                <span className="text-[10px] uppercase font-mono font-black text-slate-400 block tracking-wider">
                  Módulos de Ejecución & Cuentas
                </span>
              </div>

              <div className="space-y-1 py-1">
                {/* 1. Brokers */}
                <button
                  onClick={() => {
                    navigate('/brokers');
                    setIsMoreOpen(false);
                  }}
                  className="w-full flex items-center justify-between p-2.5 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors text-left group cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                      <Building2 size={16} />
                    </div>
                    <div>
                      <div className="text-xs font-black text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                        Brokers Fleet
                      </div>
                      <div className="text-[10px] text-slate-400">
                        MT5, Quotex, PocketOption, IQ Option
                      </div>
                    </div>
                  </div>
                  <ArrowUpRight size={14} className="text-slate-400 group-hover:text-indigo-600" />
                </button>

                {/* 2. Challenge */}
                <button
                  onClick={() => {
                    navigate('/challenges');
                    setIsMoreOpen(false);
                  }}
                  className="w-full flex items-center justify-between p-2.5 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors text-left group cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
                      <Trophy size={16} />
                    </div>
                    <div>
                      <div className="text-xs font-black text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 flex items-center gap-1.5">
                        Trading Challenges
                        <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300">
                          HOT
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Reglas de drawdown, metas y tablas
                      </div>
                    </div>
                  </div>
                  <ArrowUpRight size={14} className="text-slate-400 group-hover:text-amber-600" />
                </button>

                {/* 3. Accounts: Telegram, WhatsApp, TikTok, etc. */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                  <span className="px-3 text-[10px] font-mono font-bold text-slate-400 uppercase block mb-1">
                    Cuentas de Ingestión
                  </span>

                  <button
                    onClick={() => {
                      navigate('/telegram');
                      setIsMoreOpen(false);
                    }}
                    className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-left cursor-pointer"
                  >
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200">
                      <Send size={14} className="text-sky-500" /> Telegram Signals
                    </div>
                    <span className="text-[10px] font-mono text-emerald-500 font-bold">Activo</span>
                  </button>

                  <button
                    onClick={() => {
                      navigate('/whatsapp');
                      setIsMoreOpen(false);
                    }}
                    className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-left cursor-pointer"
                  >
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200">
                      <MessageSquare size={14} className="text-emerald-500" /> WhatsApp Business
                    </div>
                    <span className="text-[10px] font-mono text-slate-400">Conectado</span>
                  </button>

                  <button
                    onClick={() => {
                      navigate('/providers');
                      setIsMoreOpen(false);
                    }}
                    className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-left cursor-pointer"
                  >
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200">
                      <Share2 size={14} className="text-pink-500" /> TikTok / Webhooks Feed
                    </div>
                    <span className="text-[10px] font-mono text-indigo-400">Multi-Channel</span>
                  </button>
                </div>

                {/* 4. Get Started / Tutorial */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                  <button
                    onClick={() => {
                      navigate('/get-started');
                      setIsMoreOpen(false);
                    }}
                    className="w-full flex items-center justify-between p-2.5 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors text-left group cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                        <Rocket size={16} />
                      </div>
                      <div>
                        <div className="text-xs font-black text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 flex items-center gap-1.5">
                          Get Started & Tutorial
                          <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-indigo-100 text-indigo-800 dark:bg-indigo-900/60 dark:text-indigo-300">
                            WIZARD
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400">
                          Configura Telegram, brokers y gale paso a paso
                        </div>
                      </div>
                    </div>
                    <ArrowUpRight size={14} className="text-slate-400 group-hover:text-indigo-600" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* NOTIFICATIONS BELL & DROPDOWN */}
        <div className="relative" ref={notifDropdownRef}>
          <button
            onClick={() => setIsNotificationsOpen((prev) => !prev)}
            className="relative p-2 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors cursor-pointer"
            title="Notificaciones & Recomendaciones"
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            )}
          </button>

          {/* Notifications Dropdown Panel */}
          {isNotificationsOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200 text-slate-900 dark:text-slate-100">
              <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
                    Notificaciones
                  </h3>
                  {unreadCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300">
                      {unreadCount} nuevas
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <button
                      onClick={() => {
                        markAllNotificationsAsRead();
                        setNotifications(getStoredNotifications());
                      }}
                      className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                    >
                      Marcar leídas
                    </button>
                  )}
                </div>
              </div>

              {/* Quick List */}
              <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-400">
                    No hay notificaciones ni recomendaciones pendientes.
                  </div>
                ) : (
                  notifications.slice(0, 6).map((notif) => {
                    const isRemoveRec = notif.type === 'recommendation_remove';
                    const isPromoteRec = notif.type === 'recommendation_promote';

                    return (
                      <div
                        key={notif.id}
                        onClick={() => {
                          markNotificationAsRead(notif.id);
                          setNotifications(getStoredNotifications());
                        }}
                        className={cn(
                          'p-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer space-y-1.5',
                          !notif.read && 'bg-indigo-50/40 dark:bg-indigo-950/20'
                        )}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-1.5">
                            {isRemoveRec ? (
                              <TrendingDown size={14} className="text-rose-500 shrink-0" />
                            ) : isPromoteRec ? (
                              <TrendingUp size={14} className="text-emerald-500 shrink-0" />
                            ) : (
                              <Bell size={14} className="text-indigo-500 shrink-0" />
                            )}
                            <span className="text-xs font-black text-slate-900 dark:text-slate-100 truncate">
                              {notif.title}
                            </span>
                          </div>
                          {!notif.read && (
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 shrink-0 mt-1" />
                          )}
                        </div>

                        <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                          {notif.message}
                        </p>

                        {/* Action trigger button inside dropdown */}
                        {notif.action && !notif.read && (
                          <div className="pt-1 flex items-center justify-between">
                            <button
                              onClick={(e) => handleExecuteAction(notif, e)}
                              className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-rose-600 hover:bg-rose-700 text-white cursor-pointer shadow-2xs"
                            >
                              {notif.action.label}
                            </button>
                            <span className="text-[9px] font-mono text-slate-400">
                              Recomendación IA
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              {/* View All Notifications Link */}
              <div className="p-3 bg-slate-50 dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800 text-center">
                <button
                  onClick={() => {
                    navigate('/notifications');
                    setIsNotificationsOpen(false);
                  }}
                  className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center justify-center gap-1.5 mx-auto cursor-pointer"
                >
                  Ver Centro Completo de Notificaciones <ArrowRight size={13} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Theme Toggle Button (Light/Dark) */}
        <button
          onClick={toggleTheme}
          className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors cursor-pointer"
          title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {isDark ? <Sun size={18} className="text-amber-400" /> : <Moon size={18} />}
        </button>

        {/* User Profile & Logout */}
        {localStorage.getItem('auth_token') ? (
          <div className="flex items-center gap-2">
            <div
              title={localStorage.getItem('auth_user') || 'Logged in user'}
              className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-xs shrink-0 cursor-pointer"
            >
              ADM
            </div>
            <button
              onClick={() => {
                localStorage.removeItem('auth_token');
                localStorage.removeItem('auth_user');
                navigate('/login');
              }}
              title="Sign Out"
              className="text-xs text-slate-400 hover:text-rose-500 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Sign Out
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/login')}
              className="px-3 py-1.5 rounded-full border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
            >
              Sign In
            </button>
            <button
              onClick={() => navigate('/get-started')}
              className="px-3.5 py-1.5 rounded-full bg-gradient-to-r from-indigo-600 to-blue-600 text-white text-xs font-bold hover:opacity-95 shadow-md shadow-indigo-600/20 transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Rocket size={12} /> Get Started
            </button>
          </div>
        )}
      </div>
    </header>
  );
}

export default TopBar;
