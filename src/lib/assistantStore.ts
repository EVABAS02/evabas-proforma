import { useSyncExternalStore } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { CLE_ETAT_BROUILLON, lireBrouillon, type Brouillon } from '@/lib/brouillonIA';
import { lireAjout, type PropositionAjout } from '@/lib/ajoutProduitsIA';

// ---------------------------------------------------------------------------
// État partagé de l'assistant. Il vit en dehors des pages : la conversation
// survit quand on change de page, et une demande en cours continue.
// Rien n'est écrit sur le disque : tout disparaît au rechargement de la page,
// à la déconnexion et quand un autre compte se connecte.
// ---------------------------------------------------------------------------

export type Apercu = { url: string; largeur: number; hauteur: number };

export type Entree = {
  id: number;
  role: 'user' | 'assistant';
  text: string;
  brouillon?: Brouillon | null;
  erreur?: boolean;
  avecImage?: boolean;
  apercu?: Apercu;
  ajout?: PropositionAjout | null;
  ajoutStatut?: 'attente' | 'enregistrement' | 'termine';
  ajoutResultat?: string;
};

export type PhotoJointe = { mime: string; data: string; apercu: Apercu };

export type EtatAssistant = {
  utilisateurId: string | null;
  ouvert: boolean;
  entrees: Entree[];
  saisie: string;
  chargement: boolean;
  photo: PhotoJointe | null;
  photoEnvoyee: boolean;
  nonLu: boolean;
};

export const MAX_MESSAGE = 2000;
const MAX_HISTORIQUE = 10;
const TAILLE_MAX_FICHIER = 15 * 1024 * 1024;
const TAILLE_MAX_BASE64 = 1_500_000;
const TEXTE_PHOTO = 'Prépare une proforma à partir de ce bon de commande.';

type ReponseAssistant = { reponse?: unknown; brouillon?: unknown; ajout?: unknown };

const etatVide = (utilisateurId: string | null): EtatAssistant => ({
  utilisateurId,
  ouvert: false,
  entrees: [],
  saisie: '',
  chargement: false,
  photo: null,
  photoEnvoyee: false,
  nonLu: false,
});

let etat: EtatAssistant = etatVide(null);
let compteur = 0;
// Augmente à chaque remise à zéro : la réponse tardive d'une ancienne conversation est ignorée.
let generation = 0;
const ecouteurs = new Set<() => void>();

function notifier() {
  ecouteurs.forEach((f) => f());
}

function maj(partiel: Partial<EtatAssistant>) {
  etat = { ...etat, ...partiel };
  notifier();
}

function remplacer(nouvelEtat: EtatAssistant) {
  generation += 1;
  etat = nouvelEtat;
  notifier();
}

function abonner(ecouteur: () => void) {
  ecouteurs.add(ecouteur);
  return () => {
    ecouteurs.delete(ecouteur);
  };
}

export function useAssistant(): EtatAssistant {
  return useSyncExternalStore(abonner, () => etat, () => etat);
}

// Lecture directe de l'état (hors composant), utile aux tests.
export const lireEtat = (): EtatAssistant => etat;

// Déconnexion : on efface tout.
supabase.auth.onAuthStateChange((evenement) => {
  if (evenement === 'SIGNED_OUT') remplacer(etatVide(null));
});

// ------------------------------ outils internes ------------------------------

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

// L'IA ne voit pas la carte du brouillon : on lui en renvoie un court résumé pour la suite
// de la conversation (par exemple « change la quantité du gari »).
function resumerBrouillon(b: Brouillon): string {
  const client = b.client ? b.client.nom : (b.client_nom_saisi ?? 'client non reconnu');
  const lignes = b.lignes
    .map((l) => `${l.designation} x${l.quantite}${l.prix_unitaire === null ? '' : ` a ${l.prix_unitaire} F`}`)
    .join('; ');
  return `[Brouillon affiché à l'utilisateur. Client : ${client}. Lignes : ${lignes}]`;
}

// Clé de comparaison des noms de produits : sans accents, sans majuscules, sans espaces.
const cleProduit = (s: string) =>
  s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '');

// Résumé pour l'IA : elle doit savoir si la liste a été enregistrée ou non.
function resumerAjout(e: Entree): string {
  const liste = (e.ajout?.produits ?? [])
    .map((p) => `${p.designation} a ${p.prix_unitaire} F${p.existe_deja ? ' (existait deja)' : ''}`)
    .join('; ');
  return e.ajoutStatut === 'termine'
    ? `[Produits ajoutes au catalogue par l'utilisateur : ${liste}]`
    : `[Liste de produits affichee, PAS encore enregistree : ${liste}]`;
}

function majEntree(id: number, partiel: Partial<Entree>) {
  maj({ entrees: etat.entrees.map((e) => (e.id === id ? { ...e, ...partiel } : e)) });
}

// Réduit la photo (dimensions et qualité) pour qu'elle reste légère à envoyer.
async function preparerImage(fichier: File): Promise<PhotoJointe> {
  if (!fichier.type.startsWith('image/')) throw new Error("Ce fichier n'est pas une image.");
  if (fichier.size > TAILLE_MAX_FICHIER) throw new Error('Image trop lourde (15 Mo maximum).');
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(fichier);
  } catch {
    throw new Error("Format d'image non pris en charge (utilisez JPEG, PNG ou WebP).");
  }
  try {
    for (const cote of [1280, 1024, 800]) {
      const echelle = Math.min(1, cote / Math.max(bitmap.width, bitmap.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(bitmap.width * echelle));
      canvas.height = Math.max(1, Math.round(bitmap.height * echelle));
      const contexte = canvas.getContext('2d');
      if (!contexte) throw new Error('Image illisible.');
      contexte.fillStyle = '#ffffff';
      contexte.fillRect(0, 0, canvas.width, canvas.height);
      contexte.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      for (const qualite of [0.8, 0.65, 0.5]) {
        const url = canvas.toDataURL('image/jpeg', qualite);
        const data = url.slice(url.indexOf(',') + 1);
        if (data.length <= TAILLE_MAX_BASE64) {
          return {
            mime: 'image/jpeg',
            data,
            apercu: { url, largeur: canvas.width, hauteur: canvas.height },
          };
        }
      }
    }
  } finally {
    bitmap.close();
  }
  throw new Error('Impossible de réduire cette image : essayez une photo plus petite.');
}

// Envoie la conversation à la fonction « assistant » (un seul réessai automatique).
async function demander(
  historique: Entree[],
  photo: PhotoJointe | null,
): Promise<{ texte: string; brouillon: Brouillon | null; ajout: PropositionAjout | null }> {
  const messages = historique
    .filter((e) => !e.erreur)
    .slice(-MAX_HISTORIQUE)
    .map((e) => ({
      role: e.role,
      text: (e.brouillon
        ? `${e.text}\n${resumerBrouillon(e.brouillon)}`
        : e.ajout
        ? `${e.text}\n${resumerAjout(e)}`
        : e.text
      ).slice(0, MAX_MESSAGE),
      ...(e.avecImage ? { avec_image: true } : {}),
    }));

  let derniere = "L'assistant est indisponible pour le moment.";
  for (let essai = 0; essai < 2; essai++) {
    const { data, error } = await supabase.functions.invoke<ReponseAssistant>('assistant', {
      body: { messages, ...(photo ? { image: { mime_type: photo.mime, data: photo.data } } : {}) },
    });
    if (!error && data && typeof data.reponse === 'string') {
      return {
        texte: data.reponse,
        brouillon: lireBrouillon({ [CLE_ETAT_BROUILLON]: data.brouillon }),
        ajout: lireAjout(data.ajout),
      };
    }
    derniere = error ? await lireErreur(error) : "Réponse inattendue de l'assistant.";
    if (essai === 0) await new Promise((resolve) => setTimeout(resolve, 2000));
  }
  throw new Error(derniere);
}

async function repondre(historique: Entree[]) {
  const maGeneration = generation;
  maj({ entrees: historique, chargement: true });
  try {
    const { texte, brouillon, ajout } = await demander(historique, etat.photo);
    if (maGeneration !== generation) return;
    compteur += 1;
    maj({
      entrees: [
        ...historique,
        {
          id: compteur,
          role: 'assistant',
          text: texte,
          brouillon,
          ajout,
          ...(ajout ? { ajoutStatut: 'attente' as const } : {}),
        },
      ],
      chargement: false,
      nonLu: !etat.ouvert,
    });
  } catch (e) {
    if (maGeneration !== generation) return;
    compteur += 1;
    const message = e instanceof Error ? e.message : "L'assistant est indisponible.";
    maj({
      entrees: [...historique, { id: compteur, role: 'assistant', text: message, erreur: true }],
      chargement: false,
      nonLu: !etat.ouvert,
    });
  }
}

// -------------------------------- actions publiques --------------------------------

export const assistantActions = {
  // À appeler avec l'identifiant de l'utilisateur connecté : un autre compte repart de zéro.
  lier(utilisateurId: string | null) {
    if (etat.utilisateurId !== utilisateurId) remplacer(etatVide(utilisateurId));
  },

  ouvrir() {
    maj({ ouvert: true, nonLu: false });
  },

  fermer() {
    maj({ ouvert: false });
  },

  ecrire(texte: string) {
    maj({ saisie: texte });
  },

  nouvelleConversation() {
    generation += 1;
    maj({ entrees: [], saisie: '', chargement: false, photo: null, photoEnvoyee: false, nonLu: false });
  },

  async envoyer(texteBrut: string) {
    const { photo, photoEnvoyee, entrees, chargement } = etat;
    const joindre = photo !== null && !photoEnvoyee;
    const texte = texteBrut.trim() || (joindre ? TEXTE_PHOTO : '');
    if (!texte || chargement) return;
    compteur += 1;
    const historique: Entree[] = [
      ...entrees.filter((e) => !e.erreur),
      {
        id: compteur,
        role: 'user',
        text: texte.slice(0, MAX_MESSAGE),
        ...(joindre && photo ? { avecImage: true, apercu: photo.apercu } : {}),
      },
    ];
    maj({ saisie: '', photoEnvoyee: joindre ? true : photoEnvoyee });
    await repondre(historique);
  },

  async reessayer() {
    if (etat.chargement) return;
    await repondre(etat.entrees.filter((e) => !e.erreur));
  },

  async choisirPhoto(fichier: File | undefined) {
    if (!fichier) return;
    try {
      const photo = await preparerImage(fichier);
      maj({ photo, photoEnvoyee: false });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Format d'image non pris en charge.");
    }
  },

  retirerPhoto() {
    maj({ photo: null, photoEnvoyee: false });
  },

  // Enregistre la liste après le clic de confirmation. Renvoie le nombre de produits ajoutés.
  async enregistrerAjout(idEntree: number): Promise<number> {
    const entree = etat.entrees.find((e) => e.id === idEntree);
    if (!entree?.ajout || entree.ajoutStatut === 'enregistrement' || entree.ajoutStatut === 'termine') return 0;
    const maGeneration = generation;
    // Posé tout de suite : un deuxième clic est ignoré.
    majEntree(idEntree, { ajoutStatut: 'enregistrement' });
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Vous êtes déconnecté.');
      if (etat.utilisateurId && user.id !== etat.utilisateurId) throw new Error('Le compte a changé : recommencez.');

      // Relecture du catalogue au moment du clic : on ne recrée pas un produit apparu entre-temps.
      const { data: existants, error: erreurLecture } = await supabase
        .from('produits')
        .select('designation')
        .eq('user_id', user.id);
      if (erreurLecture) throw erreurLecture;
      const dejaLa = new Set((existants ?? []).map((p) => cleProduit(p.designation)));

      const lignes = entree.ajout.produits
        .filter((p) => !p.existe_deja && !dejaLa.has(cleProduit(p.designation)))
        .map((p) => ({
          designation: p.designation,
          unite: p.unite,
          prix_unitaire: p.prix_unitaire,
          categorie: p.categorie,
          user_id: user.id,
        }));
      if (lignes.length > 0) {
        const { error } = await supabase.from('produits').insert(lignes);
        if (error) throw error;
      }

      const ignores = entree.ajout.produits.length - lignes.length;
      const resultat =
        `${lignes.length} produit(s) ajouté(s) à votre catalogue` +
        (ignores > 0 ? ` · ${ignores} déjà présent(s), ignoré(s).` : '.');
      if (maGeneration === generation) majEntree(idEntree, { ajoutStatut: 'termine', ajoutResultat: resultat });
      toast.success(resultat);
      return lignes.length;
    } catch (e) {
      if (maGeneration === generation) majEntree(idEntree, { ajoutStatut: 'attente' });
      const message =
        typeof e === 'object' && e !== null && 'message' in e && typeof (e as { message: unknown }).message === 'string'
          ? (e as { message: string }).message
          : "L'enregistrement a échoué.";
      toast.error(message);
      return 0;
    }
  },
};