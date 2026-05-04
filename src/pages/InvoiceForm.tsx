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
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Trash2, ArrowLeft, PenLine } from 'lucide-react';
import { toast } from 'sonner';
import { formatFCFA } from '@/lib/format';

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
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<Item[]>([{ product_id: null, designation: '', quantity: 1, unit_price: 0 }]);
  const [applyTVA, setApplyTVA] = useState(true);
  const [applyMTCC, setApplyMTCC] = useState(true);
  const [loading, setLoading] = useState(false);

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
      setNotes(inv.notes || '');
      const { data: its } = await supabase.from('invoice_items').select('*').eq('invoice_id', id!).order('position');
      setItems((its || []).map(it => ({ id: it.id, product_id: it.product_id, designation: it.designation, quantity: it.quantity, unit_price: it.unit_price, manual: !it.product_id })));
    })();
  }, [id, editing]);

  const totalHT = items.reduce((s, it) => s + it.quantity * it.unit_price, 0);
  const tva = applyTVA ? totalHT * 0.18 : 0;
  const mtcc = applyMTCC ? totalHT * 0.01 : 0;
  const totalTTC = totalHT + tva + mtcc;

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
        date, status, notes,
        total_ttc: Math.round(totalTTC),
        invoice_number: '',
        client_name: isManualClient ? (manualClientName.trim() || null) : (client?.name || null),
        client_address: client?.address || null,
        client_phone: client?.phone || null,
        client_email: client?.email || null,
        client_ifu: client?.ifu || null,
      };
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
            <CardContent className="grid md:grid-cols-3 gap-4">
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
              <div className="md:col-span-3"><Label>Notes</Label><Textarea value={notes} onChange={e => setNotes(e.target.value)} /></div>
            </CardContent>
          </Card>

          <Card className="shadow-card border-border/60">
            <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-2">
              <CardTitle className="font-display">Articles</CardTitle>
              <div className="flex gap-2">
                <Button type="button" onClick={addItem} variant="outline" size="sm"><Plus className="h-4 w-4 mr-1" />Ajouter une ligne</Button>
                <Button type="button" onClick={addManualItem} variant="outline" size="sm"><PenLine className="h-4 w-4 mr-1" />Ajouter une ligne libre</Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {items.map((it, i) => (
                  <div key={i} className="grid grid-cols-12 gap-2 items-end">
                    {it.manual ? (
                      <div className="col-span-12 md:col-span-7">
                        {i === 0 && <Label className="text-xs">Désignation (saisie libre)</Label>}
                        <Input value={it.designation} onChange={e => updateItem(i, { designation: e.target.value })} placeholder="Désignation libre" />
                      </div>
                    ) : (
                      <>
                        <div className="col-span-12 md:col-span-3">
                          {i === 0 && <Label className="text-xs">Produit</Label>}
                          <Select value={it.product_id || ''} onValueChange={(v) => pickProduct(i, v)}>
                            <SelectTrigger><SelectValue placeholder="Choisir..." /></SelectTrigger>
                            <SelectContent>
                              {products.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="col-span-12 md:col-span-4">
                          {i === 0 && <Label className="text-xs">Désignation</Label>}
                          <Input value={it.designation} onChange={e => updateItem(i, { designation: e.target.value })} placeholder="Désignation" />
                        </div>
                      </>
                    )}
                    <div className="col-span-4 md:col-span-1">
                      {i === 0 && <Label className="text-xs">Qté</Label>}
                      <Input type="number" min="1" value={it.quantity} onChange={e => updateItem(i, { quantity: Number(e.target.value) })} />
                    </div>
                    <div className="col-span-4 md:col-span-2">
                      {i === 0 && <Label className="text-xs">PU (FCFA)</Label>}
                      <Input type="number" min="0" value={it.unit_price} onChange={e => updateItem(i, { unit_price: Number(e.target.value) })} />
                    </div>
                    <div className="col-span-3 md:col-span-1 text-right text-sm tabular-nums">
                      {i === 0 && <Label className="text-xs">Total</Label>}
                      <div className="h-10 flex items-center justify-end font-medium">{formatFCFA(it.quantity * it.unit_price)}</div>
                    </div>
                    <div className="col-span-1">
                      <Button type="button" variant="ghost" size="icon" onClick={() => removeItem(i)} disabled={items.length === 1} className="h-10 w-10 text-destructive"><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex flex-col md:flex-row justify-between gap-6 mt-6 pt-4 border-t">
                <div className="space-y-3">
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <Checkbox checked={applyTVA} onCheckedChange={(v) => setApplyTVA(!!v)} />
                    Appliquer TVA 18%
                  </label>
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <Checkbox checked={applyMTCC} onCheckedChange={(v) => setApplyMTCC(!!v)} />
                    Appliquer MTCC 1%
                  </label>
                </div>
                <div className="min-w-[260px] space-y-1.5 text-sm">
                  <div className="flex justify-between"><span className="text-muted-foreground">Montant HT</span><span className="tabular-nums font-medium">{formatFCFA(totalHT)}</span></div>
                  {applyTVA && <div className="flex justify-between"><span className="text-muted-foreground">TVA (18%)</span><span className="tabular-nums">{formatFCFA(tva)}</span></div>}
                  {applyMTCC && <div className="flex justify-between"><span className="text-muted-foreground">MTCC (1%)</span><span className="tabular-nums">{formatFCFA(mtcc)}</span></div>}
                  <div className="flex justify-between pt-2 border-t mt-2">
                    <span className="font-display font-bold">Total TTC</span>
                    <span className="font-display font-bold text-lg tabular-nums" style={{ color: '#6366F1' }}>{formatFCFA(totalTTC)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-3">
            <Link to="/factures"><Button type="button" variant="outline">Annuler</Button></Link>
            <Button type="submit" disabled={loading} className="bg-primary hover:bg-primary/90">
              {loading ? 'Enregistrement...' : editing ? 'Mettre à jour' : 'Créer la facture'}
            </Button>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}
