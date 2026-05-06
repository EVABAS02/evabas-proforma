import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') setReady(true);
    });
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setReady(true);
    });
    return () => subscription.unsubscribe();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      toast.error('Les mots de passe ne correspondent pas');
      return;
    }
    if (password.length < 6) {
      toast.error('Mot de passe trop court (6 caractères min)');
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Mot de passe mis à jour !');
      navigate('/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-stars flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-[90%] sm:w-full max-w-[480px]">
        <div className="mb-4 flex justify-center">
          <Link to="/" className="inline-flex items-center gap-2 text-white/70 hover:text-white text-sm">
            <ArrowLeft className="h-4 w-4" /> Retour à l'accueil
          </Link>
        </div>
        <div className="glass rounded-2xl p-6 sm:p-8 shadow-2xl">
          <div className="flex justify-center mb-5">
            <div className="flex items-baseline" style={{ letterSpacing: '1px', fontSize: 16 }}>
              <span style={{ fontWeight: 400, color: '#94A3B8' }}>Eva</span>
              <span style={{ fontWeight: 700, color: '#FFFFFF' }}>BAS</span>
            </div>
          </div>
          <h1 className="text-center text-white font-display text-xl sm:text-2xl font-bold mb-1">
            Nouveau mot de passe
          </h1>
          <p className="text-center text-white/60 text-sm mb-6">
            Choisissez un nouveau mot de passe sécurisé
          </p>
          {!ready ? (
            <p className="text-center text-white/70 text-sm">Vérification du lien...</p>
          ) : (
            <form onSubmit={submit} className="space-y-4">
              <div>
                <Label className="text-white/80 text-xs">Nouveau mot de passe</Label>
                <Input type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={6}
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus-visible:ring-primary" />
              </div>
              <div>
                <Label className="text-white/80 text-xs">Confirmer le mot de passe</Label>
                <Input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} required minLength={6}
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus-visible:ring-primary" />
              </div>
              <Button type="submit" disabled={loading} className="w-full h-11 rounded-lg bg-primary hover:bg-primary/90 font-semibold">
                {loading ? '...' : 'Mettre à jour'}
              </Button>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
}