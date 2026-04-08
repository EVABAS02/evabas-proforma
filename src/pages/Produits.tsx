import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Pencil, Trash2, Plus, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import CategoryBadge from '@/components/CategoryBadge';
import ConfirmDialog from '@/components/ConfirmDialog';
import AppLayout from '@/components/AppLayout';
import { formatFCFA } from '@/lib/format';
import { toast } from 'sonner';
import { SEED_PRODUCTS } from '@/data/seedProducts';
import { Tables } from '@/integrations/supabase/types';

type Produit = Tables<'produits'>;
const CATEGORIES = ['Vin', 'Alimentaire', 'Infusion & Thé', 'Serviette & Papier', 'Hygiène & Entretien'];

export default function Produits() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Produit | null>(null);
  const [form, setForm] = useState({ designation: '', categorie: 'Vin', prix_unitaire: '', prix_gros: '', qte_carton: '' });

  const { data: produits = [] } = useQuery({
    queryKey: ['produits'],
    queryFn: async () => {
      const { data } = await supabase.from('produits').select('*').order('categorie').order('designation');
      return data || [];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        designation: form.designation,
        categorie: form.categorie,
        prix_unitaire: Number(form.prix_unitaire),
        prix_gros: form.prix_gros ? Number(form.prix_gros) : null,
        qte_carton: form.qte_carton ? Number(form.qte_carton) : null,
      };
      if (editing) {
        const { error } = await supabase.from('produits').update(payload).eq('id', editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('produits').insert({ ...payload, user_id: user!.id });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['produits'] });
      qc.invalidateQueries({ queryKey: ['produits-count'] });
      setOpen(false);
      toast.success(editing ? 'Produit mis à jour' : 'Produit ajouté');
    },
    onError: (err: any) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('produits').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['produits'] });
      qc.invalidateQueries({ queryKey: ['produits-count'] });
      toast.success('Produit supprimé');
    },
  });

  const seedMutation = useMutation({
    mutationFn: async () => {
      const rows = SEED_PRODUCTS.map(p => ({ ...p, user_id: user!.id }));
      const { error } = await supabase.from('produits').insert(rows);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['produits'] });
      qc.invalidateQueries({ queryKey: ['produits-count'] });
      toast.success('63 produits ajoutés !');
    },
    onError: (err: any) => toast.error(err.message),
  });

  const openCreate = () => {
    setEditing(null);
    setForm({ designation: '', categorie: 'Vin', prix_unitaire: '', prix_gros: '', qte_carton: '' });
    setOpen(true);
  };

  const openEdit = (p: Produit) => {
    setEditing(p);
    setForm({
      designation: p.designation,
      categorie: p.categorie,
      prix_unitaire: String(p.prix_unitaire),
      prix_gros: p.prix_gros ? String(p.prix_gros) : '',
      qte_carton: p.qte_carton ? String(p.qte_carton) : '',
    });
    setOpen(true);
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Produits</h1>
          <div className="flex gap-2">
            {produits.length === 0 && (
              <Button variant="outline" onClick={() => seedMutation.mutate()} disabled={seedMutation.isPending}>
                <Sparkles className="h-4 w-4 mr-2" /> Seed Products
              </Button>
            )}
            <Button onClick={openCreate} className="bg-accent text-accent-foreground hover:bg-accent/90">
              <Plus className="h-4 w-4 mr-2" /> Ajouter un produit
            </Button>
          </div>
        </div>

        <div className="bg-card rounded-lg shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Désignation</TableHead>
                <TableHead>Catégorie</TableHead>
                <TableHead className="text-right">Prix unitaire</TableHead>
                <TableHead className="w-24">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {produits.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.designation}</TableCell>
                  <TableCell><CategoryBadge category={p.categorie} /></TableCell>
                  <TableCell className="text-right">{formatFCFA(Number(p.prix_unitaire))}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(p)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <ConfirmDialog
                        trigger={<Button variant="ghost" size="icon" className="h-8 w-8 text-destructive"><Trash2 className="h-4 w-4" /></Button>}
                        onConfirm={() => deleteMutation.mutate(p.id)}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {produits.length === 0 && (
            <p className="text-center text-muted-foreground py-8">Aucun produit.</p>
          )}
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editing ? 'Modifier le produit' : 'Ajouter un produit'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={(e) => { e.preventDefault(); saveMutation.mutate(); }} className="space-y-4">
              <div>
                <Label>Désignation *</Label>
                <Input value={form.designation} onChange={e => setForm({ ...form, designation: e.target.value })} required />
              </div>
              <div>
                <Label>Catégorie *</Label>
                <Select value={form.categorie} onValueChange={v => setForm({ ...form, categorie: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label>Prix unitaire *</Label>
                  <Input type="number" value={form.prix_unitaire} onChange={e => setForm({ ...form, prix_unitaire: e.target.value })} required />
                </div>
                <div>
                  <Label>Prix gros</Label>
                  <Input type="number" value={form.prix_gros} onChange={e => setForm({ ...form, prix_gros: e.target.value })} />
                </div>
                <div>
                  <Label>Qté/carton</Label>
                  <Input type="number" value={form.qte_carton} onChange={e => setForm({ ...form, qte_carton: e.target.value })} />
                </div>
              </div>
              <Button type="submit" className="w-full bg-accent text-accent-foreground hover:bg-accent/90" disabled={saveMutation.isPending}>
                {saveMutation.isPending ? 'Enregistrement...' : 'Enregistrer'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
