import { useEffect, useState, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from '@/hooks/useProfile';
import AppLayout from '@/components/AppLayout';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Pencil, Download, Printer, MessageCircle } from 'lucide-react';
import { formatFCFA, formatDate } from '@/lib/format';
import { toast } from 'sonner';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export default function InvoiceView() {
  const { id } = useParams();
  const nav = useNavigate();
  const { data: profile } = useProfile();
  const [invoice, setInvoice] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const { data: inv } = await supabase.from('invoices').select('*').eq('id', id).maybeSingle();
      if (!inv) return nav('/factures');
      setInvoice(inv);
      const { data: its } = await supabase.from('invoice_items').select('*').eq('invoice_id', id).order('position');
      setItems(its || []);
    })();
  }, [id, nav]);

  const downloadPDF = async () => {
    if (!printRef.current) return;
    toast.loading('Génération du PDF...', { id: 'pdf' });
    try {
      const canvas = await html2canvas(printRef.current, { scale: 2, backgroundColor: '#ffffff' });
      const img = canvas.toDataURL('image/jpeg', 0.95);
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(img, 'JPEG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`${invoice.invoice_number}.pdf`);
      toast.success('PDF téléchargé', { id: 'pdf' });
    } catch (e: any) {
      toast.error('Erreur PDF', { id: 'pdf' });
    }
  };

  const shareWhatsApp = () => {
    const phone = (invoice.client_phone || '').replace(/\D/g, '');
    const text = encodeURIComponent(
      `Bonjour ${invoice.client_name || ''},\n\nVeuillez trouver votre facture proforma ${invoice.invoice_number} d'un montant de ${formatFCFA(Number(invoice.total_ttc))}.\n\nCordialement,\n${profile?.company_name || ''}`
    );
    const url = phone ? `https://wa.me/${phone}?text=${text}` : `https://wa.me/?text=${text}`;
    window.open(url, '_blank');
  };

  if (!invoice) return <AppLayout><div className="text-muted-foreground">Chargement...</div></AppLayout>;

  const company = profile?.company_name || 'Mon Entreprise';
  const companyLine = [profile?.company_address, profile?.company_city].filter(Boolean).join(', ');
  const totalHT = items.reduce((s, it) => s + Number(it.total || it.quantity * it.unit_price), 0);
  const ttc = Number(invoice.total_ttc) || 0;
  // Reverse-engineer tax components for display: difference between TTC and HT split between TVA and MTCC.
  const taxDelta = Math.max(0, ttc - totalHT);
  // If both taxes applied (typical case): TVA=18% HT, MTCC=1% HT.
  const tva = Math.round(totalHT * 0.18);
  const mtcc = Math.round(totalHT * 0.01);
  const hasTVA = Math.abs(taxDelta - (tva + mtcc)) < 2 || taxDelta >= tva;
  const hasMTCC = taxDelta > tva || Math.abs(taxDelta - (tva + mtcc)) < 2;

  return (
    <AppLayout>
      <div className="space-y-6 max-w-4xl mx-auto">
        <div className="flex flex-wrap items-center justify-between gap-3 no-print">
          <Link to="/factures">
            <Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4 mr-2" />Retour</Button>
          </Link>
          <div className="flex flex-wrap gap-2">
            <Link to={`/factures/${id}/modifier`}><Button variant="outline" size="sm"><Pencil className="h-4 w-4 mr-2" />Modifier</Button></Link>
            <Button onClick={downloadPDF} size="sm" className="bg-accent hover:bg-accent/90"><Download className="h-4 w-4 mr-2" />Télécharger PDF</Button>
            <Button onClick={() => window.print()} variant="outline" size="sm"><Printer className="h-4 w-4 mr-2" />Imprimer</Button>
            <Button onClick={shareWhatsApp} size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white"><MessageCircle className="h-4 w-4 mr-2" />Partager WhatsApp</Button>
          </div>
        </div>

        <div ref={printRef} className="bg-white rounded-xl shadow-card p-10 print:shadow-none print:rounded-none print:p-0">
          {/* HEADER */}
          <div className="flex justify-between items-start pb-6 border-b-2 border-primary/20">
            <div>
              <h2 className="font-display text-2xl font-bold text-foreground">{company}</h2>
              {companyLine && <p className="text-sm text-muted-foreground mt-1">{companyLine}</p>}
              {profile?.phone_whatsapp && <p className="text-sm text-muted-foreground">Tél : {profile.phone_whatsapp}</p>}
              {profile?.email && <p className="text-sm text-muted-foreground">{profile.email}</p>}
            </div>
            <div className="text-right">
              <span className="inline-block bg-primary text-white text-xs font-bold tracking-[0.2em] uppercase px-3 py-1.5 rounded-full">Facture Proforma</span>
              <p className="font-mono text-lg font-bold mt-2">{invoice.invoice_number}</p>
              <p className="text-sm text-muted-foreground mt-1">Date : {formatDate(invoice.date)}</p>
            </div>
          </div>

          {/* CLIENT */}
          <div className="my-6">
            <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: '#C9A84C' }}>Client</p>
            <p className="font-bold text-lg">{invoice.client_name || '—'}</p>
            {invoice.client_address && <p className="text-sm text-muted-foreground">{invoice.client_address}</p>}
            {invoice.client_phone && <p className="text-sm text-muted-foreground">Tél : {invoice.client_phone}</p>}
            {invoice.client_ifu && <p className="text-sm text-muted-foreground">IFU : {invoice.client_ifu}</p>}
          </div>

          {/* ITEMS */}
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-primary text-white">
                <th className="text-left p-3 font-semibold">N°</th>
                <th className="text-left p-3 font-semibold">Désignation</th>
                <th className="text-right p-3 font-semibold">Qté</th>
                <th className="text-right p-3 font-semibold">Prix Unitaire (FCFA)</th>
                <th className="text-right p-3 font-semibold">Montant (FCFA)</th>
              </tr>
            </thead>
            <tbody>
              {items.map((it, i) => (
                <tr key={it.id} className="border-b border-border">
                  <td className="p-3">{i + 1}</td>
                  <td className="p-3">{it.designation}</td>
                  <td className="p-3 text-right tabular-nums">{it.quantity}</td>
                  <td className="p-3 text-right tabular-nums">{new Intl.NumberFormat('fr-FR').format(it.unit_price)}</td>
                  <td className="p-3 text-right tabular-nums font-medium">{new Intl.NumberFormat('fr-FR').format(it.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* TOTALS */}
          <div className="flex justify-end mt-6">
            <div className="min-w-[300px] space-y-1.5 text-sm">
              <div className="flex justify-between py-1"><span className="text-muted-foreground">Montant HT</span><span className="tabular-nums font-medium">{formatFCFA(totalHT)}</span></div>
              {hasTVA && <div className="flex justify-between py-1"><span className="text-muted-foreground">TVA (18%)</span><span className="tabular-nums">{formatFCFA(tva)}</span></div>}
              {hasMTCC && <div className="flex justify-between py-1"><span className="text-muted-foreground">MTCC (1%)</span><span className="tabular-nums">{formatFCFA(mtcc)}</span></div>}
              <div className="flex justify-between items-center pt-3 border-t-2 border-primary/30">
                <span className="font-display font-bold text-base">Total TTC</span>
                <span className="font-display font-bold text-2xl tabular-nums" style={{ color: '#6366F1' }}>{formatFCFA(ttc)}</span>
              </div>
            </div>
          </div>

          {invoice.notes && (
            <div className="mt-8 p-4 bg-muted/40 rounded-lg">
              <p className="text-xs font-semibold text-muted-foreground mb-1">Notes</p>
              <p className="text-sm whitespace-pre-wrap">{invoice.notes}</p>
            </div>
          )}

          <p className="text-center text-sm text-muted-foreground italic mt-10 pt-6 border-t">
            {company}{profile?.company_city ? ` — ${profile.company_city}` : ''} · Merci pour votre confiance
          </p>
        </div>
      </div>
    </AppLayout>
  );
}
