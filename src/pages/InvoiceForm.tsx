import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import AppLayout from '@/components/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Plus, Trash2, ArrowLeft, PenLine, HelpCircle } from 'lucide-react';
import { toast } from 'sonner';
import { formatFCFA } from '@/lib/format';
import { useProfile } from '@/hooks/useProfile';

type Item = { id?: string; product_id: string | null; designation: string; quantity: number; unit_price: number; manual?: boolean };

const MANUAL = '__manual__';

export default function InvoiceForm() {
  const { id } = useParams();
  const editing = !!id;
  const { user } = useAuth();
  const nav = useNavigate();

  const [clientId, setClientId] = useState<string>('');
  const [manualClientName, setManualClientName] = useState<string>('');
  const [date, setDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [status, setStatus] = useState<'brouillon' | 'envoyee' | 'payee'>('brouillon');
  const [items, setItems] = useState<Item[]>([{ product_id: null, designation: '', quantity: 1, unit_price: 0 }]);
  const [applyTVA, setApplyTVA] = useState(false);
  const [applyAIB, setApplyAIB] = useState(false);
  const [aibRate, setAibRate] = useState<0.01 | 0.05>(0.01);
  const [loading, setLoading] = useState(false);
  const { data: profile } = useProfile();
  const regime = (profile as any)?.regime_fiscal as 'tva' | 'tps' | 'inconnu' | undefined;

  // Apply smart defaults from regime when creating a new invoice
  useEffect(() => {
    if (editing) return;
    if (regime === 'tva') setApplyTVA(true);
    if (regime === 'tps') setApplyTVA(false);
  }, [regime, editing]);

  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: async () => {
      const { data } = await supabase.from('clients').select('*').order('name');
      return data || [];
    },
  });
  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const { data } = await supabase.from('products').select('*').order('name');
      return data || [];
    },
  });

  useEffect(() => {
    if (!editing) return;
    (async () => {
      const { data: inv } = await supabase.from('invoices').select('*').eq('id', id!).maybeSingle();
      if (!inv) return;
      if (inv.client_id) {
        setClientId(inv.client_id);
      } else if (inv.client_name) {
        setClientId(MANUAL);
        setManualClientName(inv.client_name);
      }
      setDate(inv.date);
      setStatus(inv.status);
      setApplyTVA(!!(inv as any).apply_tva);
      setApplyAIB(!!(inv as any).apply_aib);
      const r = Number((inv as any).aib_rate);
      setAibRate(r === 0.05 ? 0.05 : 0.01);
      const { data: its } = await supabase.from('invoice_items').select('*').eq('invoice_id', id!).order('position');
      setItems((its || []).map(it => ({ id: it.id, product_id: it.product_id, designation: it.designation, quantity: it.quantity, unit_price: it.unit_price, manual: !it.product_id })));
    })();
  }, [id, editing]);

  const totalHT = items.reduce((s, it) => s + it.quantity * it.unit_price, 0);
  const tva = applyTVA ? totalHT * 0.18 : 0;
  const aib = applyAIB ? totalHT * aibRate : 0;
  const totalTTC = totalHT + tva + aib;

  const addItem = () => setItems([...items, { product_id: null, designation: '', quantity: 1, unit_price: 0, manual: false }]);
  const addManualItem = () => setItems([...items, { product_id: null, designation: '', quantity: 1, unit_price: 0, manual: true }]);
  const removeItem = (i: number) => setItems(items.filter((_, idx) => idx !== i));
  const updateItem = (i: number, patch: Partial<Item>) => setItems(items.map((it, idx) => idx === i ? { ...it, ...patch } : it));

  const pickProduct = (i: number, productId: string) => {
    const p = products.find(pp => pp.id === productId);
    if (!p) return;
    updateItem(i, { product_id: p.id, designation: p.name, unit_price: p.unit_price });
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (items.length === 0 || !items.some(it => it.designation.trim())) {
      return toast.error('Ajoutez au moins une ligne');
    }
    setLoading(true);
    try {
      const isManualClient = clientId === MANUAL;
      const client = isManualClient ? null : clients.find(c => c.id === clientId);
      const payload = {
        user_id: user.id,
        client_id: isManualClient || !clientId ? null : clientId,
        date, status, notes: '',
        total_ttc: Math.round(totalTTC),
        invoice_number: '',
        client_name: isManualClient ? (manualClientName.trim() || null) : (client?.name || null),
        client_address: client?.address || null,
        client_phone: client?.phone || null,
        client_email: client?.email || null,
        client_ifu: client?.ifu || null,
        apply_tva: applyTVA,
        apply_mtcc: false,
        apply_tcc: false,
        apply_aib: applyAIB,
        aib_rate: aibRate,
        montant_ht: Math.round(totalHT),
        montant_tva: Math.round(tva),
        montant_mtcc: 0,
        montant_tcc: 0,
        montant_aib: Math.round(aib),
      } as any;
      let invoiceId = id!;
      if (editing) {
        const { error } = await supabase.from('invoices').update(payload).eq('id', id!);
        if (error) throw error;
        await supabase.from('invoice_items').delete().eq('invoice_id', id!);
      } else {
        const { data, error } = await supabase.from('invoices').insert(payload).select('id').single();
        if (error) throw error;
        invoiceId = data.id;
      }
      const itemsPayload = items
        .filter(it => it.designation.trim())
        .map((it, idx) => ({
          invoice_id: invoiceId,
          product_id: it.product_id,
          designation: it.designation,
          quantity: Math.max(1, Math.round(it.quantity)),
          unit_price: Math.round(it.unit_price),
          total: Math.round(it.quantity * it.unit_price),
          position: idx,
        }));
      const { error: itErr } = await supabase.from('invoice_items').insert(itemsPayload);
      if (itErr) throw itErr;
      toast.success(editing ? 'Facture mise à jour' : 'Facture créée');
      nav(`/factures/${invoiceId}`);
    } catch (err: any) {
      toast.error(err.message);
    } finally { setLoading(false); }
  };

  return (
    <AppLayout>
      <div className="space-y-6 max-w-5xl">
        <div className="flex items-center gap-3">
          <Link to="/factures"><Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button></Link>
          <div>
            <h1 className="font-display text-3xl font-bold">{editing ? 'Modifier la facture' : 'Nouvelle facture'}</h1>
            <p className="text-muted-foreground">Le numéro est généré automatiquement</p>
          </div>
        </div>

        <form onSubmit={submit} className="space-y-6">
          <Card className="shadow-card border-border/60">
            <CardHeader><CardTitle className="font-display">Informations</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2 space-y-2">
                <Label>Client</Label>
                <Select value={clientId} onValueChange={setClientId}>
                  <SelectTrigger><SelectValue placeholder="Sélectionner un client" /></SelectTrigger>
                  <SelectContent>
                    {clients.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                    <SelectItem value={MANUAL}>✏️ Saisir manuellement</SelectItem>
                  </SelectContent>
                </Select>
                {clientId === MANUAL && (
                  <Input
                    value={manualClientName}
                    onChange={e => setManualClientName(e.target.value)}
                    placeholder="Nom du client (saisie libre)"
                  />
                )}
              </div>
              <div><Label>Date</Label><Input type="date" value={date} onChange={e => setDate(e.target.value)} /></div>
              <div>
                <Label>Statut</Label>
                <Select value={status} onValueChange={(v: any) => setStatus(v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="brouillon">Brouillon</SelectItem>
                    <SelectItem value="envoyee">Envoyée</SelectItem>
                    <SelectItem value="payee">Payée</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card border-border/60">
            <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-2">
              <CardTitle className="font-display">Articles</CardTitle>
              <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                <Button type="button" onClick={addItem} variant="outline" size="sm" className="flex-1 sm:flex-none"><Plus className="h-4 w-4 mr-1" />Ajouter</Button>
                <Button type="button" onClick={addManualItem} variant="outline" size="sm" className="flex-1 sm:flex-none"><PenLine className="h-4 w-4 mr-1" />Ligne libre</Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {items.map((it, i) => (
                  <div key={i} className="grid grid-cols-12 gap-2 items-end p-3 sm:p-0 border sm:border-0 rounded-lg sm:rounded-none">
                    {it.manual ? (
                      <div className="col-span-12 md:col-span-7">
                        <Label className="text-xs sm:hidden">Désignation</Label>
                        {i === 0 && <Label className="text-xs hidden sm:block">Désignation (saisie libre)</Label>}
                        <Input value={it.designation} onChange={e => updateItem(i, { designation: e.target.value })} placeholder="Désignation libre" />
                      </div>
                    ) : (
                      <>
                        <div className="col-span-12 md:col-span-3">
                          <Label className="text-xs sm:hidden">Produit</Label>
                          {i === 0 && <Label className="text-xs hidden sm:block">Produit</Label>}
                          <Select value={it.product_id || ''} onValueChange={(v) => pickProduct(i, v)}>
                            <SelectTrigger><SelectValue placeholder="Choisir..." /></SelectTrigger>
                            <SelectContent>
                              {products.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="col-span-12 md:col-span-4">
                          <Label className="text-xs sm:hidden">Désignation</Label>
                          {i === 0 && <Label className="text-xs hidden sm:block">Désignation</Label>}
                          <Input value={it.designation} onChange={e => updateItem(i, { designation: e.target.value })} placeholder="Désignation" />
                        </div>
                      </>
                    )}
                    <div className="col-span-5 md:col-span-1">
                      <Label className="text-xs sm:hidden">Qté</Label>
                      {i === 0 && <Label className="text-xs hidden sm:block">Qté</Label>}
                      <Input type="number" min="1" value={it.quantity} onChange={e => updateItem(i, { quantity: Number(e.target.value) })} />
                    </div>
                    <div className="col-span-7 md:col-span-2">
                      <Label className="text-xs sm:hidden">PU (FCFA)</Label>
                      {i === 0 && <Label className="text-xs hidden sm:block">PU (FCFA)</Label>}
                      <Input type="number" min="0" value={it.unit_price} onChange={e => updateItem(i, { unit_price: Number(e.target.value) })} />
                    </div>
                    <div className="col-span-9 md:col-span-1 text-right text-sm tabular-nums">
                      <Label className="text-xs sm:hidden">Total</Label>
                      {i === 0 && <Label className="text-xs hidden sm:block">Total</Label>}
                      <div className="h-10 flex items-center justify-end font-medium">{formatFCFA(it.quantity * it.unit_price)}</div>
                    </div>
                    <div className="col-span-3 md:col-span-1 flex justify-end">
                      <Button type="button" variant="ghost" size="icon" onClick={() => removeItem(i)} disabled={items.length === 1} className="h-10 w-10 text-destructive"><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex flex-col md:flex-row justify-between gap-6 mt-6 pt-4 border-t">
                <div>
                  <p className="text-[13px] uppercase tracking-wide text-[#6B7280] mb-3 font-semibold">Taxes applicables</p>
                  {regime === 'tps' && (
                    <div className="mb-3 rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-[13px] text-blue-800">
                      Régime TPS : TVA non applicable
                    </div>
                  )}
                  {regime === 'inconnu' && (
                    <div className="mb-3 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-[13px] text-amber-800">
                      Consultez votre comptable pour les taxes applicables à votre entreprise.
                    </div>
                  )}
                  <TooltipProvider delayDuration={150}>
                  <div className="flex flex-col gap-[10px]">
                    {regime !== 'tps' && (
                      <label className="flex items-center gap-2 text-[14px] text-[#374151] cursor-pointer">
                        <Checkbox checked={applyTVA} onCheckedChange={(v) => setApplyTVA(!!v)} className="border-[#D1D5DB] data-[state=checked]:bg-[#6366F1] data-[state=checked]:border-[#6366F1] data-[state=checked]:text-white" />
                        Appliquer TVA (18%)
                        <Tooltip>
                          <TooltipTrigger asChild><HelpCircle className="h-3.5 w-3.5 text-[#9CA3AF]" /></TooltipTrigger>
                          <TooltipContent className="max-w-xs">Taxe sur la Valeur Ajoutée. Obligatoire si votre chiffre d'affaires dépasse 50 millions FCFA par an.</TooltipContent>
                        </Tooltip>
                      </label>
                    )}
                    <label className="flex items-center gap-2 text-[14px] text-[#374151] cursor-pointer">
                      <Checkbox checked={applyAIB} onCheckedChange={(v) => setApplyAIB(!!v)} className="border-[#D1D5DB] data-[state=checked]:bg-[#6366F1] data-[state=checked]:border-[#6366F1] data-[state=checked]:text-white" />
                      Appliquer AIB
                    </label>
                    {applyAIB && (
                      <RadioGroup value={String(aibRate)} onValueChange={(v) => setAibRate(v === '0.05' ? 0.05 : 0.01)} className="ml-6 mt-1 gap-2">
                        <label className="flex items-center gap-2 text-[14px] text-[#374151] cursor-pointer">
                          <RadioGroupItem value="0.01" id="aib-1" />
                          Fournisseur immatriculé (1%)
                          <Tooltip>
                            <TooltipTrigger asChild><HelpCircle className="h-3.5 w-3.5 text-[#9CA3AF]" /></TooltipTrigger>
                            <TooltipContent className="max-w-xs">Acompte sur Impôt assis sur le Bénéfice. Fournisseur enregistré avec IFU.</TooltipContent>
                          </Tooltip>
                        </label>
                        <label className="flex items-center gap-2 text-[14px] text-[#374151] cursor-pointer">
                          <RadioGroupItem value="0.05" id="aib-5" />
                          Fournisseur non immatriculé (5%)
                          <Tooltip>
                            <TooltipTrigger asChild><HelpCircle className="h-3.5 w-3.5 text-[#9CA3AF]" /></TooltipTrigger>
                            <TooltipContent className="max-w-xs">Fournisseur sans IFU, non immatriculé aux impôts du Bénin.</TooltipContent>
                          </Tooltip>
                        </label>
                      </RadioGroup>
                    )}
                  </div>
                  </TooltipProvider>
                </div>
                <div className="min-w-[260px] space-y-1.5 text-sm">
                  <div className="flex justify-between"><span className="text-muted-foreground">Montant HT</span><span className="tabular-nums font-medium">{formatFCFA(totalHT)}</span></div>
                  {applyTVA && <div className="flex justify-between"><span className="text-muted-foreground">TVA (18%)</span><span className="tabular-nums">{formatFCFA(tva)}</span></div>}
                  {applyAIB && <div className="flex justify-between"><span className="text-muted-foreground">AIB ({aibRate === 0.05 ? '5' : '1'}%)</span><span className="tabular-nums">{formatFCFA(aib)}</span></div>}
                  <div className="flex justify-between pt-2 border-t mt-2">
                    <span className="font-display font-bold">Total TTC</span>
                    <span className="font-display font-bold text-lg tabular-nums" style={{ color: '#000000', whiteSpace: 'nowrap' }}>{formatFCFA(totalTTC)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex flex-col sm:flex-row sm:justify-end gap-3">
            <Link to="/factures" className="sm:w-auto"><Button type="button" variant="outline" className="w-full sm:w-auto">Annuler</Button></Link>
            <Button type="submit" disabled={loading} className="w-full sm:w-auto bg-primary hover:bg-primary/90">
              {loading ? 'Enregistrement...' : editing ? 'Mettre à jour' : 'Créer la facture'}
            </Button>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}
