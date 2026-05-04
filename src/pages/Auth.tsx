import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { lovable } from '@/integrations/lovable/index';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Logo } from '@/components/Logo';
import { Eye, EyeOff } from 'lucide-react';
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
  const [signupSuccess, setSignupSuccess] = useState(false);
  const navigate = useNavigate();

  // Ensure company_name lands in profiles after first login (in case the trigger ran before metadata existed).
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        const meta = session.user.user_metadata || {};
        if (meta.company_name || meta.phone_whatsapp) {
          await supabase.from('profiles').upsert({
            id: session.user.id,
            company_name: meta.company_name || '',
            phone_whatsapp: meta.phone_whatsapp || null,
            email: session.user.email,
          }, { onConflict: 'id' });
        }
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isSignUp) {
        if (password !== confirmPassword) throw new Error('Les mots de passe ne correspondent pas');
        if (!companyName.trim()) throw new Error("Le nom de l'entreprise est requis");
        const { error } = await supabase.auth.signUp({
          email, password,
          options: {
            emailRedirectTo: `${window.location.origin}/dashboard`,
            data: { company_name: companyName, phone_whatsapp: phone },
          },
        });
        if (error) throw error;
        toast.success('Compte créé ! Vérifiez votre email pour confirmer votre inscription.');
        setSignupSuccess(true);
        setTimeout(() => {
          setSignupSuccess(false);
          setIsSignUp(false);
        }, 3000);
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate('/dashboard');
      }
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const oauth = async (provider: 'google' | 'apple') => {
    const result = await lovable.auth.signInWithOAuth(provider, { redirect_uri: `${window.location.origin}/dashboard` });
    if (result.error) toast.error("Erreur d'authentification");
    if (result.redirected) return;
  };

  return (
    <div className="min-h-screen bg-stars flex items-center justify-center p-4 py-12">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="w-full max-w-md">
        <div className="glass rounded-2xl p-8 shadow-2xl">
          <div className="flex justify-center mb-6"><Logo dark size="lg" /></div>
          <h1 className="text-center text-white font-display text-2xl font-bold mb-1">
            {isSignUp ? 'Créez votre compte' : 'Connectez-vous à votre compte'}
          </h1>
          <p className="text-center text-white/60 text-sm mb-6">
            {isSignUp ? 'Commencez gratuitement en quelques secondes' : 'Bienvenue sur Evabas Proforma'}
          </p>

          {signupSuccess ? (
            <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/30 p-4 text-emerald-200 text-sm text-center">
              Compte créé ! Vérifiez votre email pour confirmer votre inscription.
              <p className="text-white/50 text-xs mt-2">Redirection vers la connexion…</p>
            </div>
          ) : (
          <form onSubmit={submit} className="space-y-4">
            {isSignUp && (
              <div>
                <Label className="text-white/80 text-xs">Nom de l'entreprise</Label>
                <Input value={companyName} onChange={e => setCompanyName(e.target.value)} required placeholder="Mon Entreprise SARL"
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus-visible:ring-primary" />
              </div>
            )}
            <div>
              <Label className="text-white/80 text-xs">Email</Label>
              <Input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="vous@exemple.com"
                className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus-visible:ring-primary" />
            </div>
            {isSignUp && (
              <div>
                <Label className="text-white/80 text-xs">Numéro WhatsApp</Label>
                <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+229 ..."
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus-visible:ring-primary" />
              </div>
            )}
            <div>
              <div className="flex items-center justify-between">
                <Label className="text-white/80 text-xs">Mot de passe</Label>
                {!isSignUp && <a href="#" className="text-xs text-accent hover:underline">Mot de passe oublié ?</a>}
              </div>
              <div className="relative">
                <Input type={showPwd ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} required minLength={6}
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus-visible:ring-primary pr-10" />
                <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white">
                  {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            {isSignUp && (
              <div>
                <Label className="text-white/80 text-xs">Confirmer le mot de passe</Label>
                <Input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required minLength={6}
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus-visible:ring-primary" />
              </div>
            )}
            <Button type="submit" disabled={loading} className="w-full h-11 rounded-lg bg-primary hover:bg-primary/90 font-semibold">
              {loading ? '...' : isSignUp ? 'Créer mon compte' : 'Se connecter'}
            </Button>
          </form>
          )}

          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-xs text-white/40">ou</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          <div className="space-y-2">
            <Button type="button" variant="outline" onClick={() => oauth('google')}
              className="w-full h-11 rounded-lg bg-transparent border-white/15 text-white hover:bg-white/10 hover:text-white">
              Continuer avec Google
            </Button>
            <Button type="button" variant="outline" onClick={() => oauth('apple')}
              className="w-full h-11 rounded-lg bg-transparent border-white/15 text-white hover:bg-white/10 hover:text-white">
              Continuer avec Apple
            </Button>
          </div>

          <p className="text-center text-sm text-white/60 mt-6">
            {isSignUp ? 'Déjà un compte ?' : 'Pas encore de compte ?'}{' '}
            <button onClick={() => setIsSignUp(!isSignUp)} className="text-accent font-semibold hover:underline">
              {isSignUp ? 'Se connecter' : "S'inscrire"}
            </button>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
