import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';
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
import { toast as sonnerToast } from 'sonner';
import { toast } from '@/hooks/use-toast';
import { formatFCFA } from '@/lib/format';
import { useProfile } from '@/hooks/useProfile';
import { useLocation } from 'react-router-dom';
import { lireBrouillon } from '@/lib/brouillonIA';

type Client = Tables<'clients'>;
type Product = Tables<'produits'>;
type InvoiceStatus = 'brouillon' | 'envoyee' | 'payee';
type Item = { id?: string; product_id: string | null; designation: string; quantity: number; unit_price: number; manual?: boolean };
type RegimeFiscal = 'tva' | 'tps' | 'inconnu';

const MANUAL = '__manual__';

export default function InvoiceForm() {
  const { id } = useParams();
  const editing = !!id;
  const { user } = useAuth();
  const nav = useNavigate();

  const [clientId, setClientId] = useState<string>('');
  const [manualClientName, setManualClientName] = useState<string>('');
  const [date, setDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [status, setStatus] = useState<InvoiceStatus>('brouillon');
  const [items, setItems] = useState<Item[]>([{ product_id: null, designation: '', quantity: 1, unit_price: 0 }]);
  const [applyTVA, setApplyTVA] = useState(false);
  const [applyAIB, setApplyAIB] = useState(false);
  const [aibRate, setAibRate] = useState<0.01 | 0.05>(0.01);
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const { data: profile } = useProfile();
  const regime = profile?.regime_fiscal as RegimeFiscal | undefined;

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id || null);
    };
    getUser();
  }, []);

  // Apply smart defaults from regime when creating a new invoice
  useEffect(() => {
    if (editing) return;
    if (regime === 'tva') setApplyTVA(true);
    if (regime === 'tps') setApplyTVA(false);
  }, [regime, editing]);

  // --- Brouillon prepare par l'assistant IA (ajout) : preremplit une NOUVELLE facture ---
  const emplacement = useLocation();
  useEffect(() => {
    if (editing) return;
    const brouillon = lireBrouillon(emplacement.state);
    if (!brouillon) return;
    if (brouillon.client) {
      setClientId(brouillon.client.id);
    } else if (brouillon.client_nom_saisi) {
      setClientId(MANUAL);
      setManualClientName(brouillon.client_nom_saisi);
    }
    if (brouillon.lignes.length > 0) {
      setItems(brouillon.lignes.map(l => ({
        product_id: l.produit_id,
        designation: l.designation,
        quantity: l.quantite,
        unit_price: l.prix_unitaire ?? 0,
        manual: !l.produit_id,
      })));
    }
    const sansPrix = brouillon.lignes.filter(l => l.prix_unitaire === null).length;
    sonnerToast.info(
      "Brouillon de l'assistant charge : verifiez chaque ligne avant d'enregistrer." +
        (sansPrix > 0 ? ` ${sansPrix} ligne(s) sans prix : a completer.` : ''),
      { id: 'brouillon-ia' },
    );
    // On vide l'etat pour qu'un rafraichissement ne reapplique pas le brouillon.
    nav(emplacement.pathname, { replace: true, state: null });
  }, [emplacement.state, emplacement.pathname, editing, nav]);

  const { data: clients = [] } = useQuery({
    queryKey: ['clients', userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data } = await supabase.from('clients').select('*').eq('user_id', userId).order('nom');
      return (data || []) as Client[];
    },
  });
  const { data: products = [] } = useQuery({
    queryKey: ['produits', userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data } = await supabase.from('produits').select('*').eq('user_id', userId).order('designation');
      return (data || []) as Product[];
    },
  });

  useEffect(() => {
    if (!editing) return;
    (async () => {
      const { data: inv } = await supabase.from('factures').select('*').eq('id', id!).maybeSingle();
      if (!inv) return;
      if (inv.client_id) {
        setClientId(inv.client_id);
      }
      setDate(inv.date_facture);
      setStatus(inv.statut as InvoiceStatus);
      // Recharge l'état TVA/AIB de la facture existante — sinon ces cases
      // repartent à zéro à chaque modification et écrasent les vrais montants.
      setApplyTVA(!!inv.apply_tva);
      setApplyAIB(!!(inv as any).apply_aib);
      if ((inv as any).aib_rate) {
        setAibRate((inv as any).aib_rate === 0.05 ? 0.05 : 0.01);
      }
      const { data: its } = await supabase.from('facture_articles').select('*').eq('facture_id', id!);
      setItems((its || []).map(it => ({
        id: it.id,
        product_id: it.produit_id,
        designation: it.designation,
        quantity: it.quantite,
        unit_price: it.prix_unitaire,
        manual: !it.produit_id,
      })));
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
    updateItem(i, { product_id: p.id, designation: p.designation, unit_price: p.prix_unitaire });
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (items.length === 0 || !items.some(it => it.designation.trim())) {
      return sonnerToast.error('Ajoutez au moins une ligne');
    }
    setLoading(true);
    try {
      if (!userId) throw new Error('Utilisateur non authentifie');
      const isManualClient = clientId === MANUAL;
      let resolvedClientId = isManualClient || !clientId ? null : clientId;
      let selectedClientName: string | null = null;
      let selectedClientAdresse: string | null = null;
      let selectedClientTelephone: string | null = null;
      let selectedClientIfu: string | null = null;
      if (isManualClient && manualClientName.trim()) {
        const { data: createdClient, error: clientError } = await supabase
          .from('clients')
          .insert({
            nom: manualClientName.trim(),
            telephone: null,
            ifu: null,
            adresse: null,
            user_id: userId,
          })
          .select('id')
          .single();
        if (clientError) throw clientError;
        resolvedClientId = createdClient.id;
        selectedClientName = manualClientName.trim();
      } else if (resolvedClientId) {
        const selectedClient = clients.find(client => client.id === resolvedClientId);
        selectedClientName = selectedClient?.nom || null;
        selectedClientAdresse = selectedClient?.adresse || null;
        selectedClientTelephone = selectedClient?.telephone || null;
        selectedClientIfu = selectedClient?.ifu || null;
      }
      const generatedNumber = `FP-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`;
      const invoicePayload = {
        user_id: userId,
        numero: editing ? undefined : generatedNumber,
        date_facture: date,
        statut: status,
        client_id: resolvedClientId,
        client_nom: selectedClientName,
        client_adresse: selectedClientAdresse,
        client_telephone: selectedClientTelephone,
        client_ifu: selectedClientIfu,
        montant_ht: Math.round(totalHT),
        montant_tva: Math.round(tva),
        montant_aib: Math.round(aib),
        montant_ttc: Math.round(totalTTC),
        apply_tva: applyTVA,
        apply_aib: applyAIB,
        aib_rate: applyAIB ? aibRate : null,
      };
      let invoiceId = id!;
      if (editing) {
        const { numero, ...updatePayload } = invoicePayload;
        const { error } = await supabase.from('factures').update(updatePayload).eq('id', id!);
        if (error) throw error;
        await supabase.from('facture_articles').delete().eq('facture_id', id!);
      } else {
        const { data, error } = await supabase
          .from('factures')
          .insert(invoicePayload)
          .select('id')
          .single();
        if (error) throw error;
        invoiceId = data.id;
      }
      const itemsPayload = items
        .filter(it => it.designation.trim())
        .map(it => ({
          facture_id: invoiceId,
          produit_id: it.product_id || null,
          designation: it.designation,
          quantite: Math.max(1, Math.round(it.quantity)),
          prix_unitaire: Math.round(it.unit_price),
        }));
      const { error: itErr } = await supabase.from('facture_articles').insert(itemsPayload);
      if (itErr) throw itErr;
      sonnerToast.success(editing ? 'Facture mise à jour' : 'Facture créée');
      nav(`/factures/${invoiceId}`);
    } catch (error) {
      console.error('Invoice error full:', JSON.stringify(error, null, 2));
      toast({
        title: "Erreur détaillée",
        description: JSON.stringify(error),
        variant: "destructive"
      });
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
                    {clients.map(c => <SelectItem key={c.id} value={c.id}>{c.nom}</SelectItem>)}
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
                <Select value={status} onValueChange={(v) => setStatus(v as InvoiceStatus)}>
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
                              {products.map(p => <SelectItem key={p.id} value={p.id}>{p.designation}</SelectItem>)}
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