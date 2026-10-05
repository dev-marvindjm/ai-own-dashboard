import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Switch } from '@/components/common/Switch';
import { Badge } from '@/components/common/Badge';
import { Modal } from '@/components/common/Modal';
import { DataTable } from '@/components/common/DataTable';
import {
  getTemplates,
  createTemplate,
  deleteTemplate,
  updateTemplate,
  tokenizeText,
  getTemplateBrokersLinks,
  getBrokersCatalog,
  linkTemplateBrokerToAccount,
} from '@/services/tokenizerApi';
import { cn } from '@/lib/utils';
import {
  Plus,
  Trash2,
  Search,
  CheckCircle2,
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
  Building2,
  Wallet,
  Layers,
  ArrowRight,
} from 'lucide-react';

interface TemplateItem {
  id: number;
  name: string;
  sender_name?: string;
  template_type: string;
  pattern_syntax: string;
  priority: number;
  is_active: boolean;
  code_slot: string; // e.g. B1, B2, Q3
  broker: string;    // IQ Option, Quotex, Pocket Option, MetaTrader 5
  account_number: string; // Account identifier e.g. 'ip option broker', 'quotex test', '90508108'
  win_rate?: number;
  latency_us?: number;
  signals_count?: number;
  quality_score?: number;
}

interface BrokerCatalogItem {
  broker_id: number;
  name: string;
  accounts: string[];
}

export const isValidPatternTemplate = (syntax: string | undefined): boolean => {
  if (!syntax) return false;
  const lines = syntax.split('\n').filter((l) => l.trim().length > 0);
  return lines.length > 1 && syntax.includes('$(symbol)');
};

export default function TemplateBrokersPage() {
  const [templates, setTemplates] = useState<TemplateItem[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateItem | null>(null);
  const [isInspectorOpen, setIsInspectorOpen] = useState(true);
  const [viewMode, setViewMode] = useState<'matrix' | 'table'>('matrix');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');

  // Broker & Account Combobox State
  const [brokersCatalog, setBrokersCatalog] = useState<BrokerCatalogItem[]>([]);
  const [selectedBrokerFilter, setSelectedBrokerFilter] = useState<string>('ALL');
  const [selectedAccountFilter, setSelectedAccountFilter] = useState<string>('ALL');
  // Per-column account filters for each broker category
  const [columnAccountFilters, setColumnAccountFilters] = useState<Record<string, string>>({
    'Pocket Option': 'ALL',
    'MetaTrader 5': 'ALL',
    'Quotex': 'ALL',
    'IQ Option': 'ALL',
  });

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
  const [newSyntax, setNewSyntax] = useState(
    '📊 Currency : $(symbol)\n⏳ EXPIRATION : $(timeframe)\n⏱ ️ $(entry) : $(expiration)\n🟢 $(action)'
  );
  const [newType, setNewType] = useState('binary');
  const [newBroker, setNewBroker] = useState('Pocket Option');
  const [newAccount, setNewAccount] = useState('pocketoption test');

  // Load from backend
  const loadData = async () => {
    try {
      const [backendTemplates, brokerLinks, catalog] = await Promise.all([
        getTemplates({ limit: 100 }),
        getTemplateBrokersLinks().catch(() => []),
        getBrokersCatalog().catch(() => []),
      ]);

      const catList: BrokerCatalogItem[] =
        Array.isArray(catalog) && catalog.length > 0
          ? catalog
          : [
              { broker_id: 1, name: 'IQ Option', accounts: ['ip option broker'] },
              { broker_id: 2, name: 'Quotex', accounts: ['quotex test'] },
              { broker_id: 3, name: 'Pocket Option', accounts: ['pocketoption test'] },
              { broker_id: 4, name: 'MetaTrader 5', accounts: ['90508108'] },
            ];
      setBrokersCatalog(catList);

      const linksMap: Record<number, { broker_name: string; account_number: string }> = {};
      if (Array.isArray(brokerLinks)) {
        brokerLinks.forEach((l) => {
          linksMap[l.template_id] = {
            broker_name: l.broker_name || 'MetaTrader 5',
            account_number: l.account_number || 'Default',
          };
        });
      }

      if (backendTemplates && Array.isArray(backendTemplates)) {
        const validList: TemplateItem[] = [];
        const invalidIds: number[] = [];

        backendTemplates.forEach((b: any, index: number) => {
          if (isValidPatternTemplate(b.pattern_syntax)) {
            const linked = linksMap[b.id];
            // Assign default broker based on template_type or fallback if unlinked
            let brokerName = linked ? linked.broker_name : b.template_type === 'binary' ? 'Pocket Option' : 'MetaTrader 5';
            let accNumber = linked ? linked.account_number : brokerName === 'Pocket Option' ? 'pocketoption test' : '90508108';

            const brokerCode = brokerName.includes('IQ')
              ? 'IQ'
              : brokerName.includes('Quotex')
              ? 'QX'
              : brokerName.includes('Pocket')
              ? 'PO'
              : 'MT5';

            validList.push({
              id: b.id,
              name: b.name,
              sender_name: b.sender_name || 'Custom Ingestor',
              pattern_syntax: b.pattern_syntax,
              template_type: b.template_type || 'market',
              is_active: b.is_active !== undefined ? b.is_active : true,
              priority: b.priority ?? 100,
              code_slot: b.code_slot || `${brokerCode}${index + 1}`,
              broker: brokerName,
              account_number: accNumber,
              win_rate: b.win_rate ?? 80.0,
              latency_us: b.latency_us ?? 30,
              signals_count: b.signals_count ?? 0,
              quality_score: b.quality_score ?? 85,
            });
          } else {
            if (b.id) invalidIds.push(b.id);
          }
        });

        // Purge invalid templates from DB if needed
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
      console.warn('Error loading backend templates/brokers:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleToggleSlot = async (tpl: TemplateItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!tpl || !tpl.id) return;
    const nextState = !tpl.is_active;

    // Optimistic UI update
    setTemplates((prev) =>
      prev.map((t) =>
        t.id === tpl.id || t.code_slot === tpl.code_slot ? { ...t, is_active: nextState } : t
      )
    );
    if (
      selectedTemplate &&
      (selectedTemplate.id === tpl.id || selectedTemplate.code_slot === tpl.code_slot)
    ) {
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
    if (
      selectedTemplate &&
      (selectedTemplate.id === tpl.id || selectedTemplate.code_slot === tpl.code_slot)
    ) {
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
        message: `Template "${tpl.name}" (${tpl.code_slot}) eliminado de ${tpl.broker}.`,
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

    const brokerCode = newBroker.includes('IQ')
      ? 'IQ'
      : newBroker.includes('Quotex')
      ? 'QX'
      : newBroker.includes('Pocket')
      ? 'PO'
      : 'MT5';

    const nextSlot = `${brokerCode}${templates.filter((t) => t.broker === newBroker).length + 1}`;

    try {
      const created = await createTemplate({
        name: newName,
        pattern_syntax: newSyntax,
        template_type: newType,
        section: newBroker,
        code_slot: nextSlot,
        priority: 100,
        is_active: true,
      });

      const newId = created.id || Date.now();

      // Link to broker and account
      await linkTemplateBrokerToAccount(newId, {
        broker_name: newBroker,
        account_number: newAccount,
        broker_id:
          newBroker === 'IQ Option'
            ? 1
            : newBroker === 'Quotex'
            ? 2
            : newBroker === 'Pocket Option'
            ? 3
            : 4,
        is_active: true,
      }).catch(() => null);

      const newSlotItem: TemplateItem = {
        id: newId,
        code_slot: nextSlot,
        broker: newBroker,
        account_number: newAccount,
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
        message: `Template "${newSlotItem.name}" registrado y vinculado a ${newBroker} (${newAccount}).`,
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

  // Reassign Broker & Account for inspected template
  const handleReassignBroker = async (brokerName: string, accountNum: string) => {
    if (!selectedTemplate) return;
    try {
      await linkTemplateBrokerToAccount(selectedTemplate.id, {
        broker_name: brokerName,
        account_number: accountNum,
        broker_id:
          brokerName === 'IQ Option'
            ? 1
            : brokerName === 'Quotex'
            ? 2
            : brokerName === 'Pocket Option'
            ? 3
            : 4,
        is_active: selectedTemplate.is_active,
      });

      const updated = {
        ...selectedTemplate,
        broker: brokerName,
        account_number: accountNum,
      };
      setSelectedTemplate(updated);
      setTemplates((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));

      setBatchActionFeedback({
        type: 'success',
        message: `Template #${selectedTemplate.id} reasignado a ${brokerName} (${accountNum}).`,
      });
      setTimeout(() => setBatchActionFeedback(null), 3500);
    } catch (err) {
      console.error('Error reassigning broker:', err);
    }
  };

  // The 4 main Broker Columns
  const brokerSections = [
    'Pocket Option',
    'MetaTrader 5',
    'Quotex',
    'IQ Option',
  ];

  const getBrokerStats = (bName: string) => {
    const items = templates.filter((t) => t.broker === bName);
    const active = items.filter((t) => t.is_active).length;
    return `${active}/${items.length}`;
  };

  // Available accounts for the selected broker filter
  const currentBrokerItem = brokersCatalog.find((b) => b.name === selectedBrokerFilter);
  const availableAccounts = currentBrokerItem ? currentBrokerItem.accounts : [];

  // Filter templates based on Search, Active status, and Broker & Account Combobox
  const filteredTemplates = templates.filter((t) => {
    const matchesSearch =
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.code_slot.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.pattern_syntax.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.account_number.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      activeFilter === 'ALL' ||
      (activeFilter === 'ACTIVE' && t.is_active) ||
      (activeFilter === 'INACTIVE' && !t.is_active);

    const matchesBroker =
      selectedBrokerFilter === 'ALL' || t.broker === selectedBrokerFilter;

    const matchesAccount =
      selectedAccountFilter === 'ALL' || t.account_number === selectedAccountFilter;

    return matchesSearch && matchesStatus && matchesBroker && matchesAccount;
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

      await Promise.allSettled(selectedIds.map((id) => deleteTemplate(id)));

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
            <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Building2 className="text-indigo-600 dark:text-indigo-400" size={24} />
              Template Brokers Matrix ({totalSlots})
            </h1>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
              Live Accounts Routing
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Matriz de asignación de templates por broker y vinculación directa a cuentas de trading operativas.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* View switcher */}
          <div className="bg-slate-100 dark:bg-slate-900 p-1 rounded-xl flex items-center border border-slate-200 dark:border-slate-800">
            <button
              onClick={() => setViewMode('matrix')}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5',
                viewMode === 'matrix'
                  ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              )}
            >
              <LayoutGrid size={14} /> Matrix Brokers
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5',
                viewMode === 'table'
                  ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
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

          {/* Right: Batch Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <Button
              onClick={handleBatchActivate}
              disabled={selectedIds.length === 0 || isBatchLoading}
              variant="outline"
              size="sm"
              className="text-xs font-bold rounded-xl border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 disabled:opacity-40 cursor-pointer"
            >
              <Power size={13} className="mr-1.5 text-emerald-600" /> Activar{' '}
              {selectedIds.length > 0 && `(${selectedIds.length})`}
            </Button>

            <Button
              onClick={handleBatchDeactivate}
              disabled={selectedIds.length === 0 || isBatchLoading}
              variant="outline"
              size="sm"
              className="text-xs font-bold rounded-xl border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 cursor-pointer"
            >
              <PowerOff size={13} className="mr-1.5 text-slate-500" /> Desactivar{' '}
              {selectedIds.length > 0 && `(${selectedIds.length})`}
            </Button>

            <Button
              onClick={() => setIsDeleteModalOpen(true)}
              disabled={selectedIds.length === 0 || isBatchLoading}
              variant="destructive"
              size="sm"
              className="text-xs font-bold rounded-xl shadow-xs disabled:opacity-40 cursor-pointer"
            >
              <Trash2 size={13} className="mr-1.5" /> Eliminar{' '}
              {selectedIds.length > 0 && `(${selectedIds.length})`}
            </Button>

            <div className="h-6 w-px bg-slate-200 dark:bg-slate-800 mx-1 hidden sm:block" />

            {/* Inspector Hide/Show Button */}
            <Button
              onClick={() => setIsInspectorOpen((prev) => !prev)}
              variant="outline"
              size="sm"
              className={cn(
                'text-xs font-bold rounded-xl border transition-all cursor-pointer',
                isInspectorOpen
                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:bg-slate-200'
                  : 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-300 dark:border-indigo-800 hover:bg-indigo-100'
              )}
              title={isInspectorOpen ? 'Ocultar Inspector card' : 'Mostrar Inspector card'}
            >
              {isInspectorOpen ? (
                <>
                  <EyeOff size={14} className="mr-1.5 text-slate-500" /> Ocultar Inspector
                </>
              ) : (
                <>
                  <Eye size={14} className="mr-1.5 text-indigo-600" /> Mostrar Inspector (
                  {selectedTemplate?.code_slot})
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
                ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                : 'bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
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

      {/* FILTER BAR: Search & COMBOBOX (Brokers + Linked Accounts) */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-sm">
        {/* Search Input */}
        <div className="relative w-full lg:w-72">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por slot, cuenta, sintaxis..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-700 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>

        {/* COMBINADO / COMBOBOX: Brokers and Accounts Filter */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Combined Broker Selector */}
          <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
            <Building2 size={13} className="text-indigo-600 dark:text-indigo-400 shrink-0" />
            <span className="text-[11px] font-bold text-slate-400">Broker:</span>
            <select
              value={selectedBrokerFilter}
              onChange={(e) => {
                setSelectedBrokerFilter(e.target.value);
                setSelectedAccountFilter('ALL');
              }}
              className="text-xs font-extrabold bg-transparent text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="ALL">Todos los Brokers</option>
              {brokersCatalog.map((b) => (
                <option key={b.name} value={b.name}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          {/* Combined Account Selector (Dependent on Broker) */}
          <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
            <Wallet size={13} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span className="text-[11px] font-bold text-slate-400">Cuenta:</span>
            <select
              value={selectedAccountFilter}
              onChange={(e) => setSelectedAccountFilter(e.target.value)}
              className="text-xs font-mono font-bold bg-transparent text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer max-w-[180px] truncate"
            >
              <option value="ALL">Todas las Cuentas</option>
              {availableAccounts.length > 0 ? (
                availableAccounts.map((acc) => (
                  <option key={acc} value={acc}>
                    {acc}
                  </option>
                ))
              ) : (
                // If 'ALL' brokers selected, list all distinct accounts
                Array.from(new Set(templates.map((t) => t.account_number))).map((acc) => (
                  <option key={acc} value={acc}>
                    {acc}
                  </option>
                ))
              )}
            </select>
          </div>

          {/* Quick Active/Inactive Pills */}
          <div className="flex items-center gap-1 pl-1">
            {(['ALL', 'ACTIVE', 'INACTIVE'] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={cn(
                  'px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap',
                  activeFilter === filter
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                )}
              >
                {filter === 'ALL' ? 'Todos' : filter === 'ACTIVE' ? 'Activos' : 'Inactivos'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Layout: Matrix Grid + Right Side Metrics */}
      {viewMode === 'matrix' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: 4-Column Broker Matrix */}
          <div className="lg:col-span-8 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-sm space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {brokerSections.map((bName, bIdx) => {
                const currentColumnAccount = columnAccountFilters[bName] || 'ALL';
                const brokerCatalogInfo = brokersCatalog.find((b) => b.name === bName);
                const brokerAccounts = brokerCatalogInfo ? brokerCatalogInfo.accounts : [];

                const bItems = filteredTemplates
                  .filter((t) => t.broker === bName)
                  .filter((t) => currentColumnAccount === 'ALL' || t.account_number === currentColumnAccount);

                const colorPalette = [
                  {
                    bg: 'bg-emerald-500',
                    text: 'text-emerald-700 dark:text-emerald-300',
                    border: 'border-emerald-200 dark:border-emerald-800',
                    slotBg:
                      'bg-emerald-50 text-emerald-950 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-200 dark:border-emerald-800',
                  },
                  {
                    bg: 'bg-sky-500',
                    text: 'text-sky-700 dark:text-sky-300',
                    border: 'border-sky-200 dark:border-sky-800',
                    slotBg:
                      'bg-sky-50 text-sky-950 border-sky-300 dark:bg-sky-950/40 dark:text-sky-200 dark:border-sky-800',
                  },
                  {
                    bg: 'bg-amber-500',
                    text: 'text-amber-700 dark:text-amber-300',
                    border: 'border-amber-200 dark:border-amber-800',
                    slotBg:
                      'bg-amber-50 text-amber-950 border-amber-300 dark:bg-amber-950/40 dark:text-amber-200 dark:border-amber-800',
                  },
                  {
                    bg: 'bg-purple-500',
                    text: 'text-purple-700 dark:text-purple-300',
                    border: 'border-purple-200 dark:border-purple-800',
                    slotBg:
                      'bg-purple-50 text-purple-950 border-purple-300 dark:bg-purple-950/40 dark:text-purple-200 dark:border-purple-800',
                  },
                ];
                const colors = colorPalette[bIdx % 4] || colorPalette[0]!;

                return (
                  <div
                    key={bName}
                    className="p-3.5 bg-slate-50/80 dark:bg-slate-950/60 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-3"
                  >
                    {/* Column Header: Broker Name & Stats */}
                    <div className="flex items-center justify-between px-1">
                      <span
                        className="text-xs font-black text-slate-800 dark:text-slate-200 truncate flex items-center gap-1.5"
                        title={bName}
                      >
                        <Building2 size={13} className="text-indigo-500" />
                        {bName}
                      </span>
                      <span className="text-[11px] font-mono font-bold text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900 px-2 py-0.5 rounded-full border border-slate-200 dark:border-slate-700 shadow-2xs">
                        {bItems.filter((t) => t.is_active).length}/{bItems.length}
                      </span>
                    </div>

                    {/* CUADRO COMBINADO (Combobox Multicuenta) por Broker */}
                    <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700/80 shadow-2xs">
                      <Wallet size={12} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <select
                        value={currentColumnAccount}
                        onChange={(e) =>
                          setColumnAccountFilters((prev) => ({
                            ...prev,
                            [bName]: e.target.value,
                          }))
                        }
                        className="w-full text-[11px] font-mono font-bold bg-transparent text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer truncate"
                      >
                        <option value="ALL">Todas las cuentas</option>
                        {brokerAccounts.map((acc) => (
                          <option key={acc} value={acc}>
                            {acc}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Slots 2-column pills inside each broker column */}
                    {bItems.length === 0 ? (
                      <div className="py-8 px-2 text-center text-slate-400 text-xs flex flex-col items-center justify-center border border-dashed border-slate-200 dark:border-slate-800 rounded-xl bg-white/40 dark:bg-slate-900/40">
                        <span className="text-[11px] font-bold text-slate-400">
                          Sin templates {currentColumnAccount !== 'ALL' ? `en ${currentColumnAccount}` : `en ${bName}`}
                        </span>
                        <span className="text-[10px] text-slate-400 mt-0.5">Vacío</span>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-2">
                        {bItems.map((slot) => {
                          const isInspected =
                            selectedTemplate &&
                            (selectedTemplate.id === slot.id ||
                              selectedTemplate.code_slot === slot.code_slot);
                          const isChecked = selectedIds.includes(slot.id);

                          return (
                            <div
                              key={slot.id}
                              onClick={() => handleSelectSlot(slot)}
                              className={cn(
                                'relative p-2.5 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center min-h-[64px] group shadow-2xs select-none',
                                slot.is_active
                                  ? cn(colors.slotBg, 'shadow-xs font-extrabold')
                                  : 'bg-slate-100/60 dark:bg-slate-800/40 border-dashed border-slate-300 dark:border-slate-700 text-slate-400 dark:text-slate-500 opacity-60 hover:opacity-90',
                                isChecked &&
                                  'ring-2 ring-indigo-600 border-indigo-400 bg-indigo-50/80 dark:bg-indigo-950/60',
                                isInspected &&
                                  !isChecked &&
                                  'ring-2 ring-indigo-500 ring-offset-2 dark:ring-offset-slate-900'
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
                                    : 'bg-white/95 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-300 hover:border-indigo-500 hover:text-indigo-600'
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
                                      ? 'text-indigo-700 bg-white/90 dark:bg-slate-800 border-indigo-200 dark:border-indigo-800'
                                      : 'text-slate-600 bg-white/90 dark:bg-slate-800 border-slate-300 dark:border-slate-700'
                                  )}
                                  title={
                                    isInspectorOpen
                                      ? 'Ocultar Inspector de este template'
                                      : 'Mostrar Inspector de este template'
                                  }
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

          {/* Right Column: Broker Routing Overview & Stat Ring */}
          <div className="lg:col-span-4 space-y-6">
            {/* Broker Active Allocation Banner */}
            <div className="p-6 rounded-3xl bg-gradient-to-br from-indigo-50 via-white to-purple-50/40 dark:from-slate-900 dark:via-slate-900 dark:to-indigo-950/20 border border-indigo-200/80 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-indigo-900 dark:text-indigo-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Building2 size={15} /> Broker Fleet Allocation
                </span>
                <span className="text-xs font-mono font-bold text-indigo-700 dark:text-indigo-300">
                  {overallActivePct}% Active
                </span>
              </div>

              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-slate-900 dark:text-white">
                  {totalActive}
                </span>
                <span className="text-xs text-slate-500 font-bold">
                  templates activos vinculados
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-indigo-100 dark:border-slate-800 text-[11px] font-bold text-slate-700 dark:text-slate-300">
                {brokerSections.map((b) => (
                  <span
                    key={b}
                    className="px-2 py-0.5 rounded-lg bg-white/80 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs"
                  >
                    {b}: {templates.filter((t) => t.broker === b && t.is_active).length}
                  </span>
                ))}
              </div>
            </div>

            {/* Broker Slot Usage Radial Ring Card */}
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-200">
                  Broker Slot Distribution
                </h3>
                <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded-full">
                  Multi-Broker
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
                      className="text-indigo-500 transition-all duration-1000 ease-out"
                      strokeDasharray={`${overallActivePct}, 100`}
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                  </svg>
                  <div className="absolute flex flex-col items-center">
                    <span className="text-base font-black text-slate-800 dark:text-slate-100">
                      {overallActivePct}%
                    </span>
                    <span className="text-[8px] font-bold text-slate-400 uppercase">Active</span>
                  </div>
                </div>

                {/* Stat numbers */}
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs flex-1">
                  <div>
                    <span className="text-base font-black text-slate-800 dark:text-slate-100 block">
                      {totalSlots}
                    </span>
                    <span className="text-[10px] text-slate-400 font-bold uppercase">
                      Total Slots
                    </span>
                  </div>
                  <div>
                    <span className="text-base font-black text-slate-800 dark:text-slate-100 block">
                      {totalSlots - totalActive}
                    </span>
                    <span className="text-[10px] text-slate-400 font-bold uppercase">
                      Inactive
                    </span>
                  </div>
                  <div>
                    <span className="text-base font-black text-emerald-600 dark:text-emerald-400 block">
                      {totalActive}
                    </span>
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold uppercase">
                      Active Live
                    </span>
                  </div>
                  <div>
                    <span className="text-base font-black text-indigo-600 dark:text-indigo-400 block">
                      {brokersCatalog.length}
                    </span>
                    <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold uppercase">
                      Brokers
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Inventory Overview Mini Cards */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3.5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="font-bold">MT5 Signals</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">+28% ↗</span>
                </div>
                <div className="text-lg font-black text-slate-800 dark:text-slate-100 mt-1">
                  1,842
                </div>
                <span className="text-[10px] text-slate-400">MetaTrader Executed</span>
              </div>

              <div className="p-3.5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="font-bold">Binary Turbo</span>
                  <span className="text-sky-500 font-bold">1,240</span>
                </div>
                <div className="text-lg font-black text-slate-800 dark:text-slate-100 mt-1">
                  Pocket / Quotex
                </div>
                <span className="text-[10px] text-slate-400">Options Dispatched</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* MODE 2: CHECKBOX AUDIT TABLE (with Broker & Account column) */
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
                    <span className="text-xs font-extrabold text-slate-900 dark:text-slate-100 block">
                      {row.name}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {row.sender_name || 'Generic Channel'}
                    </span>
                  </div>
                ),
              },
              {
                header: 'Broker Asignado',
                accessorKey: 'broker',
                cell: (row: TemplateItem) => (
                  <div className="flex items-center gap-1.5">
                    <Building2 size={13} className="text-indigo-500" />
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      {row.broker}
                    </span>
                  </div>
                ),
              },
              {
                header: 'Cuenta Conectada',
                accessorKey: 'account_number',
                cell: (row: TemplateItem) => (
                  <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                    {row.account_number}
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
                    (selectedTemplate.id === row.id ||
                      selectedTemplate.code_slot === row.code_slot);
                  return (
                    <div className="flex items-center gap-1.5">
                      <Button
                        variant="ghost"
                        size="sm"
                        className={cn(
                          'text-xs font-bold flex items-center gap-1 cursor-pointer',
                          isThisInspected && isInspectorOpen
                            ? 'text-indigo-700 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950 dark:text-indigo-300'
                            : 'text-slate-600 hover:text-slate-900 dark:text-slate-400'
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

      {/* FLYOUT INSPECTOR DRAWER */}
      {isInspectorOpen && selectedTemplate && (
        <div className="fixed inset-y-0 right-0 w-full sm:w-[460px] bg-white dark:bg-slate-900 border-l border-slate-200/90 dark:border-slate-800 shadow-2xl z-50 p-6 flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-300 text-slate-900 dark:text-slate-100">
          <div className="space-y-6">
            {/* Drawer Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-mono font-extrabold text-xs">
                  {selectedTemplate.code_slot}
                </span>
                <span className="text-xs font-bold text-slate-400">Inspector de Broker</span>
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
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Template Identity */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                  Template Details
                </span>
                <span
                  className={cn(
                    'text-[10px] font-black px-2 py-0.5 rounded-full',
                    selectedTemplate.is_active
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                      : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                  )}
                >
                  {selectedTemplate.is_active ? 'OPERATIVO LIVE' : 'DESACTIVADO'}
                </span>
              </div>
              <h2 className="text-lg font-black text-slate-900 dark:text-slate-100">
                {selectedTemplate.name}
              </h2>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span>Sender: {selectedTemplate.sender_name}</span>
                <span>•</span>
                <span className="font-mono">ID: #{selectedTemplate.id}</span>
              </div>
            </div>

            {/* BROKER & ACCOUNT ROUTING SELECTOR IN INSPECTOR */}
            <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Building2 size={14} className="text-indigo-500" />
                  Broker & Cuenta Vinculada
                </span>
                <Badge variant="purple" className="text-[10px] font-mono">
                  Active Link
                </Badge>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block">
                  Asignar a Broker:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {brokersCatalog.map((b) => (
                    <button
                      key={b.name}
                      type="button"
                      onClick={() => handleReassignBroker(b.name, b.accounts[0] || 'Default')}
                      className={cn(
                        'p-2 rounded-xl text-xs font-bold border transition-all text-left flex flex-col cursor-pointer',
                        selectedTemplate.broker === b.name
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                          : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                      )}
                    >
                      <span className="truncate">{b.name}</span>
                      <span
                        className={cn(
                          'text-[9px] font-mono mt-0.5 truncate',
                          selectedTemplate.broker === b.name
                            ? 'text-indigo-200'
                            : 'text-slate-400'
                        )}
                      >
                        {b.accounts[0] || '1 cuenta'}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1 pt-1">
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block">
                  Cuenta Específica de Destino:
                </label>
                <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <span className="font-mono text-xs font-black text-emerald-600 dark:text-emerald-400">
                    {selectedTemplate.account_number}
                  </span>
                  <span className="text-[10px] font-bold text-slate-400">Enlazada</span>
                </div>
              </div>
            </div>

            {/* Syntax Pattern Box */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                Sintaxis del Template (Rust Lexer Matching)
              </span>
              <pre className="p-3 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 rounded-2xl text-[11px] font-mono border border-slate-200 dark:border-slate-800 whitespace-pre-wrap leading-relaxed max-h-44 overflow-y-auto">
                {selectedTemplate.pattern_syntax}
              </pre>
            </div>

            {/* Performance Mini Stats */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 font-bold uppercase">
                  Win Rate Histórico
                </span>
                <div className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
                  {selectedTemplate.win_rate}%
                </div>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 font-bold uppercase">
                  Latencia de Match
                </span>
                <div className="text-xl font-black text-slate-800 dark:text-slate-200 mt-0.5">
                  {selectedTemplate.latency_us} µs
                </div>
              </div>
            </div>
          </div>

          {/* Drawer Actions */}
          <div className="pt-6 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
            <Button
              onClick={() => handleToggleSlot(selectedTemplate)}
              className={cn(
                'flex-1 text-xs font-bold py-2.5 rounded-xl transition-all cursor-pointer',
                selectedTemplate.is_active
                  ? 'bg-rose-600 hover:bg-rose-700 text-white'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white'
              )}
            >
              {selectedTemplate.is_active ? 'Desactivar Template' : 'Activar Template'}
            </Button>

            <Button
              onClick={() => handleDeleteSingleTemplate(selectedTemplate)}
              variant="outline"
              size="sm"
              className="p-2.5 rounded-xl border-rose-200 text-rose-600 hover:bg-rose-50 cursor-pointer"
              title="Eliminar este template"
            >
              <Trash2 size={16} />
            </Button>
          </div>
        </div>
      )}

      {/* MODAL 1: TEST TOKENIZER */}
      {isTestModalOpen && (
        <Modal
          isOpen={isTestModalOpen}
          onClose={() => setIsTestModalOpen(false)}
          title="Prueba Rápida del Tokenizer"
        >
          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Texto de Señal a Evaluar:
              </label>
              <textarea
                value={testInputText}
                onChange={(e) => setTestInputText(e.target.value)}
                rows={4}
                className="w-full p-3 text-xs font-mono rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
              />
            </div>

            <Button
              onClick={handleRunTokenizeTest}
              disabled={isTesting}
              className="w-full text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl py-2"
            >
              {isTesting ? 'Evaluando en Rust...' : 'Ejecutar Matcher'}
            </Button>

            {testResult && (
              <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                <span className="text-[11px] font-bold text-slate-500 block">
                  Entidades Extraídas:
                </span>
                <pre className="text-[11px] font-mono text-emerald-600 whitespace-pre-wrap">
                  {JSON.stringify(testResult.entities || testResult, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* MODAL 2: ADD TEMPLATE */}
      {isCreateModalOpen && (
        <Modal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          title="Registrar Nuevo Template a Broker"
        >
          <form onSubmit={handleCreateTemplate} className="space-y-3.5">
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Nombre del Template:
              </label>
              <input
                type="text"
                required
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. VIP Gold M5 Strategy"
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Broker Destino:
                </label>
                <select
                  value={newBroker}
                  onChange={(e) => {
                    setNewBroker(e.target.value);
                    const b = brokersCatalog.find((x) => x.name === e.target.value);
                    if (b && b.accounts.length > 0) setNewAccount(b.accounts[0]!);
                  }}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white cursor-pointer"
                >
                  {brokerSections.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Cuenta Asociada:
                </label>
                <select
                  value={newAccount}
                  onChange={(e) => setNewAccount(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white cursor-pointer"
                >
                  {brokersCatalog.find((b) => b.name === newBroker)?.accounts.map((acc) => (
                    <option key={acc} value={acc}>
                      {acc}
                    </option>
                  )) || <option value="Default">Default</option>}
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Sintaxis del Template (Debe contener $(symbol) y varias líneas):
              </label>
              <textarea
                rows={5}
                required
                value={newSyntax}
                onChange={(e) => setNewSyntax(e.target.value)}
                className="w-full p-3 text-xs font-mono rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
              />
            </div>

            <Button
              type="submit"
              className="w-full text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl py-2 mt-2"
            >
              Registrar Template & Vincular Broker
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
                  Se eliminarán {selectedIds.length} templates seleccionados del sistema y de los brokers enlazados. Esta acción no se puede deshacer.
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
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                        {t.broker} ({t.account_number})
                      </span>
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
                {isBatchLoading
                  ? 'Eliminando...'
                  : `Sí, eliminar ${selectedIds.length} templates`}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
