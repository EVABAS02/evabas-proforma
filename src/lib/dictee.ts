import { useCallback, useEffect, useRef, useState } from 'react';

// Types minimaux de la reconnaissance vocale du navigateur (non fournis par TypeScript).
type MorceauReconnu = { 0: { transcript: string } };
type EvenementResultat = { results: ArrayLike<MorceauReconnu> };
type EvenementErreur = { error: string };
type Reconnaissance = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((e: EvenementResultat) => void) | null;
  onerror: ((e: EvenementErreur) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
};
type Constructeur = new () => Reconnaissance;

function trouverConstructeur(): Constructeur | null {
  if (typeof window === 'undefined') return null;
  const w = window as unknown as {
    SpeechRecognition?: Constructeur;
    webkitSpeechRecognition?: Constructeur;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

const MESSAGE_MICRO_REFUSE = "Accès au micro refusé. Autorisez le micro dans votre navigateur, puis réessayez.";

const MESSAGES_ERREUR: Record<string, string> = {
  'not-allowed': MESSAGE_MICRO_REFUSE,
  'service-not-allowed': MESSAGE_MICRO_REFUSE,
  'no-speech': "Je n'ai rien entendu. Réessayez en parlant plus près du micro.",
  'audio-capture': 'Aucun micro détecté sur cet appareil.',
  network: 'Dictée indisponible : vérifiez votre connexion.',
};

// Dictée vocale : le texte reconnu est ajouté à ce qui est déjà écrit dans la zone de saisie.
//  - lireSaisie : renvoie le texte actuellement dans la zone de saisie
//  - ecrire     : remplace le contenu de la zone de saisie
//  - surErreur  : affiche un message à l'utilisateur
export function useDictee(
  lireSaisie: () => string,
  ecrire: (texte: string) => void,
  surErreur: (message: string) => void,
) {
  const [disponible] = useState(() => trouverConstructeur() !== null);
  const [ecoute, setEcoute] = useState(false);
  const reconnaissance = useRef<Reconnaissance | null>(null);
  const rappels = useRef({ lireSaisie, ecrire, surErreur });

  // Garde toujours les dernières fonctions, sans recréer la reconnaissance.
  useEffect(() => {
    rappels.current = { lireSaisie, ecrire, surErreur };
  });

  const demarrer = useCallback(() => {
    const Classe = trouverConstructeur();
    if (!Classe || reconnaissance.current) return;
    const r = new Classe();
    r.lang = 'fr-FR';
    r.continuous = false;
    r.interimResults = true;
    r.maxAlternatives = 1;

    const base = rappels.current.lireSaisie();
    const separateur = base !== '' && !/\s$/.test(base) ? ' ' : '';

    r.onresult = (e) => {
      let texte = '';
      for (let i = 0; i < e.results.length; i++) texte += e.results[i][0].transcript;
      rappels.current.ecrire(base + separateur + texte.trim());
    };
    r.onerror = (e) => {
      if (e.error === 'aborted') return;
      rappels.current.surErreur(MESSAGES_ERREUR[e.error] ?? 'La dictée a échoué. Réessayez.');
    };
    r.onend = () => {
      reconnaissance.current = null;
      setEcoute(false);
    };

    reconnaissance.current = r;
    try {
      r.start();
      setEcoute(true);
    } catch {
      reconnaissance.current = null;
      setEcoute(false);
      rappels.current.surErreur("Impossible de démarrer la dictée.");
    }
  }, []);

  // Arrête l'écoute et garde le texte déjà reconnu.
  const arreter = useCallback(() => {
    reconnaissance.current?.stop();
  }, []);

  // Coupe tout de suite, sans rien ajouter de plus (utilisé à l'envoi du message).
  const annuler = useCallback(() => {
    reconnaissance.current?.abort();
  }, []);

  // Si la fenêtre se ferme pendant l'écoute, on coupe le micro.
  useEffect(() => {
    return () => {
      reconnaissance.current?.abort();
    };
  }, []);

  return { disponible, ecoute, demarrer, arreter, annuler };
}