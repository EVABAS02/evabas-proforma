import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff, ArrowLeft } from 'lucide-react';
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

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isSignUp) {
        if (password !== confirmPassword) throw new Error('Les mots de passe ne correspondent pas');
        if (!companyName.trim()) throw new Error("Le nom de l'entreprise est requis");
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/dashboard`,
            data: { company_name: companyName, phone_whatsapp: phone },
          },
        });
        if (error) throw error;
        toast.success('Compte créé !');
        navigate('/dashboard');
      } else {
        if (!email.trim() || !password.trim()) {
          throw new Error('Veuillez remplir tous les champs');
        }
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

  const handleForgotPassword = async () => {
    if (!email) {
      toast.error("Entrez d'abord votre email");
      return;
    }
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Email de réinitialisation envoyé !');
    }
  };

  return (
    <div className="min-h-screen bg-stars flex items-center justify-center p-4 py-8 sm:py-12">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="w-[90%] sm:w-full max-w-[480px]">
        <div className="glass rounded-2xl p-6 sm:p-8 shadow-2xl">
          <div className="flex justify-center mb-5">
            <div className="flex items-baseline" style={{ letterSpacing: '1px', fontSize: 16 }}>
              <span style={{ fontWeight: 400, color: '#94A3B8' }}>Eva</span>
              <span style={{ fontWeight: 700, color: '#FFFFFF' }}>BAS</span>
            </div>
          </div>
          <h1 className="text-center text-white font-display text-xl sm:text-2xl font-bold mb-1">
            {isSignUp ? 'Créez votre compte' : 'Connectez-vous à votre compte'}
          </h1>
          <p className="text-center text-white/60 text-sm mb-6">
            {isSignUp ? 'Commencez gratuitement en quelques secondes' : 'Bienvenue sur Evabas Proforma'}
          </p>

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
                {!isSignUp && (
                  <button type="button" onClick={handleForgotPassword} className="text-xs text-accent hover:underline">
                    Mot de passe oublié ?
                  </button>
                )}
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

          <p className="text-center text-sm text-white/60 mt-6">
            {isSignUp ? 'Déjà un compte ?' : 'Pas encore de compte ?'}{' '}
            <button onClick={() => setIsSignUp(!isSignUp)} className="text-accent font-semibold hover:underline">
              {isSignUp ? 'Se connecter' : "S'inscrire"}
            </button>
          </p>
          <div className="mt-4 text-center">
            <Link to="/" className="inline-flex items-center gap-1 text-xs text-white/40 hover:text-white/70 transition-colors">
              <ArrowLeft className="h-3 w-3" /> Retour à l'accueil
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
