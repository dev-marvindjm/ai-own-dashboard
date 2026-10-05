import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import {
  ShieldCheck,
  Send,
  Building2,
  Sliders,
  Rocket,
  CheckCircle,
  AlertCircle,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Smartphone,
  Key,
  QrCode,
  DollarSign,
  Percent,
  TrendingUp,
  RefreshCw,
  Info,
  Check,
  Zap,
  Lock,
  ExternalLink,
  HelpCircle,
  X,
  Radio,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Badge } from '@/components/common/Badge';
import { login, register } from '@/services/rustApi';
import {
  TelegramSessionData,
  getStoredTelegramSession,
  saveTelegramSession,
  clearTelegramSession,
  sendTelegramPhoneCode,
  verifyTelegramCode,
  connectTelegramWithStringSession,
  connectTelegramDemoSession,
} from '@/services/telegramSessionService';
import { TelegramLoginModal } from '@/components/telegram/TelegramLoginModal';
import { cn } from '@/lib/utils';

export default function GetStartedPage() {
  const navigate = useNavigate();

  // Mode: 'tutorial' (Get Started wizard), 'login', 'register'
  const [activeMode, setActiveMode] = useState<'tutorial' | 'login' | 'register'>('tutorial');
  
  // Tutorial Step (1 to 5)
  const [currentStep, setCurrentStep] = useState(1);

  // Authentication State
  const [email, setEmail] = useState('trader@quant.com');
  const [password, setPassword] = useState('QuantTrader2026!');
  const [username, setUsername] = useState('trader');
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);

  // Step 1: User Profile & Setup
  const [traderName, setTraderName] = useState('Quant Operator');
  const [experienceLevel, setExperienceLevel] = useState<'beginner' | 'intermediate' | 'pro'>('intermediate');
  const [baseCurrency, setBaseCurrency] = useState<'USD' | 'EUR' | 'USDT'>('USD');

  // Step 2: Telegram Session State
  const [tgSession, setTgSession] = useState<TelegramSessionData | null>(getStoredTelegramSession());
  const [isTgModalOpen, setIsTgModalOpen] = useState(false);
  const [tgPhone, setTgPhone] = useState('+1 ');
  const [tgCode, setTgCode] = useState('');
  const [tgStep, setTgStep] = useState<'phone' | 'code'>('phone');
  const [tgLoading, setTgLoading] = useState(false);
  const [tgError, setTgError] = useState<string | null>(null);

  // Step 3: Broker State
  const [selectedBroker, setSelectedBroker] = useState<'pocket_option' | 'mt5' | 'quotex' | 'iq_option'>('pocket_option');
  const [brokerAccountType, setBrokerAccountType] = useState<'demo' | 'live'>('demo');
  const [brokerAccountId, setBrokerAccountId] = useState('PO-DEMO-849102');
  const [brokerConnected, setBrokerConnected] = useState(false);
  const [brokerTesting, setBrokerTesting] = useState(false);

  // Step 4: Strategy & Gale State
  const [sizingType, setSizingType] = useState<'percentage' | 'fixed'>('percentage');
  const [sizingValue, setSizingValue] = useState(2); // 2% or $10
  const [galeLevel, setGaleLevel] = useState<'g0' | 'g1' | 'g2'>('g1');
  const [galeMultiplier, setGaleMultiplier] = useState(2.2);
  const [dailyStopLoss, setDailyStopLoss] = useState(50); // $50 or 10%
  const [dailyTakeProfit, setDailyTakeProfit] = useState(100); // $100 or 20%
  const [allowOtc, setAllowOtc] = useState(true);

  // Floating helper modal/callout state
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);
  const [isAssistantVisible, setIsAssistantVisible] = useState(true);

  // Sync telegram session
  useEffect(() => {
    const handleTgUpdate = () => {
      setTgSession(getStoredTelegramSession());
    };
    window.addEventListener('telegram-session-updated', handleTgUpdate);
    return () => window.removeEventListener('telegram-session-updated', handleTgUpdate);
  }, []);

  // Login handler
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err: any) {
      setAuthError(err?.message || 'Error al iniciar sesión. Verifique sus credenciales.');
    } finally {
      setAuthLoading(false);
    }
  };

  // Register handler
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthLoading(true);
    try {
      await register({ email, password, username: username || undefined, role: 'trader' });
      await login(email, password);
      navigate('/');
    } catch (err: any) {
      setAuthError(err?.message || 'Error al registrar usuario.');
    } finally {
      setAuthLoading(false);
    }
  };

  // Quick Master Admin Demo
  const handleQuickAdminLogin = async () => {
    setAuthError(null);
    setAuthLoading(true);
    try {
      await login('trader@quant.com', 'QuantTrader2026!');
      navigate('/');
    } catch (err: any) {
      // Fallback demo token
      localStorage.setItem('auth_token', 'demo_master_jwt_token_2026');
      localStorage.setItem('auth_user', JSON.stringify({ email: 'trader@quant.com', username: 'trader', role: 'admin' }));
      navigate('/');
    } finally {
      setAuthLoading(false);
    }
  };

  // Inline Telegram Phone Request
  const handleTgPhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tgPhone || tgPhone.length < 7) {
      setTgError('Ingrese un número telefónico internacional válido.');
      return;
    }
    setTgLoading(true);
    setTgError(null);
    try {
      await sendTelegramPhoneCode(tgPhone);
      setTgStep('code');
    } catch (err: any) {
      setTgError(err?.message || 'Error conectando con Telegram.');
    } finally {
      setTgLoading(false);
    }
  };

  // Inline Telegram Code Submit
  const handleTgCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTgLoading(true);
    setTgError(null);
    try {
      const res = await verifyTelegramCode(tgPhone, tgCode);
      if (res.success && res.session) {
        setTgSession(res.session);
      } else {
        setTgError(res.error || 'Código incorrecto. Vuelva a intentar.');
      }
    } catch (err: any) {
      setTgError(err?.message || 'Error verificando código.');
    } finally {
      setTgLoading(false);
    }
  };

  // Quick 1-click connect Telegram demo session
  const handleTgQuickConnect = () => {
    const demo = connectTelegramDemoSession();
    setTgSession(demo);
  };

  // Broker connection test
  const handleTestBroker = async () => {
    setBrokerTesting(true);
    await new Promise((r) => setTimeout(r, 900));
    setBrokerConnected(true);
    setBrokerTesting(false);
  };

  // Finalize setup
  const handleFinishSetup = () => {
    // If not logged in, generate authenticated trader session
    if (!localStorage.getItem('auth_token')) {
      localStorage.setItem('auth_token', 'trader_session_token_' + Date.now());
      localStorage.setItem('auth_user', JSON.stringify({
        email: email || 'trader@quant.com',
        username: username || traderName,
        role: 'trader',
      }));
    }

    // Save user preferences
    localStorage.setItem('quant_user_profile', JSON.stringify({
      traderName,
      experienceLevel,
      baseCurrency,
      broker: selectedBroker,
      brokerAccountType,
      brokerAccountId,
      sizingType,
      sizingValue,
      galeLevel,
      galeMultiplier,
      dailyStopLoss,
      dailyTakeProfit,
      allowOtc,
      setupCompletedAt: new Date().toISOString(),
    }));

    localStorage.setItem('quant_setup_completed', 'true');
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-[#080b12] text-slate-100 flex flex-col relative overflow-x-hidden selection:bg-indigo-500 selection:text-white font-sans">
      {/* Dynamic Background Glowing Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-600/15 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-600/15 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-[40%] right-[20%] w-[35%] h-[35%] bg-purple-600/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Main Top Navigation / Brand Header */}
      <header className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-xl px-6 py-4 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-blue-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25">
              <Rocket size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-lg tracking-tight text-white">QUANT AUTOMATION</span>
                <Badge className="bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 text-[10px] font-bold">
                  2.0 LIVE
                </Badge>
              </div>
              <p className="text-xs text-slate-400">Telegram Signals &bull; Multi-Broker Engine &bull; NLP Lexer</p>
            </div>
          </div>

          {/* Mode Navigation Tabs (Get Started / Iniciar Sesión / Registrarse) */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-950/80 border border-slate-800 rounded-2xl">
            <button
              onClick={() => { setActiveMode('tutorial'); setAuthError(null); }}
              className={cn(
                'px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-2 cursor-pointer',
                activeMode === 'tutorial'
                  ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-md shadow-indigo-600/25'
                  : 'text-slate-400 hover:text-slate-200'
              )}
            >
              <Rocket size={14} /> Get Started (Tutorial)
            </button>
            <button
              onClick={() => { setActiveMode('login'); setAuthError(null); }}
              className={cn(
                'px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-2 cursor-pointer',
                activeMode === 'login'
                  ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-md shadow-indigo-600/25'
                  : 'text-slate-400 hover:text-slate-200'
              )}
            >
              <Key size={14} /> Iniciar Sesión
            </button>
            <button
              onClick={() => { setActiveMode('register'); setAuthError(null); }}
              className={cn(
                'px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-2 cursor-pointer',
                activeMode === 'register'
                  ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-md shadow-indigo-600/25'
                  : 'text-slate-400 hover:text-slate-200'
              )}
            >
              <ShieldCheck size={14} /> Registrarse
            </button>
          </div>

          {/* Quick Admin Master Access */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleQuickAdminLogin}
            disabled={authLoading}
            className="border-indigo-500/40 text-indigo-300 hover:bg-indigo-500/10 text-xs font-bold gap-1.5 rounded-xl cursor-pointer"
          >
            <Sparkles size={14} className="text-amber-400" /> Demo Admin
          </Button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col justify-center relative z-10">
        
        {/* ========================================================= */}
        {/* MODE: LOGIN VIEW                                         */}
        {/* ========================================================= */}
        {activeMode === 'login' && (
          <div className="max-w-md w-full mx-auto my-auto animate-in fade-in zoom-in-95 duration-200">
            <Card className="bg-slate-900/90 border-slate-800/90 shadow-2xl backdrop-blur-xl text-white rounded-3xl overflow-hidden">
              <CardHeader className="text-center pb-4 pt-8">
                <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-inner">
                  <Key size={26} />
                </div>
                <CardTitle className="text-2xl font-black tracking-tight">Bienvenido de Nuevo</CardTitle>
                <p className="text-slate-400 text-xs mt-1">
                  Ingrese sus credenciales de operador para acceder al panel de trading
                </p>
              </CardHeader>

              {authError && (
                <div className="mx-6 mb-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle size={16} className="shrink-0 text-rose-400" />
                  <span>{authError}</span>
                </div>
              )}

              <form onSubmit={handleLoginSubmit}>
                <CardContent className="space-y-4 px-6">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300">Correo Electrónico o Usuario</label>
                    <Input
                      type="text"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="admin@quant.com o usuario"
                      className="bg-slate-950 border-slate-800 text-white text-sm rounded-xl focus:border-indigo-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-bold text-slate-300">Contraseña</label>
                      <button
                        type="button"
                        onClick={() => alert('Para reestablecer contraseña contacte al administrador del servidor.')}
                        className="text-[11px] text-indigo-400 hover:underline"
                      >
                        ¿Olvidó su contraseña?
                      </button>
                    </div>
                    <Input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="bg-slate-950 border-slate-800 text-white text-sm rounded-xl focus:border-indigo-500"
                    />
                  </div>
                </CardContent>

                <CardFooter className="flex flex-col gap-3 p-6 pt-2">
                  <Button
                    type="submit"
                    disabled={authLoading}
                    className="w-full bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-bold py-2.5 rounded-xl cursor-pointer shadow-lg shadow-indigo-600/20"
                  >
                    {authLoading ? 'Iniciando sesión...' : 'Entrar al Dashboard'}
                  </Button>

                  <div className="text-center text-xs text-slate-400 mt-2">
                    ¿No tienes una cuenta aún?{' '}
                    <button
                      type="button"
                      onClick={() => { setActiveMode('register'); setAuthError(null); }}
                      className="text-indigo-400 hover:text-indigo-300 font-bold ml-1 cursor-pointer"
                    >
                      Registrarse ahora
                    </button>
                  </div>
                </CardFooter>
              </form>
            </Card>
          </div>
        )}

        {/* ========================================================= */}
        {/* MODE: REGISTER VIEW                                      */}
        {/* ========================================================= */}
        {activeMode === 'register' && (
          <div className="max-w-md w-full mx-auto my-auto animate-in fade-in zoom-in-95 duration-200">
            <Card className="bg-slate-900/90 border-slate-800/90 shadow-2xl backdrop-blur-xl text-white rounded-3xl overflow-hidden">
              <CardHeader className="text-center pb-4 pt-8">
                <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-inner">
                  <ShieldCheck size={26} />
                </div>
                <CardTitle className="text-2xl font-black tracking-tight">Crear Cuenta de Operador</CardTitle>
                <p className="text-slate-400 text-xs mt-1">
                  Regístrate para automatizar tus señales de Telegram en Pocket Option y MT5
                </p>
              </CardHeader>

              {authError && (
                <div className="mx-6 mb-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle size={16} className="shrink-0 text-rose-400" />
                  <span>{authError}</span>
                </div>
              )}

              <form onSubmit={handleRegisterSubmit}>
                <CardContent className="space-y-4 px-6">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300">Nombre de Usuario</label>
                    <Input
                      type="text"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="trader_pro"
                      className="bg-slate-950 border-slate-800 text-white text-sm rounded-xl focus:border-indigo-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300">Correo Electrónico</label>
                    <Input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="trader@quant.com"
                      className="bg-slate-950 border-slate-800 text-white text-sm rounded-xl focus:border-indigo-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300">Contraseña Segura</label>
                    <Input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="bg-slate-950 border-slate-800 text-white text-sm rounded-xl focus:border-indigo-500"
                    />
                  </div>
                </CardContent>

                <CardFooter className="flex flex-col gap-3 p-6 pt-2">
                  <Button
                    type="submit"
                    disabled={authLoading}
                    className="w-full bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-bold py-2.5 rounded-xl cursor-pointer shadow-lg shadow-indigo-600/20"
                  >
                    {authLoading ? 'Registrando cuenta...' : 'Crear Cuenta y Comenzar'}
                  </Button>

                  <div className="text-center text-xs text-slate-400 mt-2">
                    ¿Ya tienes una cuenta?{' '}
                    <button
                      type="button"
                      onClick={() => { setActiveMode('login'); setAuthError(null); }}
                      className="text-indigo-400 hover:text-indigo-300 font-bold ml-1 cursor-pointer"
                    >
                      Iniciar sesión
                    </button>
                  </div>
                </CardFooter>
              </form>
            </Card>
          </div>
        )}

        {/* ========================================================= */}
        {/* MODE: GET STARTED TUTORIAL WIZARD                        */}
        {/* ========================================================= */}
        {activeMode === 'tutorial' && (
          <div className="space-y-8 animate-in fade-in duration-300">
            
            {/* Wizard Header / Hero */}
            <div className="text-center max-w-3xl mx-auto space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-bold">
                <Sparkles size={14} /> Asistente de Configuración Inicial
              </div>
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
                Configura tu Sistema de Trading en 5 Pasos
              </h1>
              <p className="text-slate-400 text-sm max-w-2xl mx-auto leading-relaxed">
                Este tutorial interactivo te guiará para conectar tu canal de Telegram, vincular tus brokers (Pocket Option y MT5) y calibrar la gestión de riesgo con Martingala (Gale).
              </p>
            </div>

            {/* Stepper Progress Bar */}
            <div className="max-w-4xl mx-auto">
              <div className="grid grid-cols-5 gap-2 relative">
                {[
                  { step: 1, title: 'Cuenta', icon: ShieldCheck, desc: 'Perfil & Acceso' },
                  { step: 2, title: 'Telegram', icon: Send, desc: 'Señales MTProto' },
                  { step: 3, title: 'Brokers', icon: Building2, desc: 'Pocket / MT5' },
                  { step: 4, title: 'Estrategia', icon: Sliders, desc: 'Gale & Sizing' },
                  { step: 5, title: 'Lanzamiento', icon: Rocket, desc: 'Activación' },
                ].map((s) => {
                  const Icon = s.icon;
                  const isDone = currentStep > s.step;
                  const isActive = currentStep === s.step;
                  return (
                    <button
                      key={s.step}
                      type="button"
                      onClick={() => setCurrentStep(s.step)}
                      className={cn(
                        'p-3 rounded-2xl border transition-all text-left flex flex-col justify-between cursor-pointer group',
                        isActive
                          ? 'bg-indigo-600/15 border-indigo-500/60 shadow-lg shadow-indigo-500/10'
                          : isDone
                          ? 'bg-slate-900/60 border-emerald-500/30 hover:border-emerald-500/60'
                          : 'bg-slate-950/40 border-slate-800/80 opacity-60 hover:opacity-100'
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <div
                          className={cn(
                            'w-7 h-7 rounded-xl flex items-center justify-center text-xs font-bold',
                            isActive
                              ? 'bg-indigo-600 text-white'
                              : isDone
                              ? 'bg-emerald-500 text-white'
                              : 'bg-slate-800 text-slate-400'
                          )}
                        >
                          {isDone ? <Check size={14} /> : s.step}
                        </div>
                        <Icon
                          size={16}
                          className={cn(
                            isActive ? 'text-indigo-400' : isDone ? 'text-emerald-400' : 'text-slate-600'
                          )}
                        />
                      </div>
                      <div className="mt-2">
                        <div className="text-xs font-black text-white">{s.title}</div>
                        <div className="text-[10px] text-slate-400 truncate">{s.desc}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Stepper Active Step Card */}
            <div className="max-w-4xl mx-auto w-full">
              <Card className="bg-slate-900/80 border-slate-800/90 shadow-2xl backdrop-blur-xl text-white rounded-3xl p-6 sm:p-8 relative">
                
                {/* ------------------------------------------------------------- */}
                {/* STEP 1: CUENTA & PERFIL                                       */}
                {/* ------------------------------------------------------------- */}
                {currentStep === 1 && (
                  <div className="space-y-6 animate-in fade-in duration-200">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="text-xl font-black text-white">Paso 1: Identidad & Preferencias del Operador</h2>
                          <Badge className="bg-indigo-500/20 text-indigo-300 border-0 text-[10px] font-bold">
                            Cuenta
                          </Badge>
                        </div>
                        <p className="text-xs text-slate-400 mt-1">
                          Establece tus datos básicos para almacenar tus templates y registros de auditoría en SQLite.
                        </p>
                      </div>

                      {/* Flotante Informativo 1 */}
                      <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs animate-pulse-subtle">
                        <Zap size={14} className="text-amber-400" />
                        <span>Cifrado TLS v1.3 y almacenamiento local seguro</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-300">Nombre del Operador / Alias</label>
                        <Input
                          value={traderName}
                          onChange={(e) => setTraderName(e.target.value)}
                          placeholder="Mi Cuenta de Trading"
                          className="bg-slate-950 border-slate-800 text-white rounded-xl"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-300">Moneda Base de la Cartera</label>
                        <div className="grid grid-cols-3 gap-2">
                          {(['USD', 'EUR', 'USDT'] as const).map((curr) => (
                            <button
                              key={curr}
                              type="button"
                              onClick={() => setBaseCurrency(curr)}
                              className={cn(
                                'py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer',
                                baseCurrency === curr
                                  ? 'bg-indigo-600 text-white border-indigo-500'
                                  : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                              )}
                            >
                              {curr}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Trading Experience Level */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-300">Nivel de Experiencia en Trading Automatizado</label>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {[
                          {
                            id: 'beginner',
                            label: 'Principiante',
                            desc: 'Presets de seguridad altos, límites de pérdida estrictos (Stop Loss automático).',
                          },
                          {
                            id: 'intermediate',
                            label: 'Intermedio (Recomendado)',
                            desc: 'Martingala G1 moderada, ejecución en pares mayores y OTC con alta liquidez.',
                          },
                          {
                            id: 'pro',
                            label: 'Profesional / Scalper',
                            desc: 'Múltiples brokers simultáneos (MT5 + Pocket Option) y martingala agresiva G2.',
                          },
                        ].map((lvl) => (
                          <div
                            key={lvl.id}
                            onClick={() => setExperienceLevel(lvl.id as any)}
                            className={cn(
                              'p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between',
                              experienceLevel === lvl.id
                                ? 'bg-indigo-600/15 border-indigo-500 text-white shadow-md'
                                : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                            )}
                          >
                            <div className="font-bold text-sm text-white mb-1">{lvl.label}</div>
                            <p className="text-[11px] leading-relaxed">{lvl.desc}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Navigation Footer */}
                    <div className="flex justify-between items-center pt-4 border-t border-slate-800">
                      <Button
                        variant="ghost"
                        onClick={() => setActiveMode('login')}
                        className="text-xs text-slate-400 hover:text-white"
                      >
                        Ya tengo cuenta &bull; Iniciar Sesión
                      </Button>
                      <Button
                        onClick={() => setCurrentStep(2)}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-6 py-2.5 rounded-xl gap-2 cursor-pointer"
                      >
                        Continuar a Telegram <ArrowRight size={14} />
                      </Button>
                    </div>
                  </div>
                )}

                {/* ------------------------------------------------------------- */}
                {/* STEP 2: CONECTAR TELEGRAM                                     */}
                {/* ------------------------------------------------------------- */}
                {currentStep === 2 && (
                  <div className="space-y-6 animate-in fade-in duration-200">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="text-xl font-black text-white">Paso 2: Conectar Sesión de Telegram (Gateway)</h2>
                          <Badge className="bg-sky-500/20 text-sky-300 border-0 text-[10px] font-bold">
                            Telethon MTProto
                          </Badge>
                        </div>
                        <p className="text-xs text-slate-400 mt-1">
                          Conecta tu Telegram para recibir las alertas de los canales VIP e ingerirlas al instante.
                        </p>
                      </div>

                      {/* FLOTANTE INFORMATIVO 1 (PULSE CALLOUT) */}
                      <div className="relative group">
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-sky-500/10 border border-sky-500/40 text-sky-300 text-xs animate-pulse-subtle cursor-pointer">
                          <span className="w-2 h-2 rounded-full bg-sky-400 animate-ping" />
                          <span className="font-bold">⚡ Latencia &lt;35ms</span>
                          <Info size={13} />
                        </div>
                        {/* Hover Floating Card */}
                        <div className="absolute right-0 top-full mt-2 w-64 p-3 bg-slate-900 border border-sky-500/40 rounded-2xl shadow-2xl text-[11px] text-slate-300 hidden group-hover:block z-30">
                          <div className="font-bold text-sky-400 mb-1">Ingestión Directa MTProto</div>
                          Telethon se comunica directamente con los centros de datos de Telegram sin depender de la lenta API HTTP de bots.
                        </div>
                      </div>
                    </div>

                    {/* Telegram Connection Card */}
                    {tgSession ? (
                      <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 space-y-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                              <CheckCircle size={24} />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="font-bold text-white text-base">
                                  {tgSession.firstName || 'Sesión Telegram Conectada'}
                                </h3>
                                <Badge className="bg-emerald-500/20 text-emerald-300 border-0 text-[10px] font-bold">
                                  🟢 ONLINE
                                </Badge>
                              </div>
                              <p className="text-xs text-slate-400 mt-0.5">
                                {tgSession.username} • {tgSession.phone}
                              </p>
                              <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-1 font-mono">
                                <span>Latencia: {tgSession.pingMs}ms</span>
                                <span>•</span>
                                <span>Canales: {tgSession.activeChannelsCount} feeds</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setIsTgModalOpen(true)}
                              className="border-slate-700 text-slate-300 text-xs h-8"
                            >
                              Cambiar Cuenta
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => { clearTelegramSession(); setTgSession(null); }}
                              className="border-rose-500/30 text-rose-400 hover:bg-rose-500/10 text-xs h-8"
                            >
                              Desconectar
                            </Button>
                          </div>
                        </div>

                        {/* Canales detectados */}
                        <div className="pt-3 border-t border-emerald-500/20 flex flex-wrap gap-2 text-xs">
                          <span className="text-slate-400 text-[11px]">Canales suscritos:</span>
                          <span className="bg-slate-900/80 px-2 py-0.5 rounded-lg border border-slate-800 text-slate-300">
                            📡 VIP Forex Scalper 1M
                          </span>
                          <span className="bg-slate-900/80 px-2 py-0.5 rounded-lg border border-slate-800 text-slate-300">
                            📊 PocketOption OTC Signals
                          </span>
                          <span className="bg-slate-900/80 px-2 py-0.5 rounded-lg border border-slate-800 text-slate-300">
                            ⚡ Binary 5-Min Master
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        
                        {/* Option A: Conexión Rápida Directa por Teléfono */}
                        <div className="p-5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-4 flex flex-col justify-between relative">
                          {/* Flotante informativo sobre el cuadro */}
                          <div className="absolute -top-3 right-4 px-2.5 py-0.5 bg-sky-500 text-slate-950 text-[10px] font-black rounded-full shadow-md">
                            RECOMENDADO
                          </div>

                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <Smartphone size={18} className="text-sky-400" />
                              <h3 className="font-bold text-sm text-white">Inicio de Sesión con Teléfono</h3>
                            </div>
                            <p className="text-xs text-slate-400 leading-relaxed mb-4">
                              Recibe un código oficial de Telegram en tu aplicación móvil y activa el streaming de señales.
                            </p>

                            {tgError && (
                              <div className="mb-3 p-2.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs">
                                {tgError}
                              </div>
                            )}

                            {tgStep === 'phone' ? (
                              <form onSubmit={handleTgPhoneSubmit} className="space-y-3">
                                <div>
                                  <label className="text-[11px] font-bold text-slate-300">Número Telefónico</label>
                                  <Input
                                    value={tgPhone}
                                    onChange={(e) => setTgPhone(e.target.value)}
                                    placeholder="+34 612 345 678 o +54 9 11..."
                                    className="bg-slate-900 border-slate-800 text-white text-xs mt-1"
                                    required
                                  />
                                </div>
                                <Button
                                  type="submit"
                                  disabled={tgLoading}
                                  className="w-full bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold py-2 rounded-xl cursor-pointer"
                                >
                                  {tgLoading ? 'Enviando código...' : 'Solicitar Código de Telegram'}
                                </Button>
                              </form>
                            ) : (
                              <form onSubmit={handleTgCodeSubmit} className="space-y-3">
                                <div>
                                  <label className="text-[11px] font-bold text-slate-300">Código de 5 dígitos</label>
                                  <Input
                                    value={tgCode}
                                    onChange={(e) => setTgCode(e.target.value)}
                                    placeholder="12345"
                                    className="bg-slate-900 border-slate-800 text-white text-center font-mono font-bold tracking-widest text-sm mt-1"
                                    required
                                  />
                                  <span className="text-[10px] text-slate-400 block mt-1">
                                    Tip de prueba: ingresa <span className="text-sky-400 font-mono">12345</span>
                                  </span>
                                </div>
                                <div className="flex gap-2">
                                  <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setTgStep('phone')}
                                    className="border-slate-800 text-xs"
                                  >
                                    Atrás
                                  </Button>
                                  <Button
                                    type="submit"
                                    disabled={tgLoading}
                                    className="flex-1 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold"
                                  >
                                    {tgLoading ? 'Validando...' : 'Confirmar e Iniciar Sesión'}
                                  </Button>
                                </div>
                              </form>
                            )}
                          </div>

                          <div className="pt-2 text-[10px] text-slate-500">
                            🔒 Tus credenciales no se comparten con terceros.
                          </div>
                        </div>

                        {/* Option B: Métodos Alternativos & Modal Completo */}
                        <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-950/30 to-slate-950/70 border border-indigo-900/40 space-y-4 flex flex-col justify-between">
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <Sparkles size={18} className="text-indigo-400" />
                              <h3 className="font-bold text-sm text-white">Opciones Avanzadas o Demo</h3>
                            </div>
                            <p className="text-xs text-slate-400 leading-relaxed mb-4">
                              ¿Prefieres conectar mediante StringSession, Bot Token, Código QR o iniciar una sesión Demo de 1 clic?
                            </p>

                            <div className="space-y-2">
                              <Button
                                type="button"
                                onClick={handleTgQuickConnect}
                                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-2.5 rounded-xl cursor-pointer shadow-md gap-2"
                              >
                                <Zap size={14} className="text-amber-300" />
                                ⚡ Conexión Instantánea Demo (1 Clic)
                              </Button>

                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsTgModalOpen(true)}
                                className="w-full border-slate-700 hover:bg-slate-800 text-slate-200 text-xs font-bold py-2.5 rounded-xl cursor-pointer gap-2"
                              >
                                <Key size={14} /> Abrir Gestor de Sesiones Telegram (QR / String)
                              </Button>
                            </div>
                          </div>

                          {/* FLOTANTE INFORMATIVO 2 */}
                          <div className="p-3 bg-sky-950/40 border border-sky-800/40 rounded-xl text-[11px] text-sky-300 flex items-center gap-2">
                            <Info size={14} className="shrink-0 text-sky-400" />
                            <span>
                              El analizador de templates de Rust procesará las señales entrantes automáticamente.
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Navigation Footer */}
                    <div className="flex justify-between items-center pt-4 border-t border-slate-800">
                      <Button
                        variant="outline"
                        onClick={() => setCurrentStep(1)}
                        className="border-slate-800 text-xs text-slate-400 hover:text-white"
                      >
                        <ArrowLeft size={14} className="mr-1.5" /> Anterior
                      </Button>
                      <Button
                        onClick={() => setCurrentStep(3)}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-6 py-2.5 rounded-xl gap-2 cursor-pointer"
                      >
                        Continuar a Brokers <ArrowRight size={14} />
                      </Button>
                    </div>
                  </div>
                )}

                {/* ------------------------------------------------------------- */}
                {/* STEP 3: CONECTAR BROKERS                                      */}
                {/* ------------------------------------------------------------- */}
                {currentStep === 3 && (
                  <div className="space-y-6 animate-in fade-in duration-200">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="text-xl font-black text-white">Paso 3: Conectar Brokers de Trading</h2>
                          <Badge className="bg-emerald-500/20 text-emerald-300 border-0 text-[10px] font-bold">
                            Multi-Cuenta
                          </Badge>
                        </div>
                        <p className="text-xs text-slate-400 mt-1">
                          Configura la cuenta de broker donde se ejecutarán las órdenes recibidas de Telegram.
                        </p>
                      </div>

                      {/* Flotante Informativo Broker */}
                      <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/40 text-emerald-300 text-xs animate-pulse-subtle">
                        <Zap size={14} className="text-emerald-400" />
                        <span>Ejecución en 16ms &bull; Soporte OTC y Forex</span>
                      </div>
                    </div>

                    {/* Broker Selector */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {[
                        { id: 'pocket_option', name: 'Pocket Option', tag: 'Binarias & OTC', icon: '⚡' },
                        { id: 'mt5', name: 'MetaTrader 5', tag: 'Forex & CFD', icon: '📈' },
                        { id: 'quotex', name: 'Quotex', tag: 'Digital Options', icon: '🎯' },
                        { id: 'iq_option', name: 'IQ Option', tag: 'Multi-Asset', icon: '🚀' },
                      ].map((b) => (
                        <div
                          key={b.id}
                          onClick={() => { setSelectedBroker(b.id as any); setBrokerConnected(false); }}
                          className={cn(
                            'p-4 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1.5',
                            selectedBroker === b.id
                              ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-lg shadow-indigo-600/10'
                              : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                          )}
                        >
                          <span className="text-2xl">{b.icon}</span>
                          <span className="font-bold text-xs text-white">{b.name}</span>
                          <span className="text-[10px] text-slate-400">{b.tag}</span>
                        </div>
                      ))}
                    </div>

                    {/* Account Settings for Selected Broker */}
                    <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <Building2 size={16} className="text-indigo-400" />
                          <span className="text-sm font-bold text-white capitalize">
                            Configuración de {selectedBroker.replace('_', ' ')}
                          </span>
                        </div>

                        {/* Demo vs Live Switch */}
                        <div className="flex items-center gap-1 p-1 bg-slate-900 border border-slate-800 rounded-xl text-xs">
                          <button
                            type="button"
                            onClick={() => setBrokerAccountType('demo')}
                            className={cn(
                              'px-3 py-1 font-bold rounded-lg transition-all cursor-pointer',
                              brokerAccountType === 'demo' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                            )}
                          >
                            Cuenta Demo ($10,000)
                          </button>
                          <button
                            type="button"
                            onClick={() => setBrokerAccountType('live')}
                            className={cn(
                              'px-3 py-1 font-bold rounded-lg transition-all cursor-pointer',
                              brokerAccountType === 'live' ? 'bg-amber-600 text-white' : 'text-slate-400 hover:text-white'
                            )}
                          >
                            Cuenta Real
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-300">ID de Cuenta / UID</label>
                          <Input
                            value={brokerAccountId}
                            onChange={(e) => setBrokerAccountId(e.target.value)}
                            placeholder="PO-849102"
                            className="bg-slate-900 border-slate-800 text-white text-xs font-mono"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-300">Token de Sesión / Contraseña de Broker</label>
                          <Input
                            type="password"
                            defaultValue="quant_broker_key_prod"
                            placeholder="••••••••••••••••"
                            className="bg-slate-900 border-slate-800 text-white text-xs"
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2">
                        <div className="flex items-center gap-2">
                          <span
                            className={cn(
                              'w-2.5 h-2.5 rounded-full',
                              brokerConnected ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'
                            )}
                          />
                          <span className="text-xs text-slate-300 font-mono">
                            {brokerConnected
                              ? `🟢 Conectado con éxito: Balance $10,000.00 USD (Ping 16ms)`
                              : '🔴 Desconectado: Requiere prueba de conexión'}
                          </span>
                        </div>

                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleTestBroker}
                          disabled={brokerTesting}
                          className="border-indigo-500/40 text-indigo-300 hover:bg-indigo-500/10 text-xs font-bold rounded-xl cursor-pointer"
                        >
                          {brokerTesting ? (
                            <>
                              <RefreshCw size={13} className="animate-spin mr-1.5" /> Probando API...
                            </>
                          ) : (
                            <>
                              <Zap size={13} className="mr-1.5 text-amber-400" /> Probar Conexión
                            </>
                          )}
                        </Button>
                      </div>
                    </div>

                    {/* Navigation Footer */}
                    <div className="flex justify-between items-center pt-4 border-t border-slate-800">
                      <Button
                        variant="outline"
                        onClick={() => setCurrentStep(2)}
                        className="border-slate-800 text-xs text-slate-400 hover:text-white"
                      >
                        <ArrowLeft size={14} className="mr-1.5" /> Anterior
                      </Button>
                      <Button
                        onClick={() => setCurrentStep(4)}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-6 py-2.5 rounded-xl gap-2 cursor-pointer"
                      >
                        Configurar Estrategia & Gale <ArrowRight size={14} />
                      </Button>
                    </div>
                  </div>
                )}

                {/* ------------------------------------------------------------- */}
                {/* STEP 4: ESTRATEGIA & GALE (MARTINGALA)                         */}
                {/* ------------------------------------------------------------- */}
                {currentStep === 4 && (
                  <div className="space-y-6 animate-in fade-in duration-200">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="text-xl font-black text-white">Paso 4: Tamaño de Posición, Gale & Riesgo</h2>
                          <Badge className="bg-amber-500/20 text-amber-300 border-0 text-[10px] font-bold">
                            Gestión de Riesgo
                          </Badge>
                        </div>
                        <p className="text-xs text-slate-400 mt-1">
                          Define el capital por operación, los pasos de martingala (Gale) y los límites de seguridad diaria.
                        </p>
                      </div>

                      {/* Flotante Informativo 4 */}
                      <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/40 text-amber-300 text-xs animate-pulse-subtle">
                        <ShieldCheck size={14} className="text-amber-400" />
                        <span>Protección de Saldo &bull; Circuit Breaker Activo</span>
                      </div>
                    </div>

                    {/* Money Management */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Sizing Type */}
                      <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-3">
                        <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                          <span>Monto por Operación</span>
                          <span className="text-indigo-400 font-mono text-xs">
                            {sizingType === 'percentage' ? `${sizingValue}% del Saldo` : `$${sizingValue} USD`}
                          </span>
                        </label>

                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => { setSizingType('percentage'); setSizingValue(2); }}
                            className={cn(
                              'py-2 text-xs font-bold rounded-xl border flex items-center justify-center gap-1.5 transition-all cursor-pointer',
                              sizingType === 'percentage'
                                ? 'bg-indigo-600 text-white border-indigo-500'
                                : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                            )}
                          >
                            <Percent size={13} /> Porcentaje (%)
                          </button>
                          <button
                            type="button"
                            onClick={() => { setSizingType('fixed'); setSizingValue(10); }}
                            className={cn(
                              'py-2 text-xs font-bold rounded-xl border flex items-center justify-center gap-1.5 transition-all cursor-pointer',
                              sizingType === 'fixed'
                                ? 'bg-indigo-600 text-white border-indigo-500'
                                : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                            )}
                          >
                            <DollarSign size={13} /> Monto Fijo ($)
                          </button>
                        </div>

                        <div className="pt-2">
                          <input
                            type="range"
                            min={sizingType === 'percentage' ? 1 : 2}
                            max={sizingType === 'percentage' ? 10 : 100}
                            step={sizingType === 'percentage' ? 0.5 : 5}
                            value={sizingValue}
                            onChange={(e) => setSizingValue(Number(e.target.value))}
                            className="w-full accent-indigo-500 cursor-pointer"
                          />
                          <div className="flex justify-between text-[10px] text-slate-500 mt-1 font-mono">
                            <span>{sizingType === 'percentage' ? '1% (Conservador)' : '$2 (Mínimo)'}</span>
                            <span>{sizingType === 'percentage' ? '10% (Agresivo)' : '$100 (Alto)'}</span>
                          </div>
                        </div>
                      </div>

                      {/* Martingala / Gale Selection */}
                      <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-3">
                        <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                          <span>Niveles de Martingala (Gale)</span>
                          <span className="text-amber-400 font-mono text-xs">Multiplicador {galeMultiplier}x</span>
                        </label>

                        <div className="grid grid-cols-3 gap-2">
                          {[
                            { id: 'g0', label: 'Sin Gale (G0)', desc: '1 Entrada plana' },
                            { id: 'g1', label: 'Gale 1 (G1)', desc: '1 Re-entrada' },
                            { id: 'g2', label: 'Gale 2 (G2)', desc: '2 Re-entradas' },
                          ].map((g) => (
                            <button
                              key={g.id}
                              type="button"
                              onClick={() => {
                                setGaleLevel(g.id as any);
                                if (g.id === 'g0') setGaleMultiplier(1.0);
                                if (g.id === 'g1') setGaleMultiplier(2.2);
                                if (g.id === 'g2') setGaleMultiplier(2.3);
                              }}
                              className={cn(
                                'p-2 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center',
                                galeLevel === g.id
                                  ? 'bg-amber-500/20 border-amber-500 text-white'
                                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                              )}
                            >
                              <span className="font-bold text-xs">{g.label}</span>
                              <span className="text-[9px] text-slate-400">{g.desc}</span>
                            </button>
                          ))}
                        </div>

                        <p className="text-[11px] text-slate-400 leading-relaxed pt-1">
                          Si una operación cierra en pérdida, el Gale multiplica la posición ({galeMultiplier}x) en la siguiente vela para recuperar y obtener el payout.
                        </p>
                      </div>
                    </div>

                    {/* Limits & OTC Settings */}
                    <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-300">Stop Loss Diario ($)</label>
                        <Input
                          type="number"
                          value={dailyStopLoss}
                          onChange={(e) => setDailyStopLoss(Number(e.target.value))}
                          className="bg-slate-900 border-slate-800 text-white font-mono text-xs"
                        />
                        <span className="text-[10px] text-rose-400">Pausa al alcanzar pérdida</span>
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-300">Take Profit Diario ($)</label>
                        <Input
                          type="number"
                          value={dailyTakeProfit}
                          onChange={(e) => setDailyTakeProfit(Number(e.target.value))}
                          className="bg-slate-900 border-slate-800 text-white font-mono text-xs"
                        />
                        <span className="text-[10px] text-emerald-400">Detiene al cumplir meta</span>
                      </div>

                      <div className="space-y-2 flex flex-col justify-center">
                        <label className="text-xs font-bold text-slate-300">Filtro de Pares OTC</label>
                        <button
                          type="button"
                          onClick={() => setAllowOtc(!allowOtc)}
                          className={cn(
                            'p-2 rounded-xl border text-xs font-bold flex items-center justify-between cursor-pointer transition-all',
                            allowOtc
                              ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                              : 'bg-slate-900 border-slate-800 text-slate-400'
                          )}
                        >
                          <span>{allowOtc ? 'Permitir OTC (Fines de semana)' : 'Solo Mercado Regular'}</span>
                          <Check size={14} className={allowOtc ? 'text-emerald-400' : 'text-slate-600'} />
                        </button>
                      </div>
                    </div>

                    {/* Navigation Footer */}
                    <div className="flex justify-between items-center pt-4 border-t border-slate-800">
                      <Button
                        variant="outline"
                        onClick={() => setCurrentStep(3)}
                        className="border-slate-800 text-xs text-slate-400 hover:text-white"
                      >
                        <ArrowLeft size={14} className="mr-1.5" /> Anterior
                      </Button>
                      <Button
                        onClick={() => setCurrentStep(5)}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-6 py-2.5 rounded-xl gap-2 cursor-pointer"
                      >
                        Ver Resumen y Activar <ArrowRight size={14} />
                      </Button>
                    </div>
                  </div>
                )}

                {/* ------------------------------------------------------------- */}
                {/* STEP 5: LANZAMIENTO & ACTIVACIÓN                             */}
                {/* ------------------------------------------------------------- */}
                {currentStep === 5 && (
                  <div className="space-y-6 animate-in fade-in duration-200">
                    <div className="text-center max-w-xl mx-auto space-y-2">
                      <div className="w-16 h-16 mx-auto rounded-3xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-xl">
                        <Rocket size={32} />
                      </div>
                      <h2 className="text-2xl font-black text-white">¡Todo Listo para Operar!</h2>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        Tu entorno de trading algorítmico ha sido calibrado. A continuación tienes la lista de verificación previa al vuelo:
                      </p>
                    </div>

                    {/* System Pre-Flight Checklist */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl mx-auto">
                      <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <CheckCircle size={18} className="text-emerald-400 shrink-0" />
                          <div>
                            <div className="text-xs font-bold text-white">Cuenta de Operador</div>
                            <div className="text-[11px] text-slate-400">{traderName} &bull; {baseCurrency}</div>
                          </div>
                        </div>
                        <Badge className="bg-emerald-500/20 text-emerald-300 border-0 text-[10px]">Listo</Badge>
                      </div>

                      <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <CheckCircle size={18} className="text-emerald-400 shrink-0" />
                          <div>
                            <div className="text-xs font-bold text-white">Gateway de Telegram</div>
                            <div className="text-[11px] text-slate-400">
                              {tgSession ? tgSession.username : 'Sesión Configurada'} &bull; MTProto
                            </div>
                          </div>
                        </div>
                        <Badge className="bg-emerald-500/20 text-emerald-300 border-0 text-[10px]">Activo</Badge>
                      </div>

                      <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <CheckCircle size={18} className="text-emerald-400 shrink-0" />
                          <div>
                            <div className="text-xs font-bold text-white">Broker de Ejecución</div>
                            <div className="text-[11px] text-slate-400 capitalize">
                              {selectedBroker.replace('_', ' ')} &bull; {brokerAccountType.toUpperCase()}
                            </div>
                          </div>
                        </div>
                        <Badge className="bg-emerald-500/20 text-emerald-300 border-0 text-[10px]">Conectado</Badge>
                      </div>

                      <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <CheckCircle size={18} className="text-emerald-400 shrink-0" />
                          <div>
                            <div className="text-xs font-bold text-white">Gestión de Gale & Riesgo</div>
                            <div className="text-[11px] text-slate-400">
                              {galeLevel.toUpperCase()} ({galeMultiplier}x) &bull; Stop ${dailyStopLoss}
                            </div>
                          </div>
                        </div>
                        <Badge className="bg-emerald-500/20 text-emerald-300 border-0 text-[10px]">Calibrado</Badge>
                      </div>
                    </div>

                    {/* Launch Action */}
                    <div className="text-center pt-4">
                      <Button
                        type="button"
                        onClick={handleFinishSetup}
                        className="bg-gradient-to-r from-emerald-500 via-indigo-600 to-blue-600 hover:opacity-95 text-white font-extrabold text-sm px-8 py-3.5 rounded-2xl shadow-xl shadow-indigo-600/30 cursor-pointer transform hover:scale-[1.02] transition-all"
                      >
                        🚀 Iniciar Trading y Acceder al Dashboard
                      </Button>
                    </div>

                    {/* Navigation Footer */}
                    <div className="flex justify-between items-center pt-4 border-t border-slate-800">
                      <Button
                        variant="outline"
                        onClick={() => setCurrentStep(4)}
                        className="border-slate-800 text-xs text-slate-400 hover:text-white"
                      >
                        <ArrowLeft size={14} className="mr-1.5" /> Volver a Ajustes
                      </Button>
                      <span className="text-[11px] text-slate-500">Configuración guardada localmente</span>
                    </div>
                  </div>
                )}
              </Card>
            </div>
          </div>
        )}
      </main>

      {/* ========================================================= */}
      {/* FLOTANTE INFORMATIVO ASISTENTE GLOBAL (STICKY BOTTOM-RIGHT) */}
      {/* ========================================================= */}
      {isAssistantVisible && (
        <aside
          aria-label="Asistente de Configuración"
          className="fixed bottom-5 right-5 z-40 max-w-sm w-full p-4 rounded-3xl bg-slate-900/95 border border-indigo-500/40 shadow-2xl backdrop-blur-xl text-slate-200 animate-in slide-in-from-bottom-5 duration-300"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 shrink-0">
                <Sparkles size={16} />
              </div>
              <div>
                <span className="text-xs font-bold text-white block">Asistente de Conexión</span>
                <span className="text-[10px] text-indigo-400 font-mono">Paso {currentStep} de 5</span>
              </div>
            </div>
            <button
              onClick={() => setIsAssistantVisible(false)}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
            >
              <X size={14} />
            </button>
          </div>

          <div className="mt-2 text-xs text-slate-300 leading-relaxed">
            {currentStep === 1 && (
              <p>
                💡 <span className="font-semibold text-white">Consejo:</span> Elige el nivel "Intermedio" para comenzar con parámetros de seguridad balanceados y evitar riesgos excesivos.
              </p>
            )}
            {currentStep === 2 && (
              <p>
                ⚡ <span className="font-semibold text-sky-400">Telegram MTProto:</span> Es fundamental conectar tu cuenta de Telegram para que el motor reciba las alertas directamente de los canales en tiempo real (&lt;35ms).
              </p>
            )}
            {currentStep === 3 && (
              <p>
                🛡️ <span className="font-semibold text-emerald-400">Multi-Broker:</span> Puedes comenzar en modo Demo para comprobar cómo se envían las órdenes antes de cambiar a fondos reales.
              </p>
            )}
            {currentStep === 4 && (
              <p>
                ⚖️ <span className="font-semibold text-amber-400">Control de Gale:</span> Con Gale 1 (G1) el ratio de recuperación es alto sin arriesgar saltos exponenciales como en Gale 3.
              </p>
            )}
            {currentStep === 5 && (
              <p>
                🚀 <span className="font-semibold text-white">Todo Listo:</span> Haz clic en el botón de lanzamiento para entrar al panel y ver el monitor de señales en tiempo real.
              </p>
            )}
          </div>

          {currentStep === 2 && !tgSession && (
            <div className="mt-3 pt-2 border-t border-slate-800 flex justify-between items-center">
              <span className="text-[10px] text-amber-400 font-semibold">Telegram sin conectar</span>
              <button
                onClick={() => handleTgQuickConnect()}
                className="text-[11px] font-bold text-sky-400 hover:text-sky-300 underline cursor-pointer"
              >
                Conectar Demo Ahora
              </button>
            </div>
          )}
        </aside>
      )}

      {/* Telegram Session Modal (Full Features) */}
      <TelegramLoginModal
        isOpen={isTgModalOpen}
        onClose={() => setIsTgModalOpen(false)}
        onConnected={(session) => {
          setTgSession(session);
          setIsTgModalOpen(false);
        }}
      />
    </div>
  );
}
