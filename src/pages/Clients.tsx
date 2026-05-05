import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import AppLayout from '@/components/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Plus, Pencil, Trash2, Search } from 'lucide-react';
import { toast } from 'sonner';

type Client = { id: string; name: string; email: string | null; phone: string | null; address: string | null; ifu: string | null };

export default function Clients() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Client | null>(null);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({ name: '', email: '', phone: '', address: '', ifu: '' });

  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: async () => {
      const { data } = await supabase.from('clients').select('*').order('name');
      return (data as Client[]) || [];
    },
  });

  const filtered = clients.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));

  const reset = () => { setForm({ name: '', email: '', phone: '', address: '', ifu: '' }); setEditing(null); };

  const openNew = () => { reset(); setOpen(true); };
  const openEdit = (c: Client) => {
    setEditing(c);
    setForm({ name: c.name, email: c.email || '', phone: c.phone || '', address: c.address || '', ifu: c.ifu || '' });
    setOpen(true);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    try {
      if (editing) {
        const { error } = await supabase.from('clients').update(form).eq('id', editing.id);
        if (error) throw error;
        toast.success('Client mis à jour');
      } else {
        const { error } = await supabase.from('clients').insert({ ...form, user_id: user.id });
        if (error) throw error;
        toast.success('Client créé');
      }
      setOpen(false); reset();
      qc.invalidateQueries({ queryKey: ['clients'] });
    } catch (err: any) { toast.error(err.message); }
  };

  const remove = async (id: string) => {
    if (!confirm('Supprimer ce client ?')) return;
    const { error } = await supabase.from('clients').delete().eq('id', id);
    if (error) return toast.error(error.message);
    toast.success('Client supprimé');
    qc.invalidateQueries({ queryKey: ['clients'] });
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:flex-wrap justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold">Clients</h1>
            <p className="text-muted-foreground text-sm sm:text-base">Gérez votre carnet d'adresses</p>
          </div>
          <Button onClick={openNew} className="w-full sm:w-auto rounded-full bg-accent hover:bg-accent/90 h-11"><Plus className="h-4 w-4 mr-2" />Nouveau client</Button>
        </div>

        <Card className="shadow-card border-border/60">
          <CardHeader>
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher..." className="pl-9" />
            </div>
          </CardHeader>
          <CardContent>
            {filtered.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">Aucun client</p>
            ) : (
              <>
              <div className="md:hidden space-y-3">
                {filtered.map(c => (
                  <div key={c.id} className="border border-border rounded-lg p-4 flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium truncate">{c.name}</p>
                      {c.phone && <p className="text-xs text-muted-foreground mt-0.5">{c.phone}</p>}
                      {c.email && <p className="text-xs text-muted-foreground truncate">{c.email}</p>}
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => openEdit(c)}><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" className="h-9 w-9 text-destructive" onClick={() => remove(c.id)}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-muted-foreground border-b">
                      <th className="py-3 pr-4">Nom</th>
                      <th className="py-3 pr-4">Téléphone</th>
                      <th className="py-3 pr-4">Email</th>
                      <th className="py-3 pr-4">IFU</th>
                      <th className="py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(c => (
                      <tr key={c.id} className="border-b last:border-0 hover:bg-muted/30">
                        <td className="py-3 pr-4 font-medium">{c.name}</td>
                        <td className="py-3 pr-4 text-muted-foreground">{c.phone || '—'}</td>
                        <td className="py-3 pr-4 text-muted-foreground">{c.email || '—'}</td>
                        <td className="py-3 pr-4 text-muted-foreground">{c.ifu || '—'}</td>
                        <td className="py-3 text-right">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(c)}><Pencil className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => remove(c.id)}><Trash2 className="h-4 w-4" /></Button>
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
          <DialogContent>
            <DialogHeader><DialogTitle>{editing ? 'Modifier le client' : 'Nouveau client'}</DialogTitle></DialogHeader>
            <form onSubmit={submit} className="space-y-4">
              <div><Label>Nom *</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Téléphone</Label><Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></div>
                <div><Label>Email</Label><Input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
              </div>
              <div><Label>Adresse</Label><Input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} /></div>
              <div><Label>IFU</Label><Input value={form.ifu} onChange={e => setForm({ ...form, ifu: e.target.value })} /></div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>Annuler</Button>
                <Button type="submit" className="bg-primary hover:bg-primary/90">{editing ? 'Mettre à jour' : 'Créer'}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
