import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ImagePlus, Loader2, RotateCcw, Send, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { CLE_ETAT_BROUILLON, type Brouillon, type SourcePrix } from '@/lib/brouillonIA';
import { MAX_MESSAGE, assistantActions, useAssistant } from '@/lib/assistantStore';

const SUGGESTIONS = [
  'Combien de factures ai-je faites ce mois-ci ?',
  'Vérifie mes factures de ce mois-ci',
  'Quelles factures sont en attente de paiement ?',
];

const LIBELLES_SOURCE: Record<SourcePrix, string> = {
  phrase: 'Prix de la demande',
  catalogue: 'Prix du catalogue',
  photo: 'Lu sur la photo',
  a_completer: 'Prix à compléter',
};

const formaterMontant = (valeur: number) =>
  `${new Intl.NumberFormat('fr-FR').format(valeur)} F`;

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

// Place la zone de conversation : au début de la dernière réponse (pour la lire depuis
// le haut), ou tout en bas pendant que l'assistant réfléchit.
function defiler(zone: HTMLDivElement | null, cible: HTMLDivElement | null, versLeDebut: boolean) {
  if (!zone) return;
  zone.scrollTop = versLeDebut && cible ? Math.max(0, cible.offsetTop - 8) : zone.scrollHeight;
}

function ApercuBrouillon({ brouillon, onOuvrir }: { brouillon: Brouillon; onOuvrir: () => void }) {
  return (
    <div className="mt-3 space-y-3 rounded-lg border bg-background p-3 text-foreground">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-sm font-semibold">Brouillon prêt à vérifier</span>
        <Button onClick={onOuvrir} className="w-full sm:w-auto">
          Ouvrir dans le formulaire de facture
        </Button>
      </div>

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

      <p className="text-xs text-muted-foreground">
        Rien n'est enregistré : vous vérifiez dans le formulaire.
      </p>
    </div>
  );
}



// Contenu du panneau latéral : la conversation et la zone de saisie.
// L'état vit dans assistantStore : il survit aux changements de page.
export default function AssistantPanel() {
  const nav = useNavigate();
  const a = useAssistant();
  const zoneMessages = useRef<HTMLDivElement | null>(null);
  const dernierMessage = useRef<HTMLDivElement | null>(null);
  const champFichier = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const dernier = a.entrees[a.entrees.length - 1];
    defiler(zoneMessages.current, dernierMessage.current, dernier?.role === 'assistant' && !a.chargement);
  }, [a.entrees, a.chargement]);

  // Une photo qui finit de se charger change la hauteur : on se replace.
  const resynchroniser = () => {
    const dernier = a.entrees[a.entrees.length - 1];
    defiler(zoneMessages.current, dernierMessage.current, dernier?.role === 'assistant' && !a.chargement);
  };

  const ouvrirDansLeFormulaire = (brouillon: Brouillon) => {
    assistantActions.fermer();
    nav('/factures/nouveau', { state: { [CLE_ETAT_BROUILLON]: brouillon } });
  };

  const photoAEnvoyer = a.photo !== null && !a.photoEnvoyee;
  const derniereEstErreur = a.entrees.length > 0 && a.entrees[a.entrees.length - 1].erreur === true;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div
        ref={zoneMessages}
        className="relative min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-3"
        aria-live="polite"
      >
        {a.entrees.length === 0 ? (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Posez une question sur vos factures, demandez une vérification, ou faites préparer une
              proforma en une phrase ou à partir d'une photo de bon de commande.
            </p>
            <div className="flex flex-wrap gap-2">
              {SUGGESTIONS.map((suggestion) => (
                <Button
                  key={suggestion}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => void assistantActions.envoyer(suggestion)}
                  disabled={a.chargement}
                >
                  {suggestion}
                </Button>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => assistantActions.ecrire('Fais-moi une proforma pour ')}
                disabled={a.chargement}
              >
                Préparer une proforma
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => champFichier.current?.click()}
                disabled={a.chargement}
              >
                <ImagePlus className="mr-2 h-4 w-4" aria-hidden="true" />
                Joindre un bon de commande
              </Button>
            </div>
          </div>
        ) : (
          <>
            {a.entrees.map((entree, index) => (
              <div
                key={entree.id}
                ref={index === a.entrees.length - 1 ? dernierMessage : undefined}
                className={entree.role === 'user' ? 'flex justify-end' : 'flex justify-start'}
              >
                <div
                  className={
                    'max-w-[92%] rounded-2xl px-4 py-2 text-sm ' +
                    (entree.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : entree.erreur
                      ? 'border border-destructive/40 bg-destructive/10 text-foreground'
                      : 'bg-muted text-foreground')
                  }
                >
                  {entree.apercu && (
                    <img
                      src={entree.apercu.url}
                      width={entree.apercu.largeur}
                      height={entree.apercu.hauteur}
                      alt="Photo jointe"
                      onLoad={resynchroniser}
                      className="mb-2 h-auto max-h-40 w-auto max-w-full rounded-md border"
                    />
                  )}
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
            {a.chargement && (
              <div className="flex justify-start">
                <div className="flex items-center gap-2 rounded-2xl bg-muted px-4 py-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  L'assistant réfléchit…
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <div className="space-y-2 border-t px-4 py-3">
        {a.entrees.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-2">
            {derniereEstErreur && !a.chargement ? (
              <Button variant="outline" size="sm" onClick={() => void assistantActions.reessayer()}>
                <RotateCcw className="mr-2 h-4 w-4" aria-hidden="true" />
                Réessayer
              </Button>
            ) : (
              <span />
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => assistantActions.nouvelleConversation()}
              disabled={a.chargement}
            >
              Nouvelle conversation
            </Button>
          </div>
        )}

        {a.photo && (
          <div className="flex items-center gap-2">
            <img
              src={a.photo.apercu.url}
              alt="Photo à envoyer"
              className="h-14 w-14 rounded-md border object-cover"
            />
            <span className="text-xs text-muted-foreground">
              Photo jointe{a.photoEnvoyee ? ' (déjà envoyée)' : ''}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => assistantActions.retirerPhoto()}
              disabled={a.chargement}
              aria-label="Retirer la photo"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>
        )}
        <input
          ref={champFichier}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            void assistantActions.choisirPhoto(e.target.files?.[0]);
            e.target.value = '';
          }}
        />
        <div className="flex items-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => champFichier.current?.click()}
            disabled={a.chargement}
            aria-label="Joindre une photo de bon de commande"
          >
            <ImagePlus className="h-4 w-4" aria-hidden="true" />
          </Button>
          <Textarea
            value={a.saisie}
            onChange={(e) => assistantActions.ecrire(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                void assistantActions.envoyer(a.saisie);
              }
            }}
            maxLength={MAX_MESSAGE}
            rows={2}
            placeholder="Ex. : Combien de factures ai-je faites pour Koffi en octobre ?"
            aria-label="Votre message à l'assistant"
            disabled={a.chargement}
          />
          <Button
            onClick={() => void assistantActions.envoyer(a.saisie)}
            disabled={a.chargement || (a.saisie.trim() === '' && !photoAEnvoyer)}
            aria-label="Envoyer"
          >
            
            <Send className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          L'assistant consulte et prépare, il n'enregistre rien. Mode test : tant qu'il utilise
          l'offre gratuite de Google, n'y mettez que des données fictives (photos comprises).
        </p>
      </div>
    </div>
  );
}