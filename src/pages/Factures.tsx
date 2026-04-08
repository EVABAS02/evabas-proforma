import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Plus, Pencil, Trash2, Eye, Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import StatusBadge from '@/components/StatusBadge';
import CategoryBadge from '@/components/CategoryBadge';
import ConfirmDialog from '@/components/ConfirmDialog';
import AppLayout from '@/components/AppLayout';
import { formatFCFA, formatDate } from '@/lib/format';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Tables } from '@/integrations/supabase/types';

type Facture = Tables<'factures'>;

interface ArticleLine {
  id?: string;
  produit_id: string | null;
  designation: string;
  quantite: number;
  prix_unitaire: number;
}

export default function Factures() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [numero, setNumero] = useState('');
  const [dateFacture, setDateFacture] = useState<Date>(new Date());
  const [clientMode, setClientMode] = useState<'existing' | 'manual'>('existing');
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [clientNom, setClientNom] = useState('');
  const [clientIfu, setClientIfu] = useState('');
  const [clientTelephone, setClientTelephone] = useState('');
  const [clientAdresse, setClientAdresse] = useState('');
  const [articles, setArticles] = useState<ArticleLine[]>([]);

  const { data: factures = [] } = useQuery({
    queryKey: ['factures'],
    queryFn: async () => {
      const { data } = await supabase.from('factures').select('*').order('created_at', { ascending: false });
      return data || [];
    },
  });

  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: async () => {
      const { data } = await supabase.from('clients').select('*').order('nom');
      return data || [];
    },
  });

  const { data: produits = [] } = useQuery({
    queryKey: ['produits'],
    queryFn: async () => {
      const { data } = await supabase.from('produits').select('*').order('designation');
      return data || [];
    },
  });

  const generateNumero = async (): Promise<string> => {
    const year = new Date().getFullYear();
    const { data } = await supabase
      .from('factures')
      .select('numero')
      .like('numero', `FP-${year}-%`)
      .order('numero', { ascending: false })
      .limit(1);
    const last = data?.[0]?.numero;
    const seq = last ? parseInt(last.split('-')[2]) + 1 : 1;
    return `FP-${year}-${String(seq).padStart(4, '0')}`;
  };

  const openCreate = async () => {
    setEditingId(null);
    setNumero(await generateNumero());
    setDateFacture(new Date());
    setClientMode('existing');
    setSelectedClientId('');
    setClientNom(''); setClientIfu(''); setClientTelephone(''); setClientAdresse('');
    setArticles([{ produit_id: null, designation: '', quantite: 1, prix_unitaire: 0 }]);
    setSheetOpen(true);
  };

  const openEdit = async (f: Facture) => {
    setEditingId(f.id);
    setNumero(f.numero);
    setDateFacture(new Date(f.date_facture));
    if (f.client_id) {
      setClientMode('existing');
      setSelectedClientId(f.client_id);
    } else {
      setClientMode('manual');
    }
    setClientNom(f.client_nom || '');
    setClientIfu(f.client_ifu || '');
    setClientTelephone(f.client_telephone || '');
    setClientAdresse(f.client_adresse || '');
    const { data: arts } = await supabase.from('facture_articles').select('*').eq('facture_id', f.id);
    setArticles(
      (arts || []).map(a => ({
        id: a.id,
        produit_id: a.produit_id,
        designation: a.designation,
        quantite: a.quantite,
        prix_unitaire: Number(a.prix_unitaire),
      }))
    );
    setSheetOpen(true);
  };

  const selectClient = (clientId: string) => {
    setSelectedClientId(clientId);
    const c = clients.find(cl => cl.id === clientId);
    if (c) {
      setClientNom(c.nom);
      setClientIfu(c.ifu || '');
      setClientTelephone(c.telephone || '');
      setClientAdresse(c.adresse || '');
    }
  };

  const updateArticle = (index: number, field: keyof ArticleLine, value: any) => {
    setArticles(prev => prev.map((a, i) => i === index ? { ...a, [field]: value } : a));
  };

  const removeArticle = (index: number) => {
    setArticles(prev => prev.filter((_, i) => i !== index));
  };

  const addArticle = () => {
    setArticles(prev => [...prev, { produit_id: null, designation: '', quantite: 1, prix_unitaire: 0 }]);
  };

  const totalTTC = articles.reduce((sum, a) => sum + a.quantite * a.prix_unitaire, 0);

  const saveMutation = useMutation({
    mutationFn: async (statut: string) => {
      const factureData = {
        numero,
        date_facture: format(dateFacture, 'yyyy-MM-dd'),
        statut,
        client_id: clientMode === 'existing' && selectedClientId ? selectedClientId : null,
        client_nom: clientNom || null,
        client_ifu: clientIfu || null,
        client_telephone: clientTelephone || null,
        client_adresse: clientAdresse || null,
        montant_ttc: totalTTC,
        user_id: user!.id,
      };

      let factureId = editingId;

      if (editingId) {
        const { user_id, ...updateData } = factureData;
        const { error } = await supabase.from('factures').update(updateData).eq('id', editingId);
        if (error) throw error;
        await supabase.from('facture_articles').delete().eq('facture_id', editingId);
      } else {
        const { data, error } = await supabase.from('factures').insert(factureData).select().single();
        if (error) throw error;
        factureId = data.id;
      }

      if (articles.length > 0) {
        const artRows = articles.map(a => ({
          facture_id: factureId!,
          produit_id: a.produit_id || null,
          designation: a.designation,
          quantite: a.quantite,
          prix_unitaire: a.prix_unitaire,
        }));
        const { error } = await supabase.from('facture_articles').insert(artRows);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['factures'] });
      qc.invalidateQueries({ queryKey: ['factures-count'] });
      qc.invalidateQueries({ queryKey: ['total-ttc'] });
      qc.invalidateQueries({ queryKey: ['recent-factures'] });
      setSheetOpen(false);
      toast.success('Facture enregistrée');
    },
    onError: (err: any) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('factures').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['factures'] });
      qc.invalidateQueries({ queryKey: ['factures-count'] });
      qc.invalidateQueries({ queryKey: ['total-ttc'] });
      qc.invalidateQueries({ queryKey: ['recent-factures'] });
      toast.success('Facture supprimée');
    },
  });

  const statusMutation = useMutation({
    mutationFn: async ({ id, statut }: { id: string; statut: string }) => {
      const { error } = await supabase.from('factures').update({ statut }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['factures'] });
      qc.invalidateQueries({ queryKey: ['recent-factures'] });
      toast.success('Statut mis à jour');
    },
  });

  const filtered = factures.filter(f =>
    f.numero.toLowerCase().includes(search.toLowerCase()) ||
    (f.client_nom || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Toutes les factures</h1>
          <Button onClick={openCreate} className="bg-accent text-accent-foreground hover:bg-accent/90">
            <Plus className="h-4 w-4 mr-2" /> Nouvelle facture
          </Button>
        </div>

        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Rechercher par n° ou client..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>

        <div className="bg-card rounded-lg shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>N° Facture</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-right">Montant</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="w-28">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((f) => (
                <TableRow key={f.id}>
                  <TableCell className="font-mono text-sm font-medium">{f.numero}</TableCell>
                  <TableCell>{f.client_nom || '—'}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="cursor-pointer"><StatusBadge status={f.statut} /></button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        {['brouillon', 'envoyé', 'validé'].map(s => (
                          <DropdownMenuItem key={s} onClick={() => statusMutation.mutate({ id: f.id, statut: s })}>
                            <StatusBadge status={s} />
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                  <TableCell className="text-right font-medium">{formatFCFA(Number(f.montant_ttc))}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{formatDate(f.date_facture)}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(f)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Link to={`/factures/${f.id}/print`}>
                        <Button variant="ghost" size="icon" className="h-8 w-8"><Eye className="h-4 w-4" /></Button>
                      </Link>
                      <ConfirmDialog
                        trigger={<Button variant="ghost" size="icon" className="h-8 w-8 text-destructive"><Trash2 className="h-4 w-4" /></Button>}
                        onConfirm={() => deleteMutation.mutate(f.id)}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {filtered.length === 0 && (
            <p className="text-center text-muted-foreground py-8">Aucune facture trouvée.</p>
          )}
        </div>

        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetContent className="sm:max-w-2xl overflow-y-auto">
            <SheetHeader>
              <SheetTitle>{editingId ? 'Modifier la facture' : 'Nouvelle facture'}</SheetTitle>
            </SheetHeader>

            <div className="space-y-6 mt-6">
              {/* Info section */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>N° Facture</Label>
                  <Input value={numero} readOnly className="bg-muted" />
                </div>
                <div>
                  <Label>Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal">
                        {format(dateFacture, 'dd/MM/yyyy')}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar mode="single" selected={dateFacture} onSelect={d => d && setDateFacture(d)} className="pointer-events-auto" />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              {/* Client section */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Label className="text-base font-semibold">Client</Label>
                  <Button variant="ghost" size="sm" onClick={() => setClientMode(clientMode === 'existing' ? 'manual' : 'existing')} className="text-xs text-accent">
                    {clientMode === 'existing' ? 'Saisir manuellement' : 'Client existant'}
                  </Button>
                </div>

                {clientMode === 'existing' ? (
                  <Select value={selectedClientId} onValueChange={selectClient}>
                    <SelectTrigger><SelectValue placeholder="Sélectionner un client existant" /></SelectTrigger>
                    <SelectContent>
                      {clients.map(c => <SelectItem key={c.id} value={c.id}>{c.nom}</SelectItem>)}
                    </SelectContent>
                  </Select>
                ) : null}

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Nom</Label>
                    <Input value={clientNom} onChange={e => setClientNom(e.target.value)} />
                  </div>
                  <div>
                    <Label className="text-xs">IFU</Label>
                    <Input value={clientIfu} onChange={e => setClientIfu(e.target.value)} />
                  </div>
                  <div>
                    <Label className="text-xs">Téléphone</Label>
                    <Input value={clientTelephone} onChange={e => setClientTelephone(e.target.value)} />
                  </div>
                  <div>
                    <Label className="text-xs">Adresse</Label>
                    <Input value={clientAdresse} onChange={e => setClientAdresse(e.target.value)} />
                  </div>
                </div>
              </div>

              {/* Articles section */}
              <div className="space-y-3">
                <Label className="text-base font-semibold">Articles</Label>
                {articles.map((art, i) => (
                  <ArticleRow
                    key={i}
                    article={art}
                    produits={produits}
                    onChange={(field, value) => updateArticle(i, field, value)}
                    onRemove={() => removeArticle(i)}
                  />
                ))}
                <Button variant="outline" className="w-full border-dashed" onClick={addArticle}>
                  <Plus className="h-4 w-4 mr-2" /> Ajouter un article
                </Button>

                <div className="flex justify-end pt-2">
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Montant TTC</p>
                    <p className="text-2xl font-bold text-foreground">{formatFCFA(totalTTC)}</p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-4 border-t">
                {editingId && (
                  <Link to={`/factures/${editingId}/print`} className="flex-1">
                    <Button variant="outline" className="w-full">Aperçu & Imprimer</Button>
                  </Link>
                )}
                <Button variant="outline" className="flex-1" onClick={() => saveMutation.mutate('brouillon')} disabled={saveMutation.isPending}>
                  Sauvegarder brouillon
                </Button>
                <Button className="flex-1 bg-accent text-accent-foreground hover:bg-accent/90" onClick={() => saveMutation.mutate('envoyé')} disabled={saveMutation.isPending}>
                  Marquer envoyé
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </AppLayout>
  );
}

function ArticleRow({
  article,
  produits,
  onChange,
  onRemove,
}: {
  article: ArticleLine;
  produits: Tables<'produits'>[];
  onChange: (field: keyof ArticleLine, value: any) => void;
  onRemove: () => void;
}) {
  const [query, setQuery] = useState(article.designation);
  const [showDropdown, setShowDropdown] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setQuery(article.designation);
  }, [article.designation]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setShowDropdown(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filtered = produits.filter(p =>
    p.designation.toLowerCase().includes(query.toLowerCase())
  ).slice(0, 8);

  const selectProduct = (p: Tables<'produits'>) => {
    onChange('produit_id', p.id);
    onChange('designation', p.designation);
    onChange('prix_unitaire', Number(p.prix_unitaire));
    setQuery(p.designation);
    setShowDropdown(false);
  };

  return (
    <div className="flex gap-2 items-start border rounded-lg p-3">
      <div className="flex-1 relative" ref={ref}>
        <Label className="text-xs">Désignation</Label>
        <Input
          value={query}
          onChange={e => {
            setQuery(e.target.value);
            onChange('designation', e.target.value);
            setShowDropdown(true);
          }}
          onFocus={() => setShowDropdown(true)}
          placeholder="Rechercher un produit..."
        />
        {showDropdown && filtered.length > 0 && (
          <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-popover border rounded-md shadow-lg max-h-48 overflow-y-auto">
            {filtered.map(p => (
              <button
                key={p.id}
                className="w-full px-3 py-2 text-left text-sm hover:bg-muted flex items-center justify-between"
                onClick={() => selectProduct(p)}
              >
                <span className="truncate mr-2">{p.designation}</span>
                <span className="flex items-center gap-2 shrink-0">
                  <CategoryBadge category={p.categorie} />
                  <span className="text-xs text-muted-foreground">{formatFCFA(Number(p.prix_unitaire))}</span>
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="w-20">
        <Label className="text-xs">Qté</Label>
        <Input type="number" min={1} value={article.quantite} onChange={e => onChange('quantite', Number(e.target.value))} />
      </div>
      <div className="w-28">
        <Label className="text-xs">Prix unit.</Label>
        <Input type="number" value={article.prix_unitaire} onChange={e => onChange('prix_unitaire', Number(e.target.value))} />
      </div>
      <div className="w-28">
        <Label className="text-xs">Montant</Label>
        <Input readOnly value={formatFCFA(article.quantite * article.prix_unitaire)} className="bg-muted" />
      </div>
      <Button variant="ghost" size="icon" className="mt-5 shrink-0 text-destructive" onClick={onRemove}>
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}
