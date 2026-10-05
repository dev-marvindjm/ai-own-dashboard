import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import {
  Bell,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Trash2,
  CheckCheck,
  RefreshCw,
  Sparkles,
  ArrowRight,
  ShieldAlert,
  Flame,
  PowerOff,
  Filter,
  Eye,
  Sliders,
  Building2,
  UserCheck,
} from 'lucide-react';
import {
  AppNotification,
  getStoredNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  clearAllNotifications,
  runSignalsAndTemplatesAnalysis,
  executeNotificationAction,
  SystemAnalysisReport,
} from '@/services/signalsAnalysisService';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router';

export default function NotificationsPage() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [analysisReport, setAnalysisReport] = useState<SystemAnalysisReport | null>(null);
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'UNREAD' | 'RECOMMENDATIONS' | 'SYSTEM'>('ALL');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  const loadNotifications = () => {
    setNotifications(getStoredNotifications());
  };

  const runAnalysis = async () => {
    setIsAnalyzing(true);
    setActionFeedback(null);
    try {
      const report = await runSignalsAndTemplatesAnalysis();
      setAnalysisReport(report);
      loadNotifications();
      setActionFeedback('Análisis de señales completado. Recomendaciones y métricas actualizadas.');
      setTimeout(() => setActionFeedback(null), 4000);
    } catch (err) {
      console.error('Error during signals analysis:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  useEffect(() => {
    loadNotifications();
    runAnalysis();

    const handleUpdate = () => loadNotifications();
    window.addEventListener('quant-notifications-updated', handleUpdate);
    return () => window.removeEventListener('quant-notifications-updated', handleUpdate);
  }, []);

  const handleMarkAsRead = (id: string) => {
    markNotificationAsRead(id);
    loadNotifications();
  };

  const handleMarkAllRead = () => {
    markAllNotificationsAsRead();
    loadNotifications();
  };

  const handleClearAll = () => {
    if (confirm('¿Deseas vaciar todas las notificaciones?')) {
      clearAllNotifications();
      loadNotifications();
    }
  };

  const handleExecuteAction = async (notif: AppNotification) => {
    if (!notif.action) return;
    const ok = await executeNotificationAction(notif.action);
    if (ok) {
      setActionFeedback(`Acción ejecutada: ${notif.action.label} exitoso.`);
      markNotificationAsRead(notif.id);
      loadNotifications();
      setTimeout(() => setActionFeedback(null), 3500);
    }
  };

  const filteredNotifications = notifications.filter((n) => {
    if (activeFilter === 'UNREAD') return !n.read;
    if (activeFilter === 'RECOMMENDATIONS')
      return n.type === 'recommendation_remove' || n.type === 'recommendation_promote';
    if (activeFilter === 'SYSTEM')
      return n.type === 'system_alert' || n.type === 'trade_milestone';
    return true;
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-[1500px] mx-auto select-none">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-600/10 text-indigo-500 border border-indigo-500/20">
              <Bell size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                  Notificaciones & Recomendaciones Operativas
                </h1>
                {unreadCount > 0 && (
                  <Badge className="bg-rose-500 text-white font-black text-xs px-2 py-0.5">
                    {unreadCount} Nuevas
                  </Badge>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Centro de alertas inteligentes generadas en base al análisis de señales, pérdidas, ganancias y efectividad.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={runAnalysis}
            disabled={isAnalyzing}
            variant="outline"
            size="sm"
            className="text-xs font-bold rounded-xl border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 gap-1.5"
          >
            <RefreshCw size={13} className={isAnalyzing ? 'animate-spin' : ''} />
            {isAnalyzing ? 'Analizando...' : 'Re-analizar Señales'}
          </Button>

          {notifications.length > 0 && (
            <>
              <Button
                onClick={handleMarkAllRead}
                variant="outline"
                size="sm"
                className="text-xs font-bold rounded-xl border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 gap-1.5"
              >
                <CheckCheck size={14} /> Marcar Leídas
              </Button>
              <Button
                onClick={handleClearAll}
                variant="ghost"
                size="sm"
                className="text-xs font-bold text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl"
              >
                <Trash2 size={14} /> Limpiar
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Action Feedback Banner */}
      {actionFeedback && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 rounded-2xl text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 size={16} className="text-emerald-600" />
          <span>{actionFeedback}</span>
        </div>
      )}

      {/* AI Performance Analysis Dashboard Widget */}
      {analysisReport && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
            <div className="flex items-center justify-between text-xs text-slate-400 font-bold">
              <span>Elementos Analizados</span>
              <Sparkles size={14} className="text-indigo-500" />
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
              {analysisReport.total_analyzed}
            </div>
            <span className="text-[11px] text-slate-500 mt-1 block">
              Templates y Canales monitoreados
            </span>
          </Card>

          <Card className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
            <div className="flex items-center justify-between text-xs text-slate-400 font-bold">
              <span>Rendimiento Global</span>
              <TrendingUp size={14} className="text-emerald-500" />
            </div>
            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
              +${analysisReport.net_estimated_pnl.toFixed(2)}
            </div>
            <span className="text-[11px] text-emerald-600/80 font-bold mt-1 block">
              {analysisReport.profitable_count} rentables vs {analysisReport.unprofitable_count} en pérdida
            </span>
          </Card>

          <Card className="rounded-3xl border border-rose-200/80 dark:border-rose-900/60 bg-rose-50/30 dark:bg-rose-950/20 p-5 shadow-sm">
            <div className="flex items-center justify-between text-xs text-rose-800 dark:text-rose-400 font-bold">
              <span>Alertas de Retiro</span>
              <AlertTriangle size={14} className="text-rose-500" />
            </div>
            <div className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-1">
              {analysisReport.underperforming.length}
            </div>
            <span className="text-[11px] text-rose-700/80 dark:text-rose-400 mt-1 block">
              Templates/senders en pérdidas críticas
            </span>
          </Card>

          <Card className="rounded-3xl border border-emerald-200/80 dark:border-emerald-900/60 bg-emerald-50/30 dark:bg-emerald-950/20 p-5 shadow-sm">
            <div className="flex items-center justify-between text-xs text-emerald-800 dark:text-emerald-400 font-bold">
              <span>Top Performers</span>
              <Flame size={14} className="text-emerald-500" />
            </div>
            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
              {analysisReport.top_performers.length}
            </div>
            <span className="text-[11px] text-emerald-700/80 dark:text-emerald-400 mt-1 block">
              Efectividad superior al 78%
            </span>
          </Card>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center justify-between gap-3 p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-2 overflow-x-auto">
          {(['ALL', 'UNREAD', 'RECOMMENDATIONS', 'SYSTEM'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveFilter(tab)}
              className={cn(
                'px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap',
                activeFilter === tab
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              )}
            >
              {tab === 'ALL'
                ? `Todas (${notifications.length})`
                : tab === 'UNREAD'
                ? `No Leídas (${unreadCount})`
                : tab === 'RECOMMENDATIONS'
                ? 'Recomendaciones IA'
                : 'Alertas del Sistema'}
            </button>
          ))}
        </div>

        <span className="text-xs text-slate-400 font-mono">
          Filtro: {activeFilter}
        </span>
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {filteredNotifications.length === 0 ? (
          <Card className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-12 text-center shadow-sm">
            <Bell size={36} className="mx-auto text-slate-300 dark:text-slate-600 mb-3" />
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
              Bandeja al día
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              No tienes notificaciones pendientes con este filtro. El recomendador algorítmico te notificará de anomalías en tiempo real.
            </p>
          </Card>
        ) : (
          filteredNotifications.map((notif) => {
            const isRemoveRec = notif.type === 'recommendation_remove';
            const isPromoteRec = notif.type === 'recommendation_promote';

            return (
              <div
                key={notif.id}
                className={cn(
                  'p-4 rounded-3xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm',
                  !notif.read
                    ? 'bg-indigo-50/40 dark:bg-indigo-950/20 border-indigo-200 dark:border-indigo-800/80 ring-1 ring-indigo-500/20'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                )}
              >
                <div className="flex items-start gap-3.5 flex-1 min-w-0">
                  <div
                    className={cn(
                      'p-2.5 rounded-2xl shrink-0 mt-0.5',
                      isRemoveRec
                        ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/80 dark:text-rose-400'
                        : isPromoteRec
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-400'
                        : 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/80 dark:text-indigo-400'
                    )}
                  >
                    {isRemoveRec ? (
                      <TrendingDown size={18} />
                    ) : isPromoteRec ? (
                      <TrendingUp size={18} />
                    ) : (
                      <Bell size={18} />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-xs font-black text-slate-900 dark:text-white">
                        {notif.title}
                      </h4>
                      {!notif.read && (
                        <span className="w-2 h-2 rounded-full bg-indigo-600 dark:bg-indigo-400" />
                      )}
                      <span className="text-[10px] text-slate-400 font-mono">
                        {new Date(notif.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                      {notif.message}
                    </p>

                    {/* Action buttons if available */}
                    {notif.action && (
                      <div className="flex items-center gap-2 mt-3">
                        <Button
                          onClick={() => handleExecuteAction(notif)}
                          size="sm"
                          className={cn(
                            'text-xs font-bold rounded-xl gap-1.5',
                            isRemoveRec
                              ? 'bg-rose-600 hover:bg-rose-700 text-white'
                              : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                          )}
                        >
                          <PowerOff size={13} />
                          {notif.action.label}
                        </Button>

                        <Button
                          onClick={() =>
                            navigate(
                              notif.action?.targetType === 'template'
                                ? '/templates'
                                : '/providers'
                            )
                          }
                          variant="outline"
                          size="sm"
                          className="text-xs font-bold rounded-xl border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 gap-1"
                        >
                          Inspeccionar <ArrowRight size={12} />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right options */}
                <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                  {!notif.read && (
                    <button
                      type="button"
                      onClick={() => handleMarkAsRead(notif.id)}
                      className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                      title="Marcar como leída"
                    >
                      <CheckCheck size={16} />
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
