export type LigneAjout = {
  designation: string;
  unite: string | null;
  prix_unitaire: number;
  categorie: string;
  existe_deja: boolean;
  produit_existant: string | null;
};

export type PropositionAjout = { produits: LigneAjout[]; remarques: string[] };

const CATEGORIES_VALIDES = ['Vin', 'Alimentaire', 'Entretien', 'Général'];

export function lireAjout(valeur: unknown): PropositionAjout | null {
  if (typeof valeur !== 'object' || valeur === null) return null;
  const brut = valeur as { produits?: unknown; remarques?: unknown };
  if (!Array.isArray(brut.produits)) return null;
  const produits: LigneAjout[] = [];
  for (const element of brut.produits.slice(0, 20)) {
    if (typeof element !== 'object' || element === null) continue;
    const l = element as Record<string, unknown>;
    const designation = typeof l.designation === 'string' ? l.designation.trim().slice(0, 200) : '';
    const prix = typeof l.prix_unitaire === 'number' ? l.prix_unitaire : NaN;
    if (designation === '' || !Number.isFinite(prix) || prix < 0 || prix > 100_000_000) continue;
    const categorie =
      typeof l.categorie === 'string' && CATEGORIES_VALIDES.includes(l.categorie) ? l.categorie : 'Général';
    produits.push({
      designation,
      unite: typeof l.unite === 'string' && l.unite.trim() !== '' ? l.unite.trim().slice(0, 30) : null,
      prix_unitaire: prix,
      categorie,
      existe_deja: l.existe_deja === true,
      produit_existant: typeof l.produit_existant === 'string' ? l.produit_existant : null,
    });
  }
  if (produits.length === 0) return null;
  const remarques = Array.isArray(brut.remarques)
    ? brut.remarques.filter((r): r is string => typeof r === 'string').slice(0, 20)
    : [];
  return { produits, remarques };
}