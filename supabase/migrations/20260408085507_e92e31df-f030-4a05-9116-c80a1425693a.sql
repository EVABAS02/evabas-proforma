
-- Create clients table
CREATE TABLE public.clients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nom TEXT NOT NULL,
  ifu TEXT,
  telephone TEXT,
  adresse TEXT
);

ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own clients" ON public.clients FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own clients" ON public.clients FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own clients" ON public.clients FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own clients" ON public.clients FOR DELETE USING (auth.uid() = user_id);

-- Create produits table
CREATE TABLE public.produits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  designation TEXT NOT NULL,
  categorie TEXT NOT NULL CHECK (categorie IN ('Vin', 'Alimentaire', 'Infusion & Thé', 'Serviette & Papier', 'Hygiène & Entretien')),
  prix_unitaire NUMERIC NOT NULL DEFAULT 0,
  prix_gros NUMERIC,
  qte_carton INTEGER
);

ALTER TABLE public.produits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own produits" ON public.produits FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own produits" ON public.produits FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own produits" ON public.produits FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own produits" ON public.produits FOR DELETE USING (auth.uid() = user_id);

-- Create factures table
CREATE TABLE public.factures (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  numero TEXT NOT NULL UNIQUE,
  date_facture DATE NOT NULL DEFAULT CURRENT_DATE,
  statut TEXT NOT NULL DEFAULT 'brouillon' CHECK (statut IN ('brouillon', 'envoyé', 'validé')),
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  client_nom TEXT,
  client_ifu TEXT,
  client_telephone TEXT,
  client_adresse TEXT,
  montant_ttc NUMERIC NOT NULL DEFAULT 0
);

ALTER TABLE public.factures ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own factures" ON public.factures FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own factures" ON public.factures FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own factures" ON public.factures FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own factures" ON public.factures FOR DELETE USING (auth.uid() = user_id);

-- Create facture_articles table
CREATE TABLE public.facture_articles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  facture_id UUID NOT NULL REFERENCES public.factures(id) ON DELETE CASCADE,
  produit_id UUID REFERENCES public.produits(id) ON DELETE SET NULL,
  designation TEXT NOT NULL,
  quantite INTEGER NOT NULL DEFAULT 1,
  prix_unitaire NUMERIC NOT NULL,
  montant NUMERIC GENERATED ALWAYS AS (quantite * prix_unitaire) STORED
);

ALTER TABLE public.facture_articles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own facture_articles" ON public.facture_articles FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.factures WHERE factures.id = facture_articles.facture_id AND factures.user_id = auth.uid())
);
CREATE POLICY "Users can create own facture_articles" ON public.facture_articles FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.factures WHERE factures.id = facture_articles.facture_id AND factures.user_id = auth.uid())
);
CREATE POLICY "Users can update own facture_articles" ON public.facture_articles FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.factures WHERE factures.id = facture_articles.facture_id AND factures.user_id = auth.uid())
);
CREATE POLICY "Users can delete own facture_articles" ON public.facture_articles FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.factures WHERE factures.id = facture_articles.facture_id AND factures.user_id = auth.uid())
);
