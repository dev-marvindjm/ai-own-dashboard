import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { useNavigate } from 'react-router-dom';
import { login, register } from '@/services/rustApi';
import { ShieldCheck, AlertCircle, Sparkles, Rocket } from 'lucide-react';

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('trader@quant.com');
  const [password, setPassword] = useState('QuantTrader2026!');
  const [username, setUsername] = useState('trader');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (isLogin) {
        await login(email, password);
      } else {
        await register({ email, password, username: username || undefined, role: 'trader' });
        await login(email, password);
      }
      navigate('/');
    } catch (err: any) {
      setError(err?.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickAdminLogin = async () => {
    setError(null);
    setLoading(true);
    try {
      await login('trader@quant.com', 'QuantTrader2026!');
      navigate('/');
    } catch (err: any) {
      setError(err?.message || 'Admin login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f] p-4 relative overflow-hidden">
      {/* Background gradients */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-600/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-purple-600/20 rounded-full blur-[120px] pointer-events-none" />

      <Card className="w-full max-w-md bg-white/5 border-white/10 backdrop-blur-xl shadow-2xl relative z-10 text-white">
        <CardHeader className="space-y-1 text-center pb-6">
          <div className="flex justify-center mb-2">
            <div className="p-3 bg-indigo-500/10 border border-indigo-500/30 rounded-2xl text-indigo-400">
              <ShieldCheck size={32} />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold tracking-tight">
            {isLogin ? 'Welcome Back' : 'Create Account'}
          </CardTitle>
          <p className="text-slate-400 text-sm">
            {isLogin ? 'Enter your credentials to access the quant trading dashboard' : 'Sign up to start automating your trades'}
          </p>
        </CardHeader>
        
        {error && (
          <div className="mx-6 mb-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle size={16} className="shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {!isLogin && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Username</label>
                <Input 
                  required 
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="johndoe" 
                  className="bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus-visible:ring-blue-500" 
                />
              </div>
            )}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Email Address or Username</label>
              <Input 
                required 
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@quant.com" 
                className="bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus-visible:ring-blue-500" 
              />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-sm font-medium text-slate-300">Password</label>
                {isLogin && <a href="#" className="text-xs text-blue-400 hover:text-blue-300">Forgot password?</a>}
              </div>
              <Input 
                required 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••" 
                className="bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus-visible:ring-blue-500" 
              />
            </div>
          </CardContent>

          <CardFooter className="flex flex-col gap-3 pt-4">
            <Button 
              type="submit" 
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white border-0 font-bold py-2.5"
            >
              {loading ? 'Authenticating...' : (isLogin ? 'Sign In' : 'Register')}
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={handleQuickAdminLogin}
              disabled={loading}
              className="w-full border-indigo-500/40 text-indigo-300 hover:bg-indigo-500/10 gap-2 text-xs font-semibold py-2"
            >
              <Sparkles size={14} className="text-indigo-400" /> Quick Admin Login (Master Demo)
            </Button>

            <Button
              type="button"
              variant="ghost"
              onClick={() => navigate('/get-started')}
              className="w-full text-sky-400 hover:text-sky-300 hover:bg-sky-500/10 gap-2 text-xs font-bold py-2"
            >
              <Rocket size={14} className="text-sky-400" /> Iniciar Tutorial Guiado (Get Started)
            </Button>

            <div className="text-center text-sm text-slate-400 mt-1">
              {isLogin ? "Don't have an account? " : "Already have an account? "}
              <button 
                type="button" 
                onClick={() => { setIsLogin(!isLogin); setError(null); }} 
                className="text-blue-400 hover:text-blue-300 font-medium transition-colors cursor-pointer"
              >
                {isLogin ? 'Sign up' : 'Sign in'}
              </button>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
