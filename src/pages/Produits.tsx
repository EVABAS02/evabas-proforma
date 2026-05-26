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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Pencil, Trash2, Search } from 'lucide-react';
import { toast } from 'sonner';
import { formatFCFA } from '@/lib/format';

type Product = {
  id: string;
  designation: string;
  unite: string | null;
  prix_unitaire: number;
  categorie: string | null;
};

const categories = ['Vin', 'Alimentaire', 'Entretien', 'Général'] as const;

export default function Produits() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({ designation: '', unite: '', prix_unitaire: 0, categorie: 'Général' });

  const { data: products = [] } = useQuery({
    queryKey: ['produits'],
    queryFn: async () => {
      const { data, error } = await supabase.from('produits').select('*').order('designation');
      if (error) throw error;
      return (data as Product[]) || [];
    },
  });

  const filtered = products.filter(p => p.designation.toLowerCase().includes(search.toLowerCase()));

  const reset = () => { setForm({ designation: '', unite: '', prix_unitaire: 0, categorie: 'Général' }); setEditing(null); };
  const openNew = () => { reset(); setOpen(true); };
  const openEdit = (p: Product) => {
    setEditing(p);
    setForm({
      designation: p.designation,
      unite: p.unite || '',
      prix_unitaire: p.prix_unitaire,
      categorie: p.categorie || 'Général',
    });
    setOpen(true);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      const userId = authUser?.id;
      const payload = {
        designation: form.designation,
        unite: form.unite || null,
        prix_unitaire: Number(form.prix_unitaire),
        categorie: form.categorie || 'Général',
        user_id: userId,
      };

      if (editing) {
        const { error } = await supabase.from('produits').update(payload).eq('id', editing.id);
        if (error) {
          console.error('Produits error:', error);
          throw error;
        }
        toast.success('Produit mis a jour');
      } else {
        const { error } = await supabase.from('produits').insert(payload);
        if (error) {
          console.error('Produits error:', error);
          throw error;
        }
        toast.success('Produit cree');
      }
      setOpen(false); reset();
      qc.invalidateQueries({ queryKey: ['produits'] });
    } catch (err) { toast.error(err instanceof Error ? err.message : 'Une erreur est survenue'); }
  };

  const remove = async (id: string) => {
    if (!confirm('Supprimer ce produit ?')) return;
    const { error } = await supabase.from('produits').delete().eq('id', id);
    if (error) return toast.error(error.message);
    toast.success('Produit supprime');
    qc.invalidateQueries({ queryKey: ['produits'] });
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
              <div className="md:hidden space-y-3">
                {filtered.map(p => (
                  <div key={p.id} className="border border-border rounded-lg p-4 flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium truncate">{p.designation}</p>
                      {p.unite && <p className="text-xs text-muted-foreground mt-0.5">{p.unite}</p>}
                      <p className="text-sm font-semibold mt-1 tabular-nums">{formatFCFA(p.prix_unitaire)}</p>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => openEdit(p)}><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" className="h-9 w-9 text-destructive" onClick={() => remove(p.id)}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-muted-foreground border-b">
                      <th className="py-3 pr-4">Designation</th>
                      <th className="py-3 pr-4">Unite</th>
                      <th className="py-3 pr-4">Categorie</th>
                      <th className="py-3 pr-4 text-right">Prix unitaire</th>
                      <th className="py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(p => (
                      <tr key={p.id} className="border-b last:border-0 hover:bg-muted/30">
                        <td className="py-3 pr-4 font-medium">{p.designation}</td>
                        <td className="py-3 pr-4 text-muted-foreground">{p.unite || '-'}</td>
                        <td className="py-3 pr-4 text-muted-foreground">{p.categorie || '-'}</td>
                        <td className="py-3 pr-4 text-right tabular-nums">{formatFCFA(p.prix_unitaire)}</td>
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
              <div><Label>Designation *</Label><Input value={form.designation} onChange={e => setForm({ ...form, designation: e.target.value })} required /></div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div><Label>Unite</Label><Input value={form.unite} onChange={e => setForm({ ...form, unite: e.target.value })} placeholder="piece, m2, kg..." /></div>
                <div><Label>Prix unitaire (FCFA) *</Label><Input type="number" min="0" value={form.prix_unitaire} onChange={e => setForm({ ...form, prix_unitaire: Number(e.target.value) })} required /></div>
              </div>
              <div>
                <Label>Catégorie</Label>
                <Select value={form.categorie} onValueChange={categorie => setForm({ ...form, categorie })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {categories.map(categorie => <SelectItem key={categorie} value={categorie}>{categorie}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>Annuler</Button>
                <Button type="submit" className="bg-primary hover:bg-primary/90">{editing ? 'Mettre a jour' : 'Creer'}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
