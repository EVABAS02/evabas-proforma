import { useEffect, useState, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from '@/hooks/useProfile';
import AppLayout from '@/components/AppLayout';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Pencil, Download, Printer, MessageCircle, Loader2 } from 'lucide-react';
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
  montant_aib: number | null;
  montant_ttc: number;
  apply_tva: boolean;
  apply_aib: boolean | null;
  aib_rate: number | null;
};

const STATUT_LABELS: Record<string, { label: string; bg: string; text: string }> = {
  brouillon: { label: 'Brouillon', bg: '#f3f4f6', text: '#374151' },
  envoyee: { label: 'Envoyée', bg: '#dbeafe', text: '#1e40af' },
  payee: { label: 'Payée', bg: '#dcfce7', text: '#166534' },
};

export default function InvoiceView() {
  const { id } = useParams();
  const nav = useNavigate();
  const { data: profile } = useProfile();
  const printRef = useRef<HTMLDivElement>(null);
  const [facture, setFacture] = useState<Facture | null>(null);
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isSharing, setIsSharing] = useState(false);

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
      setFacture(inv as unknown as Facture);

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

  // Génère le PDF en le découpant automatiquement sur autant de pages A4 que nécessaire,
  // et masque tout élément .no-print (badge de statut, etc.) uniquement dans la capture.
  const generatePdfBlob = async () => {
    if (!printRef.current || !facture) return null;
    const el = printRef.current;
    const prevW = el.style.width;
    el.style.width = '794px';

    const { default: html2canvas } = await import('html2canvas');
    const { default: jsPDF } = await import('jspdf');

    const canvas = await html2canvas(el, {
      scale: 2,
      backgroundColor: '#ffffff',
      useCORS: true,
      onclone: (clonedDoc) => {
        clonedDoc.querySelectorAll('.no-print').forEach((elToHide) => {
          (elToHide as HTMLElement).style.display = 'none';
        });
      },
    });
    el.style.width = prevW;

    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfW = pdf.internal.pageSize.getWidth();
    const pdfH = pdf.internal.pageSize.getHeight();
    const pageHeightPx = (pdfH * canvas.width) / pdfW;

    let renderedHeightPx = 0;
    let pageIndex = 0;

    while (renderedHeightPx < canvas.height) {
      const sliceHeightPx = Math.min(pageHeightPx, canvas.height - renderedHeightPx);

      const pageCanvas = document.createElement('canvas');
      pageCanvas.width = canvas.width;
      pageCanvas.height = sliceHeightPx;
      const ctx = pageCanvas.getContext('2d');
      ctx?.drawImage(
        canvas,
        0, renderedHeightPx, canvas.width, sliceHeightPx,
        0, 0, canvas.width, sliceHeightPx
      );

      const pageImg = pageCanvas.toDataURL('image/jpeg', 0.95);
      const sliceHeightMm = (sliceHeightPx * pdfW) / canvas.width;

      if (pageIndex > 0) pdf.addPage();
      pdf.addImage(pageImg, 'JPEG', 0, 0, pdfW, sliceHeightMm);

      renderedHeightPx += sliceHeightPx;
      pageIndex++;
    }

    return pdf;
  };

  const handlePDF = async () => {
    if (!facture || isGeneratingPdf) return;
    setIsGeneratingPdf(true);
    toast.loading('Génération du PDF...', { id: 'pdf' });
    const orig = document.title;
    document.title = facture.numero;
    try {
      const pdf = await generatePdfBlob();
      if (!pdf) throw new Error('PDF non généré');
      pdf.save(`${facture.numero}.pdf`);
      toast.success('PDF téléchargé', { id: 'pdf' });
    } catch {
      toast.error('Erreur lors de la génération du PDF', { id: 'pdf' });
    } finally {
      document.title = orig;
      setIsGeneratingPdf(false);
    }
  };

  const handleWhatsApp = async () => {
    if (!facture || isSharing) return;
    setIsSharing(true);
    toast.loading('Préparation du PDF...', { id: 'whatsapp' });
    const orig = document.title;
    document.title = facture.numero;
    try {
      const pdf = await generatePdfBlob();
      if (!pdf) throw new Error('PDF non généré');
      const pdfBlob = pdf.output('blob');
      const file = new File([pdfBlob], `${facture.numero}.pdf`, { type: 'application/pdf' });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `Facture ${facture.numero}`,
          text: `Facture ${facture.numero} de ${profile?.company_name || 'notre entreprise'}`,
        });
        toast.success('Partagé', { id: 'whatsapp' });
      } else {
        pdf.save(`${facture.numero}.pdf`);
        const msg = encodeURIComponent(
          `Facture ${facture.numero} de ${profile?.company_name || 'notre entreprise'} — le PDF vient d'être téléchargé, joignez-le à ce message.`
        );
        window.open(`https://wa.me/?text=${msg}`, '_blank');
        toast.success('PDF téléchargé — joignez-le sur WhatsApp', { id: 'whatsapp' });
      }
    } catch (err) {
      if ((err as Error)?.name !== 'AbortError') {
        toast.error('Erreur lors du partage', { id: 'whatsapp' });
      } else {
        toast.dismiss('whatsapp');
      }
    } finally {
      document.title = orig;
      setIsSharing(false);
    }
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
  const montantAIB = Number(facture.montant_aib) || 0;
  const montantTTC = Number(facture.montant_ttc) || 0;
  const statutInfo = STATUT_LABELS[facture.statut] || STATUT_LABELS.brouillon;

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
      position: static !important;
      width: 100% !important;
      box-shadow: none !important;
      border-radius: 0 !important;
      padding: 0 !important;
    }
    table { page-break-inside: auto; }
    tr { page-break-inside: avoid; page-break-after: auto; }
    thead { display: table-header-group; }
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
              disabled={isGeneratingPdf}
              className="gap-1 bg-yellow-500 hover:bg-yellow-600 text-white disabled:opacity-60"
            >
              {isGeneratingPdf ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              PDF
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
              disabled={isSharing}
              className="gap-1 bg-green-600 hover:bg-green-700 text-white disabled:opacity-60"
            >
              {isSharing ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageCircle className="h-4 w-4" />}
              WhatsApp
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
              <span
                className="no-print inline-block mt-2 px-2 py-0.5 rounded text-xs font-semibold"
                style={{ backgroundColor: statutInfo.bg, color: statutInfo.text }}
              >
                {statutInfo.label}
              </span>
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
                Adresse : {facture.client_adresse}
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
                {articles.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-sm" style={{ color: '#6b7280' }}>
                      Aucun article sur cette facture
                    </td>
                  </tr>
                ) : (
                  articles.map((art, idx) => (
                    <tr
                      key={art.id}
                      style={{ borderBottom: '1px solid #e5e7eb' }}
                    >
                      <td className="py-2 px-2" style={{ color: '#000000' }}>{idx + 1}</td>
                      <td
                        className="py-2 px-2"
                        style={{ color: '#000000', overflowWrap: 'break-word', wordBreak: 'break-word' }}
                      >
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
                  ))
                )}
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
              {facture.apply_aib && (
                <div className="flex justify-between" style={{ color: '#000000' }}>
                  <span>AIB ({facture.aib_rate === 0.05 ? '5' : '1'}%)</span>
                  <span className="tabular-nums">{formatFCFA(montantAIB)}</span>
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