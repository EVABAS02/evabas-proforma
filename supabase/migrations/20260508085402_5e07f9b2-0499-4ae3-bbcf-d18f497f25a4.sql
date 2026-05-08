ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS regime_fiscal text;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS apply_aib boolean NOT NULL DEFAULT false;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS aib_rate numeric NOT NULL DEFAULT 0.01;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS montant_aib numeric NOT NULL DEFAULT 0;