import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { FileText, Users, Package, Eye } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import StatusBadge from '@/components/StatusBadge';
import { formatFCFA, formatDate } from '@/lib/format';
import AppLayout from '@/components/AppLayout';

export default function Dashboard() {
  const { user } = useAuth();

  const { data: factureCount = 0 } = useQuery({
    queryKey: ['factures-count'],
    queryFn: async () => {
      const { count } = await supabase.from('factures').select('*', { count: 'exact', head: true });
      return count || 0;
    },
  });

  const { data: clientCount = 0 } = useQuery({
    queryKey: ['clients-count'],
    queryFn: async () => {
      const { count } = await supabase.from('clients').select('*', { count: 'exact', head: true });
      return count || 0;
    },
  });

  const { data: produitCount = 0 } = useQuery({
    queryKey: ['produits-count'],
    queryFn: async () => {
      const { count } = await supabase.from('produits').select('*', { count: 'exact', head: true });
      return count || 0;
    },
  });

  const { data: totalTTC = 0 } = useQuery({
    queryKey: ['total-ttc'],
    queryFn: async () => {
      const { data } = await supabase.from('factures').select('montant_ttc');
      return data?.reduce((sum, f) => sum + Number(f.montant_ttc), 0) || 0;
    },
  });

  const { data: recentFactures = [] } = useQuery({
    queryKey: ['recent-factures'],
    queryFn: async () => {
      const { data } = await supabase.from('factures').select('*').order('created_at', { ascending: false }).limit(5);
      return data || [];
    },
  });

  const kpis = [
    { label: 'Factures', value: factureCount, icon: FileText, bg: 'bg-blue-50', iconColor: 'text-blue-500' },
    { label: 'Clients', value: clientCount, icon: Users, bg: 'bg-green-50', iconColor: 'text-green-500' },
    { label: 'Produits', value: produitCount, icon: Package, bg: 'bg-purple-50', iconColor: 'text-purple-500' },
    { label: 'Total TTC', value: formatFCFA(totalTTC), icon: FileText, bg: 'bg-amber-50', iconColor: 'text-amber-600' },
  ];

  return (
    <AppLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-foreground">Tableau de bord</h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {kpis.map((kpi) => (
            <Card key={kpi.label} className="shadow-sm">
              <CardContent className="flex items-center gap-4 p-5">
                <div className={`p-3 rounded-lg ${kpi.bg}`}>
                  <kpi.icon className={`h-6 w-6 ${kpi.iconColor}`} />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{kpi.label}</p>
                  <p className="text-xl font-bold text-foreground">{kpi.value}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Dernières factures</CardTitle>
            <Link to="/factures" className="text-sm text-accent hover:underline font-medium">Voir tout →</Link>
          </CardHeader>
          <CardContent>
            {recentFactures.length === 0 ? (
              <p className="text-muted-foreground text-sm py-4">Aucune facture pour le moment.</p>
            ) : (
              <div className="space-y-3">
                {recentFactures.map((f) => (
                  <div key={f.id} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div className="flex items-center gap-4">
                      <span className="font-mono text-sm font-medium">{f.numero}</span>
                      <span className="text-sm text-muted-foreground">{f.client_nom || '—'}</span>
                      <StatusBadge status={f.statut} />
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-sm font-medium">{formatFCFA(Number(f.montant_ttc))}</span>
                      <Link to={`/factures/${f.id}/print`} className="text-muted-foreground hover:text-foreground">
                        <Eye className="h-4 w-4" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
