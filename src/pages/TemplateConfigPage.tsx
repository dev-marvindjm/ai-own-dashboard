import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { Switch } from '@/components/common/Switch';
import {
  Sliders,
  Sparkles,
  TrendingUp,
  Percent,
  DollarSign,
  Layers,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Save,
  Search,
  Check,
  Cpu,
  Zap,
  Info,
  ChevronRight,
  HelpCircle,
} from 'lucide-react';
import {
  getTemplates,
  getTemplateConfigsList,
  getTemplateConfigData,
  saveTemplateConfigData,
} from '@/services/tokenizerApi';
import { cn } from '@/lib/utils';

interface TemplateItem {
  id: number;
  name: string;
  pattern_syntax: string;
  template_type: string;
  priority: number;
  is_active: boolean;
  code_slot?: string;
  section?: string;
}

interface TemplateConfigItem {
  id?: number;
  template_id: number;
  strategy_id?: number | null;
  ammount_type: 'percentage' | 'fixed';
  ammount: number;
  exit_strategy_type: 'gale' | 'profit_loss' | 'open';
  exit_strategy_id?: number | null;
  exit_contained_inside: boolean;
  max_gale: number;
  gale_ammount: number;
  profit_ratio?: number | null;
  loss_type?: string | null;
  loss_ratio?: number | null;
  logic?: string | null;
  updated_at?: string;
}

export default function TemplateConfigPage() {
  const [templates, setTemplates] = useState<TemplateItem[]>([]);
  const [configs, setConfigs] = useState<Record<number, TemplateConfigItem>>({});
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | 'GALE' | 'PERCENT' | 'FIXED'>('ALL');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Form State for currently selected template
  const [formData, setFormData] = useState<TemplateConfigItem>({
    template_id: 0,
    ammount_type: 'percentage',
    ammount: 1.0,
    exit_strategy_type: 'gale',
    exit_contained_inside: false,
    max_gale: 0,
    gale_ammount: 2.0,
    profit_ratio: 10.0,
    loss_type: 'price',
    loss_ratio: 5.0,
    logic: '',
  });

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [tpls, cfgs] = await Promise.all([
        getTemplates({ limit: 100 }),
        getTemplateConfigsList(),
      ]);

      const tplsList = Array.isArray(tpls) ? tpls : [];
      setTemplates(tplsList);

      const configMap: Record<number, TemplateConfigItem> = {};
      if (Array.isArray(cfgs)) {
        cfgs.forEach((c) => {
          configMap[c.template_id] = c;
        });
      }
      setConfigs(configMap);

      if (tplsList.length > 0 && selectedTemplateId === null) {
        selectTemplate(tplsList[0].id, configMap);
      }
    } catch (err: any) {
      console.error('Error fetching template configs:', err);
      setFeedback({ type: 'error', message: 'No se pudieron cargar los datos de configuración.' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const selectTemplate = async (templateId: number, currentConfigs = configs) => {
    setSelectedTemplateId(templateId);
    setFeedback(null);

    if (currentConfigs[templateId]) {
      const existing = currentConfigs[templateId];
      setFormData({
        template_id: templateId,
        strategy_id: existing.strategy_id || null,
        ammount_type: existing.ammount_type || 'percentage',
        ammount: existing.ammount ?? 1.0,
        exit_strategy_type: existing.exit_strategy_type || 'gale',
        exit_contained_inside: existing.exit_contained_inside ?? false,
        max_gale: existing.max_gale ?? 0,
        gale_ammount: existing.gale_ammount ?? 2.0,
        profit_ratio: existing.profit_ratio ?? 10.0,
        loss_type: existing.loss_type || 'price',
        loss_ratio: existing.loss_ratio ?? 5.0,
        logic: existing.logic || '',
      });
    } else {
      try {
        const live = await getTemplateConfigData(templateId);
        setFormData({
          template_id: templateId,
          strategy_id: live.strategy_id || null,
          ammount_type: live.ammount_type || 'percentage',
          ammount: live.ammount ?? 1.0,
          exit_strategy_type: live.exit_strategy_type || 'gale',
          exit_contained_inside: live.exit_contained_inside ?? false,
          max_gale: live.max_gale ?? 0,
          gale_ammount: live.gale_ammount ?? 2.0,
          profit_ratio: live.profit_ratio ?? 10.0,
          loss_type: live.loss_type || 'price',
          loss_ratio: live.loss_ratio ?? 5.0,
          logic: live.logic || '',
        });
      } catch {
        setFormData({
          template_id: templateId,
          ammount_type: 'percentage',
          ammount: 1.0,
          exit_strategy_type: 'gale',
          exit_contained_inside: false,
          max_gale: 0,
          gale_ammount: 2.0,
          profit_ratio: 10.0,
          loss_type: 'price',
          loss_ratio: 5.0,
          logic: '',
        });
      }
    }
  };

  const handleSave = async () => {
    if (!selectedTemplateId) return;
    setIsSaving(true);
    setFeedback(null);
    try {
      const payload = {
        template_id: selectedTemplateId,
        strategy_id: formData.strategy_id,
        ammount_type: formData.ammount_type,
        ammount: Number(formData.ammount),
        exit_strategy_type: formData.exit_strategy_type,
        exit_contained_inside: formData.exit_contained_inside,
        max_gale: Number(formData.max_gale),
        gale_ammount: Number(formData.gale_ammount),
        profit_ratio: formData.profit_ratio ? Number(formData.profit_ratio) : null,
        loss_type: formData.loss_type,
        loss_ratio: formData.loss_ratio ? Number(formData.loss_ratio) : null,
        logic: formData.logic,
      };

      const res = await saveTemplateConfigData(selectedTemplateId, payload);
      setConfigs((prev) => ({
        ...prev,
        [selectedTemplateId]: { ...res, ...payload },
      }));

      setFeedback({
        type: 'success',
        message: `Configuración guardada exitosamente para Template #${selectedTemplateId}`,
      });
      setTimeout(() => setFeedback(null), 4000);
    } catch (err: any) {
      console.error('Error saving config:', err);
      setFeedback({
        type: 'error',
        message: 'Error al persistir la configuración en la base de datos.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const selectedTemplate = templates.find((t) => t.id === selectedTemplateId);

  // Filtered Templates List
  const filteredTemplates = templates.filter((tpl) => {
    const cfg = configs[tpl.id];
    const matchesSearch =
      tpl.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      String(tpl.id).includes(searchQuery) ||
      (tpl.code_slot && tpl.code_slot.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;

    if (filterType === 'GALE') {
      return (cfg?.max_gale ?? 0) > 0;
    }
    if (filterType === 'PERCENT') {
      return cfg?.ammount_type === 'percentage';
    }
    if (filterType === 'FIXED') {
      return cfg?.ammount_type === 'fixed';
    }
    return true;
  });

  // Calculate Gale Progression Sample
  const baseAmt = Number(formData.ammount) || 0;
  const mult = Number(formData.gale_ammount) || 2.0;
  const maxG = Number(formData.max_gale) || 0;
  const isPercent = formData.ammount_type === 'percentage';

  const progressionSteps = [
    { step: 0, label: 'Entrada Base', val: baseAmt },
    ...(maxG >= 1 ? [{ step: 1, label: 'Gale 1 (Re-entrada)', val: +(baseAmt * mult).toFixed(2) }] : []),
    ...(maxG >= 2 ? [{ step: 2, label: 'Gale 2 (Re-entrada)', val: +(baseAmt * mult * mult).toFixed(2) }] : []),
    ...(maxG >= 3 ? [{ step: 3, label: 'Gale 3 (Re-entrada)', val: +(baseAmt * Math.pow(mult, 3)).toFixed(2) }] : []),
  ];

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-[1600px] mx-auto select-none">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-600/10 text-indigo-500 border border-indigo-500/20">
              <Sliders size={22} />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                Template Operational Config
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Vincule parámetros de entrada (capital fijo o porcentaje), pasos de Martingala (Gale) y estrategias de salida operativas.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={fetchData}
            variant="outline"
            size="sm"
            disabled={isLoading}
            className="text-xs font-bold rounded-xl border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 gap-1.5"
          >
            <RefreshCw size={13} className={isLoading ? 'animate-spin' : ''} />
            Recargar
          </Button>

          <Button
            onClick={handleSave}
            size="sm"
            disabled={isSaving || !selectedTemplateId}
            className="text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white gap-1.5 shadow-sm shadow-indigo-600/20"
          >
            {isSaving ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
            Guardar Configuración
          </Button>
        </div>
      </div>

      {/* Feedback banner */}
      {feedback && (
        <div
          className={cn(
            'flex items-center gap-2.5 px-4 py-3 rounded-2xl border text-xs font-semibold animate-in fade-in duration-200',
            feedback.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
              : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300'
          )}
        >
          {feedback.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Main Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Templates Master Selector */}
        <div className="lg:col-span-4 space-y-4">
          <Card className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/60 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                  <Layers size={14} className="text-indigo-500" />
                  Templates Disponibles ({filteredTemplates.length})
                </span>
                <Badge variant="outline" className="text-[10px] font-mono px-2 py-0.5">
                  DB: SQLite
                </Badge>
              </div>

              {/* Search input */}
              <div className="relative">
                <Search
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="text"
                  placeholder="Buscar template, id o slot..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              {/* Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                {(['ALL', 'GALE', 'PERCENT', 'FIXED'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setFilterType(tab)}
                    className={cn(
                      'text-[10px] font-bold px-2.5 py-1 rounded-lg border transition-all cursor-pointer whitespace-nowrap',
                      filterType === tab
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                    )}
                  >
                    {tab === 'ALL'
                      ? 'Todos'
                      : tab === 'GALE'
                      ? 'Con Gale'
                      : tab === 'PERCENT'
                      ? 'Porcentaje'
                      : 'Fijo'}
                  </button>
                ))}
              </div>
            </div>

            {/* Template List Items */}
            <div className="divide-y divide-slate-100 dark:divide-slate-800/60 max-h-[580px] overflow-y-auto">
              {isLoading ? (
                <div className="p-8 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                  <RefreshCw size={14} className="animate-spin" /> Cargando templates...
                </div>
              ) : filteredTemplates.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400">
                  No se encontraron templates con los filtros activos.
                </div>
              ) : (
                filteredTemplates.map((tpl) => {
                  const cfg = configs[tpl.id];
                  const isSelected = selectedTemplateId === tpl.id;
                  const maxGale = cfg?.max_gale ?? 0;
                  const ammount = cfg?.ammount ?? 1.0;
                  const ammountType = cfg?.ammount_type ?? 'percentage';

                  return (
                    <div
                      key={tpl.id}
                      onClick={() => selectTemplate(tpl.id)}
                      className={cn(
                        'p-3.5 flex items-center justify-between gap-3 cursor-pointer transition-colors',
                        isSelected
                          ? 'bg-indigo-50/80 dark:bg-indigo-950/30 border-l-4 border-indigo-600 dark:border-indigo-500'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                      )}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-slate-800 dark:text-slate-100 truncate">
                            {tpl.name}
                          </span>
                          {tpl.code_slot && (
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-200/70 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold shrink-0">
                              {tpl.code_slot}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                          <span className="text-[10px] font-mono text-slate-400">
                            ID #{tpl.id}
                          </span>

                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.2 rounded bg-indigo-100/60 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300">
                            {ammountType === 'percentage' ? (
                              <Percent size={10} />
                            ) : (
                              <DollarSign size={10} />
                            )}
                            {ammount}
                            {ammountType === 'percentage' ? '%' : ' USD'}
                          </span>

                          <span
                            className={cn(
                              'text-[10px] font-bold px-1.5 py-0.2 rounded',
                              maxGale > 0
                                ? 'bg-amber-100/70 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                                : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                            )}
                          >
                            Gale: {maxGale}
                          </span>
                        </div>
                      </div>

                      <ChevronRight
                        size={15}
                        className={cn(
                          'shrink-0 text-slate-400 transition-transform',
                          isSelected && 'text-indigo-600 dark:text-indigo-400 translate-x-0.5'
                        )}
                      />
                    </div>
                  );
                })
              )}
            </div>
          </Card>
        </div>

        {/* Right Column: Detailed Configuration Form & Strategy Preview */}
        <div className="lg:col-span-8 space-y-6">
          {selectedTemplate ? (
            <>
              {/* Active Template Card Info */}
              <Card className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-black text-slate-900 dark:text-white">
                        {selectedTemplate.name}
                      </h2>
                      <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800 text-[10px] font-bold">
                        Template #{selectedTemplate.id}
                      </Badge>
                      {selectedTemplate.code_slot && (
                        <Badge variant="outline" className="text-[10px] font-mono">
                          Slot: {selectedTemplate.code_slot}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      Ajuste los parámetros financieros de ejecución sobre las señales detectadas con este template.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400">Tipo de motor:</span>
                    <Badge variant="purple" className="text-xs font-bold uppercase">
                      {selectedTemplate.template_type}
                    </Badge>
                  </div>
                </div>

                {/* Syntax pattern preview collapse */}
                <div className="mt-3.5 bg-slate-50 dark:bg-slate-950/70 p-3 rounded-2xl border border-slate-100 dark:border-slate-800/80">
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1.5">
                    <span>Sintaxis del Template</span>
                    <span className="font-mono text-[10px] text-slate-400">Tokens extraídos dinámicos</span>
                  </div>
                  <pre className="text-[11px] font-mono text-slate-800 dark:text-slate-300 whitespace-pre-wrap leading-relaxed max-h-24 overflow-y-auto">
                    {selectedTemplate.pattern_syntax}
                  </pre>
                </div>
              </Card>

              {/* Section 1: Capital & Operation Sizing */}
              <Card className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-indigo-600/10 text-indigo-500">
                      <DollarSign size={18} />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-slate-900 dark:text-white">
                        1. Dimensionamiento de Operación (Amount)
                      </h3>
                      <p className="text-xs text-slate-500">
                        Defina cómo se calcula el volumen o valor monetario de cada entrada en el broker.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-start">
                  {/* Amount Type Switcher */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Modo de Cálculo (ammount_type)
                    </label>
                    <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-slate-950 rounded-2xl border border-slate-200/80 dark:border-slate-800">
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, ammount_type: 'percentage' })}
                        className={cn(
                          'flex items-center justify-center gap-1.5 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer',
                          formData.ammount_type === 'percentage'
                            ? 'bg-white dark:bg-indigo-600 text-indigo-600 dark:text-white shadow-sm'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                        )}
                      >
                        <Percent size={13} /> Porcentaje (%)
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, ammount_type: 'fixed' })}
                        className={cn(
                          'flex items-center justify-center gap-1.5 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer',
                          formData.ammount_type === 'fixed'
                            ? 'bg-white dark:bg-indigo-600 text-indigo-600 dark:text-white shadow-sm'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                        )}
                      >
                        <DollarSign size={13} /> Capital Fijo ($)
                      </button>
                    </div>
                    <span className="text-[11px] text-slate-400 block">
                      {formData.ammount_type === 'percentage'
                        ? 'Calculado automáticamente como % del balance disponible en la cuenta del broker.'
                        : 'Monto monetario exacto en USD por cada operación lanzada.'}
                    </span>
                  </div>

                  {/* Amount Input & Presets */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        Cantidad a Operar ({formData.ammount_type === 'percentage' ? '%' : 'USD'})
                      </label>
                      <span className="text-[10px] font-mono text-indigo-500 font-bold">
                        Valor actual: {formData.ammount}
                        {formData.ammount_type === 'percentage' ? '%' : ' USD'}
                      </span>
                    </div>

                    <div className="relative">
                      <input
                        type="number"
                        step="0.1"
                        min="0.1"
                        value={formData.ammount}
                        onChange={(e) =>
                          setFormData({ ...formData, ammount: parseFloat(e.target.value) || 0 })
                        }
                        className="w-full pl-3 pr-10 py-2.5 text-sm font-black rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                        {formData.ammount_type === 'percentage' ? '%' : 'USD'}
                      </span>
                    </div>

                    {/* Quick Presets */}
                    <div className="flex items-center gap-1.5 pt-1">
                      <span className="text-[10px] font-bold text-slate-400">Presets:</span>
                      {(formData.ammount_type === 'percentage'
                        ? [1.0, 2.0, 3.5, 5.0]
                        : [5, 10, 25, 50, 100]
                      ).map((val) => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => setFormData({ ...formData, ammount: val })}
                          className={cn(
                            'text-[10px] font-bold px-2 py-0.5 rounded-lg border cursor-pointer transition-colors',
                            formData.ammount === val
                              ? 'bg-indigo-600 text-white border-indigo-600'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                          )}
                        >
                          {val}
                          {formData.ammount_type === 'percentage' ? '%' : '$'}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </Card>

              {/* Section 2: Gale Strategy Configuration (Martingale) */}
              <Card className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-amber-600/10 text-amber-500">
                      <Zap size={18} />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-slate-900 dark:text-white">
                        2. Estrategia de Gale (Martingala / Re-entradas)
                      </h3>
                      <p className="text-xs text-slate-500">
                        Vincula el número máximo de pasos de recuperación y el multiplicador de volumen en caso de pérdida.
                      </p>
                    </div>
                  </div>

                  <Badge
                    className={cn(
                      'text-xs font-bold',
                      formData.max_gale > 0
                        ? 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300'
                        : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                    )}
                  >
                    {formData.max_gale > 0 ? `Gale Activo (${formData.max_gale} pasos)` : 'Sin Gale (Paso 0)'}
                  </Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-start">
                  {/* Max Gale Steps */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Número Máximo de Gales (max_gale)
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                      {[0, 1, 2, 3].map((step) => (
                        <button
                          key={step}
                          type="button"
                          onClick={() => setFormData({ ...formData, max_gale: step })}
                          className={cn(
                            'py-2 rounded-2xl border text-xs font-black transition-all cursor-pointer flex flex-col items-center justify-center gap-0.5',
                            formData.max_gale === step
                              ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
                              : 'bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                          )}
                        >
                          <span>G{step}</span>
                          <span className="text-[9px] font-normal opacity-80">
                            {step === 0 ? 'Sin Gale' : `${step} re-entrada${step > 1 ? 's' : ''}`}
                          </span>
                        </button>
                      ))}
                    </div>
                    <span className="text-[11px] text-slate-400 block">
                      Define cuántas veces consecutivas se duplicará o multiplicará la entrada si la vela o señal cierra negativa.
                    </span>
                  </div>

                  {/* Gale Multiplier / Amount */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        Multiplicador de Gale (gale_ammount)
                      </label>
                      <span className="text-[10px] font-mono text-amber-500 font-bold">
                        Factor: {formData.gale_ammount}x
                      </span>
                    </div>

                    <div className="relative">
                      <input
                        type="number"
                        step="0.1"
                        min="1.0"
                        max="5.0"
                        disabled={formData.max_gale === 0}
                        value={formData.gale_ammount}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            gale_ammount: parseFloat(e.target.value) || 2.0,
                          })
                        }
                        className={cn(
                          'w-full pl-3 pr-10 py-2.5 text-sm font-black rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500',
                          formData.max_gale === 0 && 'opacity-40 cursor-not-allowed'
                        )}
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                        Multiplicador
                      </span>
                    </div>

                    {/* Quick Multiplier Presets */}
                    <div className="flex items-center gap-1.5 pt-1">
                      <span className="text-[10px] font-bold text-slate-400">Comunes:</span>
                      {[2.0, 2.1, 2.2, 2.5].map((val) => (
                        <button
                          key={val}
                          type="button"
                          disabled={formData.max_gale === 0}
                          onClick={() => setFormData({ ...formData, gale_ammount: val })}
                          className={cn(
                            'text-[10px] font-bold px-2 py-0.5 rounded-lg border cursor-pointer transition-colors',
                            formData.gale_ammount === val
                              ? 'bg-amber-500 text-white border-amber-500'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700',
                            formData.max_gale === 0 && 'opacity-40 cursor-not-allowed'
                          )}
                        >
                          {val}x
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Progression Simulator Cards */}
                <div className="p-4 rounded-2xl bg-amber-50/40 dark:bg-amber-950/15 border border-amber-200/60 dark:border-amber-900/40 space-y-2.5">
                  <div className="flex items-center justify-between text-xs font-bold text-amber-900 dark:text-amber-300">
                    <span className="flex items-center gap-1.5">
                      <TrendingUp size={14} /> Simulación de Secuencia Martingala
                    </span>
                    <span className="text-[10px] font-mono">
                      Exposición Total: {progressionSteps.reduce((acc, curr) => acc + curr.val, 0).toFixed(2)}
                      {isPercent ? '%' : ' USD'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                    {progressionSteps.map((st) => (
                      <div
                        key={st.step}
                        className="bg-white dark:bg-slate-900/90 p-3 rounded-xl border border-amber-200/80 dark:border-amber-800/60 flex flex-col justify-between"
                      >
                        <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                          {st.label}
                        </div>
                        <div className="text-base font-black text-slate-900 dark:text-white mt-1">
                          {st.val}
                          <span className="text-xs font-semibold text-amber-600 dark:text-amber-400 ml-0.5">
                            {isPercent ? '%' : '$'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>

              {/* Section 3: Exit Strategy & Signal Handling */}
              <Card className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-emerald-600/10 text-emerald-500">
                      <ShieldCheck size={18} />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-slate-900 dark:text-white">
                        3. Estrategia de Salida & Cierre Operativo
                      </h3>
                      <p className="text-xs text-slate-500">
                        Seleccione el método de salida (Gale por velas, Profit/Loss Ratio, o Condiciones abiertas).
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {[
                    { id: 'gale', title: 'Gale (Velas / Re-entradas)', desc: 'Cierre tras el resultado de cada vela o ciclo Martingala.' },
                    { id: 'profit_loss', title: 'Profit & Loss Target', desc: 'Ratio porcentual de toma de ganancias y límite de pérdida.' },
                    { id: 'open', title: 'Lógica Abierta / Indicadores', desc: 'Salida gobernada por RSI, cruces de medias o disparadores.' },
                  ].map((mode) => (
                    <div
                      key={mode.id}
                      onClick={() => setFormData({ ...formData, exit_strategy_type: mode.id as any })}
                      className={cn(
                        'p-4 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between gap-2',
                        formData.exit_strategy_type === mode.id
                          ? 'bg-indigo-50/80 dark:bg-indigo-950/40 border-indigo-600 dark:border-indigo-500 ring-1 ring-indigo-500'
                          : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-slate-900 dark:text-white">
                          {mode.title}
                        </span>
                        {formData.exit_strategy_type === mode.id && (
                          <Check size={14} className="text-indigo-600 dark:text-indigo-400" />
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                        {mode.desc}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Conditional Fields depending on exit_strategy_type */}
                {formData.exit_strategy_type === 'profit_loss' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        Profit Ratio (%)
                      </label>
                      <input
                        type="number"
                        step="0.5"
                        value={formData.profit_ratio || ''}
                        onChange={(e) =>
                          setFormData({ ...formData, profit_ratio: parseFloat(e.target.value) || 0 })
                        }
                        placeholder="10.0"
                        className="w-full px-3 py-2 text-xs font-bold rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        Loss Ratio (%)
                      </label>
                      <input
                        type="number"
                        step="0.5"
                        value={formData.loss_ratio || ''}
                        onChange={(e) =>
                          setFormData({ ...formData, loss_ratio: parseFloat(e.target.value) || 0 })
                        }
                        placeholder="5.0"
                        className="w-full px-3 py-2 text-xs font-bold rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>
                )}

                {formData.exit_strategy_type === 'open' && (
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Lógica de Disparo de Salida (Expression / Script)
                    </label>
                    <input
                      type="text"
                      value={formData.logic || ''}
                      onChange={(e) => setFormData({ ...formData, logic: e.target.value })}
                      placeholder="e.g. RSI > 75 OR StochCrossDown"
                      className="w-full px-3 py-2 text-xs font-mono rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>
                )}

                {/* Exit Signal Contained Inside Toggle */}
                <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                  <div className="space-y-0.5">
                    <div className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <span>Señal de salida incluida en el mismo mensaje</span>
                      <span className="text-[10px] font-mono text-slate-400">
                        (exit_contained_inside)
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Actívelo si el texto capturado ya provee tiempo de expiración o Take-Profit implícito sin requerir un segundo mensaje.
                    </p>
                  </div>

                  <Switch
                    checked={formData.exit_contained_inside}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, exit_contained_inside: checked })
                    }
                  />
                </div>
              </Card>

              {/* Bottom Action Footer */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <Button
                  onClick={fetchData}
                  variant="outline"
                  size="sm"
                  className="rounded-xl border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-600 dark:text-slate-300"
                >
                  Cancelar Cambios
                </Button>

                <Button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold gap-2 px-5 py-2.5 shadow-md shadow-indigo-600/20"
                >
                  {isSaving ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
                  Guardar Parámetros de Template #{selectedTemplate.id}
                </Button>
              </div>
            </>
          ) : (
            <Card className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-12 text-center shadow-sm">
              <Sliders size={36} className="mx-auto text-slate-400 mb-3" />
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
                Seleccione un Template
              </h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Haga clic en cualquiera de los templates de la lista lateral para visualizar y editar sus configuraciones operativas.
              </p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
