import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from '@/hooks/useProfile';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Eye, Pencil, MessageCircle } from 'lucide-react';
import StatusBadge from '@/components/StatusBadge';
import { formatFCFA, formatDateShort } from '@/lib/format';
import AppLayout from '@/components/AppLayout';

export default function Dashboard() {
  const { data: profile } = useProfile();
  const company = profile?.company_name || 'Mon Entreprise';
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id || null);
    };
    getUser();
  }, []);

  const { data: stats } = useQuery({
    queryKey: ['dashboard-stats', userId],
    enabled: !!userId,
    queryFn: async () => {
      const [{ count: invoiceCount }, { count: clientCount }, { count: productCount }, { data: invoices }] = await Promise.all([
        supabase.from('factures').select('*', { count: 'exact', head: true }).eq('user_id', userId),
        supabase.from('clients').select('*', { count: 'exact', head: true }).eq('user_id', userId),
        supabase.from('produits').select('*', { count: 'exact', head: true }).eq('user_id', userId),
        supabase.from('factures').select('montant_ttc').eq('user_id', userId),
      ]);
      const total = invoices?.reduce((s, i) => s + Number(i.montant_ttc), 0) || 0;
      return { invoiceCount: invoiceCount || 0, clientCount: clientCount || 0, productCount: productCount || 0, total };
    },
  });

  const { data: recent = [] } = useQuery({
    queryKey: ['recent-invoices', userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data } = await supabase
        .from('factures')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(8);
      return data || [];
    },
  });

  const kpis = [
    { label: 'Factures', value: stats?.invoiceCount ?? 0 },
    { label: 'Clients', value: stats?.clientCount ?? 0 },
    { label: 'Produits', value: stats?.productCount ?? 0 },
    { label: 'Total TTC', value: formatFCFA(stats?.total ?? 0) },
  ];

  return (
    <AppLayout>
      <div className="space-y-6 sm:space-y-8">
        <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-start justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold">{company}</h1>
            <p className="text-muted-foreground mt-1 text-sm sm:text-base">Gestion des factures proforma</p>
          </div>
          <Link to="/factures/nouveau" className="sm:w-auto">
            <Button className="w-full sm:w-auto rounded-full bg-accent text-accent-foreground hover:bg-accent/90 h-11 px-5 shadow-soft">
              <Plus className="h-4 w-4 mr-2" /> Nouvelle facture
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {kpis.map((k) => (
            <div key={k.label} className="bg-white border border-[#E5E7EB] rounded-xl p-5" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
              <p className="text-[12px] uppercase tracking-wide text-[#6B7280] font-medium">{k.label}</p>
              <p className="font-display font-bold text-[22px] sm:text-[28px] text-[#0F172A] mt-2 truncate">{k.value}</p>
            </div>
          ))}
        </div>

        <Card className="shadow-card border-border/60">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="font-display">Factures recentes</CardTitle>
            <Link to="/factures" className="text-sm text-primary hover:underline font-medium">Voir tout</Link>
          </CardHeader>
          <CardContent>
            {recent.length === 0 ? (
              <p className="text-muted-foreground text-sm py-6 text-center">Aucune facture pour le moment.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-muted-foreground border-b">
                      <th className="py-3 pr-4">N</th>
                      <th className="py-3 pr-4">Client</th>
                      <th className="py-3 pr-4 hidden md:table-cell">Date</th>
                      <th className="py-3 pr-4 text-right">Montant</th>
                      <th className="py-3 pr-4">Statut</th>
                      <th className="py-3 text-right hidden sm:table-cell">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recent.map((f) => (
                      <tr key={f.id} className="border-b last:border-0 hover:bg-muted/30">
                        <td className="py-3 pr-4 font-mono font-medium">{f.numero}</td>
                        <td className="py-3 pr-4">{f.client_nom || '-'}</td>
                        <td className="py-3 pr-4 text-muted-foreground hidden md:table-cell">{formatDateShort(f.date_facture)}</td>
                        <td className="py-3 pr-4 text-right font-medium tabular-nums">{formatFCFA(Number(f.montant_ttc))}</td>
                        <td className="py-3 pr-4"><StatusBadge status={f.statut} /></td>
                        <td className="py-3 text-right hidden sm:table-cell">
                          <div className="inline-flex gap-1">
                            <Link to={`/factures/${f.id}`} title="Voir"><Button variant="ghost" size="icon" className="h-8 w-8"><Eye className="h-4 w-4" /></Button></Link>
                            <Link to={`/factures/${f.id}/modifier`} title="Modifier"><Button variant="ghost" size="icon" className="h-8 w-8"><Pencil className="h-4 w-4" /></Button></Link>
                            <Link to={`/factures/${f.id}`} title="WhatsApp"><Button variant="ghost" size="icon" className="h-8 w-8 text-emerald-600"><MessageCircle className="h-4 w-4" /></Button></Link>
                          </div>
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
