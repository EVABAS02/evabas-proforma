import { useState } from 'react';
import { Loader2, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import AppLayout from '@/components/AppLayout';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';

type SourcePrix = 'phrase' | 'catalogue' | 'a_completer';

type Ligne = {
  produit_id: string | null;
  designation: string;
  quantite: number;
  prix_unitaire: number | null;
  source_prix: SourcePrix;
};

type Brouillon = {
  client: { id: string; nom: string } | null;
  client_nom_saisi: string | null;
  lignes: Ligne[];
  remarques: string[];
};

type ReponseAgent = { brouillon?: Brouillon };

const MAX_MESSAGE = 2000;

const EXEMPLES = [
  'Proforma pour Client Test Koffi : 10 sacs de ciment 50 kg et 20 barres de fer a beton 10 mm',
  'Proforma pour Client Test Koffi : 5 sacs de ciment a 6000 F',
];

const LIBELLES_SOURCE: Record<SourcePrix, string> = {
  phrase: 'Prix de la demande',
  catalogue: 'Prix du catalogue',
  a_completer: 'Prix à compléter',
};

const formaterMontant = (valeur: number) =>
  `${new Intl.NumberFormat('fr-FR').format(valeur)} F`;

async function lireErreur(erreur: unknown): Promise<string> {
  const defaut = "L'assistant est indisponible pour le moment. Réessayez dans un instant.";
  const contexte = (erreur as { context?: unknown } | null)?.context;
  if (contexte instanceof Response) {
    try {
      const corps: unknown = await contexte.json();
      if (typeof corps === 'object' && corps !== null && 'error' in corps) {
        const message = (corps as { error: unknown }).error;
        if (typeof message === 'string') return message;
      }
    } catch {
      // corps illisible : on garde le message par défaut
    }
  }
  return defaut;
}

export default function Assistant() {
  const [texte, setTexte] = useState('');
  const [chargement, setChargement] = useState(false);
  const [brouillon, setBrouillon] = useState<Brouillon | null>(null);

  const preparer = async () => {
    const message = texte.trim();
    if (!message) {
      toast.error("Écrivez d'abord votre demande.");
      return;
    }
    setChargement(true);
    setBrouillon(null);
    try {
      const { data, error } = await supabase.functions.invoke<ReponseAgent>('agent-ia', {
        body: { message },
      });
      if (error) {
        toast.error(await lireErreur(error));
        return;
      }
      if (!data?.brouillon) {
        toast.error("Réponse inattendue de l'assistant.");
        return;
      }
      setBrouillon(data.brouillon);
    } catch {
      toast.error("Impossible de contacter l'assistant.");
    } finally {
      setChargement(false);
    }
  };

  return (
    <AppLayout>
      <div className="mx-auto max-w-3xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Assistant proforma</h1>
          <p className="text-sm text-muted-foreground">
            Décrivez la proforma en une phrase : l'assistant prépare un brouillon, vous vérifiez.
            Rien n'est enregistré.
          </p>
        </div>

        <Card>
          <CardHeader>
            <h2 className="font-semibold">Votre demande</h2>
          </CardHeader>
          <CardContent className="space-y-3">
            <Textarea
              value={texte}
              onChange={(e) => setTexte(e.target.value)}
              maxLength={MAX_MESSAGE}
              rows={4}
              placeholder="Ex. : Proforma pour M. Koffi, 10 sacs de ciment à 5500 F"
              disabled={chargement}
            />
            <div className="flex flex-wrap gap-2">
              {EXEMPLES.map((exemple, i) => (
                <Button
                  key={exemple}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setTexte(exemple)}
                  disabled={chargement}
                >
                  Exemple {i + 1}
                </Button>
              ))}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                {texte.length}/{MAX_MESSAGE}
              </span>
              <Button onClick={preparer} disabled={chargement || texte.trim() === ''}>
                {chargement ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="mr-2 h-4 w-4" />
                )}
                Préparer le brouillon
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Mode test : tant que l'assistant utilise l'offre gratuite de Google, n'y mettez que
              des données fictives.
            </p>
          </CardContent>
        </Card>

        {brouillon && (
          <Card>
            <CardHeader>
              <h2 className="font-semibold">Brouillon proposé</h2>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-medium">Client :</span>
                {brouillon.client ? (
                  <>
                    <Badge>Client reconnu</Badge>
                    <span className="text-sm">{brouillon.client.nom}</span>
                  </>
                ) : (
                  <>
                    <Badge variant="outline">Client non reconnu</Badge>
                    {brouillon.client_nom_saisi && (
                      <span className="text-sm">{brouillon.client_nom_saisi}</span>
                    )}
                  </>
                )}
              </div>

              <div className="space-y-2">
                <span className="text-sm font-medium">Lignes :</span>
                {brouillon.lignes.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Aucune ligne exploitable.</p>
                ) : (
                  <ul className="space-y-2">
                    {brouillon.lignes.map((ligne, i) => (
                      <li
                        key={`${ligne.designation}-${i}`}
                        className="flex flex-wrap items-center justify-between gap-2 rounded-md border p-3"
                      >
                        <div>
                          <div className="text-sm font-medium">{ligne.designation}</div>
                          <div className="text-xs text-muted-foreground">
                            Quantité : {ligne.quantite} ·{' '}
                            {ligne.prix_unitaire === null
                              ? 'Prix à compléter'
                              : `Prix unitaire : ${formaterMontant(ligne.prix_unitaire)}`}
                          </div>
                        </div>
                        <Badge variant={ligne.source_prix === 'a_completer' ? 'outline' : 'secondary'}>
                          {LIBELLES_SOURCE[ligne.source_prix]}
                        </Badge>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {brouillon.remarques.length > 0 && (
                <div className="space-y-1">
                  <span className="text-sm font-medium">À vérifier :</span>
                  <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                    {brouillon.remarques.map((remarque, i) => (
                      <li key={`${remarque}-${i}`}>{remarque}</li>
                    ))}
                  </ul>
                </div>
              )}

              <p className="text-xs text-muted-foreground">
                Ce brouillon n'est pas enregistré. Les totaux, la TVA et l'AIB seront calculés par
                le formulaire de facture, jamais par l'assistant.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}