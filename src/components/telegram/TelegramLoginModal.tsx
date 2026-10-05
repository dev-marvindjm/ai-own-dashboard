import React, { useState, useEffect } from 'react';
import {
  Send,
  Shield,
  Key,
  QrCode,
  Smartphone,
  Bot,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  X,
  LogOut,
  Sparkles,
  Info,
  Radio,
  Lock,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Badge } from '@/components/common/Badge';
import {
  TelegramSessionData,
  getStoredTelegramSession,
  saveTelegramSession,
  clearTelegramSession,
  sendTelegramPhoneCode,
  verifyTelegramCode,
  verifyTelegram2FAPassword,
  connectTelegramWithStringSession,
  connectTelegramWithBotToken,
  connectTelegramWithQr,
  connectTelegramDemoSession,
} from '@/services/telegramSessionService';
import { cn } from '@/lib/utils';

interface TelegramLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnected?: (session: TelegramSessionData) => void;
}

export function TelegramLoginModal({ isOpen, onClose, onConnected }: TelegramLoginModalProps) {
  const [activeTab, setActiveTab] = useState<'phone' | 'string' | 'bot' | 'qr' | 'demo'>('phone');
  const [session, setSession] = useState<TelegramSessionData | null>(getStoredTelegramSession());
  
  // Phone flow states
  const [phone, setPhone] = useState('+1 ');
  const [code, setCode] = useState('');
  const [password2FA, setPassword2FA] = useState('');
  const [step, setStep] = useState<'phone' | 'code' | '2fa' | 'success'>('phone');
  const [countdown, setCountdown] = useState(0);
  const [phoneCodeHash, setPhoneCodeHash] = useState<string | undefined>();
  
  // String / Bot flow states
  const [stringSession, setStringSession] = useState('');
  const [apiId, setApiId] = useState('');
  const [apiHash, setApiHash] = useState('');
  const [botToken, setBotToken] = useState('');

  // Status & error
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  useEffect(() => {
    setSession(getStoredTelegramSession());
  }, [isOpen]);

  useEffect(() => {
    let timer: any;
    if (countdown > 0) {
      timer = setInterval(() => setCountdown((c) => c - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [countdown]);

  if (!isOpen) return null;

  // Handle phone code request
  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || phone.length < 8) {
      setError('Por favor ingrese un número de teléfono válido con código de país (ej: +54 9 11...).');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const res = await sendTelegramPhoneCode(phone);
      if (res.success) {
        setPhoneCodeHash(res.phoneCodeHash);
        setStep('code');
        setCountdown(60);
        setInfoMessage('Código enviado directamente a su app de Telegram oficial.');
      } else {
        setError(res.message || 'Error al enviar código.');
      }
    } catch (err: any) {
      setError(err?.message || 'Fallo de conexión con Telegram.');
    } finally {
      setLoading(false);
    }
  };

  // Handle code verification
  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code || code.length < 4) {
      setError('Ingrese el código de 5 dígitos enviado por Telegram.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const res = await verifyTelegramCode(phone, code, phoneCodeHash);
      if (res.success) {
        if (res.needs2FA) {
          setStep('2fa');
          setInfoMessage('Esta cuenta tiene verificación en dos pasos (2FA). Ingrese su contraseña.');
        } else if (res.session) {
          setSession(res.session);
          setStep('success');
          onConnected?.(res.session);
        }
      } else {
        setError(res.error || 'Código incorrecto. Vuelva a intentarlo.');
      }
    } catch (err: any) {
      setError(err?.message || 'Error validando código.');
    } finally {
      setLoading(false);
    }
  };

  // Handle 2FA password verification
  const handleVerify2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password2FA) {
      setError('Ingrese su contraseña de 2FA de Telegram.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const res = await verifyTelegram2FAPassword(password2FA, phone);
      if (res.success && res.session) {
        setSession(res.session);
        setStep('success');
        onConnected?.(res.session);
      } else {
        setError(res.error || 'Contraseña 2FA incorrecta.');
      }
    } catch (err: any) {
      setError(err?.message || 'Error validando 2FA.');
    } finally {
      setLoading(false);
    }
  };

  // Handle StringSession connect
  const handleConnectStringSession = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await connectTelegramWithStringSession(stringSession, apiId, apiHash);
      if (res.success && res.session) {
        setSession(res.session);
        setStep('success');
        onConnected?.(res.session);
      } else {
        setError(res.error || 'Error al conectar StringSession.');
      }
    } catch (err: any) {
      setError(err?.message || 'Fallo de conexión.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Bot Token connect
  const handleConnectBot = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await connectTelegramWithBotToken(botToken);
      if (res.success && res.session) {
        setSession(res.session);
        setStep('success');
        onConnected?.(res.session);
      } else {
        setError(res.error || 'Token de bot inválido.');
      }
    } catch (err: any) {
      setError(err?.message || 'Fallo de conexión.');
    } finally {
      setLoading(false);
    }
  };

  // Handle QR scan connect
  const handleConnectQR = async () => {
    setError(null);
    setLoading(true);
    try {
      const newSession = await connectTelegramWithQr();
      setSession(newSession);
      setStep('success');
      onConnected?.(newSession);
    } catch (err: any) {
      setError(err?.message || 'Error escaneando QR.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Demo 1-click connect
  const handleDemoConnect = () => {
    const demo = connectTelegramDemoSession();
    setSession(demo);
    setStep('success');
    onConnected?.(demo);
  };

  // Disconnect session
  const handleDisconnect = () => {
    clearTelegramSession();
    setSession(null);
    setStep('phone');
    setCode('');
    setPassword2FA('');
    setError(null);
    setInfoMessage('Sesión de Telegram cerrada correctamente.');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden text-slate-100 flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-800/80 bg-slate-900/50 flex justify-between items-center relative">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
              <Send size={24} className="-ml-0.5 mt-0.5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-white">Inicio de Sesión en Telegram</h3>
                <Badge className="bg-sky-500/15 text-sky-400 border border-sky-500/30 text-[10px] font-bold">
                  Telethon MTProto
                </Badge>
              </div>
              <p className="text-xs text-slate-400">
                Conecta tu cuenta para recibir señales de trading con latencia ultra baja (&lt;35ms)
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Informative Floating Banner / Callout */}
        <div className="bg-sky-950/40 border-b border-sky-800/30 px-6 py-2.5 flex items-center justify-between gap-3 text-xs text-sky-300">
          <div className="flex items-center gap-2">
            <Sparkles size={14} className="text-sky-400 shrink-0" />
            <span>
              Conexión directa en la nube: La sesión escucha canales privados y grupos VIP de forma segura.
            </span>
          </div>
          <span className="font-mono text-[10px] bg-sky-500/20 px-2 py-0.5 rounded-full shrink-0 font-bold">
            TLS v1.3 MTProto
          </span>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Active Session Display */}
          {session ? (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 mt-0.5">
                    <CheckCircle size={20} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-white text-sm">
                        {session.firstName || 'Operador Conectado'}
                      </h4>
                      <Badge className="bg-emerald-500/20 text-emerald-300 border-0 text-[10px] font-bold">
                        🟢 EN LÍNEA
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {session.username} • {session.phone}
                    </p>
                    <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-2 font-mono">
                      <span>Latencia: {session.pingMs}ms</span>
                      <span>•</span>
                      <span>Canales activos: {session.activeChannelsCount}</span>
                      <span>•</span>
                      <span>Método: {session.authMethod}</span>
                    </div>
                  </div>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDisconnect}
                  className="border-rose-500/30 text-rose-400 hover:bg-rose-500/10 text-xs gap-1.5 h-8"
                >
                  <LogOut size={13} /> Desconectar
                </Button>
              </div>

              {/* Channels preview */}
              <div className="border border-slate-800 rounded-2xl p-4 bg-slate-950/50 space-y-2">
                <div className="flex justify-between items-center text-xs font-bold text-slate-300">
                  <span>Canales Detectados Escuchando Señales</span>
                  <span className="text-emerald-400 text-[11px]">Auto-Ingestión Activa</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-300">
                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center gap-2">
                    <Radio size={14} className="text-emerald-400 shrink-0" />
                    <span className="truncate font-medium">VIP Forex Signals 1M/5M</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center gap-2">
                    <Radio size={14} className="text-emerald-400 shrink-0" />
                    <span className="truncate font-medium">Pocket Option OTC Masters</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center gap-2">
                    <Radio size={14} className="text-emerald-400 shrink-0" />
                    <span className="truncate font-medium">Binary Scalpers High Profit</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center gap-2">
                    <Radio size={14} className="text-emerald-400 shrink-0" />
                    <span className="truncate font-medium">Crypto Breakouts & OTC</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Tab Selector */}
              <div className="grid grid-cols-4 gap-1 p-1 bg-slate-950 rounded-2xl border border-slate-800/80">
                <button
                  type="button"
                  onClick={() => { setActiveTab('phone'); setError(null); }}
                  className={cn(
                    'py-2 px-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer',
                    activeTab === 'phone'
                      ? 'bg-sky-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-slate-200'
                  )}
                >
                  <Smartphone size={14} /> Teléfono
                </button>
                <button
                  type="button"
                  onClick={() => { setActiveTab('string'); setError(null); }}
                  className={cn(
                    'py-2 px-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer',
                    activeTab === 'string'
                      ? 'bg-sky-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-slate-200'
                  )}
                >
                  <Key size={14} /> String/API
                </button>
                <button
                  type="button"
                  onClick={() => { setActiveTab('qr'); setError(null); }}
                  className={cn(
                    'py-2 px-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer',
                    activeTab === 'qr'
                      ? 'bg-sky-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-slate-200'
                  )}
                >
                  <QrCode size={14} /> QR
                </button>
                <button
                  type="button"
                  onClick={() => { setActiveTab('demo'); setError(null); }}
                  className={cn(
                    'py-2 px-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer',
                    activeTab === 'demo'
                      ? 'bg-sky-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-slate-200'
                  )}
                >
                  <Sparkles size={14} /> Demo
                </button>
              </div>

              {/* Alert Feedback */}
              {error && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle size={16} className="shrink-0 text-rose-400" />
                  <span>{error}</span>
                </div>
              )}

              {infoMessage && (
                <div className="p-3 bg-sky-500/10 border border-sky-500/30 rounded-xl text-sky-300 text-xs flex items-center gap-2">
                  <Info size={16} className="shrink-0 text-sky-400" />
                  <span>{infoMessage}</span>
                </div>
              )}

              {/* TAB 1: Phone + OTP Code + 2FA Flow */}
              {activeTab === 'phone' && (
                <div>
                  {step === 'phone' && (
                    <form onSubmit={handleSendCode} className="space-y-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-300">
                          Número de Teléfono Internacional
                        </label>
                        <Input
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="+34 612 345 678 o +52 55..."
                          className="bg-slate-950 border-slate-800 text-white font-mono text-sm"
                          required
                        />
                        <p className="text-[11px] text-slate-400">
                          Incluye el prefijo de tu país (ej: +54, +34, +52, +57, +1).
                        </p>
                      </div>

                      <Button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-sky-600 hover:bg-sky-700 text-white font-bold py-2.5 rounded-xl cursor-pointer"
                      >
                        {loading ? 'Solicitando código...' : 'Enviar Código de Verificación'}
                      </Button>
                    </form>
                  )}

                  {step === 'code' && (
                    <form onSubmit={handleVerifyCode} className="space-y-4">
                      <div className="space-y-1.5">
                        <div className="flex justify-between items-center">
                          <label className="text-xs font-semibold text-slate-300">
                            Código de Verificación Telegram (5 dígitos)
                          </label>
                          <span className="text-[11px] font-mono text-sky-400">
                            {countdown > 0 ? `Reenviar en ${countdown}s` : 'Listo para reenviar'}
                          </span>
                        </div>
                        <Input
                          type="text"
                          maxLength={5}
                          value={code}
                          onChange={(e) => setCode(e.target.value.trim())}
                          placeholder="12345"
                          className="bg-slate-950 border-slate-800 text-white font-mono text-center tracking-widest text-lg font-bold"
                          autoFocus
                          required
                        />
                        <p className="text-[11px] text-slate-400">
                          Ingresa el código que Telegram envió al chat de "Telegram" en tu app móvil o de escritorio.
                          (Tip: Puedes usar <span className="font-mono text-sky-400">12345</span> para prueba).
                        </p>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setStep('phone')}
                          className="border-slate-800 text-slate-400 hover:text-white"
                        >
                          Atrás
                        </Button>
                        <Button
                          type="submit"
                          disabled={loading}
                          className="flex-1 bg-sky-600 hover:bg-sky-700 text-white font-bold"
                        >
                          {loading ? 'Verificando...' : 'Confirmar e Iniciar Sesión'}
                        </Button>
                      </div>
                    </form>
                  )}

                  {step === '2fa' && (
                    <form onSubmit={handleVerify2FA} className="space-y-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                          <Lock size={14} className="text-amber-400" /> Contraseña 2FA en la Nube
                        </label>
                        <Input
                          type="password"
                          value={password2FA}
                          onChange={(e) => setPassword2FA(e.target.value)}
                          placeholder="Tu contraseña de Telegram..."
                          className="bg-slate-950 border-slate-800 text-white"
                          autoFocus
                          required
                        />
                        <p className="text-[11px] text-slate-400">
                          Esta cuenta tiene contraseña adicional configurada en los ajustes de seguridad de Telegram.
                        </p>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setStep('code')}
                          className="border-slate-800 text-slate-400 hover:text-white"
                        >
                          Atrás
                        </Button>
                        <Button
                          type="submit"
                          disabled={loading}
                          className="flex-1 bg-sky-600 hover:bg-sky-700 text-white font-bold"
                        >
                          {loading ? 'Validando 2FA...' : 'Desbloquear y Conectar'}
                        </Button>
                      </div>
                    </form>
                  )}
                </div>
              )}

              {/* TAB 2: StringSession / API credentials */}
              {activeTab === 'string' && (
                <form onSubmit={handleConnectStringSession} className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-300">
                      StringSession de Telethon (MTProto)
                    </label>
                    <textarea
                      rows={3}
                      value={stringSession}
                      onChange={(e) => setStringSession(e.target.value)}
                      placeholder="1BVtsOHQBu7V..."
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-mono text-xs focus:ring-2 focus:ring-sky-500 outline-none"
                      required
                    />
                    <p className="text-[11px] text-slate-400">
                      Ideal para despliegues en servidores Docker y contenedores persistentes sin necesidad de re-autenticar por SMS.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[11px] text-slate-400 font-semibold">TELEGRAM_API_ID (Opcional)</label>
                      <Input
                        value={apiId}
                        onChange={(e) => setApiId(e.target.value)}
                        placeholder="2049182"
                        className="bg-slate-950 border-slate-800 text-xs font-mono"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] text-slate-400 font-semibold">TELEGRAM_API_HASH (Opcional)</label>
                      <Input
                        value={apiHash}
                        onChange={(e) => setApiHash(e.target.value)}
                        placeholder="b84f910..."
                        className="bg-slate-950 border-slate-800 text-xs font-mono"
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-sky-600 hover:bg-sky-700 text-white font-bold py-2 rounded-xl mt-2 cursor-pointer"
                  >
                    {loading ? 'Verificando sesión...' : 'Cargar y Activar StringSession'}
                  </Button>
                </form>
              )}

              {/* TAB 3: QR Code Flow */}
              {activeTab === 'qr' && (
                <div className="flex flex-col items-center justify-center p-4 bg-slate-950 border border-slate-800 rounded-2xl text-center space-y-4">
                  <div className="p-4 bg-white rounded-2xl shadow-xl flex items-center justify-center">
                    {/* Simulated visual QR */}
                    <div className="w-44 h-44 bg-slate-900 rounded-xl flex flex-col items-center justify-center p-2 relative overflow-hidden">
                      <div className="grid grid-cols-4 gap-1.5 w-full h-full p-2 opacity-90">
                        {Array.from({ length: 16 }).map((_, i) => (
                          <div
                            key={i}
                            className={cn(
                              'rounded-xs transition-colors duration-700',
                              (i % 3 === 0 || i === 7 || i === 11 || i === 14) ? 'bg-sky-400' : 'bg-slate-700'
                            )}
                          />
                        ))}
                      </div>
                      <div className="absolute inset-0 bg-sky-500/10 flex items-center justify-center">
                        <div className="bg-sky-600 text-white p-2 rounded-xl shadow-lg border border-sky-400/50">
                          <Send size={22} className="-ml-0.5" />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1 max-w-sm">
                    <p className="text-xs font-bold text-white">Escanear desde Telegram Móvil</p>
                    <p className="text-[11px] text-slate-400">
                      1. Abre Telegram &gt; Ajustes &gt; Dispositivos &gt; <span className="text-sky-300 font-semibold">Vincular dispositivo</span>.
                      <br />2. Apunta la cámara de tu teléfono a este código QR.
                    </p>
                  </div>

                  <Button
                    type="button"
                    onClick={handleConnectQR}
                    disabled={loading}
                    className="bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold px-6 py-2 rounded-xl cursor-pointer"
                  >
                    {loading ? 'Sincronizando con Telegram...' : 'Simular Escaneo y Conectar'}
                  </Button>
                </div>
              )}

              {/* TAB 4: Demo 1-Click Connect */}
              {activeTab === 'demo' && (
                <div className="p-5 bg-gradient-to-br from-indigo-950/40 to-slate-950 border border-indigo-800/40 rounded-2xl space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-indigo-500/20 text-indigo-400 rounded-xl">
                      <Sparkles size={20} />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">Sesión Demo Instantánea (1 Clic)</h4>
                      <p className="text-xs text-slate-400">
                        Conecta una cuenta de prueba ya configurada con 9 canales activos y feeds de señales.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2 text-xs text-slate-300">
                    <div className="flex items-center gap-2">
                      <CheckCircle size={14} className="text-emerald-400" />
                      <span>Sin necesidad de código SMS ni API_ID</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle size={14} className="text-emerald-400" />
                      <span>Canales pre-cargados de Pocket Option OTC y Forex</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle size={14} className="text-emerald-400" />
                      <span>Listo para probar el parser de tokens y ejecución automática</span>
                    </div>
                  </div>

                  <Button
                    type="button"
                    onClick={handleDemoConnect}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 rounded-xl cursor-pointer shadow-lg shadow-indigo-600/20"
                  >
                    ⚡ Conectar Sesión Demo Inmediatamente
                  </Button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/60 flex justify-between items-center text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <Shield size={14} className="text-sky-400" />
            <span>Encriptación MTProto de extremo a extremo</span>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-xs text-slate-300 hover:text-white"
          >
            Cerrar
          </Button>
        </div>
      </div>
    </div>
  );
}

export default TelegramLoginModal;
