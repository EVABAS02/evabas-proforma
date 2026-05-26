import { useEffect, useState, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from '@/hooks/useProfile';
import AppLayout from '@/components/AppLayout';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Pencil, Download, Printer, MessageCircle } from 'lucide-react';
import { formatFCFA } from '@/lib/format';
import { toast } from 'sonner';

type Article = {
  id: string;
  designation: string;
  quantite: number;
  prix_unitaire: number;
};

type Facture = {
  id: string;
  numero: string;
  date_facture: string;
  statut: string;
  client_nom: string | null;
  client_adresse: string | null;
  client_telephone: string | null;
  client_ifu: string | null;
  montant_ht: number;
  montant_tva: number;
  montant_ttc: number;
  apply_tva: boolean;
};

export default function InvoiceView() {
  const { id } = useParams();
  const nav = useNavigate();
  const { data: profile } = useProfile();
  const printRef = useRef<HTMLDivElement>(null);
  const [facture, setFacture] = useState<Facture | null>(null);
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const { data: inv, error } = await supabase
        .from('factures')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      if (error || !inv) {
        toast.error('Facture introuvable');
        nav('/factures');
        return;
      }
      setFacture(inv as Facture);

      const { data: arts } = await supabase
        .from('facture_articles')
        .select('*')
        .eq('facture_id', id);
      setArticles((arts || []) as Article[]);
      setLoading(false);
    })();
  }, [id, nav]);

  const handlePrint = () => {
    if (!facture) return;
    const orig = document.title;
    document.title = facture.numero;
    window.print();
    setTimeout(() => { document.title = orig; }, 500);
  };

  const handlePDF = async () => {
    if (!printRef.current || !facture) return;
    toast.loading('Génération du PDF...', { id: 'pdf' });
    const orig = document.title;
    document.title = facture.numero;
    const el = printRef.current;
    const prevW = el.style.width;
    el.style.width = '794px';
    try {
      const { default: html2canvas } = await import('html2canvas');
      const { default: jsPDF } = await import('jspdf');
      const canvas = await html2canvas(el, {
        scale: 2,
        backgroundColor: '#ffffff',
        useCORS: true,
      });
      el.style.width = prevW;
      const img = canvas.toDataURL('image/jpeg', 0.95);
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfW = pdf.internal.pageSize.getWidth();
      const pdfH = (canvas.height * pdfW) / canvas.width;
      pdf.addImage(img, 'JPEG', 0, 0, pdfW, pdfH);
      pdf.save(`${facture.numero}.pdf`);
      toast.success('PDF téléchargé', { id: 'pdf' });
    } catch {
      el.style.width = prevW;
      toast.error('Erreur PDF', { id: 'pdf' });
    } finally {
      document.title = orig;
    }
  };

  const handleWhatsApp = () => {
    if (!facture) return;
    const msg = encodeURIComponent(
      `Facture ${facture.numero} de ${profile?.company_name || 'notre entreprise'} : ${window.location.href}`
    );
    window.open(`https://wa.me/?text=${msg}`, '_blank');
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </AppLayout>
    );
  }

  if (!facture) return null;

  const montantHT = Number(facture.montant_ht) || 0;
  const montantTVA = Number(facture.montant_tva) || 0;
  const montantTTC = Number(facture.montant_ttc) || 0;

  const formatDateFR = (d: string) => {
    if (!d) return '-';
    const dt = new Date(d);
    return dt.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
  };

  return (
    <AppLayout>
   <style>{`
  @media print {
    @page {
      size: A4;
      margin-top: 1cm;
      margin-bottom: 0.5cm;
      margin-left: 1.5cm;
      margin-right: 1.5cm;
    }
    body {
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    body * { visibility: hidden !important; }
    #invoice-card, #invoice-card * {
      visibility: visible !important;
    }
    #invoice-card {
      position: fixed !important;
      top: 0 !important;
      left: 0 !important;
      width: 100% !important;
      box-shadow: none !important;
      border-radius: 0 !important;
      padding: 20px !important;
    }
    .no-print { display: none !important; }
  }
`}</style>

      <div className="space-y-4 max-w-4xl mx-auto">

        {/* Boutons */}
        <div className="no-print flex flex-wrap items-center gap-2">
          <Link to="/factures">
            <Button variant="ghost" size="sm" className="gap-1">
              <ArrowLeft className="h-4 w-4" /> Retour
            </Button>
          </Link>
          <div className="flex flex-wrap gap-2 ml-auto">
            <Link to={`/factures/${id}/modifier`}>
              <Button variant="outline" size="sm" className="gap-1">
                <Pencil className="h-4 w-4" /> Modifier
              </Button>
            </Link>
            <Button
              size="sm"
              onClick={handlePDF}
              className="gap-1 bg-yellow-500 hover:bg-yellow-600 text-white"
            >
              <Download className="h-4 w-4" /> PDF
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrint}
              className="gap-1"
            >
              <Printer className="h-4 w-4" /> Imprimer
            </Button>
            <Button
              size="sm"
              onClick={handleWhatsApp}
              className="gap-1 bg-green-600 hover:bg-green-700 text-white"
            >
              <MessageCircle className="h-4 w-4" /> WhatsApp
            </Button>
          </div>
        </div>

        {/* Facture */}
        <div
          id="invoice-card"
          ref={printRef}
          className="bg-white rounded-xl shadow-md p-6 sm:p-10"
          style={{ color: '#000000', fontFamily: 'Georgia, serif' }}
        >
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between gap-4 pb-6 border-b border-gray-200">
            <div>
              <h2 className="text-2xl font-bold" style={{ color: '#000000' }}>
                {profile?.company_name || 'Mon Entreprise'}
              </h2>
              {profile?.company_address && (
                <p className="text-sm mt-1" style={{ color: '#000000' }}>
                  {profile.company_address}
                </p>
              )}
              {profile?.phone_whatsapp && (
                <p className="text-sm" style={{ color: '#000000' }}>
                  Tél : {profile.phone_whatsapp}
                </p>
              )}
              {profile?.email && (
                <p className="text-sm" style={{ color: '#000000' }}>
                  {profile.email}
                </p>
              )}
            </div>
            <div className="text-right">
              <p
                className="text-xs font-bold uppercase tracking-widest"
                style={{ color: '#000000' }}
              >
                Facture Proforma
              </p>
              <p className="font-bold text-lg mt-1" style={{ color: '#000000' }}>
                {facture.numero}
              </p>
              <p className="text-sm" style={{ color: '#000000' }}>
                Date : {formatDateFR(facture.date_facture)}
              </p>
            </div>
          </div>

          {/* Client */}
          {facture.client_nom && (
            <div className="my-6">
              <p
                className="text-xs font-bold uppercase tracking-widest mb-2"
                style={{ color: '#000000' }}
              >
                Client
              </p>
              <p className="font-bold text-base" style={{ color: '#000000' }}>
                {facture.client_nom}
              </p>
              {facture.client_adresse && (
                <p className="text-sm" style={{ color: '#000000' }}>
                  {facture.client_adresse}
                </p>
              )}
              {facture.client_telephone && (
                <p className="text-sm" style={{ color: '#000000' }}>
                  Tél : {facture.client_telephone}
                </p>
              )}
              {facture.client_ifu && (
                <p className="text-sm" style={{ color: '#000000' }}>
                  IFU : {facture.client_ifu}
                </p>
              )}
            </div>
          )}

          {/* Tableau */}
          <div className="overflow-x-auto">
            <table
              className="w-full text-sm"
              style={{ tableLayout: 'fixed', borderCollapse: 'collapse' }}
            >
              <colgroup>
                <col style={{ width: '5%' }} />
                <col style={{ width: '42%' }} />
                <col style={{ width: '10%' }} />
                <col style={{ width: '20%' }} />
                <col style={{ width: '23%' }} />
              </colgroup>
              <thead>
                <tr style={{ backgroundColor: '#f0f0f0', borderBottom: '2px solid #e0e0e0' }}>
                  {['N°', 'Désignation', 'Qté', 'PU (FCFA)', 'Montant (FCFA)'].map((h, i) => (
                    <th
                      key={h}
                      className="py-3 px-2"
                      style={{
                        color: '#000000',
                        fontWeight: 700,
                        fontSize: '12px',
                        textAlign: i > 1 ? 'right' : 'left',
                        overflow: 'hidden',
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {articles.map((art, idx) => (
                  <tr
                    key={art.id}
                    style={{ borderBottom: '1px solid #e5e7eb' }}
                  >
                    <td className="py-2 px-2" style={{ color: '#000000' }}>{idx + 1}</td>
                    <td className="py-2 px-2" style={{ color: '#000000', overflow: 'hidden' }}>
                      {art.designation}
                    </td>
                    <td className="py-2 px-2 text-right tabular-nums" style={{ color: '#000000' }}>
                      {art.quantite}
                    </td>
                    <td className="py-2 px-2 text-right tabular-nums" style={{ color: '#000000' }}>
                      {Number(art.prix_unitaire).toLocaleString('fr-FR')}
                    </td>
                    <td
                      className="py-2 px-2 text-right tabular-nums font-medium"
                      style={{ color: '#000000' }}
                    >
                      {(art.quantite * art.prix_unitaire).toLocaleString('fr-FR')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totaux */}
          <div className="flex justify-end mt-6">
            <div className="w-full sm:w-72 space-y-2 text-sm">
              <div className="flex justify-between" style={{ color: '#000000' }}>
                <span>Montant HT</span>
                <span className="tabular-nums">{formatFCFA(montantHT)}</span>
              </div>
              {facture.apply_tva && (
                <div className="flex justify-between" style={{ color: '#000000' }}>
                  <span>TVA (18%)</span>
                  <span className="tabular-nums">{formatFCFA(montantTVA)}</span>
                </div>
              )}
              <div
                className="flex justify-between pt-3"
                style={{ borderTop: '2px solid #000000' }}
              >
                <span
                  style={{
                    color: '#000000',
                    fontWeight: 700,
                    fontSize: '16px',
                    whiteSpace: 'nowrap',
                  }}
                >
                  Total TTC
                </span>
                <span
                  className="tabular-nums"
                  style={{
                    color: '#000000',
                    fontWeight: 700,
                    fontSize: '20px',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {formatFCFA(montantTTC)}
                </span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div
            className="mt-10 pt-4 text-center text-sm italic"
            style={{ borderTop: '1px solid #e5e7eb', color: '#000000' }}
          >
            {profile?.company_name || 'Mon Entreprise'} — Merci pour votre confiance
          </div>
        </div>
      </div>
    </AppLayout>
  );
}