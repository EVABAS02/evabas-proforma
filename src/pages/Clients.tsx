import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Building2, Pencil, Trash2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import ConfirmDialog from '@/components/ConfirmDialog';
import AppLayout from '@/components/AppLayout';
import { toast } from 'sonner';
import { Tables } from '@/integrations/supabase/types';

type Client = Tables<'clients'>;

export default function Clients() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Client | null>(null);
  const [form, setForm] = useState({ nom: '', ifu: '', telephone: '', adresse: '' });

  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: async () => {
      const { data } = await supabase.from('clients').select('*').order('nom');
      return data || [];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (editing) {
        const { error } = await supabase.from('clients').update(form).eq('id', editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('clients').insert({ ...form, user_id: user!.id });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['clients'] });
      qc.invalidateQueries({ queryKey: ['clients-count'] });
      setOpen(false);
      setEditing(null);
      toast.success(editing ? 'Client mis à jour' : 'Client ajouté');
    },
    onError: (err: any) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('clients').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['clients'] });
      qc.invalidateQueries({ queryKey: ['clients-count'] });
      toast.success('Client supprimé');
    },
  });

  const openCreate = () => {
    setEditing(null);
    setForm({ nom: '', ifu: '', telephone: '', adresse: '' });
    setOpen(true);
  };

  const openEdit = (c: Client) => {
    setEditing(c);
    setForm({ nom: c.nom, ifu: c.ifu || '', telephone: c.telephone || '', adresse: c.adresse || '' });
    setOpen(true);
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Clients</h1>
          <Button onClick={openCreate} className="bg-accent text-accent-foreground hover:bg-accent/90">
            <Plus className="h-4 w-4 mr-2" /> Ajouter un client
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {clients.map((c) => (
            <Card key={c.id} className="shadow-sm relative group">
              <CardContent className="p-5">
                <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(c)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <ConfirmDialog
                    trigger={<Button variant="ghost" size="icon" className="h-8 w-8 text-destructive"><Trash2 className="h-4 w-4" /></Button>}
                    onConfirm={() => deleteMutation.mutate(c.id)}
                  />
                </div>
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-muted rounded-lg">
                    <Building2 className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-semibold">{c.nom}</p>
                    {c.ifu && <p className="text-sm text-muted-foreground">IFU: {c.ifu}</p>}
                    {c.telephone && <p className="text-sm text-muted-foreground">Tél: {c.telephone}</p>}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {clients.length === 0 && (
          <p className="text-center text-muted-foreground py-8">Aucun client. Commencez par en ajouter un.</p>
        )}

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editing ? 'Modifier le client' : 'Ajouter un client'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={(e) => { e.preventDefault(); saveMutation.mutate(); }} className="space-y-4">
              <div>
                <Label>Nom du client *</Label>
                <Input value={form.nom} onChange={e => setForm({ ...form, nom: e.target.value })} required />
              </div>
              <div>
                <Label>IFU</Label>
                <Input value={form.ifu} onChange={e => setForm({ ...form, ifu: e.target.value })} />
              </div>
              <div>
                <Label>Téléphone</Label>
                <Input value={form.telephone} onChange={e => setForm({ ...form, telephone: e.target.value })} />
              </div>
              <div>
                <Label>Adresse</Label>
                <Input value={form.adresse} onChange={e => setForm({ ...form, adresse: e.target.value })} />
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
