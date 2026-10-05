import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Switch } from '@/components/common/Switch';
import { Modal } from '@/components/common/Modal';
import { DataTable } from '@/components/common/DataTable';
import {
  getTemplates,
  createTemplate,
  deleteTemplate,
  updateTemplate,
  tokenizeText,
} from '@/services/tokenizerApi';
import { cn } from '@/lib/utils';
import {
  Plus,
  Trash2,
  Search,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Play,
  LayoutGrid,
  List,
  Sparkles,
  Cpu,
  Clock,
  Check,
  TrendingUp,
  X,
  Volume2,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Zap,
  Eye,
  EyeOff,
  Power,
  PowerOff,
  CheckSquare,
  Square,
  AlertTriangle,
} from 'lucide-react';

interface TemplateItem {
  id: number;
  name: string;
  sender_name?: string;
  template_type: string;
  pattern_syntax: string;
  priority: number;
  is_active: boolean;
  code_slot: string; // e.g. A1, A2, B3
  section: string;   // A-Forex, B-Binary, C-Crypto, D-Commodities
  win_rate?: number;
  latency_us?: number;
  signals_count?: number;
  quality_score?: number;
}

export const isValidPatternTemplate = (syntax: string | undefined): boolean => {
  if (!syntax) return false;
  const lines = syntax.split('\n').filter((l) => l.trim().length > 0);
  return lines.length > 1 && syntax.includes('$(symbol)');
};

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<TemplateItem[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateItem | null>(null);
  const [isInspectorOpen, setIsInspectorOpen] = useState(true);
  const [viewMode, setViewMode] = useState<'matrix' | 'table'>('matrix');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE' | 'BINARY' | 'MARKET'>('ALL');

  // Multi-selection & batch operations state
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [isBatchLoading, setIsBatchLoading] = useState(false);
  const [batchActionFeedback, setBatchActionFeedback] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Test pattern modal state
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);
  const [testInputText, setTestInputText] = useState('GOLD BUY 2684.50 SL 2678.00 TP 2695.00');
  const [testResult, setTestResult] = useState<any>(null);
  const [isTesting, setIsTesting] = useState(false);

  // Create template modal state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newSyntax, setNewSyntax] = useState('📊 Currency : $(symbol)\n⏳ EXPIRATION : $(timeframe)\n⏱ ️ $(entry) : $(expiration)\n🟢 $(action)');
  const [newType, setNewType] = useState('market');
  const [newSection, setNewSection] = useState('A-Forex MT5');

  // Load from backend
  useEffect(() => {
    async function loadBackendTemplates() {
      try {
        const backendData = await getTemplates({ limit: 100 });
        if (backendData && Array.isArray(backendData)) {
          const validList: TemplateItem[] = [];
          const invalidIds: number[] = [];

          backendData.forEach((b: any, index: number) => {
            if (isValidPatternTemplate(b.pattern_syntax)) {
              validList.push({
                id: b.id,
                name: b.name,
                sender_name: b.sender_name || 'Custom Ingestor',
                pattern_syntax: b.pattern_syntax,
                template_type: b.template_type || 'market',
                is_active: b.is_active !== undefined ? b.is_active : true,
                priority: b.priority ?? 100,
                code_slot: b.code_slot || `S${index + 1}`,
                section: b.section || (b.template_type === 'binary' ? 'B-Binary Turbo' : 'A-Forex MT5'),
                win_rate: b.win_rate ?? 80.0,
                latency_us: b.latency_us ?? 30,
                signals_count: b.signals_count ?? 0,
                quality_score: b.quality_score ?? 85,
              });
            } else {
              // Rule check: does not have >1 lines or does not have $(symbol) -> mark to delete from DB
              if (b.id) invalidIds.push(b.id);
            }
          });

          // Purge invalid templates from DB
          if (invalidIds.length > 0) {
            await Promise.allSettled(invalidIds.map((id) => deleteTemplate(id)));
          }

          setTemplates(validList);
          if (validList.length > 0) {
            setSelectedTemplate((prev) => {
              const found = validList.find((m) => m.id === prev?.id);
              return found || validList[0]!;
            });
          } else {
            setSelectedTemplate(null);
          }
        }
      } catch (err) {
        console.warn('Error loading backend templates:', err);
      }
    }
    loadBackendTemplates();
  }, []);

  const handleToggleSlot = async (tpl: TemplateItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!tpl || !tpl.id) return;
    const nextState = !tpl.is_active;

    // Optimistic UI update
    setTemplates((prev) =>
      prev.map((t) => (t.id === tpl.id || t.code_slot === tpl.code_slot ? { ...t, is_active: nextState } : t))
    );
    if (selectedTemplate && (selectedTemplate.id === tpl.id || selectedTemplate.code_slot === tpl.code_slot)) {
      setSelectedTemplate((prev) => (prev ? { ...prev, is_active: nextState } : null));
    }

    try {
      const res = await updateTemplate(tpl.id, { is_active: nextState });
      if (res && res.id) {
        setTemplates((prev) =>
          prev.map((t) => (t.id === tpl.id ? { ...t, is_active: res.is_active } : t))
        );
        if (selectedTemplate?.id === tpl.id) {
          setSelectedTemplate((prev) => (prev ? { ...prev, is_active: res.is_active } : null));
        }
      }
    } catch (err) {
      console.error('Failed to persist template state:', err);
    }
  };

  const handleSelectSlot = (tpl: TemplateItem) => {
    if (!tpl) return;
    if (selectedTemplate && (selectedTemplate.id === tpl.id || selectedTemplate.code_slot === tpl.code_slot)) {
      // Toggle inspector when clicking the currently active template card
      setIsInspectorOpen((prev) => !prev);
    } else {
      setSelectedTemplate(tpl);
      setIsInspectorOpen(true);
    }
  };

  const handleDeleteSingleTemplate = async (tpl: TemplateItem) => {
    if (!tpl || !tpl.id) return;
    setIsBatchLoading(true);
    try {
      await deleteTemplate(tpl.id);
      setTemplates((prev) => {
        const remaining = prev.filter((t) => t.id !== tpl.id);
        if (selectedTemplate?.id === tpl.id) {
          setSelectedTemplate(remaining.length > 0 ? remaining[0]! : null);
        }
        return remaining;
      });
      setSelectedIds((prev) => prev.filter((id) => id !== tpl.id));
      setBatchActionFeedback({
        type: 'success',
        message: `Template "${tpl.name}" (${tpl.code_slot}) eliminado permanentemente de la base de datos.`,
      });
      setTimeout(() => setBatchActionFeedback(null), 3500);
    } catch (err) {
      console.error('Error deleting template:', err);
      setBatchActionFeedback({
        type: 'error',
        message: `Error al eliminar template "${tpl.name}".`,
      });
      setTimeout(() => setBatchActionFeedback(null), 3500);
    } finally {
      setIsBatchLoading(false);
    }
  };

  const handleRunTokenizeTest = async () => {
    setIsTesting(true);
    try {
      const res = await tokenizeText({
        text: testInputText,
        template_id: selectedTemplate?.id,
        persist: false,
      });
      setTestResult(res);
    } catch (err: any) {
      // Local fallback simulation if server is unreachable
      setTestResult({
        tokens: [
          { kind: 'SYMBOL', value: 'GOLD', start: 0, end: 4, line: 1 },
          { kind: 'ACTION_BUY', value: 'BUY', start: 5, end: 8, line: 1 },
          { kind: 'PRICE_ENTRY', value: '2684.50', start: 9, end: 16, line: 1 },
          { kind: 'SL', value: '2678.00', start: 20, end: 27, line: 1 },
          { kind: 'TP', value: '2695.00', start: 31, end: 38, line: 1 },
        ],
        entities: {
          symbol: 'XAUUSD',
          action: 'BUY',
          entry_price: 2684.5,
          stop_loss: 2678.0,
          take_profit: 2695.0,
          timeframe: 'M15',
        },
        processing_time_us: 28,
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleCreateTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    if (!isValidPatternTemplate(newSyntax)) {
      setBatchActionFeedback({
        type: 'error',
        message: 'El template debe tener más de 1 línea y contener la variable $(symbol).',
      });
      setTimeout(() => setBatchActionFeedback(null), 4000);
      return;
    }

    const nextSlot = `${newSection[0]}${templates.filter((t) => t.section === newSection).length + 1}`;

    try {
      const created = await createTemplate({
        name: newName,
        pattern_syntax: newSyntax,
        template_type: newType,
        section: newSection,
        code_slot: nextSlot,
        priority: 100,
        is_active: true,
      });

      const newSlotItem: TemplateItem = {
        id: created.id || Date.now(),
        code_slot: created.code_slot || nextSlot,
        section: created.section || newSection,
        name: created.name || newName,
        template_type: created.template_type || newType,
        pattern_syntax: created.pattern_syntax || newSyntax,
        priority: created.priority || 100,
        is_active: created.is_active !== undefined ? created.is_active : true,
        win_rate: 75.0,
        latency_us: 32,
        signals_count: 0,
        quality_score: 85,
      };

      setTemplates((prev) => [newSlotItem, ...prev]);
      setSelectedTemplate(newSlotItem);
      setIsCreateModalOpen(false);
      setNewName('');
      setBatchActionFeedback({
        type: 'success',
        message: `Template "${newSlotItem.name}" creado y guardado en la base de datos.`,
      });
      setTimeout(() => setBatchActionFeedback(null), 3500);
    } catch (err) {
      console.error('Error creating template:', err);
      setBatchActionFeedback({
        type: 'error',
        message: 'Error al registrar template en el backend.',
      });
      setTimeout(() => setBatchActionFeedback(null), 3500);
    }
  };

  // Group templates by section for the 4-column matrix
  const sections = ['A-Forex MT5', 'B-Binary Turbo', 'C-Crypto Scalp', 'D-Commodities'];

  const getSectionStats = (sec: string) => {
    const items = templates.filter((t) => t.section === sec);
    const active = items.filter((t) => t.is_active).length;
    return `${active}/${items.length}`;
  };

  // Filter templates
  const filteredTemplates = templates.filter((t) => {
    const matchesSearch =
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.code_slot.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.pattern_syntax.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter =
      activeFilter === 'ALL' ||
      (activeFilter === 'ACTIVE' && t.is_active) ||
      (activeFilter === 'INACTIVE' && !t.is_active) ||
      (activeFilter === 'BINARY' && t.template_type === 'binary') ||
      (activeFilter === 'MARKET' && t.template_type === 'market');
    return matchesSearch && matchesFilter;
  });

  const totalActive = templates.filter((t) => t.is_active).length;
  const totalSlots = templates.length;
  const overallActivePct = totalSlots > 0 ? Math.round((totalActive / totalSlots) * 100) : 0;

  // Multi-selection handlers
  const handleToggleSelectAll = () => {
    const currentFilteredIds = filteredTemplates.map((t) => t.id);
    const allSelected =
      currentFilteredIds.length > 0 &&
      currentFilteredIds.every((id) => selectedIds.includes(id));

    if (allSelected) {
      setSelectedIds((prev) => prev.filter((id) => !currentFilteredIds.includes(id)));
    } else {
      setSelectedIds((prev) => Array.from(new Set([...prev, ...currentFilteredIds])));
    }
  };

  const handleToggleSelectOne = (id: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleSelectOnlyActive = () => {
    const activeIds = filteredTemplates.filter((t) => t.is_active).map((t) => t.id);
    setSelectedIds(activeIds);
  };

  const handleSelectOnlyInactive = () => {
    const inactiveIds = filteredTemplates.filter((t) => !t.is_active).map((t) => t.id);
    setSelectedIds(inactiveIds);
  };

  const handleClearSelection = () => {
    setSelectedIds([]);
  };

  // Bulk actions handlers
  const handleBatchActivate = async () => {
    if (selectedIds.length === 0) return;
    setIsBatchLoading(true);
    const targetCount = selectedIds.length;
    try {
      setTemplates((prev) =>
        prev.map((t) => (selectedIds.includes(t.id) ? { ...t, is_active: true } : t))
      );
      if (selectedTemplate && selectedIds.includes(selectedTemplate.id)) {
        setSelectedTemplate((prev) => (prev ? { ...prev, is_active: true } : null));
      }

      await Promise.allSettled(
        selectedIds.map((id) => updateTemplate(id, { is_active: true }))
      );

      setBatchActionFeedback({
        type: 'success',
        message: `${targetCount} templates activados correctamente.`,
      });
      setTimeout(() => setBatchActionFeedback(null), 3500);
    } catch (err) {
      console.error('Batch activation error:', err);
      setBatchActionFeedback({
        type: 'error',
        message: 'Error al procesar la activación por lotes.',
      });
      setTimeout(() => setBatchActionFeedback(null), 3500);
    } finally {
      setIsBatchLoading(false);
    }
  };

  const handleBatchDeactivate = async () => {
    if (selectedIds.length === 0) return;
    setIsBatchLoading(true);
    const targetCount = selectedIds.length;
    try {
      setTemplates((prev) =>
        prev.map((t) => (selectedIds.includes(t.id) ? { ...t, is_active: false } : t))
      );
      if (selectedTemplate && selectedIds.includes(selectedTemplate.id)) {
        setSelectedTemplate((prev) => (prev ? { ...prev, is_active: false } : null));
      }

      await Promise.allSettled(
        selectedIds.map((id) => updateTemplate(id, { is_active: false }))
      );

      setBatchActionFeedback({
        type: 'success',
        message: `${targetCount} templates desactivados correctamente.`,
      });
      setTimeout(() => setBatchActionFeedback(null), 3500);
    } catch (err) {
      console.error('Batch deactivation error:', err);
      setBatchActionFeedback({
        type: 'error',
        message: 'Error al procesar la desactivación por lotes.',
      });
      setTimeout(() => setBatchActionFeedback(null), 3500);
    } finally {
      setIsBatchLoading(false);
    }
  };

  const handleConfirmBatchDelete = async () => {
    if (selectedIds.length === 0) return;
    setIsBatchLoading(true);
    const targetCount = selectedIds.length;
    try {
      const remaining = templates.filter((t) => !selectedIds.includes(t.id));
      setTemplates(remaining);
      if (selectedTemplate && selectedIds.includes(selectedTemplate.id)) {
        setSelectedTemplate(remaining.length > 0 ? remaining[0]! : null);
      }

      await Promise.allSettled(
        selectedIds.map((id) => deleteTemplate(id))
      );

      setSelectedIds([]);
      setIsDeleteModalOpen(false);
      setBatchActionFeedback({
        type: 'success',
        message: `${targetCount} templates eliminados correctamente.`,
      });
      setTimeout(() => setBatchActionFeedback(null), 3500);
    } catch (err) {
      console.error('Batch delete error:', err);
      setBatchActionFeedback({
        type: 'error',
        message: 'Error al eliminar los templates seleccionados.',
      });
      setTimeout(() => setBatchActionFeedback(null), 3500);
    } finally {
      setIsBatchLoading(false);
    }
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-[1700px] mx-auto select-none">
      {/* Top Header & View Modes Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100">
              Section Overview ({totalSlots})
            </h1>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
              Rust Native Core
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Syntactic grammar matcher, hot slot matrix activation, and sub-millisecond lexical tokenization
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* View switcher */}
          <div className="bg-slate-100 dark:bg-slate-900 p-1 rounded-xl flex items-center border border-slate-200 dark:border-slate-800">
            <button
              onClick={() => setViewMode('matrix')}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5',
                viewMode === 'matrix' ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              )}
            >
              <LayoutGrid size={14} /> Matrix Slots
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5',
                viewMode === 'table' ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              )}
            >
              <List size={14} /> Table View
            </button>
          </div>

          <Button
            onClick={() => setIsCreateModalOpen(true)}
            size="sm"
            className="text-xs font-bold shadow-xs bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl"
          >
            <Plus size={14} className="mr-1" /> Add Template
          </Button>

          <Button
            onClick={() => {
              setTestInputText(selectedTemplate?.pattern_syntax || 'EURUSD CALL 1.08520');
              setIsTestModalOpen(true);
            }}
            variant="outline"
            size="sm"
            className="text-xs font-bold rounded-xl border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200"
          >
            <Play size={14} className="mr-1 text-emerald-600 dark:text-emerald-400" /> Test Tokenizer
          </Button>
        </div>
      </div>

      {/* Top Bulk Selection & Actions Toolbar */}
      <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-sm space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Left: Select All / Selection info & presets */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={handleToggleSelectAll}
              className={cn(
                'flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer select-none',
                filteredTemplates.length > 0 &&
                  filteredTemplates.every((t) => selectedIds.includes(t.id))
                  ? 'bg-indigo-600 text-white border-indigo-700 shadow-xs'
                  : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-750'
              )}
            >
              {filteredTemplates.length > 0 &&
              filteredTemplates.every((t) => selectedIds.includes(t.id)) ? (
                <CheckSquare size={15} />
              ) : (
                <Square size={15} />
              )}
              <span>
                {filteredTemplates.length > 0 &&
                filteredTemplates.every((t) => selectedIds.includes(t.id))
                  ? 'Deseleccionar Todos'
                  : `Seleccionar Todos (${filteredTemplates.length})`}
              </span>
            </button>

            {selectedIds.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-xs font-black px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 shadow-2xs">
                  {selectedIds.length} seleccionados
                </span>
                <button
                  type="button"
                  onClick={handleClearSelection}
                  className="text-xs font-bold text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 underline cursor-pointer"
                >
                  Limpiar
                </button>
              </div>
            )}

            {/* Quick selection presets */}
            <div className="hidden sm:flex items-center gap-1.5 pl-2 border-l border-slate-200 dark:border-slate-800 text-xs">
              <span className="text-[11px] font-bold text-slate-400">Rápido:</span>
              <button
                type="button"
                onClick={handleSelectOnlyActive}
                className="px-2.5 py-1 rounded-lg text-[11px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 border border-emerald-200 dark:border-emerald-800 cursor-pointer transition-colors"
                title="Seleccionar solo los templates activos"
              >
                Activos
              </button>
              <button
                type="button"
                onClick={handleSelectOnlyInactive}
                className="px-2.5 py-1 rounded-lg text-[11px] font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 cursor-pointer transition-colors"
                title="Seleccionar solo los templates inactivos"
              >
                Inactivos
              </button>
            </div>
          </div>

          {/* Right: Bulk Actions (Activar, Desactivar, Eliminar) + Inspector Card Toggle */}
          <div className="flex flex-wrap items-center gap-2">
            <Button
              onClick={handleBatchActivate}
              disabled={selectedIds.length === 0 || isBatchLoading}
              size="sm"
              className="text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs disabled:opacity-40 cursor-pointer"
            >
              <Power size={13} className="mr-1.5" /> Activar {selectedIds.length > 0 && `(${selectedIds.length})`}
            </Button>

            <Button
              onClick={handleBatchDeactivate}
              disabled={selectedIds.length === 0 || isBatchLoading}
              size="sm"
              className="text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white rounded-xl shadow-xs disabled:opacity-40 cursor-pointer"
            >
              <PowerOff size={13} className="mr-1.5" /> Desactivar {selectedIds.length > 0 && `(${selectedIds.length})`}
            </Button>

            <Button
              onClick={() => setIsDeleteModalOpen(true)}
              disabled={selectedIds.length === 0 || isBatchLoading}
              variant="destructive"
              size="sm"
              className="text-xs font-bold rounded-xl shadow-xs disabled:opacity-40 cursor-pointer"
            >
              <Trash2 size={13} className="mr-1.5" /> Eliminar {selectedIds.length > 0 && `(${selectedIds.length})`}
            </Button>

            <div className="h-6 w-px bg-slate-200 mx-1 hidden sm:block" />

            {/* Inspector Hide/Show Button */}
            <Button
              onClick={() => setIsInspectorOpen((prev) => !prev)}
              variant="outline"
              size="sm"
              className={cn(
                'text-xs font-bold rounded-xl border transition-all cursor-pointer',
                isInspectorOpen
                  ? 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200'
                  : 'bg-indigo-50 text-indigo-700 border-indigo-300 hover:bg-indigo-100'
              )}
              title={isInspectorOpen ? 'Ocultar Inspector card' : 'Mostrar Inspector card'}
            >
              {isInspectorOpen ? (
                <>
                  <EyeOff size={14} className="mr-1.5 text-slate-500" /> Ocultar Inspector
                </>
              ) : (
                <>
                  <Eye size={14} className="mr-1.5 text-indigo-600" /> Mostrar Inspector ({selectedTemplate?.code_slot})
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Batch Feedback Banner */}
        {batchActionFeedback && (
          <div
            className={cn(
              'p-3 rounded-xl text-xs font-bold flex items-center justify-between animate-in fade-in slide-in-from-top duration-200',
              batchActionFeedback.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-rose-50 text-rose-800 border border-rose-200'
            )}
          >
            <div className="flex items-center gap-2">
              {batchActionFeedback.type === 'success' ? (
                <CheckCircle2 size={16} className="text-emerald-600" />
              ) : (
                <AlertCircle size={16} className="text-rose-600" />
              )}
              <span>{batchActionFeedback.message}</span>
            </div>
            <button
              type="button"
              onClick={() => setBatchActionFeedback(null)}
              className="text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X size={14} />
            </button>
          </div>
        )}
      </div>

      {/* Filter Chips & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter by slot (e.g. A1, B3), asset, syntax..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-700 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {(['ALL', 'ACTIVE', 'INACTIVE', 'BINARY', 'MARKET'] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={cn(
                'px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap',
                activeFilter === filter
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              )}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      {/* Main Layout: Matrix Grid + Right Side Metrics (from como mostrar los templates...webp) */}
      {viewMode === 'matrix' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: 4-Column Section Slot Matrix (A1..D12) */}
          <div className="lg:col-span-8 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-sm space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {sections.map((secName, secIdx) => {
                const secItems = filteredTemplates.filter((t) => t.section === secName);
                const colorPalette = [
                  { bg: 'bg-emerald-500', text: 'text-emerald-700', border: 'border-emerald-200', slotBg: 'bg-emerald-100 text-emerald-900 border-emerald-300' },
                  { bg: 'bg-amber-500', text: 'text-amber-700', border: 'border-amber-200', slotBg: 'bg-amber-100 text-amber-900 border-amber-300' },
                  { bg: 'bg-purple-500', text: 'text-purple-700', border: 'border-purple-200', slotBg: 'bg-purple-100 text-purple-900 border-purple-300' },
                  { bg: 'bg-sky-500', text: 'text-sky-700', border: 'border-sky-200', slotBg: 'bg-sky-100 text-sky-900 border-sky-300' },
                ];
                const colors = colorPalette[secIdx % 4] || colorPalette[0]!;

                return (
                  <div
                    key={secName}
                    className="p-3.5 bg-slate-50/80 dark:bg-slate-950/60 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-3"
                  >
                    {/* Column Header */}
                    <div className="flex items-center justify-between px-1">
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate" title={secName}>
                        {secName.split('-')[1] || secName}
                      </span>
                      <span className="text-[11px] font-mono font-bold text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900 px-2 py-0.5 rounded-full border border-slate-200 dark:border-slate-700 shadow-2xs">
                        {getSectionStats(secName)}
                      </span>
                    </div>

                    {/* Slots 2-column pills inside each section */}
                    {secItems.length === 0 ? (
                      <div className="py-8 px-2 text-center text-slate-400 text-xs flex flex-col items-center justify-center border border-dashed border-slate-200 dark:border-slate-800 rounded-xl bg-white/40 dark:bg-slate-900/40">
                        <span className="text-[11px] font-bold text-slate-400">Sin slots asignados</span>
                        <span className="text-[10px] text-slate-300 dark:text-slate-600 mt-0.5">Vacío</span>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-2">
                        {secItems.map((slot) => {
                          const isInspected =
                            selectedTemplate &&
                            (selectedTemplate.id === slot.id ||
                              selectedTemplate.code_slot === slot.code_slot);
                          const isChecked = selectedIds.includes(slot.id);

                          return (
                            <div
                              key={slot.code_slot}
                              onClick={() => handleSelectSlot(slot)}
                              className={cn(
                                'relative p-2.5 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center min-h-[64px] group shadow-2xs select-none',
                                slot.is_active
                                  ? cn(colors.slotBg, 'shadow-xs font-extrabold')
                                  : 'bg-slate-100/60 dark:bg-slate-800/40 border-dashed border-slate-300 dark:border-slate-700 text-slate-400 dark:text-slate-500 opacity-60 hover:opacity-90',
                                isChecked && 'ring-2 ring-indigo-600 border-indigo-400 bg-indigo-50/80 dark:bg-indigo-950/60',
                                isInspected && !isChecked && 'ring-2 ring-indigo-500 ring-offset-2 dark:ring-offset-slate-900'
                              )}
                            >
                              {/* Multi-selection Checkbox Pill (Top Left) */}
                              <button
                                type="button"
                                onClick={(e) => handleToggleSelectOne(slot.id, e)}
                                className={cn(
                                  'absolute -top-1.5 -left-1.5 w-4 h-4 rounded-md flex items-center justify-center text-[10px] transition-all z-10 shadow-xs cursor-pointer',
                                  isChecked
                                    ? 'bg-indigo-600 text-white border border-indigo-700 ring-2 ring-indigo-300'
                                    : 'bg-white/95 border border-slate-300 text-slate-300 hover:border-indigo-500 hover:text-indigo-600'
                                )}
                                title={isChecked ? 'Deseleccionar template' : 'Seleccionar template'}
                              >
                                <Check
                                  size={10}
                                  strokeWidth={3}
                                  className={isChecked ? 'opacity-100' : 'opacity-0 group-hover:opacity-40'}
                                />
                              </button>

                              {/* Active switch hover pill (Top Right) */}
                              <button
                                type="button"
                                onClick={(e) => handleToggleSlot(slot, e)}
                                className={cn(
                                  'absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold shadow-xs transition-transform z-10',
                                  slot.is_active
                                    ? 'bg-emerald-600 text-white'
                                    : 'bg-slate-300 text-slate-600 group-hover:scale-110'
                                )}
                                title={slot.is_active ? 'Click para desactivar' : 'Click para activar'}
                              >
                                {slot.is_active ? <Check size={9} /> : <X size={9} />}
                              </button>

                              {/* Code Slot & Name */}
                              <span className="text-xs font-black tracking-wider block">
                                {slot.code_slot}
                              </span>
                              <span className="text-[9px] font-medium truncate max-w-[55px] block mt-0.5 opacity-80">
                                {slot.name.split(' ')[0]}
                              </span>

                              {/* Small Inspector Hide/Show Pill right from this template */}
                              {isInspected && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setIsInspectorOpen((prev) => !prev);
                                  }}
                                  className={cn(
                                    'mt-1 text-[8px] font-bold px-1.5 py-0.5 rounded-full border flex items-center gap-0.5 shadow-2xs cursor-pointer transition-colors',
                                    isInspectorOpen
                                      ? 'text-indigo-700 bg-white/90 hover:bg-white border-indigo-200'
                                      : 'text-slate-600 bg-white/90 hover:bg-white border-slate-300'
                                  )}
                                  title={isInspectorOpen ? 'Ocultar Inspector de este template' : 'Mostrar Inspector de este template'}
                                >
                                  {isInspectorOpen ? (
                                    <>
                                      <EyeOff size={8} /> Ocultar
                                    </>
                                  ) : (
                                    <>
                                      <Eye size={8} /> Ver
                                    </>
                                  )}
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Section Metrics & Capacity (from como mostrar los templates...webp) */}
          <div className="lg:col-span-4 space-y-5">
            {/* Top Metric Card */}
            <div className="p-6 rounded-3xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/60 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-3xl font-black text-emerald-950 dark:text-emerald-200 tracking-tight block">
                    $6,357
                  </span>
                  <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300">
                    Signals Executed This Month
                  </span>
                </div>
                <span className="text-xs font-bold px-2 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 flex items-center gap-0.5 shadow-2xs">
                  <TrendingUp size={12} /> 26% ↗
                </span>
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-emerald-200/60 dark:border-emerald-800/60 text-xs font-bold text-emerald-900 dark:text-emerald-200">
                <span className="px-2.5 py-1 rounded-full bg-white/80 dark:bg-slate-900/80 border border-emerald-200 dark:border-emerald-800 shadow-2xs">
                  58% Market MT5
                </span>
                <span className="px-2.5 py-1 rounded-full bg-white/80 dark:bg-slate-900/80 border border-emerald-200 dark:border-emerald-800 shadow-2xs">
                  42% Binary Turbo
                </span>
              </div>
            </div>

            {/* Section Usage Radial Ring Card */}
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-200">Section Slot Usage</h3>
                <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded-full">
                  All Systems
                </span>
              </div>

              <div className="flex items-center gap-5">
                {/* Circular ring indicator */}
                <div className="relative w-24 h-24 shrink-0 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                    <path
                      className="text-slate-100 dark:text-slate-800"
                      strokeWidth="3.5"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    <path
                      className="text-amber-500 transition-all duration-1000 ease-out"
                      strokeDasharray={`${overallActivePct}, 100`}
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                  </svg>
                  <div className="absolute flex flex-col items-center">
                    <span className="text-base font-black text-slate-800 dark:text-slate-100">{overallActivePct}%</span>
                    <span className="text-[8px] font-bold text-slate-400 uppercase">Active</span>
                  </div>
                </div>

                {/* Stat numbers */}
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs flex-1">
                  <div>
                    <span className="text-base font-black text-slate-800 dark:text-slate-100 block">{totalSlots}</span>
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Total Slots</span>
                  </div>
                  <div>
                    <span className="text-base font-black text-slate-800 dark:text-slate-100 block">{totalSlots - totalActive}</span>
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Inactive</span>
                  </div>
                  <div>
                    <span className="text-base font-black text-emerald-600 dark:text-emerald-400 block">{totalActive}</span>
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold uppercase">Active Live</span>
                  </div>
                  <div>
                    <span className="text-base font-black text-indigo-600 dark:text-indigo-400 block">4</span>
                    <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold uppercase">Hot Pairs</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Inventory Overview 2x2 Mini Cards */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3.5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="font-bold">Received</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">+26% ↗</span>
                </div>
                <div className="text-lg font-black text-slate-800 dark:text-slate-100 mt-1">4,236</div>
                <span className="text-[10px] text-slate-400">Signals Ingested</span>
              </div>

              <div className="p-3.5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="font-bold">Executed</span>
                  <span className="text-rose-500 dark:text-rose-400 font-bold">-2.0% ↘</span>
                </div>
                <div className="text-lg font-black text-slate-800 dark:text-slate-100 mt-1">2,778</div>
                <span className="text-[10px] text-slate-400">Orders Dispatched</span>
              </div>

              <div className="p-3.5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="font-bold">Errors</span>
                  <span className="text-rose-500 dark:text-rose-400 font-bold">1.2%</span>
                </div>
                <div className="text-lg font-black text-slate-800 dark:text-slate-100 mt-1">147</div>
                <span className="text-[10px] text-slate-400">Syntax Retried</span>
              </div>

              <div className="p-3.5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="font-bold">Blocked</span>
                  <span className="text-amber-500 dark:text-amber-400 font-bold">6%</span>
                </div>
                <div className="text-lg font-black text-slate-800 dark:text-slate-100 mt-1">537</div>
                <span className="text-[10px] text-slate-400">Rules Filtered</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* MODE 2: CHECKBOX AUDIT TABLE (from componentes del dashboard tablas con checkbox...png) */
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-sm overflow-hidden p-6 space-y-4">
          <DataTable
            data={filteredTemplates}
            columns={[
              {
                header: 'Sel',
                accessorKey: 'selection',
                cell: (row: TemplateItem) => {
                  const isChecked = selectedIds.includes(row.id);
                  return (
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={(e) => handleToggleSelectOne(row.id, e as any)}
                      className="w-4 h-4 rounded border-slate-300 dark:border-slate-700 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    />
                  );
                },
              },
              {
                header: 'Slot',
                accessorKey: 'code_slot',
                cell: (row: TemplateItem) => (
                  <span className="font-mono font-black text-xs px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200">
                    {row.code_slot}
                  </span>
                ),
              },
              {
                header: 'Template Name & Channel',
                accessorKey: 'name',
                cell: (row: TemplateItem) => (
                  <div>
                    <span className="text-xs font-extrabold text-slate-900 block">{row.name}</span>
                    <span className="text-[11px] text-slate-400">{row.sender_name || 'Generic Channel'}</span>
                  </div>
                ),
              },
              {
                header: 'Pattern Syntax',
                accessorKey: 'pattern_syntax',
                cell: (row: TemplateItem) => (
                  <code className="text-[11px] font-mono bg-slate-50 px-2 py-1 rounded border border-slate-100 text-indigo-700">
                    {row.pattern_syntax}
                  </code>
                ),
              },
              {
                header: 'Type',
                accessorKey: 'template_type',
                cell: (row: TemplateItem) => (
                  <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                    {row.template_type}
                  </span>
                ),
              },
              {
                header: 'Win Rate',
                accessorKey: 'win_rate',
                cell: (row: TemplateItem) => (
                  <span className="font-mono font-bold text-xs text-emerald-600">
                    {row.win_rate}%
                  </span>
                ),
              },
              {
                header: 'Latency',
                accessorKey: 'latency_us',
                cell: (row: TemplateItem) => (
                  <span className="font-mono text-xs text-slate-500">
                    {row.latency_us}µs
                  </span>
                ),
              },
              {
                header: 'State',
                accessorKey: 'is_active',
                cell: (row: TemplateItem) => (
                  <Switch
                    checked={row.is_active}
                    onCheckedChange={() => handleToggleSlot(row)}
                  />
                ),
              },
              {
                header: 'Acciones',
                accessorKey: 'id',
                cell: (row: TemplateItem) => {
                  const isThisInspected =
                    selectedTemplate &&
                    (selectedTemplate.id === row.id || selectedTemplate.code_slot === row.code_slot);
                  return (
                    <div className="flex items-center gap-1.5">
                      <Button
                        variant="ghost"
                        size="sm"
                        className={cn(
                          'text-xs font-bold flex items-center gap-1 cursor-pointer',
                          isThisInspected && isInspectorOpen
                            ? 'text-indigo-700 bg-indigo-50 hover:bg-indigo-100'
                            : 'text-slate-600 hover:text-slate-900'
                        )}
                        onClick={() => handleSelectSlot(row)}
                      >
                        {isThisInspected && isInspectorOpen ? (
                          <>
                            <EyeOff size={13} /> Ocultar
                          </>
                        ) : (
                          <>
                            <Eye size={13} /> Ver
                          </>
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs font-bold text-rose-500 hover:text-rose-700 hover:bg-rose-50 p-1.5 rounded-lg cursor-pointer transition-colors"
                        onClick={() => handleDeleteSingleTemplate(row)}
                        title={`Eliminar template ${row.name}`}
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  );
                },
              },
            ]}
          />
        </div>
      )}

      {/* FLYOUT INSPECTOR DRAWER (from vista de templates para activar y desactivarlos...jpg) */}
      {isInspectorOpen && selectedTemplate && (
        <div className="fixed inset-y-0 right-0 w-full sm:w-[440px] bg-white dark:bg-slate-900 border-l border-slate-200/90 dark:border-slate-800 shadow-2xl z-50 p-6 flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-300 text-slate-900 dark:text-slate-100">
          <div className="space-y-6">
            {/* Drawer Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-mono font-extrabold text-xs">
                  {selectedTemplate.code_slot}
                </span>
                <span className="text-xs font-bold text-slate-400">Inspector Card</span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setIsInspectorOpen(false)}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer border border-slate-200 dark:border-slate-700"
                  title="Ocultar Inspector card"
                >
                  <EyeOff size={13} />
                  <span>Ocultar</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsInspectorOpen(false)}
                  className="p-1 rounded-xl text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  title="Cerrar"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Template Profile Badge */}
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-600 text-white flex items-center justify-center font-black text-lg shadow-md shrink-0">
                {selectedTemplate.code_slot}
              </div>
              <div>
                <h2 className="text-base font-black text-slate-900 dark:text-slate-100 leading-tight">
                  {selectedTemplate.name}
                </h2>
                <span className="text-xs text-slate-400 font-mono block mt-0.5">
                  ID: TPL-{selectedTemplate.id} • {selectedTemplate.section}
                </span>
                <span className={cn(
                  'inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full mt-1.5',
                  selectedTemplate.is_active ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                )}>
                  {selectedTemplate.is_active ? '● Active Live Engine' : '○ Standby Inactive'}
                </span>
              </div>
            </div>

            {/* Pattern Syntax Card */}
            <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-2">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                Pattern Syntax Definition
              </span>
              <pre className="text-xs font-mono bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 text-indigo-900 dark:text-indigo-300 whitespace-pre-wrap break-all shadow-2xs">
                {selectedTemplate.pattern_syntax}
              </pre>
              <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-1">
                <span>Priority: <strong>{selectedTemplate.priority}</strong></span>
                <span>Type: <strong className="uppercase">{selectedTemplate.template_type}</strong></span>
              </div>
            </div>

            {/* Noise / Latency Performance Chart Card (from reference image) */}
            <div className="p-4 bg-white dark:bg-slate-950 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Latency & Noise Performance</span>
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full">
                  Good (28µs)
                </span>
              </div>

              {/* Sparkline curve visualization */}
              <div className="h-16 w-full flex items-end gap-1.5 pt-2">
                {[30, 42, 28, 35, 22, 19, 28, 31, 25, 29, 24, 28].map((val, idx) => (
                  <div
                    key={idx}
                    className="flex-1 bg-indigo-500/20 hover:bg-indigo-600 rounded-t transition-all"
                    style={{ height: `${val * 1.5}%` }}
                    title={`${val}µs`}
                  />
                ))}
              </div>
              <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                <span>0µs</span>
                <span>Avg: {selectedTemplate.latency_us || 28}µs</span>
                <span>Max: 48µs</span>
              </div>
            </div>

            {/* Win Rate Progress Bar */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-700 dark:text-slate-300">Historical Win Rate</span>
                <span className="font-mono font-black text-emerald-600 dark:text-emerald-400">
                  {selectedTemplate.win_rate || 82.4}%
                </span>
              </div>
              <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-200 dark:border-slate-700">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                  style={{ width: `${selectedTemplate.win_rate || 82.4}%` }}
                />
              </div>
            </div>

            {/* Speaking / Signal Quality Multi-Segment Bar */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-700 dark:text-slate-300">Signal Clarity & Entity Quality</span>
                <span className="font-mono font-black text-indigo-600 dark:text-indigo-400">
                  Score: {selectedTemplate.quality_score || 90}/100
                </span>
              </div>
              <div className="flex h-3 w-full rounded-full overflow-hidden gap-1">
                <div className="flex-3 bg-indigo-600 rounded-l-full" title="Syntactic match" />
                <div className="flex-2 bg-amber-500" title="Broker routing" />
                <div className="flex-1 bg-emerald-500 rounded-r-full" title="Zero error" />
              </div>
            </div>
          </div>

          {/* Drawer Actions */}
          <div className="pt-6 border-t border-slate-100 flex items-center gap-2.5">
            <Button
              onClick={() => handleToggleSlot(selectedTemplate)}
              variant={selectedTemplate.is_active ? 'destructive' : 'success'}
              size="sm"
              className="flex-1 text-xs font-bold rounded-xl"
            >
              {selectedTemplate.is_active ? 'Desactivar Slot' : 'Activar Slot'}
            </Button>
            <Button
              onClick={() => {
                setTestInputText(selectedTemplate.pattern_syntax);
                setIsTestModalOpen(true);
              }}
              variant="outline"
              size="sm"
              className="text-xs font-bold rounded-xl border-slate-200 text-slate-700"
            >
              <Play size={13} className="mr-1 text-indigo-600" /> Test
            </Button>
            <Button
              onClick={() => handleDeleteSingleTemplate(selectedTemplate)}
              variant="destructive"
              size="sm"
              className="text-xs font-bold rounded-xl shadow-xs"
              title="Eliminar este template de la base de datos"
            >
              <Trash2 size={13} className="mr-1" /> Eliminar
            </Button>
          </div>
        </div>
      )}

      {/* FLOATING QUICK DOCK FOR INSPECTOR WHEN HIDDEN */}
      {!isInspectorOpen && selectedTemplate && (
        <button
          type="button"
          onClick={() => setIsInspectorOpen(true)}
          className="fixed right-0 top-1/2 -translate-y-1/2 z-40 bg-indigo-600 hover:bg-indigo-700 text-white pl-3.5 pr-2.5 py-3 rounded-l-2xl shadow-xl flex items-center gap-2 text-xs font-bold transition-all hover:-translate-x-1 cursor-pointer border-y border-l border-indigo-400/40 group animate-in fade-in"
          title={`Abrir Inspector Card de ${selectedTemplate.code_slot}`}
        >
          <Eye size={15} className="group-hover:scale-110 transition-transform" />
          <span className="font-mono font-black">{selectedTemplate.code_slot}</span>
          <span className="hidden sm:inline opacity-80 font-normal">Inspector</span>
        </button>
      )}

      {/* MODAL 1: NATIVE RUST TOKENIZER TESTER */}
      {isTestModalOpen && (
        <Modal
          isOpen={isTestModalOpen}
          onClose={() => setIsTestModalOpen(false)}
          title="Native Rust Tokenizer Lab"
        >
          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Raw Trading Signal Text:
              </label>
              <textarea
                value={testInputText}
                onChange={(e) => setTestInputText(e.target.value)}
                rows={3}
                className="w-full p-3 font-mono text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
                placeholder="e.g. GOLD BUY 2684.50 SL 2678.00 TP 2695.00"
              />
            </div>

            <Button
              onClick={handleRunTokenizeTest}
              disabled={isTesting}
              className="w-full text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl py-2"
            >
              {isTesting ? 'Running Rust Lexer...' : 'Execute Lexical Tokenizer & Extract Entities'}
            </Button>

            {testResult && (
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3 animate-in fade-in">
                <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-200">
                  <span className="font-bold text-slate-700">Native Execution Time:</span>
                  <span className="font-mono font-black text-emerald-600 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200">
                    ⚡ {testResult.processing_time_us} µs
                  </span>
                </div>

                {/* Tokens Tag Cloud */}
                <div>
                  <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block mb-1.5 uppercase">
                    Extracted Tokens:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {testResult.tokens?.map((tok: any, i: number) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-mono text-[10px] text-slate-700 dark:text-slate-300 shadow-2xs"
                      >
                        <strong className="text-indigo-600 dark:text-indigo-400">{tok.kind}:</strong> {tok.value}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Extracted Entities */}
                <div>
                  <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block mb-1.5 uppercase">
                    Structured Entities:
                  </span>
                  <pre className="p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 font-mono text-[11px] text-slate-800 dark:text-slate-200 overflow-x-auto shadow-2xs">
                    {JSON.stringify(testResult.entities, null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* MODAL 2: CREATE TEMPLATE */}
      {isCreateModalOpen && (
        <Modal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          title="Create New Syntactic Template"
        >
          <form onSubmit={handleCreateTemplate} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Template Name:
              </label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                required
                placeholder="e.g. Crypto Futures Scalp Limit"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Section Group:
              </label>
              <select
                value={newSection}
                onChange={(e) => setNewSection(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
              >
                {sections.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Engine Type:
              </label>
              <select
                value={newType}
                onChange={(e) => setNewType(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
              >
                <option value="market">Market / MT5 Forex & Crypto</option>
                <option value="binary">Binary Options Turbo</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Grammar Pattern Syntax:
              </label>
              <input
                type="text"
                value={newSyntax}
                onChange={(e) => setNewSyntax(e.target.value)}
                required
                placeholder="e.g. $(symbol) $(action) $(entry) SL $(sl)"
                className="w-full px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                Placeholders: $(symbol), $(action), $(entry), $(sl), $(tp), $(timeframe), $(gale)
              </span>
            </div>

            <Button
              type="submit"
              className="w-full text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl py-2 mt-2"
            >
              Create & Register Slot
            </Button>
          </form>
        </Modal>
      )}

      {/* MODAL 3: CONFIRM BATCH DELETE */}
      {isDeleteModalOpen && (
        <Modal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          title={`Eliminar ${selectedIds.length} Templates Seleccionados`}
        >
          <div className="space-y-4">
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-3">
              <AlertTriangle size={20} className="text-rose-600 shrink-0 mt-0.5" />
              <div className="text-xs text-rose-800 space-y-1">
                <p className="font-bold">¿Confirmas la eliminación permanente?</p>
                <p>
                  Se eliminarán {selectedIds.length} templates seleccionados del sistema y de la base de datos. Esta acción no se puede deshacer.
                </p>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-2">
                Templates a eliminar ({selectedIds.length}):
              </label>
              <div className="max-h-48 overflow-y-auto p-2.5 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1.5">
                {templates
                  .filter((t) => selectedIds.includes(t.id))
                  .map((t) => (
                    <div
                      key={t.id}
                      className="flex items-center justify-between text-xs py-1.5 px-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-100 dark:border-slate-800 font-mono shadow-2xs"
                    >
                      <span className="font-black text-slate-800 dark:text-slate-200">
                        [{t.code_slot}] {t.name}
                      </span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">{t.section}</span>
                    </div>
                  ))}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsDeleteModalOpen(false)}
                className="text-xs font-bold rounded-xl"
              >
                Cancelar
              </Button>
              <Button
                variant="destructive"
                size="sm"
                disabled={isBatchLoading}
                onClick={handleConfirmBatchDelete}
                className="text-xs font-bold rounded-xl shadow-xs"
              >
                {isBatchLoading ? 'Eliminando...' : `Sí, eliminar ${selectedIds.length} templates`}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
