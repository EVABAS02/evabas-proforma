import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, RotateCcw, Send, Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  CLE_ETAT_BROUILLON,
  lireBrouillon,
  type Brouillon,
  type SourcePrix,
} from '@/lib/brouillonIA';

type Entree = {
  id: number;
  role: 'user' | 'assistant';
  text: string;
  brouillon?: Brouillon | null;
  erreur?: boolean;
};

type ReponseAssistant = { reponse?: unknown; brouillon?: unknown };

const MAX_HISTORIQUE = 10;
const MAX_MESSAGE = 2000;

const SUGGESTIONS = [
  'Combien de factures ai-je faites ce mois-ci ?',
  'Vérifie mes factures de ce mois-ci',
  'Quelles factures sont en attente de paiement ?',
];

const LIBELLES_SOURCE: Record<SourcePrix, string> = {
  phrase: 'Prix de la demande',
  catalogue: 'Prix du catalogue',
  a_completer: 'Prix à compléter',
};

const formaterMontant = (valeur: number) =>
  `${new Intl.NumberFormat('fr-FR').format(valeur)} F`;

async function lireErreur(erreur: unknown): Promise<string> {
  const defaut = "L'assistant est indisponible pour le moment.";
  const contexte = (erreur as { context?: unknown } | null)?.context;
  if (contexte instanceof Response) {
    try {
      const corps: unknown = await contexte.json();
      if (typeof corps === 'object' && corps !== null && 'error' in corps) {
        const message = (corps as { error: unknown }).error;
        if (typeof message === 'string') return message;
      }
    } catch {
      // corps illisible : message par défaut
    }
  }
  return defaut;
}

// Envoie la conversation à la fonction « assistant » (un seul réessai automatique).
async function demander(
  historique: Entree[],
): Promise<{ texte: string; brouillon: Brouillon | null }> {
  const messages = historique
    .filter((e) => !e.erreur)
    .slice(-MAX_HISTORIQUE)
    .map((e) => ({ role: e.role, text: e.text }));

  let derniere = "L'assistant est indisponible pour le moment.";
  for (let essai = 0; essai < 2; essai++) {
    const { data, error } = await supabase.functions.invoke<ReponseAssistant>('assistant', {
      body: { messages },
    });
    if (!error && data && typeof data.reponse === 'string') {
      return {
        texte: data.reponse,
        brouillon: lireBrouillon({ [CLE_ETAT_BROUILLON]: data.brouillon }),
      };
    }
    derniere = error ? await lireErreur(error) : "Réponse inattendue de l'assistant.";
    if (essai === 0) await new Promise((resolve) => setTimeout(resolve, 2000));
  }
  throw new Error(derniere);
}

// Mise en forme minimale (puces et gras) sans HTML brut.
function Gras({ texte }: { texte: string }) {
  const morceaux = texte.split(/(\*\*[^*]+\*\*)/g);
  return (
    <>
      {morceaux.map((m, i) =>
        m.length > 4 && m.startsWith('**') && m.endsWith('**') ? (
          <strong key={i}>{m.slice(2, -2)}</strong>
        ) : (
          <span key={i}>{m}</span>
        ),
      )}
    </>
  );
}

function TexteFormate({ texte }: { texte: string }) {
  return (
    <div className="space-y-1">
      {texte.split('\n').map((ligne, i) => {
        if (ligne.trim() === '') return <div key={i} className="h-1" />;
        const puce = /^\s*[*-]\s+/.test(ligne);
        const contenu = ligne.replace(/^\s*[*-]\s+/, '');
        return puce ? (
          <div key={i} className="flex gap-2">
            <span aria-hidden="true">•</span>
            <span>
              <Gras texte={contenu} />
            </span>
          </div>
        ) : (
          <p key={i}>
            <Gras texte={ligne} />
          </p>
        );
      })}
    </div>
  );
}

function ApercuBrouillon({ brouillon, onOuvrir }: { brouillon: Brouillon; onOuvrir: () => void }) {
  return (
    <div className="mt-3 space-y-3 rounded-lg border bg-background p-3 text-foreground">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium">Client :</span>
        {brouillon.client ? (
          <>
            <Badge>Client reconnu</Badge>
            <span className="text-xs">{brouillon.client.nom}</span>
          </>
        ) : (
          <>
            <Badge variant="outline">Client non reconnu</Badge>
            {brouillon.client_nom_saisi && <span className="text-xs">{brouillon.client_nom_saisi}</span>}
          </>
        )}
      </div>

      {brouillon.lignes.length === 0 ? (
        <p className="text-xs text-muted-foreground">Aucune ligne exploitable.</p>
      ) : (
        <ul className="space-y-2">
          {brouillon.lignes.map((ligne, i) => (
            <li
              key={`${ligne.designation}-${i}`}
              className="flex flex-wrap items-center justify-between gap-2 rounded-md border p-2"
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

      {brouillon.remarques.length > 0 && (
        <ul className="list-disc space-y-1 pl-5 text-xs text-muted-foreground">
          {brouillon.remarques.map((remarque, i) => (
            <li key={`${remarque}-${i}`}>{remarque}</li>
          ))}
        </ul>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs text-muted-foreground">
          Rien n'est enregistré : vous vérifiez dans le formulaire.
        </span>
        <Button size="sm" onClick={onOuvrir}>
          Ouvrir dans le formulaire de facture
        </Button>
      </div>
    </div>
  );
}

export default function AssistantPanel() {
  const nav = useNavigate();
  const [entrees, setEntrees] = useState<Entree[]>([]);
  const [saisie, setSaisie] = useState('');
  const [chargement, setChargement] = useState(false);
  const compteur = useRef(0);
  const zoneMessages = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const zone = zoneMessages.current;
    if (zone) zone.scrollTop = zone.scrollHeight;
  }, [entrees, chargement]);

  const repondre = async (historique: Entree[]) => {
    setChargement(true);
    try {
      const { texte, brouillon } = await demander(historique);
      compteur.current += 1;
      setEntrees([...historique, { id: compteur.current, role: 'assistant', text: texte, brouillon }]);
    } catch (e) {
      compteur.current += 1;
      const message = e instanceof Error ? e.message : "L'assistant est indisponible.";
      setEntrees([...historique, { id: compteur.current, role: 'assistant', text: message, erreur: true }]);
    } finally {
      setChargement(false);
    }
  };

  const envoyer = async (texteBrut: string) => {
    const texte = texteBrut.trim();
    if (!texte || chargement) return;
    compteur.current += 1;
    const historique: Entree[] = [
      ...entrees.filter((e) => !e.erreur),
      { id: compteur.current, role: 'user', text: texte.slice(0, MAX_MESSAGE) },
    ];
    setEntrees(historique);
    setSaisie('');
    await repondre(historique);
  };

  const reessayer = async () => {
    if (chargement) return;
    await repondre(entrees.filter((e) => !e.erreur));
  };

  const ouvrirDansLeFormulaire = (brouillon: Brouillon) => {
    nav('/factures/nouveau', { state: { [CLE_ETAT_BROUILLON]: brouillon } });
  };

  const derniereEstErreur = entrees.length > 0 && entrees[entrees.length - 1].erreur === true;

  return (
    <Card className="shadow-card border-border/60">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="font-display flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" aria-hidden="true" />
          Assistant
        </CardTitle>
        {entrees.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setEntrees([])}
            disabled={chargement}
          >
            Nouvelle conversation
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {entrees.length === 0 ? (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Posez une question sur vos factures, demandez une vérification, ou faites préparer une
              proforma en une phrase.
            </p>
            <div className="flex flex-wrap gap-2">
              {SUGGESTIONS.map((suggestion) => (
                <Button
                  key={suggestion}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => envoyer(suggestion)}
                  disabled={chargement}
                >
                  {suggestion}
                </Button>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setSaisie('Fais-moi une proforma pour ')}
                disabled={chargement}
              >
                Préparer une proforma
              </Button>
            </div>
          </div>
        ) : (
          <div
            ref={zoneMessages}
            className="max-h-[420px] space-y-3 overflow-y-auto pr-1"
            aria-live="polite"
          >
            {entrees.map((entree) => (
              <div
                key={entree.id}
                className={entree.role === 'user' ? 'flex justify-end' : 'flex justify-start'}
              >
                <div
                  className={
                    'max-w-[92%] rounded-2xl px-4 py-2 text-sm sm:max-w-[85%] ' +
                    (entree.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : entree.erreur
                      ? 'border border-destructive/40 bg-destructive/10 text-foreground'
                      : 'bg-muted text-foreground')
                  }
                >
                  <TexteFormate texte={entree.text} />
                  {entree.brouillon && (
                    <ApercuBrouillon
                      brouillon={entree.brouillon}
                      onOuvrir={() => ouvrirDansLeFormulaire(entree.brouillon as Brouillon)}
                    />
                  )}
                </div>
              </div>
            ))}
            {chargement && (
              <div className="flex justify-start">
                <div className="flex items-center gap-2 rounded-2xl bg-muted px-4 py-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  L'assistant réfléchit…
                </div>
              </div>
            )}
          </div>
        )}

        {derniereEstErreur && !chargement && (
          <Button variant="outline" size="sm" onClick={reessayer}>
            <RotateCcw className="mr-2 h-4 w-4" aria-hidden="true" />
            Réessayer
          </Button>
        )}

        <div className="space-y-2">
          <div className="flex items-end gap-2">
            <Textarea
              value={saisie}
              onChange={(e) => setSaisie(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  void envoyer(saisie);
                }
              }}
              maxLength={MAX_MESSAGE}
              rows={2}
              placeholder="Ex. : Combien de factures ai-je faites pour Koffi en octobre ?"
              aria-label="Votre message à l'assistant"
              disabled={chargement}
            />
            <Button
              onClick={() => envoyer(saisie)}
              disabled={chargement || saisie.trim() === ''}
              aria-label="Envoyer"
            >
              <Send className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            L'assistant consulte et prépare, il n'enregistre rien. Mode test : tant qu'il utilise
            l'offre gratuite de Google, n'y mettez que des données fictives.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}