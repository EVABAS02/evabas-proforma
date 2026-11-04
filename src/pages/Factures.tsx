import { useEffect, useState } from 'react';
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
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id || null);
    };
    getUser();
  }, []);

  const { data: invoices = [] } = useQuery({
    queryKey: ['invoices', userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data } = await supabase
        .from('factures')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      return data || [];
    },
  });

  const filtered = invoices.filter(i =>
    i.numero.toLowerCase().includes(search.toLowerCase()) ||
    (i.client_nom || '').toLowerCase().includes(search.toLowerCase())
  );

  const updateStatus = async (id: string, status: typeof statuses[number]) => {
    const { error } = await supabase.from('factures').update({ statut: status }).eq('id', id);
    if (error) return toast.error(error.message);
    toast.success('Statut mis a jour');
    qc.invalidateQueries({ queryKey: ['invoices', userId] });
    qc.invalidateQueries({ queryKey: ['recent-invoices', userId] });
  };

  const remove = async (id: string) => {
    if (!confirm('Supprimer cette facture ?')) return;
    const { error } = await supabase.from('factures').delete().eq('id', id);
    if (error) return toast.error(error.message);
    toast.success('Facture supprimee');
    qc.invalidateQueries({ queryKey: ['invoices', userId] });
  };

  return (
    <AppLayout>
      <div className="space-y-6 bg-white p-4 sm:p-6 rounded-3xl min-h-screen text-slate-900">
        <div className="flex flex-col sm:flex-row sm:flex-wrap justify-between gap-4 border-b border-blue-50 pb-6">
          <div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-blue-950">Factures</h1>
            <p className="text-blue-600/70 text-sm sm:text-base font-medium">Toutes vos factures proforma</p>
          </div>
          <Link to="/factures/nouveau" className="sm:w-auto">
            <Button className="w-full sm:w-auto rounded-full bg-blue-600 hover:bg-blue-700 text-white h-11 font-semibold shadow-sm"><Plus className="h-4 w-4 mr-2" />Nouvelle facture</Button>
          </Link>
        </div>

        <Card className="shadow-sm border-blue-100 bg-white">
          <CardHeader>
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-blue-400" />
              <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="N° ou client..." className="pl-9 border-blue-100 focus-visible:ring-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            {filtered.length === 0 ? (
              <p className="text-center text-blue-400 py-8 font-medium">Aucune facture</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-blue-400 uppercase font-bold border-b border-blue-100">
                      <th className="py-3 pr-4">N°</th>
                      <th className="py-3 pr-4">Client</th>
                      <th className="py-3 pr-4">Date</th>
                      <th className="py-3 pr-4 text-right">Montant TTC</th>
                      <th className="py-3 pr-4">Statut</th>
                      <th className="py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-blue-50">
                    {filtered.map((f) => (
                      <tr key={f.id} className="hover:bg-blue-50/50 transition-colors">
                        <td className="py-3 pr-4 font-mono font-semibold text-blue-950">{f.numero}</td>
                        <td className="py-3 pr-4 font-medium text-blue-900">{f.client_nom || '-'}</td>
                        <td className="py-3 pr-4 text-blue-600/70">{formatDateShort(f.date_facture)}</td>
                        <td className="py-3 pr-4 text-right font-bold text-blue-950 tabular-nums">{formatFCFA(Number(f.montant_ttc))}</td>
                        <td className="py-3 pr-4">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button className="cursor-pointer"><StatusBadge status={f.statut} /></button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="border-blue-100">
                              {statuses.map(s => (
                                <DropdownMenuItem key={s} onClick={() => updateStatus(f.id, s)}>
                                  <StatusBadge status={s} />
                                </DropdownMenuItem>
                              ))}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                        <td className="py-3 text-right space-x-1">
                          <Link to={`/factures/${f.id}`}><Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600 hover:bg-blue-100 rounded-full"><Eye className="h-4 w-4" /></Button></Link>
                          <Link to={`/factures/${f.id}/modifier`}><Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600 hover:bg-blue-100 rounded-full"><Pencil className="h-4 w-4" /></Button></Link>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:bg-red-50 rounded-full" onClick={() => remove(f.id)}><Trash2 className="h-4 w-4" /></Button>
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