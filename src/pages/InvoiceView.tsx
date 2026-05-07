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
    const originalTitle = document.title;
    document.title = invoice.invoice_number;
    const el = printRef.current;
    const originalWidth = el.style.width;
    el.style.width = '794px';
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
    } finally {
      el.style.width = originalWidth;
      document.title = originalTitle;
    }
  };

  const handlePrint = () => {
    const originalTitle = document.title;
    document.title = invoice.invoice_number;
    setTimeout(() => {
      window.print();
      setTimeout(() => { document.title = originalTitle; }, 500);
    }, 50);
  };

  const handleWhatsAppShare = () => {
    const invoiceNumber = invoice.invoice_number || 'FP-2026-0001';
    const clientName = invoice.client_name || 'Client';
    const total = Number(invoice.total_ttc || 0).toLocaleString('fr-FR');

    const message = encodeURIComponent(
      `Bonjour,\n\nVeuillez trouver ci-joint notre facture proforma.\n\n` +
      `📋 Facture : ${invoiceNumber}\n` +
      `👤 Client : ${clientName}\n` +
      `💰 Montant TTC : ${total} FCFA\n\n` +
      `Merci pour votre confiance.\n` +
      `— ${profile?.company_name || 'Notre entreprise'}`
    );

    window.open(`https://wa.me/?text=${message}`, '_blank');
  };

  if (!invoice) return <AppLayout><div className="text-muted-foreground">Chargement...</div></AppLayout>;

  const company = profile?.company_name || 'Mon Entreprise';
  const companyLine = [profile?.company_address, profile?.company_city].filter(Boolean).join(', ');
  const itemsHT = items.reduce((s, it) => s + Number(it.total || it.quantity * it.unit_price), 0);
  const totalHT = Number((invoice as any).montant_ht) || itemsHT;
  const ttc = Number(invoice.total_ttc) || 0;
  const hasTVA = !!(invoice as any).apply_tva;
  const hasMTCC = !!(invoice as any).apply_mtcc;
  const hasTCC = !!(invoice as any).apply_tcc;
  const tva = Number((invoice as any).montant_tva) || (hasTVA ? Math.round(totalHT * 0.18) : 0);
  const mtcc = Number((invoice as any).montant_mtcc) || (hasMTCC ? Math.round(totalHT * 0.01) : 0);
  const tcc = Number((invoice as any).montant_tcc) || (hasTCC ? Math.round(totalHT * 0.01) : 0);

  return (
    <AppLayout>
      <div className="space-y-6 max-w-4xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 no-print">
          <Link to="/factures" className="self-start">
            <Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4 mr-2" />Retour</Button>
          </Link>
          <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2">
            <Link to={`/factures/${id}/modifier`}><Button variant="outline" size="sm" className="w-full"><Pencil className="h-4 w-4 mr-2" />Modifier</Button></Link>
            <Button onClick={downloadPDF} size="sm" className="bg-accent hover:bg-accent/90"><Download className="h-4 w-4 mr-2" />PDF</Button>
            <Button onClick={handlePrint} variant="outline" size="sm"><Printer className="h-4 w-4 mr-2" />Imprimer</Button>
            <Button onClick={handleWhatsAppShare} size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white"><MessageCircle className="h-4 w-4 mr-2" />WhatsApp</Button>
          </div>
        </div>

        <div ref={printRef} className="bg-white rounded-xl shadow-card p-4 sm:p-10 print:shadow-none print:rounded-none print:p-0 text-[12px] sm:text-sm" style={{ color: '#000000' }}>
          {/* HEADER */}
          <div className="flex justify-between items-start pb-6 border-b-2 border-primary/20" style={{ color: '#000000' }}>
            <div>
              <h2 className="font-display text-2xl font-bold" style={{ color: '#000000' }}>{company}</h2>
              {companyLine && <p className="text-sm mt-1" style={{ color: '#000000' }}>{companyLine}</p>}
              {profile?.phone_whatsapp && <p className="text-sm" style={{ color: '#000000' }}>Tél : {profile.phone_whatsapp}</p>}
              {profile?.email && <p className="text-sm" style={{ color: '#000000' }}>{profile.email}</p>}
            </div>
            <div className="text-right">
              <span style={{ color: '#000000', fontSize: '11px', letterSpacing: '2px', fontWeight: 600 }} className="uppercase block">Facture Proforma</span>
              <p className="font-mono text-lg font-bold mt-2" style={{ color: '#000000' }}>{invoice.invoice_number}</p>
              <p className="text-sm mt-1" style={{ color: '#000000' }}>Date : {formatDate(invoice.date)}</p>
            </div>
          </div>

          {/* CLIENT */}
          <div className="my-6">
            <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: '#000000' }}>Client</p>
            <p className="font-bold text-lg" style={{ color: '#000000' }}>{invoice.client_name || '—'}</p>
            {invoice.client_address && <p className="text-sm" style={{ color: '#000000' }}>{invoice.client_address}</p>}
            {invoice.client_phone && <p className="text-sm" style={{ color: '#000000' }}>Tél : {invoice.client_phone}</p>}
            {invoice.client_ifu && <p className="text-sm" style={{ color: '#000000' }}>IFU : {invoice.client_ifu}</p>}
          </div>

          {/* ITEMS */}
          <table className="w-full border-collapse mt-2" style={{ tableLayout: 'fixed', fontSize: '12px' }}>
            <colgroup>
              <col style={{ width: '5%' }} />
              <col style={{ width: '40%' }} />
              <col style={{ width: '10%' }} />
              <col style={{ width: '22%' }} />
              <col style={{ width: '23%' }} />
            </colgroup>
            <thead>
              <tr style={{ background: '#f0f0f0', color: '#000000', borderBottom: '2px solid #e0e0e0' }}>
                <th className="text-left p-3" style={{ overflow: 'hidden', color: '#000000', fontWeight: 600 }}>N°</th>
                <th className="text-left p-3" style={{ overflow: 'hidden', color: '#000000', fontWeight: 600 }}>Désignation</th>
                <th className="text-right p-3" style={{ overflow: 'hidden', color: '#000000', fontWeight: 600 }}>Qté</th>
                <th className="text-right p-3" style={{ overflow: 'hidden', color: '#000000', fontWeight: 600 }}>PU (FCFA)</th>
                <th className="text-right p-3" style={{ overflow: 'hidden', color: '#000000', fontWeight: 600 }}>Montant (FCFA)</th>
              </tr>
            </thead>
            <tbody>
              {items.map((it, i) => (
                <tr key={it.id} className="border-b border-border">
                  <td className="p-3" style={{ overflow: 'hidden', color: '#000000' }}>{i + 1}</td>
                  <td className="p-3" style={{ overflow: 'hidden', color: '#000000' }}>{it.designation}</td>
                  <td className="p-3 text-right tabular-nums" style={{ overflow: 'hidden', color: '#000000' }}>{it.quantity}</td>
                  <td className="p-3 text-right tabular-nums" style={{ overflow: 'hidden', color: '#000000' }}>{new Intl.NumberFormat('fr-FR').format(it.unit_price)}</td>
                  <td className="p-3 text-right tabular-nums font-medium" style={{ overflow: 'hidden', color: '#000000' }}>{new Intl.NumberFormat('fr-FR').format(it.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* TOTALS */}
          <div className="flex justify-end mt-6">
            <div className="min-w-[300px] space-y-1.5 text-sm" style={{ color: '#000000' }}>
              <div className="flex justify-between py-1"><span style={{ color: '#000000' }}>Montant HT</span><span className="tabular-nums font-medium" style={{ color: '#000000' }}>{formatFCFA(totalHT)}</span></div>
              {hasTVA && <div className="flex justify-between py-1"><span style={{ color: '#000000' }}>TVA (18%)</span><span className="tabular-nums" style={{ color: '#000000' }}>{formatFCFA(tva)}</span></div>}
              {hasMTCC && <div className="flex justify-between py-1"><span style={{ color: '#000000' }}>MTCC (1%)</span><span className="tabular-nums" style={{ color: '#000000' }}>{formatFCFA(mtcc)}</span></div>}
              {hasTCC && <div className="flex justify-between py-1"><span style={{ color: '#000000' }}>TCC (1%)</span><span className="tabular-nums" style={{ color: '#000000' }}>{formatFCFA(tcc)}</span></div>}
              <div className="flex justify-between items-center pt-3 border-t-2 border-primary/30">
                <span className="font-display" style={{ whiteSpace: 'nowrap', color: '#000000', fontWeight: 700, fontSize: '16px' }}>Total TTC</span>
                <span className="font-display tabular-nums" style={{ color: '#000000', whiteSpace: 'nowrap', fontSize: '22px', fontWeight: 700 }}>{formatFCFA(ttc)}</span>
              </div>
            </div>
          </div>

          <p className="text-center text-sm italic mt-10 pt-6 border-t" style={{ color: '#000000' }}>
            {company}{profile?.company_city ? ` — ${profile.company_city}` : ''} · Merci pour votre confiance
          </p>
        </div>
      </div>
    </AppLayout>
  );
}
