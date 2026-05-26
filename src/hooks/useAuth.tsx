import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({ session: null, user: null, loading: true, signOut: async () => {} });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const ensureProfile = async (authUser: User) => {
      try {
        const { data: existing } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', authUser.id)
          .maybeSingle();
        if (!existing) {
          await supabase.from('profiles').insert({
            id: authUser.id,
            company_name: authUser.user_metadata?.company_name ?? 'Mon Entreprise',
            email: authUser.email ?? null,
            phone_whatsapp: authUser.user_metadata?.phone ?? null,
          });
        }
      } catch (err) {
        console.error('ensureProfile error', err);
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setLoading(false);
      if (event === 'SIGNED_IN' && session?.user) {
        // Defer to avoid deadlock with Supabase auth callback
        setTimeout(() => ensureProfile(session.user), 0);
      }
    });
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
      if (session?.user) {
        ensureProfile(session.user);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  return (
    <AuthContext.Provider value={{ session, user: session?.user ?? null, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
