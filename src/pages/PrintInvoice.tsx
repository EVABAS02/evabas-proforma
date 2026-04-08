import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { formatFCFA } from '@/lib/format';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Printer } from 'lucide-react';

export default function PrintInvoice() {
  const { id } = useParams<{ id: string }>();

  const { data: facture } = useQuery({
    queryKey: ['facture', id],
    queryFn: async () => {
      const { data } = await supabase.from('factures').select('*').eq('id', id!).single();
      return data;
    },
    enabled: !!id,
  });

  const { data: articles = [] } = useQuery({
    queryKey: ['facture-articles', id],
    queryFn: async () => {
      const { data } = await supabase.from('facture_articles').select('*').eq('facture_id', id!);
      return data || [];
    },
    enabled: !!id,
  });

  if (!facture) return <div className="flex items-center justify-center min-h-screen">Chargement...</div>;

  return (
    <div className="min-h-screen bg-background">
      <div className="no-print flex justify-center py-4">
        <Button onClick={() => window.print()} className="bg-accent text-accent-foreground hover:bg-accent/90">
          <Printer className="h-4 w-4 mr-2" /> Imprimer
        </Button>
      </div>

      <div className="max-w-[210mm] mx-auto bg-card p-10 shadow-lg" style={{ minHeight: '297mm' }}>
        {/* Header */}
        <div className="flex justify-between items-start mb-10 border-b-2 border-primary pb-6">
          <div>
            <h1 className="text-3xl font-bold text-primary">Sté MORAVI</h1>
            <p className="text-sm text-muted-foreground mt-1">Tokpa Hoho, Cotonou</p>
            <p className="text-sm text-muted-foreground">République du Bénin</p>
          </div>
          <div className="text-right">
            <h2 className="text-xl font-bold text-accent uppercase tracking-wider">Facture Proforma</h2>
            <p className="font-mono text-sm mt-2">{facture.numero}</p>
            <p className="text-sm text-muted-foreground">
              {format(new Date(facture.date_facture), 'dd MMMM yyyy', { locale: fr })}
            </p>
          </div>
        </div>

        {/* Client info */}
        <div className="mb-8 p-4 bg-muted/50 rounded-lg">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Client</h3>
          <p className="font-semibold text-lg">{facture.client_nom || '—'}</p>
          {facture.client_ifu && <p className="text-sm">IFU: {facture.client_ifu}</p>}
          {facture.client_telephone && <p className="text-sm">Tél: {facture.client_telephone}</p>}
          {facture.client_adresse && <p className="text-sm">{facture.client_adresse}</p>}
        </div>

        {/* Articles table */}
        <table className="w-full mb-8 text-sm">
          <thead>
            <tr className="border-b-2 border-primary">
              <th className="text-left py-3 font-semibold text-primary">N°</th>
              <th className="text-left py-3 font-semibold text-primary">Désignation</th>
              <th className="text-center py-3 font-semibold text-primary">Qté</th>
              <th className="text-right py-3 font-semibold text-primary">Prix Unitaire</th>
              <th className="text-right py-3 font-semibold text-primary">Montant</th>
            </tr>
          </thead>
          <tbody>
            {articles.map((art, i) => (
              <tr key={art.id} className="border-b">
                <td className="py-3">{i + 1}</td>
                <td className="py-3">{art.designation}</td>
                <td className="py-3 text-center">{art.quantite}</td>
                <td className="py-3 text-right">{formatFCFA(Number(art.prix_unitaire))}</td>
                <td className="py-3 text-right font-medium">{formatFCFA(Number(art.montant))}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Total */}
        <div className="flex justify-end mb-12">
          <div className="w-64 border-t-2 border-primary pt-3">
            <div className="flex justify-between text-lg font-bold">
              <span>Total TTC</span>
              <span className="text-primary">{formatFCFA(Number(facture.montant_ttc))}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-auto pt-8 border-t text-center">
          <p className="text-xs text-muted-foreground italic">
            Ce document est une facture proforma et ne constitue pas un titre de paiement.
          </p>
        </div>
      </div>
    </div>
  );
}
