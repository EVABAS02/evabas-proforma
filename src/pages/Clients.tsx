import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import AppLayout from '@/components/AppLayout';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Plus, Pencil, Trash2, Search } from 'lucide-react';
import { toast as sonnerToast } from 'sonner';
import { toast } from '@/hooks/use-toast';

type Client = { id: string; nom: string; telephone: string | null; adresse: string | null; ifu: string | null };

export default function Clients() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Client | null>(null);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({ nom: '', telephone: '', adresse: '', ifu: '' });
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id || null);
    };
    getUser();
  }, []);

  const { data: clients = [] } = useQuery({
    queryKey: ['clients', userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase.from('clients').select('*').eq('user_id', userId).order('nom');
      if (error) throw error;
      return (data as Client[]) || [];
    },
  });

  const filtered = clients.filter(c => c.nom.toLowerCase().includes(search.toLowerCase()));

  const reset = () => { setForm({ nom: '', telephone: '', adresse: '', ifu: '' }); setEditing(null); };

  const openNew = () => { reset(); setOpen(true); };
  const openEdit = (c: Client) => {
    setEditing(c);
    setForm({ nom: c.nom, telephone: c.telephone || '', adresse: c.adresse || '', ifu: c.ifu || '' });
    setOpen(true);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    try {
      if (!userId) throw new Error('Utilisateur non authentifie');
      const payload = {
        nom: form.nom,
        telephone: form.telephone || null,
        ifu: form.ifu || null,
        adresse: form.adresse || null,
        user_id: userId,
      };

      if (editing) {
        const { error } = await supabase.from('clients').update(payload).eq('id', editing.id);
        if (error) throw error;
        sonnerToast.success('Client mis a jour');
      } else {
        const { error } = await supabase.from('clients').insert(payload);
        if (error) throw error;
        sonnerToast.success('Client cree');
      }
      setOpen(false); reset();
      qc.invalidateQueries({ queryKey: ['clients'] });
    } catch (error) {
      console.error('Supabase error:', error);
      toast({
        title: "Erreur détaillée",
        description: JSON.stringify(error),
        variant: "destructive"
      });
    }
  };

  const remove = async (id: string) => {
    if (!confirm('Supprimer ce client ?')) return;
    const { error } = await supabase.from('clients').delete().eq('id', id);
    if (error) return sonnerToast.error(error.message);
    sonnerToast.success('Client supprime');
    qc.invalidateQueries({ queryKey: ['clients'] });
  };

  return (
    <AppLayout>
      <div className="space-y-6 bg-white p-4 sm:p-6 rounded-3xl min-h-screen text-slate-900">
        <div className="flex flex-col sm:flex-row sm:flex-wrap justify-between gap-4 border-b border-blue-50 pb-6">
          <div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-blue-950">Clients</h1>
            <p className="text-blue-600/70 text-sm sm:text-base font-medium">Gérez votre carnet d'adresses</p>
          </div>
          <Button onClick={openNew} className="w-full sm:w-auto rounded-full bg-blue-600 hover:bg-blue-700 text-white h-11 font-semibold shadow-sm">
            <Plus className="h-4 w-4 mr-2" />Nouveau client
          </Button>
        </div>

        <Card className="shadow-sm border-blue-100 bg-white">
          <CardHeader>
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-blue-400" />
              <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher..." className="pl-9 border-blue-100 focus-visible:ring-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            {filtered.length === 0 ? (
              <p className="text-center text-blue-400 py-8 font-medium">Aucun client</p>
            ) : (
              <>
              <div className="md:hidden space-y-3">
                {filtered.map(c => (
                  <div key={c.id} className="border border-blue-100 bg-blue-50/20 rounded-2xl p-4 flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-blue-950 truncate">{c.nom}</p>
                      {c.telephone && <p className="text-xs text-blue-600/70 mt-0.5">{c.telephone}</p>}
                      {c.ifu && <p className="text-xs text-blue-600/70 truncate">IFU: {c.ifu}</p>}
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button variant="ghost" size="icon" className="h-9 w-9 text-blue-600 hover:bg-blue-100 rounded-full" onClick={() => openEdit(c)}><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" className="h-9 w-9 text-red-500 hover:bg-red-50 rounded-full" onClick={() => remove(c.id)}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-blue-400 uppercase font-bold border-b border-blue-100">
                      <th className="py-3 pr-4">Nom</th>
                      <th className="py-3 pr-4">Téléphone</th>
                      <th className="py-3 pr-4">IFU</th>
                      <th className="py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-blue-50">
                    {filtered.map(c => (
                      <tr key={c.id} className="hover:bg-blue-50/50 transition-colors">
                        <td className="py-3 pr-4 font-semibold text-blue-950">{c.nom}</td>
                        <td className="py-3 pr-4 text-blue-600/70">{c.telephone || '-'}</td>
                        <td className="py-3 pr-4 text-blue-600/70">{c.ifu || '-'}</td>
                        <td className="py-3 text-right">
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600 hover:bg-blue-100 rounded-full" onClick={() => openEdit(c)}><Pencil className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:bg-red-50 rounded-full" onClick={() => remove(c.id)}><Trash2 className="h-4 w-4" /></Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              </>
            )}
          </CardContent>
        </Card>

        <Dialog open={open} onOpenChange={(o) => { if (!o) reset(); setOpen(o); }}>
          <DialogContent className="border-blue-100 bg-white">
            <DialogHeader><DialogTitle className="text-blue-950 font-bold">{editing ? 'Modifier le client' : 'Nouveau client'}</DialogTitle></DialogHeader>
            <form onSubmit={submit} className="space-y-4">
              <div><Label className="text-blue-950">Nom *</Label><Input value={form.nom} onChange={e => setForm({ ...form, nom: e.target.value })} required className="border-blue-100 focus-visible:ring-blue-600" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label className="text-blue-950">Téléphone</Label><Input value={form.telephone} onChange={e => setForm({ ...form, telephone: e.target.value })} className="border-blue-100 focus-visible:ring-blue-600" /></div>
                <div><Label className="text-blue-950">IFU</Label><Input value={form.ifu} onChange={e => setForm({ ...form, ifu: e.target.value })} className="border-blue-100 focus-visible:ring-blue-600" /></div>
              </div>
              <div><Label className="text-blue-950">Adresse</Label><Input value={form.adresse} onChange={e => setForm({ ...form, adresse: e.target.value })} className="border-blue-100 focus-visible:ring-blue-600" /></div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setOpen(false)} className="border-blue-200 text-blue-950 hover:bg-blue-50 rounded-full">Annuler</Button>
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white rounded-full">{editing ? 'Mettre à jour' : 'Créer'}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}