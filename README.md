# Evabas Proforma

Application React/Vite pour creer et gerer des factures proforma avec Supabase.

## Demarrage sur Windows

Dans VS Code, ouvre un terminal dans ce dossier puis lance:

```powershell
npm.cmd install
npm.cmd run dev
```

L'application sera disponible sur:

```text
http://localhost:5173
```

Si PowerShell bloque `npm`, utilise toujours `npm.cmd`. C'est normal sur certaines installations Windows.

Si tu vois `spawn EPERM` avec Vite/esbuild sur ton PC:

1. Ferme le terminal VS Code.
2. Ouvre VS Code normalement ou en administrateur.
3. Relance `npm.cmd install`.
4. Relance `npm.cmd run dev`.
5. Si Windows Defender bloque encore, autorise Node.js et le dossier du projet.

## Configuration Supabase

Le projet local utilise le fichier `.env`.

Exemple:

```env
VITE_SUPABASE_PROJECT_ID="pjzrstrycwwnrkcigqdf"
VITE_SUPABASE_URL="https://pjzrstrycwwnrkcigqdf.supabase.co"
VITE_SUPABASE_ANON_KEY="colle_ta_publishable_key_ici"
```

Pour trouver la cle:

1. Ouvre Supabase.
2. Va dans ton projet `Facture Proforma`.
3. Va dans `Settings` puis `API`.
4. Copie la cle `Publishable key` ou `anon public`.
5. Colle-la dans `.env`.

Le fichier `.env` ne doit pas etre envoye sur GitHub.

## Verification avant de pousser

Avant un `git push`, lance:

```powershell
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run build
```

Ou tout en une seule commande:

```powershell
npm.cmd run check
```

## Travail avec un collaborateur

Chaque personne doit faire:

```powershell
git clone https://github.com/lascaro22/evabas-proforma.git
cd evabas-proforma
npm.cmd install
copy .env.example .env
npm.cmd run dev
```

Ensuite chacun met sa vraie cle Supabase dans `.env`.

Workflow simple:

```powershell
git pull
npm.cmd install
npm.cmd run dev
git add .
git commit -m "message clair"
git push
```
