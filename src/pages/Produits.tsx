import { useState } from 'react';
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
import { toast } from 'sonner';
import { formatFCFA } from '@/lib/format';

type Product = { id: string; name: string; description: string | null; unit_price: number; category: string | null };

export default function Produits() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({ name: '', unit_price: 0, category: '' });

  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const { data } = await supabase.from('products').select('*').order('name');
      return (data as Product[]) || [];
    },
  });

  const filtered = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));

  const reset = () => { setForm({ name: '', unit_price: 0, category: '' }); setEditing(null); };
  const openNew = () => { reset(); setOpen(true); };
  const openEdit = (p: Product) => {
    setEditing(p);
    setForm({ name: p.name, unit_price: p.unit_price, category: p.category || '' });
    setOpen(true);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    try {
      const payload = { ...form, unit_price: Math.round(Number(form.unit_price)) };
      if (editing) {
        const { error } = await supabase.from('products').update(payload).eq('id', editing.id);
        if (error) throw error;
        toast.success('Produit mis à jour');
      } else {
        const { error } = await supabase.from('products').insert({ ...payload, user_id: user.id });
        if (error) throw error;
        toast.success('Produit créé');
      }
      setOpen(false); reset();
      qc.invalidateQueries({ queryKey: ['products'] });
    } catch (err: any) { toast.error(err.message); }
  };

  const remove = async (id: string) => {
    if (!confirm('Supprimer ce produit ?')) return;
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) return toast.error(error.message);
    toast.success('Produit supprimé');
    qc.invalidateQueries({ queryKey: ['products'] });
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:flex-wrap justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold">Produits</h1>
            <p className="text-muted-foreground text-sm sm:text-base">Votre catalogue de produits</p>
          </div>
          <Button onClick={openNew} className="w-full sm:w-auto rounded-full bg-accent hover:bg-accent/90 h-11"><Plus className="h-4 w-4 mr-2" />Nouveau produit</Button>
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
              <p className="text-center text-muted-foreground py-8">Aucun produit</p>
            ) : (
              <>
              {/* Mobile cards */}
              <div className="md:hidden space-y-3">
                {filtered.map(p => (
                  <div key={p.id} className="border border-border rounded-lg p-4 flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium truncate">{p.name}</p>
                      {p.category && <p className="text-xs text-muted-foreground mt-0.5">{p.category}</p>}
                      <p className="text-sm font-semibold mt-1 tabular-nums">{formatFCFA(p.unit_price)}</p>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => openEdit(p)}><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" className="h-9 w-9 text-destructive" onClick={() => remove(p.id)}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </div>
                ))}
              </div>
              {/* Desktop table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-muted-foreground border-b">
                      <th className="py-3 pr-4">Désignation</th>
                      <th className="py-3 pr-4">Catégorie</th>
                      <th className="py-3 pr-4 text-right">Prix unitaire</th>
                      <th className="py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(p => (
                      <tr key={p.id} className="border-b last:border-0 hover:bg-muted/30">
                        <td className="py-3 pr-4 font-medium">{p.name}</td>
                        <td className="py-3 pr-4 text-muted-foreground">{p.category || '—'}</td>
                        <td className="py-3 pr-4 text-right tabular-nums">{formatFCFA(p.unit_price)}</td>
                        <td className="py-3 text-right">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(p)}><Pencil className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => remove(p.id)}><Trash2 className="h-4 w-4" /></Button>
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
            <DialogHeader><DialogTitle>{editing ? 'Modifier le produit' : 'Nouveau produit'}</DialogTitle></DialogHeader>
            <form onSubmit={submit} className="space-y-4">
              <div><Label>Désignation *</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required /></div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div><Label>Catégorie</Label><Input value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} /></div>
                <div><Label>Prix unitaire (FCFA) *</Label><Input type="number" min="0" value={form.unit_price} onChange={e => setForm({ ...form, unit_price: Number(e.target.value) })} required /></div>
              </div>
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
