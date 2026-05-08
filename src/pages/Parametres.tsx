import { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from '@/hooks/useProfile';
import { useAuth } from '@/hooks/useAuth';
import AppLayout from '@/components/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { toast } from 'sonner';

export default function Parametres() {
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const qc = useQueryClient();
  const [form, setForm] = useState({ company_name: '', company_address: '', company_city: '', phone_whatsapp: '', email: '', regime_fiscal: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      setForm({
        company_name: profile.company_name || '',
        company_address: profile.company_address || '',
        company_city: profile.company_city || '',
        phone_whatsapp: profile.phone_whatsapp || '',
        email: profile.email || '',
        regime_fiscal: (profile as any).regime_fiscal || '',
      });
    }
  }, [profile]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from('profiles').upsert({ id: user.id, ...form });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success('Paramètres enregistrés');
    qc.invalidateQueries({ queryKey: ['profile', user.id] });
  };

  return (
    <AppLayout>
      <div className="max-w-2xl space-y-6">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold">Paramètres</h1>
          <p className="text-muted-foreground text-sm sm:text-base">Informations de votre entreprise</p>
        </div>
        <Card className="shadow-card border-border/60">
          <CardHeader><CardTitle className="font-display">Profil entreprise</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={save} className="space-y-4">
              <div><Label>Nom de l'entreprise *</Label><Input value={form.company_name} onChange={e => setForm({ ...form, company_name: e.target.value })} required /></div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div><Label>Adresse</Label><Input value={form.company_address} onChange={e => setForm({ ...form, company_address: e.target.value })} /></div>
                <div><Label>Ville</Label><Input value={form.company_city} onChange={e => setForm({ ...form, company_city: e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div><Label>WhatsApp</Label><Input value={form.phone_whatsapp} onChange={e => setForm({ ...form, phone_whatsapp: e.target.value })} placeholder="+229 ..." /></div>
                <div><Label>Email</Label><Input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
              </div>
              <div className="pt-2">
                <Label className="block mb-2">Régime fiscal de votre entreprise</Label>
                <RadioGroup value={form.regime_fiscal} onValueChange={(v) => setForm({ ...form, regime_fiscal: v })} className="gap-2">
                  <label className="flex items-center gap-2 text-sm cursor-pointer"><RadioGroupItem value="tva" />Régime TVA (CA &gt; 50 millions FCFA)</label>
                  <label className="flex items-center gap-2 text-sm cursor-pointer"><RadioGroupItem value="tps" />Régime TPS (CA &lt; 50 millions FCFA)</label>
                  <label className="flex items-center gap-2 text-sm cursor-pointer"><RadioGroupItem value="inconnu" />Je ne sais pas encore</label>
                </RadioGroup>
              </div>
              <Button type="submit" disabled={saving} className="w-full sm:w-auto bg-primary hover:bg-primary/90 h-11">
                {saving ? 'Enregistrement...' : 'Enregistrer'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
