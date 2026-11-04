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
  const [form, setForm] = useState({ company_name: '', adresse: '', telephone: '', email: '', regime_fiscal: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      setForm({
        company_name: profile.company_name || '',
        adresse: profile.company_address || '',
        telephone: profile.phone_whatsapp || '',
        email: profile.email || '',
        regime_fiscal: profile.regime_fiscal || '',
      });
    }
  }, [profile]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    const payload = {
      company_name: form.company_name,
      company_address: form.adresse || null,
      phone_whatsapp: form.telephone || null,
      email: form.email || null,
      regime_fiscal: form.regime_fiscal,
    };
    const { error } = await supabase.from('profiles').update(payload).eq('id', user.id);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success('Paramètres enregistrés');
    qc.invalidateQueries({ queryKey: ['profile', user.id] });
  };

  return (
    <AppLayout>
      <div className="max-w-2xl space-y-6 bg-white p-4 sm:p-6 rounded-3xl min-h-screen text-slate-900">
        <div className="border-b border-blue-50 pb-6">
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-blue-950">Paramètres</h1>
          <p className="text-blue-600/70 text-sm sm:text-base font-medium">Informations de votre entreprise</p>
        </div>
        <Card className="shadow-sm border-blue-100 bg-white">
          <CardHeader><CardTitle className="font-display text-blue-950">Profil entreprise</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={save} className="space-y-4">
              <div><Label className="text-blue-950">Nom de l'entreprise *</Label><Input value={form.company_name} onChange={e => setForm({ ...form, company_name: e.target.value })} required className="border-blue-100 focus-visible:ring-blue-600" /></div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2"><Label className="text-blue-950">Adresse</Label><Input value={form.adresse} onChange={e => setForm({ ...form, adresse: e.target.value })} className="border-blue-100 focus-visible:ring-blue-600" /></div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div><Label className="text-blue-950">Téléphone</Label><Input value={form.telephone} onChange={e => setForm({ ...form, telephone: e.target.value })} placeholder="+229 ..." className="border-blue-100 focus-visible:ring-blue-600" /></div>
                <div><Label className="text-blue-950">Email</Label><Input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="border-blue-100 focus-visible:ring-blue-600" /></div>
              </div>
              <div className="pt-2">
                <Label className="block mb-2 text-blue-950">Régime fiscal de votre entreprise</Label>
                <RadioGroup value={form.regime_fiscal} onValueChange={(v) => setForm({ ...form, regime_fiscal: v })} className="gap-2">
                  <label className="flex items-center gap-2 text-sm text-blue-900 cursor-pointer"><RadioGroupItem value="tva" />Régime TVA (CA &gt; 50 millions FCFA)</label>
                  <label className="flex items-center gap-2 text-sm text-blue-900 cursor-pointer"><RadioGroupItem value="tps" />Régime TPS (CA &lt; 50 millions FCFA)</label>
                  <label className="flex items-center gap-2 text-sm text-blue-900 cursor-pointer"><RadioGroupItem value="inconnu" />Je ne sais pas encore</label>
                </RadioGroup>
              </div>
              <Button type="submit" disabled={saving} className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white h-11 rounded-full font-semibold shadow-sm">
                {saving ? 'Enregistrement...' : 'Enregistrer'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}