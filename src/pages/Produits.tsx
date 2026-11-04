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

  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id || null);
    };
    getUser();
  }, []);

  const { data: products = [] } = useQuery({
    queryKey: ['produits', userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase.from('produits').select('*').eq('user_id', userId).order('designation');
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
      if (!userId) throw new Error('Utilisateur non authentifie');
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
      <div className="space-y-6 bg-white p-4 sm:p-6 rounded-3xl min-h-screen text-black">
        <div className="flex flex-col sm:flex-row sm:flex-wrap justify-between gap-4 border-b border-blue-100 pb-6">
          <div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-black">Produits</h1>
            <p className="text-black/70 text-sm sm:text-base font-medium">Votre catalogue de produits</p>
          </div>
          <Button onClick={openNew} className="w-full sm:w-auto rounded-full bg-blue-600 hover:bg-blue-700 text-white h-11 font-semibold shadow-sm">
            <Plus className="h-4 w-4 mr-2" />Nouveau produit
          </Button>
        </div>

        <Card className="shadow-sm border-blue-100 bg-white">
          <CardHeader>
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-black/50" />
              <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher..." className="pl-9 border-blue-200 focus-visible:ring-blue-600 text-black placeholder:text-black/40" />
            </div>
          </CardHeader>
          <CardContent>
            {filtered.length === 0 ? (
              <p className="text-center text-black/50 py-8 font-medium">Aucun produit</p>
            ) : (
              <>
              <div className="md:hidden space-y-3">
                {filtered.map(p => (
                  <div key={p.id} className="border border-blue-100 bg-blue-50/20 rounded-2xl p-4 flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-black truncate">{p.designation}</p>
                      {p.unite && <p className="text-xs text-black/60 mt-0.5">{p.unite}</p>}
                      <p className="text-sm font-bold text-black mt-1 tabular-nums">{formatFCFA(p.prix_unitaire)}</p>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button variant="ghost" size="icon" className="h-9 w-9 text-blue-600 hover:bg-blue-100 rounded-full" onClick={() => openEdit(p)}><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" className="h-9 w-9 text-red-600 hover:bg-red-50 rounded-full" onClick={() => remove(p.id)}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-black/60 uppercase font-bold border-b border-blue-100">
                      <th className="py-3 pr-4">Designation</th>
                      <th className="py-3 pr-4">Unite</th>
                      <th className="py-3 pr-4">Categorie</th>
                      <th className="py-3 pr-4 text-right">Prix unitaire</th>
                      <th className="py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-blue-50">
                    {filtered.map(p => (
                      <tr key={p.id} className="hover:bg-blue-50/40 transition-colors">
                        <td className="py-3 pr-4 font-semibold text-black">{p.designation}</td>
                        <td className="py-3 pr-4 text-black/70">{p.unite || '-'}</td>
                        <td className="py-3 pr-4 text-black/70">{p.categorie || '-'}</td>
                        <td className="py-3 pr-4 text-right font-bold text-black tabular-nums">{formatFCFA(p.prix_unitaire)}</td>
                        <td className="py-3 text-right">
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600 hover:bg-blue-100 rounded-full" onClick={() => openEdit(p)}><Pencil className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600 hover:bg-red-50 rounded-full" onClick={() => remove(p.id)}><Trash2 className="h-4 w-4" /></Button>
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
          <DialogContent className="border-blue-100 bg-white text-black">
            <DialogHeader><DialogTitle className="text-black font-bold">{editing ? 'Modifier le produit' : 'Nouveau produit'}</DialogTitle></DialogHeader>
            <form onSubmit={submit} className="space-y-4">
              <div><Label className="text-black font-semibold">Designation *</Label><Input value={form.designation} onChange={e => setForm({ ...form, designation: e.target.value })} required className="border-blue-200 focus-visible:ring-blue-600 text-black" /></div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div><Label className="text-black font-semibold">Unite</Label><Input value={form.unite} onChange={e => setForm({ ...form, unite: e.target.value })} placeholder="piece, m2, kg..." className="border-blue-200 focus-visible:ring-blue-600 text-black" /></div>
                <div><Label className="text-black font-semibold">Prix unitaire (FCFA) *</Label><Input type="number" min="0" value={form.prix_unitaire} onChange={e => setForm({ ...form, prix_unitaire: Number(e.target.value) })} required className="border-blue-200 focus-visible:ring-blue-600 text-black" /></div>
              </div>
              <div>
                <Label className="text-black font-semibold">Catégorie</Label>
                <Select value={form.categorie} onValueChange={categorie => setForm({ ...form, categorie })}>
                  <SelectTrigger className="border-blue-200 focus:ring-blue-600 text-black"><SelectValue /></SelectTrigger>
                  <SelectContent className="border-blue-200 bg-white text-black">
                    {categories.map(categorie => <SelectItem key={categorie} value={categorie} className="hover:bg-blue-50">{categorie}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setOpen(false)} className="border-blue-300 text-black hover:bg-blue-50 rounded-full font-semibold">Annuler</Button>
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white rounded-full font-semibold">{editing ? 'Mettre a jour' : 'Creer'}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}