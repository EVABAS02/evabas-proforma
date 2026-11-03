import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type EtatDictee = 'repos' | 'enregistrement' | 'transcription';

const DUREE_MAX_S = 40;
const DUREE_MIN_S = 0.7;
const FREQUENCE = 16000;
const SEUIL_SILENCE = 0.01;
const MAX_BASE64 = 2_000_000;

class ErreurDictee extends Error {}

async function lireErreur(erreur: unknown): Promise<string> {
  const defaut = 'La transcription est indisponible pour le moment.';
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

function messageMicro(erreur: unknown): string {
  const nom = erreur instanceof DOMException ? erreur.name : '';
  if (nom === 'NotAllowedError' || nom === 'SecurityError') {
    return 'Accès au micro refusé. Autorisez le micro dans votre navigateur, puis réessayez.';
  }
  if (nom === 'NotFoundError' || nom === 'OverconstrainedError') {
    return 'Aucun micro détecté sur cet appareil.';
  }
  if (nom === 'NotReadableError' || nom === 'AbortError') {
    return 'Le micro est utilisé par une autre application (Teams, Zoom, Discord…). Fermez-la puis réessayez.';
  }
  return "Impossible d'ouvrir le micro.";
}

// Fichier WAV 16 bits mono : format simple, léger et accepté tel quel par Gemini.
function encoderWav(echantillons: Float32Array, frequence: number): Uint8Array {
  const octets = echantillons.length * 2;
  const buffer = new ArrayBuffer(44 + octets);
  const v = new DataView(buffer);
  const ecrireTexte = (decalage: number, texte: string) => {
    for (let i = 0; i < texte.length; i++) v.setUint8(decalage + i, texte.charCodeAt(i));
  };
  ecrireTexte(0, 'RIFF');
  v.setUint32(4, 36 + octets, true);
  ecrireTexte(8, 'WAVE');
  ecrireTexte(12, 'fmt ');
  v.setUint32(16, 16, true);
  v.setUint16(20, 1, true); // PCM
  v.setUint16(22, 1, true); // mono
  v.setUint32(24, frequence, true);
  v.setUint32(28, frequence * 2, true);
  v.setUint16(32, 2, true);
  v.setUint16(34, 16, true);
  ecrireTexte(36, 'data');
  v.setUint32(40, octets, true);
  for (let i = 0; i < echantillons.length; i++) {
    const s = Math.max(-1, Math.min(1, echantillons[i]));
    v.setInt16(44 + i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }
  return new Uint8Array(buffer);
}

function versBase64(octets: Uint8Array): string {
  let binaire = '';
  for (let i = 0; i < octets.length; i += 0x4000) {
    binaire += String.fromCharCode(...octets.subarray(i, i + 0x4000));
  }
  return btoa(binaire);
}

// Décode l'enregistrement du navigateur (webm, mp4...) et le convertit en 16 kHz mono.
async function versWav16k(blob: Blob): Promise<{ wav: Uint8Array; duree: number; crete: number }> {
  const donnees = await blob.arrayBuffer();
  const contexte = new AudioContext();
  let decode: AudioBuffer;
  try {
    decode = await contexte.decodeAudioData(donnees);
  } finally {
    void contexte.close();
  }
  const longueur = Math.max(1, Math.ceil(decode.duration * FREQUENCE));
  const hors = new OfflineAudioContext(1, longueur, FREQUENCE);
  const source = hors.createBufferSource();
  source.buffer = decode;
  source.connect(hors.destination);
  source.start();
  const rendu = await hors.startRendering();
  const echantillons = rendu.getChannelData(0);
  let crete = 0;
  for (let i = 0; i < echantillons.length; i++) crete = Math.max(crete, Math.abs(echantillons[i]));
  return { wav: encoderWav(echantillons, FREQUENCE), duree: decode.duration, crete };
}

// Dictée vocale par Gemini :
//  - lireSaisie : renvoie le texte actuellement dans la zone de saisie
//  - ecrire     : remplace le contenu de la zone de saisie
//  - surErreur  : affiche un message à l'utilisateur
// Le texte transcrit est AJOUTÉ à la saisie ; l'utilisateur le relit avant d'envoyer.
export function useDicteeIA(
  lireSaisie: () => string,
  ecrire: (texte: string) => void,
  surErreur: (message: string) => void,
) {
  const [disponible] = useState(
    () =>
      typeof window !== 'undefined' &&
      window.isSecureContext &&
      !!navigator.mediaDevices?.getUserMedia &&
      typeof MediaRecorder !== 'undefined',
  );
  const [etat, setEtat] = useState<EtatDictee>('repos');
  const [duree, setDuree] = useState(0);
  const etatRef = useRef<EtatDictee>('repos');
  const enregistreur = useRef<MediaRecorder | null>(null);
  const flux = useRef<MediaStream | null>(null);
  const morceaux = useRef<Blob[]>([]);
  const minuteur = useRef<number | null>(null);
  // Augmente à chaque annulation : un résultat tardif d'une ancienne session est ignoré.
  const session = useRef(0);
  const rappels = useRef({ lireSaisie, ecrire, surErreur });

  useEffect(() => {
    rappels.current = { lireSaisie, ecrire, surErreur };
  });

  const changer = useCallback((e: EtatDictee) => {
    etatRef.current = e;
    setEtat(e);
  }, []);

  const nettoyer = useCallback(() => {
    if (minuteur.current !== null) {
      window.clearInterval(minuteur.current);
      minuteur.current = null;
    }
    flux.current?.getTracks().forEach((t) => t.stop());
    flux.current = null;
    enregistreur.current = null;
  }, []);

  // Arrête l'enregistrement : la transcription démarre ensuite toute seule.
  const arreter = useCallback(() => {
    const r = enregistreur.current;
    if (r && r.state !== 'inactive') r.stop();
  }, []);

  // Coupe tout, sans rien transcrire (envoi du message, fermeture, etc.).
  const annuler = useCallback(() => {
    session.current += 1;
    const r = enregistreur.current;
    if (r) {
      r.onstop = null;
      if (r.state !== 'inactive') r.stop();
    }
    nettoyer();
    changer('repos');
  }, [nettoyer, changer]);

  const finir = useCallback(
    async (ma: number, mime: string) => {
      const blob = new Blob(morceaux.current, { type: mime || 'audio/webm' });
      morceaux.current = [];
      nettoyer();
      if (ma !== session.current) return;
      changer('transcription');
      try {
        const { wav, duree: dureeAudio, crete } = await versWav16k(blob);
        if (ma !== session.current) return;
        if (dureeAudio < DUREE_MIN_S) {
          throw new ErreurDictee('Enregistrement trop court. Appuyez sur le micro, parlez, puis appuyez sur le carré.');
        }
        if (crete < SEUIL_SILENCE) {
          throw new ErreurDictee(
            'Aucun son enregistré. Vérifiez que le bon micro est sélectionné dans Windows et dans le navigateur.',
          );
        }
        const data = versBase64(wav);
        if (data.length > MAX_BASE64) throw new ErreurDictee('Enregistrement trop long : parlez moins longtemps.');

        const { data: reponse, error } = await supabase.functions.invoke<{ texte?: unknown }>('transcrire', {
          body: { audio: { mime_type: 'audio/wav', data } },
        });
        if (ma !== session.current) return;
        if (error || !reponse || typeof reponse.texte !== 'string') {
          throw new ErreurDictee(error ? await lireErreur(error) : 'Réponse inattendue du service de transcription.');
        }
        const texte = reponse.texte.trim();
        if (texte === '') {
          throw new ErreurDictee('Aucune parole reconnue. Réessayez en parlant plus près du micro.');
        }
        const base = rappels.current.lireSaisie();
        const separateur = base !== '' && !/\s$/.test(base) ? ' ' : '';
        rappels.current.ecrire(base + separateur + texte);
      } catch (e) {
        if (ma === session.current) {
          rappels.current.surErreur(
            e instanceof ErreurDictee ? e.message : 'La transcription a échoué. Réessayez.',
          );
        }
      } finally {
        if (ma === session.current) changer('repos');
      }
    },
    [nettoyer, changer],
  );

  const demarrer = useCallback(async () => {
    if (etatRef.current !== 'repos') return;
    // Réservé tout de suite : un deuxième clic pendant la demande d'autorisation est ignoré.
    changer('enregistrement');
    const ma = session.current;

    let micro: MediaStream;
    try {
      micro = await navigator.mediaDevices.getUserMedia({
        audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true },
      });
    } catch (e) {
      if (ma === session.current) {
        changer('repos');
        rappels.current.surErreur(messageMicro(e));
      }
      return;
    }
    if (ma !== session.current) {
      micro.getTracks().forEach((t) => t.stop());
      return;
    }

    flux.current = micro;
    morceaux.current = [];
    let r: MediaRecorder;
    try {
      r = new MediaRecorder(micro);
    } catch {
      nettoyer();
      changer('repos');
      rappels.current.surErreur("L'enregistrement audio n'est pas pris en charge par ce navigateur.");
      return;
    }
    r.ondataavailable = (e) => {
      if (e.data.size > 0) morceaux.current.push(e.data);
    };
    r.onstop = () => {
      void finir(ma, r.mimeType);
    };
    enregistreur.current = r;
    r.start();

    setDuree(0);
    const depart = Date.now();
    minuteur.current = window.setInterval(() => {
      const secondes = Math.floor((Date.now() - depart) / 1000);
      setDuree(secondes);
      if (secondes >= DUREE_MAX_S) arreter();
    }, 250);
  }, [changer, nettoyer, arreter, finir]);

  // Si le panneau est fermé en cours d'enregistrement, on coupe le micro.
  useEffect(() => {
    return () => {
      annuler();
    };
  }, [annuler]);

  return { disponible, etat, duree, dureeMax: DUREE_MAX_S, demarrer, arreter, annuler };
}