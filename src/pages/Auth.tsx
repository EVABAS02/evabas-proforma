import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff, ArrowLeft, Lock, Mail, Phone, Building } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

export default function Auth() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [companyName, setCompanyName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { session, loading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && session) {
      navigate('/dashboard', { replace: true });
    }
  }, [authLoading, session, navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isSignUp) {
        if (password !== confirmPassword) throw new Error('Passwords do not match');
        if (!companyName.trim()) throw new Error('Company name is required');
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/dashboard`,
            data: { company_name: companyName, phone },
          },
        });
        if (error) throw error;
        toast.success('Account created!');
        navigate('/dashboard', { replace: true });
      } else {
        if (!email.trim() || !password.trim()) {
          throw new Error('Please fill in all fields');
        }
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate('/dashboard', { replace: true });
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      toast.error('Please enter your email first');
      return;
    }
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Reset email sent!');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-950 via-blue-900 to-blue-950 flex items-center justify-center p-4 py-8 sm:py-12 selection:bg-blue-500 selection:text-white relative overflow-hidden">
      
      {/* Background neon glow effects */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="w-[90%] sm:w-full max-w-[460px] relative z-10">
        
        {/* Main card with frosted glass style */}
        <div className="bg-blue-900/40 backdrop-blur-xl border border-blue-500/30 rounded-[32px] p-6 sm:p-8 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)]">
          
          {/* Logo at the top */}
          <div className="flex justify-center mb-6">
            <div className="flex items-baseline" style={{ letterSpacing: '1px', fontSize: 18 }}>
              <span style={{ fontWeight: 400, color: '#93C5FD' }}>Eva</span>
              <span style={{ fontWeight: 700, color: '#FFFFFF' }}>BAS</span>
            </div>
          </div>

          <h1 className="text-center text-white font-display text-2xl font-bold mb-1 tracking-wide">
            {isSignUp ? 'Create Account' : 'Login'}
          </h1>
          <p className="text-center text-blue-200/60 text-xs mb-6 font-medium">
            {isSignUp ? 'Get started in seconds' : 'Access your invoicing workspace'}
          </p>

          <form onSubmit={submit} className="space-y-4">
            {isSignUp && (
              <div className="space-y-1">
                <Label className="text-blue-200/80 text-[11px] font-semibold uppercase tracking-wider ml-1">Company Name</Label>
                <div className="relative">
                  <Building className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-blue-300/50" />
                  <Input value={companyName} onChange={e => setCompanyName(e.target.value)} required placeholder="My Company LLC"
                    className="bg-blue-950/40 border-blue-500/30 text-white placeholder:text-blue-300/30 focus-visible:ring-blue-400 rounded-2xl h-12 pl-10 text-sm shadow-inner" />
                </div>
              </div>
            )}

            <div className="space-y-1">
              <Label className="text-blue-200/80 text-[11px] font-semibold uppercase tracking-wider ml-1">Email / Username</Label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-blue-300/50" />
                <Input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="you@example.com"
                  className="bg-blue-950/40 border-blue-500/30 text-white placeholder:text-blue-300/30 focus-visible:ring-blue-400 rounded-2xl h-12 pl-10 text-sm shadow-inner" />
              </div>
            </div>

            {isSignUp && (
              <div className="space-y-1">
                <Label className="text-blue-200/80 text-[11px] font-semibold uppercase tracking-wider ml-1">WhatsApp Number</Label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-blue-300/50" />
                  <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+229 ..."
                    className="bg-blue-950/40 border-blue-500/30 text-white placeholder:text-blue-300/30 focus-visible:ring-blue-400 rounded-2xl h-12 pl-10 text-sm shadow-inner" />
                </div>
              </div>
            )}

            <div className="space-y-1">
              <div className="flex items-center justify-between ml-1 mr-1">
                <Label className="text-blue-200/80 text-[11px] font-semibold uppercase tracking-wider">Password</Label>
                {!isSignUp && (
                  <button type="button" onClick={handleForgotPassword} className="text-xs text-blue-300 hover:text-white transition-colors">
                    Forgot Password?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-blue-300/50" />
                <Input type={showPwd ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} required minLength={6} placeholder="••••••••"
                  className="bg-blue-950/40 border-blue-500/30 text-white placeholder:text-blue-300/30 focus-visible:ring-blue-400 rounded-2xl h-12 pl-10 pr-10 text-sm shadow-inner" />
                <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-blue-300/50 hover:text-white transition-colors">
                  {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {isSignUp && (
              <div className="space-y-1">
                <Label className="text-blue-200/80 text-[11px] font-semibold uppercase tracking-wider ml-1">Confirm Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-blue-300/50" />
                  <Input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required minLength={6} placeholder="••••••••"
                    className="bg-blue-950/40 border-blue-500/30 text-white placeholder:text-blue-300/30 focus-visible:ring-blue-400 rounded-2xl h-12 pl-10 text-sm shadow-inner" />
                </div>
              </div>
            )}

            {!isSignUp && (
              <div className="flex items-center justify-between text-xs text-blue-200/70 px-1 pt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="rounded border-blue-500/40 bg-blue-950 text-blue-600 focus:ring-0 w-3.5 h-3.5" />
                  <span>Remember me</span>
                </label>
              </div>
            )}

            <div className="pt-2">
              <Button type="submit" disabled={loading} className="w-full h-12 rounded-2xl bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-600 text-white font-bold text-sm shadow-[0_0_20px_rgba(37,99,235,0.4)] transition-all">
                {loading ? '...' : isSignUp ? 'Sign up' : 'Sign in'}
              </Button>
            </div>
          </form>

          <p className="text-center text-xs text-blue-200/70 mt-6 font-medium">
            {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button onClick={() => setIsSignUp(!isSignUp)} className="text-white font-bold hover:underline ml-1">
              {isSignUp ? 'Sign in' : 'Sign up'}
            </button>
          </p>

          <div className="mt-4 text-center">
            <Link to="/" className="inline-flex items-center gap-1.5 text-xs text-blue-300/50 hover:text-blue-200 transition-colors">
              <ArrowLeft className="h-3.5 w-3.5" /> Back to home
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}