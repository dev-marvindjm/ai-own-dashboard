import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import {
  Hammer,
  HardHat,
  Construction,
  Layers,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Cpu,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import { useNavigate } from 'react-router';

export default function TradingStrategyPage() {
  const navigate = useNavigate();

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-[1400px] mx-auto select-none">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
              Trading Strategy Studio
            </h1>
            <Badge className="bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800 font-bold text-xs py-0.5 px-2.5">
              En Construcción
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Módulo automatizado para orquestar reglas de entrada, filtros de volatilidad y ejecución algorítmica sobre señales templateadas.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={() => navigate('/templates')}
            variant="outline"
            size="sm"
            className="text-xs font-bold rounded-xl border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300"
          >
            Ver Templates Config
          </Button>
          <Button
            onClick={() => navigate('/template-brokers')}
            size="sm"
            className="text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white gap-1.5"
          >
            Ver Template Brokers <ArrowRight size={13} />
          </Button>
        </div>
      </div>

      {/* Hero Under Construction Banner */}
      <Card className="border-2 border-dashed border-amber-300 dark:border-amber-700/60 bg-gradient-to-br from-amber-50/50 via-white to-orange-50/30 dark:from-slate-900 dark:via-slate-900 dark:to-amber-950/20 rounded-3xl p-8 sm:p-12 text-center shadow-sm">
        <div className="max-w-2xl mx-auto flex flex-col items-center">
          {/* Animated Icon Badge */}
          <div className="relative mb-6">
            <div className="w-20 h-20 rounded-3xl bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-300 dark:border-amber-700/50 shadow-inner">
              <Construction size={40} className="animate-bounce" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-md">
              <HardHat size={16} />
            </div>
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Módulo de Estrategias de Trading en Desarrollo
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
            Estamos integrando el motor cuántico de gestión de riesgo dinámico (Risk Multipliers, Martingale Step Clamps, Stop Out Guardians y Filtros de Noticias) conectado directamente con los slots del Tokenizer.
          </p>

          <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-3.5 w-full text-left">
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 shadow-2xs">
              <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-xs mb-2">
                <Cpu size={16} />
              </div>
              <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">Execution Engine</h4>
              <p className="text-[11px] text-slate-400 mt-1">Conexión directa vía WebSocket y FIX API a MetaTrader 5 y Brokers OTC.</p>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 shadow-2xs">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-xs mb-2">
                <TrendingUp size={16} />
              </div>
              <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">Trailing & BE Logic</h4>
              <p className="text-[11px] text-slate-400 mt-1">Break-Even automático y escalonamiento de Take Profits por niveles de volatilidad.</p>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 shadow-2xs">
              <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold text-xs mb-2">
                <Sparkles size={16} />
              </div>
              <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">AI Signal Validator</h4>
              <p className="text-[11px] text-slate-400 mt-1">Ponderación con modelos de machine learning antes del envío de la orden.</p>
            </div>
          </div>

          <div className="mt-8 flex items-center gap-3">
            <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
              <Clock size={14} className="text-amber-500" /> Próximo lanzamiento en v2.4
            </span>
          </div>
        </div>
      </Card>
    </div>
  );
}
