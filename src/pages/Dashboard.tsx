import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from '@/hooks/useProfile';
import { Button } from '@/components/ui/button';
import { 
  Plus, 
  Eye, 
  Pencil, 
  MessageCircle, 
  FileText, 
  Users, 
  Package, 
  CreditCard,
  ChevronRight,
  HardDrive
} from 'lucide-react';
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
    { label: 'Factures', value: stats?.invoiceCount ?? 0, icon: FileText, primary: true },
    { label: 'Clients', value: stats?.clientCount ?? 0, icon: Users, primary: false },
    { label: 'Produits', value: stats?.productCount ?? 0, icon: Package, primary: false },
    { label: 'Total TTC', value: formatFCFA(stats?.total ?? 0), icon: CreditCard, primary: false },
  ];

  return (
    <AppLayout>
      <div className="space-y-8 bg-white p-4 sm:p-6 rounded-3xl min-h-screen text-slate-900">
        {/* Header avec Titre et Bouton Principal d'Action */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-blue-50 pb-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-600 text-white rounded-2xl shadow-sm">
              <HardDrive className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-blue-950 tracking-tight">{company}</h1>
              <p className="text-xs text-blue-600/70 font-medium">Espace de gestion et suivi des factures</p>
            </div>
          </div>

          <Link to="/factures/nouveau">
            <Button className="w-full sm:w-auto rounded-full bg-blue-600 hover:bg-blue-700 text-white font-semibold h-11 px-6 shadow-sm transition-all">
              <Plus className="h-5 w-5 mr-2" /> Nouvelle facture
            </Button>
          </Link>
        </div>

        {/* Section QUICK ACCESS (Cartes KPIs) */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-blue-950">Accès rapide</h2>
            <ChevronRight className="h-4 w-4 text-blue-400 cursor-pointer" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {kpis.map((k) => {
              const Icon = k.icon;
              return (
                <div
                  key={k.label}
                  className={`relative p-5 rounded-2xl transition-all duration-200 border ${
                    k.primary
                      ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-600/20'
                      : 'bg-blue-50/40 text-blue-950 border-blue-100 hover:bg-blue-50/80'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className={`text-xs font-bold uppercase tracking-wider ${k.primary ? 'text-blue-100' : 'text-blue-600'}`}>
                      {k.label}
                    </span>
                    <div className={`p-2 rounded-xl ${k.primary ? 'bg-blue-500/40 text-white' : 'bg-blue-100/70 text-blue-600'}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                  </div>
                  <div className="font-extrabold text-2xl truncate">{k.value}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Section ALL FILES (Tableau récents) */}
        <div className="bg-white rounded-2xl border border-blue-100 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-blue-950">Tous les fichiers récents</h2>
            <Link to="/factures" className="text-xs font-bold text-blue-600 hover:underline">
              Voir tout
            </Link>
          </div>

          {recent.length === 0 ? (
            <p className="text-blue-400 text-sm py-8 text-center font-medium">Aucune facture pour le moment.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-blue-100 text-[11px] font-bold text-blue-400 uppercase tracking-wider">
                    <th className="py-3 px-4">Nom / N°</th>
                    <th className="py-3 px-4">Client</th>
                    <th className="py-3 px-4 hidden md:table-cell">Date</th>
                    <th className="py-3 px-4 text-right">Montant</th>
                    <th className="py-3 px-4">Statut</th>
                    <th className="py-3 px-4 text-right hidden sm:table-cell">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-blue-50">
                  {recent.map((f) => (
                    <tr key={f.id} className="hover:bg-blue-50/50 transition-colors group">
                      <td className="py-4 px-4 font-mono font-semibold text-blue-950 flex items-center gap-2">
                        <FileText className="h-4 w-4 text-blue-600" />
                        {f.numero}
                      </td>
                      <td className="py-4 px-4 font-medium text-blue-900">{f.client_nom || '-'}</td>
                      <td className="py-4 px-4 text-xs text-blue-400 font-medium hidden md:table-cell">{formatDateShort(f.date_facture)}</td>
                      <td className="py-4 px-4 text-right font-bold text-blue-950 tabular-nums">{formatFCFA(Number(f.montant_ttc))}</td>
                      <td className="py-4 px-4">
                        <StatusBadge status={f.statut} />
                      </td>
                      <td className="py-4 px-4 text-right hidden sm:table-cell">
                        <div className="inline-flex items-center gap-1 opacity-90 group-hover:opacity-100">
                          <Link to={`/factures/${f.id}`} title="Voir">
                            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-blue-100 rounded-full text-blue-600">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Link to={`/factures/${f.id}/modifier`} title="Modifier">
                            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-blue-100 rounded-full text-blue-600">
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Link to={`/factures/${f.id}`} title="WhatsApp">
                            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-blue-100 rounded-full text-blue-600">
                              <MessageCircle className="h-4 w-4" />
                            </Button>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}