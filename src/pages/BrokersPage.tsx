import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/common/Card';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { Switch } from '@/components/common/Switch';
import { Modal } from '@/components/common/Modal';
import { Input } from '@/components/common/Input';
import {
  getBrokers,
  getAvailableBrokers,
  connectBroker,
  toggleBroker,
  deleteBroker,
  reconnectBroker,
} from '@/services/rustApi';
import { Plus, Download, Trash2, Power, RefreshCw, AlertCircle, CheckCircle, ShieldCheck } from 'lucide-react';

export default function BrokersPage() {
  const [connectedBrokers, setConnectedBrokers] = useState<any[]>([]);
  const [availableBrokers, setAvailableBrokers] = useState<any[]>([]);
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);
  const [selectedBrokerCode, setSelectedBrokerCode] = useState('quotex');
  const [accountName, setAccountName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [credentialsPassword, setCredentialsPassword] = useState('');
  const [accountMode, setAccountMode] = useState('PRACTICE');
  const [server, setServer] = useState('');
  const [loading, setLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const loadData = async () => {
    try {
      const [connected, available] = await Promise.all([
        getBrokers(),
        getAvailableBrokers(),
      ]);
      setConnectedBrokers(connected);
      setAvailableBrokers(available);
    } catch (err) {
      console.error('Error fetching brokers:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openConnectModal = (code: string) => {
    setSelectedBrokerCode(code);
    setAccountName(`${code.toUpperCase()} Trading Account`);
    setIsConnectModalOpen(true);
  };

  const handleConnectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setActionMessage(null);
    try {
      const payload = {
        broker: selectedBrokerCode,
        account_name: accountName || `${selectedBrokerCode.toUpperCase()} Account`,
        account_mode: accountMode,
        credentials: {
          email: accountNumber,
          login: accountNumber,
          password: credentialsPassword,
          server: server || undefined,
        },
        currency: 'USD',
        server: server || undefined,
      };

      await connectBroker(payload);
      setIsConnectModalOpen(false);
      setActionMessage(`Account for ${selectedBrokerCode.toUpperCase()} connected successfully!`);
      // Reset form
      setAccountNumber('');
      setCredentialsPassword('');
      setServer('');
      await loadData();
    } catch (err: any) {
      alert(`Error connecting broker: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (account: any) => {
    try {
      await toggleBroker(account.id);
      await loadData();
    } catch (err: any) {
      alert(`Error toggling account state: ${err.message}`);
    }
  };

  const handleReconnect = async (account: any) => {
    try {
      await reconnectBroker(account.id);
      alert(`Reconnected to ${account.account_name} (${account.broker.toUpperCase()}) successfully!`);
      await loadData();
    } catch (err: any) {
      alert(`Reconnect error: ${err.message}`);
    }
  };

  const handleDelete = async (account: any) => {
    if (!window.confirm(`Are you sure you want to remove account "${account.account_name}"?`)) {
      return;
    }
    try {
      await deleteBroker(account.id);
      await loadData();
    } catch (err: any) {
      alert(`Error removing account: ${err.message}`);
    }
  };

  return (
    <div className="p-6 space-y-8 max-w-[1700px] mx-auto">
      <div>
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Connected Brokers & Accounts</h1>
            <p className="text-slate-500 mt-1">Multi-tenant active trading accounts, balance sync and execution gateways</p>
          </div>
          <Button onClick={() => openConnectModal('quotex')} className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold">
            <Plus size={16} /> Connect Account
          </Button>
        </div>

        {actionMessage && (
          <div className="mb-6 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-700 dark:text-emerald-400 text-xs flex items-center gap-2">
            <CheckCircle size={16} className="shrink-0 text-emerald-500" />
            <span>{actionMessage}</span>
          </div>
        )}
        
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {connectedBrokers.map((account) => (
            <Card key={account.id} className="border border-slate-200/90 dark:border-slate-800 shadow-sm relative overflow-hidden">
              <div className={`h-1.5 w-full ${account.is_active ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'}`} />
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div>
                  <CardTitle className="text-lg font-bold">{account.account_name}</CardTitle>
                  <p className="text-xs uppercase tracking-wider text-slate-400 font-mono mt-0.5">{account.broker}</p>
                </div>
                <Switch 
                  checked={account.is_active} 
                  onCheckedChange={() => handleToggle(account)} 
                />
              </CardHeader>
              <CardContent className="space-y-3 pt-2">
                <div className="flex justify-between items-center py-1 border-b border-slate-100 dark:border-slate-800 text-xs">
                  <span className="text-slate-500">Mode</span>
                  <Badge variant={account.account_mode === 'REAL' ? 'default' : 'secondary'} className={account.account_mode === 'REAL' ? 'bg-amber-500 text-white' : ''}>
                    {account.account_mode}
                  </Badge>
                </div>

                <div className="flex justify-between items-center py-1 border-b border-slate-100 dark:border-slate-800 text-xs">
                  <span className="text-slate-500">Balance</span>
                  <span className="font-extrabold text-sm text-slate-900 dark:text-white font-mono">
                    ${Number(account.balance || 0).toFixed(2)} {account.currency || 'USD'}
                  </span>
                </div>

                <div className="flex justify-between items-center py-1 text-xs">
                  <span className="text-slate-500">Account / Server</span>
                  <span className="font-mono text-slate-700 dark:text-slate-300">
                    {account.account_number || account.server || 'Direct'}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 pt-1 text-[11px] text-slate-400">
                  <ShieldCheck size={13} className="text-emerald-500" />
                  <span>Fernet encrypted credentials at rest</span>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between bg-slate-50 dark:bg-slate-900/60 p-3 border-t border-slate-100 dark:border-slate-800">
                <Button 
                  onClick={() => handleReconnect(account)} 
                  variant="outline" 
                  size="sm" 
                  className="gap-1.5 text-xs text-slate-700 dark:text-slate-300"
                >
                  <Power size={13} /> Sync / Reconnect
                </Button>
                <Button 
                  onClick={() => handleDelete(account)} 
                  variant="ghost" 
                  size="sm" 
                  className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30 gap-1.5 text-xs"
                >
                  <Trash2 size={13} /> Remove
                </Button>
              </CardFooter>
            </Card>
          ))}

          {connectedBrokers.length === 0 && (
            <div className="col-span-full py-12 text-center border-2 border-dashed rounded-2xl border-slate-200 dark:border-slate-800 bg-slate-50/50">
              <p className="text-slate-600 font-semibold">No brokers connected for your tenant account yet.</p>
              <p className="text-slate-400 text-xs mt-1">Select an integration below to connect MetaTrader 5 or Binary Options.</p>
            </div>
          )}
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-bold tracking-tight mb-4">Supported Broker Integrations</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {availableBrokers.map((broker) => (
            <Card key={broker.code} className="bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-bold flex items-center justify-between">
                  <span>{broker.name}</span>
                  <Badge variant="outline" className="text-[10px] uppercase font-mono">
                    {broker.code}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-xs text-slate-500 leading-relaxed min-h-[36px]">
                  {broker.notes || `Direct high-frequency adapter for ${broker.name}.`}
                </p>
                <div className="flex gap-2 text-[11px] text-slate-600 font-semibold">
                  <span className="px-2 py-0.5 bg-white dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700">
                    {broker.market_types}
                  </span>
                </div>
                <Button 
                  onClick={() => openConnectModal(broker.code)} 
                  variant="outline" 
                  className="w-full gap-2 text-xs font-bold hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200"
                >
                  <Download size={14} /> Connect {broker.name}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <Modal isOpen={isConnectModalOpen} onClose={() => setIsConnectModalOpen(false)} title={`Connect ${selectedBrokerCode.toUpperCase()} Account`}>
        <form onSubmit={handleConnectSubmit} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Broker Gateway</label>
            <select
              value={selectedBrokerCode}
              onChange={(e) => setSelectedBrokerCode(e.target.value)}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm"
            >
              <option value="quotex">Quotex (Binary Options)</option>
              <option value="pocketoption">PocketOption (Binary Options)</option>
              <option value="iqoption">IQ Option (Binary / Digital)</option>
              <option value="mt5">MetaTrader 5 (Wine Socket Gateway)</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Account Alias / Name</label>
            <Input 
              required
              value={accountName} 
              onChange={(e) => setAccountName(e.target.value)} 
              placeholder="e.g. My Quotex Live" 
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Account Mode</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                <input 
                  type="radio" 
                  name="accountMode" 
                  value="PRACTICE" 
                  checked={accountMode === 'PRACTICE'} 
                  onChange={(e) => setAccountMode(e.target.value)} 
                />
                PRACTICE / DEMO
              </label>
              <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                <input 
                  type="radio" 
                  name="accountMode" 
                  value="REAL" 
                  checked={accountMode === 'REAL'} 
                  onChange={(e) => setAccountMode(e.target.value)} 
                />
                REAL MONEY
              </label>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              {selectedBrokerCode === 'mt5' ? 'MT5 Account Login (Number)' : 'Broker Login Email / User'}
            </label>
            <Input 
              required
              value={accountNumber} 
              onChange={(e) => setAccountNumber(e.target.value)} 
              placeholder={selectedBrokerCode === 'mt5' ? 'e.g. 90508108' : 'user@example.com'} 
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Password / API Secret</label>
            <Input 
              required
              type="password" 
              value={credentialsPassword} 
              onChange={(e) => setCredentialsPassword(e.target.value)} 
              placeholder="••••••••" 
            />
          </div>

          {selectedBrokerCode === 'mt5' && (
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">MT5 Broker Server</label>
              <Input 
                value={server} 
                onChange={(e) => setServer(e.target.value)} 
                placeholder="e.g. MEXAtlantic-Demo" 
              />
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button type="button" variant="outline" onClick={() => setIsConnectModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold">
              {loading ? 'Connecting...' : 'Save & Connect'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
