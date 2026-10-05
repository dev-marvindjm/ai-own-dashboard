import { useState, useEffect } from 'react';
import { NavLink } from 'react-router';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Radio,
  FileCode,
  Building2,
  ShieldCheck,
  MessageSquare,
  Trophy,
  Wallet,
  Tag,
  Settings,
  ChevronLeft,
  ChevronRight,
  Copy,
  Check,
  Sparkles,
  AlertTriangle,
  Sliders,
  Layers,
  Construction,
  Bell,
} from 'lucide-react';
import { closeAllPositions } from '@/services/quantApi';

interface NavGroup {
  title: string;
  items: {
    name: string;
    path: string;
    icon: any;
    badge?: string;
  }[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    title: 'TRADING & SIGNALS',
    items: [
      { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
      { name: 'Live Operations', path: '/explore', icon: Radio, badge: 'LIVE' },
      { name: 'Templates Matrix', path: '/templates', icon: FileCode },
      { name: 'Brokers & Accounts', path: '/brokers', icon: Building2 },
    ],
  },
  {
    title: 'TRADING OPERATIONS',
    items: [
      { name: 'Template Config', path: '/template-config', icon: Sliders },
      { name: 'Template Brokers', path: '/template-brokers', icon: Building2 },
      { name: 'Trading Strategy', path: '/trading-strategy', icon: Construction, badge: 'WIP' },
    ],
  },
  {
    title: 'INGESTION & RULES',
    items: [
      { name: 'Senders & Whitelist', path: '/providers', icon: ShieldCheck },
      { name: 'Messages Audit', path: '/telegram', icon: MessageSquare },
    ],
  },
  {
    title: 'PERFORMANCE & CAPITAL',
    items: [
      { name: 'Funds & Targets', path: '/funds', icon: Wallet },
      { name: 'Challenges Hub', path: '/challenges', icon: Trophy, badge: 'HOT' },
    ],
  },
  {
    title: 'ENGINE & TOOLS',
    items: [
      { name: 'Tokenizer Lab (Rust)', path: '/tokens', icon: Tag },
      { name: 'Notifications & Alerts', path: '/notifications', icon: Bell },
      { name: 'System Settings', path: '/settings', icon: Settings },
    ],
  },
];

export function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebar-collapsed');
    return saved === 'true';
  });
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    localStorage.setItem('sidebar-collapsed', String(isCollapsed));
  }, [isCollapsed]);

  const handleCopyId = () => {
    navigator.clipboard.writeText('quant-tenant-001');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleEmergencyClose = async () => {
    if (confirm('🚨 EMERGENCY CLOSE ALL: Are you sure you want to liquidate all open positions on all brokers?')) {
      try {
        await closeAllPositions();
        alert('All open positions liquidation order sent.');
      } catch (err) {
        alert('Emergency close triggered: ' + String(err));
      }
    }
  };

  return (
    <aside
      className={cn(
        'relative flex flex-col bg-[#0c101a] text-slate-400 transition-all duration-300 ease-in-out border-r border-slate-800/80 z-20 shrink-0 select-none shadow-2xl',
        isCollapsed ? 'w-[72px]' : 'w-64'
      )}
    >
      {/* Brand Header */}
      <div className="flex items-center h-16 px-4 border-b border-slate-800/60">
        <div className="flex items-center justify-center w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 text-white shadow-md shadow-indigo-500/20 shrink-0">
          <Sparkles size={20} className="animate-pulse" />
        </div>
        {!isCollapsed && (
          <div className="ml-3 flex flex-col truncate">
            <span className="text-white font-extrabold text-base tracking-tight leading-none">
              Quant<span className="text-indigo-400">Hub</span>
            </span>
            <span className="text-[10px] text-slate-400 font-medium tracking-wide mt-1 uppercase">
              Trading Control Room
            </span>
          </div>
        )}
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden px-3 py-4 space-y-5 scrollbar-thin scrollbar-thumb-slate-800">
        {NAV_GROUPS.map((group) => (
          <div key={group.title} className="space-y-1">
            {!isCollapsed ? (
              <div className="px-3 pb-1 text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                {group.title}
              </div>
            ) : (
              <div className="h-2" />
            )}

            {group.items.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  cn(
                    'group flex items-center px-3 py-2.5 rounded-xl transition-all duration-200 relative text-xs font-semibold',
                    isActive
                      ? 'bg-indigo-600/20 text-white font-bold border border-indigo-500/30 shadow-xs'
                      : 'hover:bg-slate-800/60 hover:text-slate-200'
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-6 bg-indigo-500 rounded-r-full shadow-sm shadow-indigo-500" />
                    )}
                    <item.icon
                      size={18}
                      className={cn(
                        'shrink-0 transition-colors',
                        isActive ? 'text-indigo-400' : 'text-slate-400 group-hover:text-slate-200'
                      )}
                    />
                    {!isCollapsed && (
                      <div className="ml-3 flex-1 flex items-center justify-between truncate">
                        <span className="truncate">{item.name}</span>
                        {item.badge && (
                          <span
                            className={cn(
                              'text-[9px] font-extrabold px-1.5 py-0.5 rounded-md uppercase tracking-wider',
                              item.badge === 'LIVE'
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 animate-pulse'
                                : 'bg-pink-500/20 text-pink-400 border border-pink-500/30'
                            )}
                          >
                            {item.badge}
                          </span>
                        )}
                      </div>
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      {/* Footer Area: Unique ID & Profile (from iDonate / Intelly schema) */}
      <div className="p-3 border-t border-slate-800/80 space-y-2 mt-auto bg-[#0a0d15]">
        {/* Unique ID Card */}
        {!isCollapsed ? (
          <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between text-xs">
            <div>
              <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">
                Tenant Key
              </span>
              <span className="font-mono text-xs text-indigo-300 font-bold">
                quant-tenant-001
              </span>
            </div>
            <button
              onClick={handleCopyId}
              className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors cursor-pointer"
              title="Copy ID"
            >
              {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
            </button>
          </div>
        ) : null}

        {/* Emergency Stop Button */}
        <button
          onClick={handleEmergencyClose}
          className={cn(
            'w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-bold transition-all cursor-pointer shadow-xs',
            isCollapsed && 'px-0'
          )}
          title="Emergency Close All Positions"
        >
          <AlertTriangle size={15} />
          {!isCollapsed && <span>Emergency Close All</span>}
        </button>

        {/* User Card */}
        <div
          className={cn(
            'flex items-center p-2 rounded-xl bg-slate-900/50 border border-slate-800/50',
            isCollapsed ? 'justify-center' : 'justify-between'
          )}
        >
          <div className="flex items-center gap-2.5 truncate">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-violet-600 flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-xs">
              AD
            </div>
            {!isCollapsed && (
              <div className="flex flex-col truncate">
                <span className="text-xs font-bold text-slate-200 truncate">Admin Trader</span>
                <span className="text-[10px] text-slate-400 truncate">admin@quant.com</span>
              </div>
            )}
          </div>
          {!isCollapsed && (
            <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500" title="Connected" />
          )}
        </div>
      </div>

      {/* Collapse Toggle Handle */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-20 flex h-6 w-6 items-center justify-center rounded-full bg-slate-800 text-slate-300 hover:text-white border border-slate-700 z-30 transition-transform cursor-pointer shadow-md"
        title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {isCollapsed ? <ChevronRight size={13} /> : <ChevronLeft size={13} />}
      </button>
    </aside>
  );
}

export default Sidebar;
