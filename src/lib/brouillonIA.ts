// Brouillon de proforma prepare par l'assistant IA (page Assistant -> formulaire de facture).
export type SourcePrix = 'phrase' | 'catalogue' | 'a_completer' | 'photo';

export type LigneBrouillon = {
  produit_id: string | null;
  designation: string;
  quantite: number;
  prix_unitaire: number | null;
  source_prix: SourcePrix;
};

export type Brouillon = {
  client: { id: string; nom: string } | null;
  client_nom_saisi: string | null;
  lignes: LigneBrouillon[];
  remarques: string[];
};

// Nom de la cle qui transporte le brouillon dans l'etat de navigation.
export const CLE_ETAT_BROUILLON = 'brouillonIA';

const estObjet = (valeur: unknown): valeur is Record<string, unknown> =>
  typeof valeur === 'object' && valeur !== null && !Array.isArray(valeur);

// Relit et reverifie un brouillon recu : on ne fait confiance a aucune donnee entrante.
export function lireBrouillon(etat: unknown): Brouillon | null {
  if (!estObjet(etat)) return null;
  const brut = etat[CLE_ETAT_BROUILLON];
  if (!estObjet(brut)) return null;

  const lignesBrutes: unknown[] = Array.isArray(brut.lignes) ? brut.lignes : [];
  const lignes: LigneBrouillon[] = [];
  for (const element of lignesBrutes) {
    if (!estObjet(element)) continue;
    const designation = element.designation;
    const quantite = element.quantite;
    const prix = element.prix_unitaire;
    const produitId = element.produit_id;
    const source = element.source_prix;
    if (typeof designation !== 'string' || designation.trim() === '') continue;
    if (typeof quantite !== 'number' || !Number.isFinite(quantite) || quantite <= 0) continue;
    lignes.push({
      produit_id: typeof produitId === 'string' ? produitId : null,
      designation: designation.trim(),
      quantite,
      prix_unitaire: typeof prix === 'number' && Number.isFinite(prix) && prix >= 0 ? prix : null,
      source_prix: source === 'phrase' || source === 'catalogue' || source === 'photo' ? source : 'a_completer',
    });
  }

  let client: Brouillon['client'] = null;
  const brutClient = brut.client;
  if (estObjet(brutClient)) {
    const id = brutClient.id;
    const nom = brutClient.nom;
    if (typeof id === 'string' && typeof nom === 'string') client = { id, nom };
  }

  const nomSaisi = brut.client_nom_saisi;
  const remarques: unknown[] = Array.isArray(brut.remarques) ? brut.remarques : [];

  return {
    client,
    client_nom_saisi: typeof nomSaisi === 'string' && nomSaisi.trim() !== '' ? nomSaisi.trim() : null,
    lignes,
    remarques: remarques.filter((r): r is string => typeof r === 'string'),
  };
}