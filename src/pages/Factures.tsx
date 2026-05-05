import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import AppLayout from '@/components/AppLayout';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import StatusBadge from '@/components/StatusBadge';
import { formatFCFA, formatDateShort } from '@/lib/format';
import { Plus, Search, Eye, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

const statuses = ['brouillon', 'envoyee', 'payee'] as const;

export default function Factures() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');

  const { data: invoices = [] } = useQuery({
    queryKey: ['invoices'],
    queryFn: async () => {
      const { data } = await supabase.from('invoices').select('*').order('created_at', { ascending: false });
      return data || [];
    },
  });

  const filtered = invoices.filter(i =>
    i.invoice_number.toLowerCase().includes(search.toLowerCase()) ||
    (i.client_name || '').toLowerCase().includes(search.toLowerCase())
  );

  const updateStatus = async (id: string, status: typeof statuses[number]) => {
    const { error } = await supabase.from('invoices').update({ status }).eq('id', id);
    if (error) return toast.error(error.message);
    toast.success('Statut mis à jour');
    qc.invalidateQueries({ queryKey: ['invoices'] });
    qc.invalidateQueries({ queryKey: ['recent-invoices'] });
  };

  const remove = async (id: string) => {
    if (!confirm('Supprimer cette facture ?')) return;
    const { error } = await supabase.from('invoices').delete().eq('id', id);
    if (error) return toast.error(error.message);
    toast.success('Facture supprimée');
    qc.invalidateQueries({ queryKey: ['invoices'] });
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:flex-wrap justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold">Factures</h1>
            <p className="text-muted-foreground text-sm sm:text-base">Toutes vos factures proforma</p>
          </div>
          <Link to="/factures/nouveau" className="sm:w-auto">
            <Button className="w-full sm:w-auto rounded-full bg-accent hover:bg-accent/90 h-11"><Plus className="h-4 w-4 mr-2" />Nouvelle facture</Button>
          </Link>
        </div>

        <Card className="shadow-card border-border/60">
          <CardHeader>
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="N° ou client..." className="pl-9" />
            </div>
          </CardHeader>
          <CardContent>
            {filtered.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">Aucune facture</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-muted-foreground border-b">
                      <th className="py-3 pr-4">N°</th>
                      <th className="py-3 pr-4">Client</th>
                      <th className="py-3 pr-4">Date</th>
                      <th className="py-3 pr-4 text-right">Montant TTC</th>
                      <th className="py-3 pr-4">Statut</th>
                      <th className="py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((f) => (
                      <tr key={f.id} className="border-b last:border-0 hover:bg-muted/30">
                        <td className="py-3 pr-4 font-mono font-medium">{f.invoice_number}</td>
                        <td className="py-3 pr-4">{f.client_name || '—'}</td>
                        <td className="py-3 pr-4 text-muted-foreground">{formatDateShort(f.date)}</td>
                        <td className="py-3 pr-4 text-right tabular-nums">{formatFCFA(Number(f.total_ttc))}</td>
                        <td className="py-3 pr-4">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button><StatusBadge status={f.status} /></button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                              {statuses.map(s => (
                                <DropdownMenuItem key={s} onClick={() => updateStatus(f.id, s)}>
                                  <StatusBadge status={s} />
                                </DropdownMenuItem>
                              ))}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                        <td className="py-3 text-right">
                          <Link to={`/factures/${f.id}`}><Button variant="ghost" size="icon" className="h-8 w-8"><Eye className="h-4 w-4" /></Button></Link>
                          <Link to={`/factures/${f.id}/modifier`}><Button variant="ghost" size="icon" className="h-8 w-8"><Pencil className="h-4 w-4" /></Button></Link>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => remove(f.id)}><Trash2 className="h-4 w-4" /></Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
