--
-- PostgreSQL database dump
--

\restrict K4zcXaiQfY4JDUTTof36MP4LcY8tdQ4X6c8RUkvwMu7aUoTmIeDT2UeBVgYaAG4

-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.10

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: pg_database_owner
--

CREATE SCHEMA public;


ALTER SCHEMA public OWNER TO pg_database_owner;

--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: pg_database_owner
--

COMMENT ON SCHEMA public IS 'standard public schema';


--
-- Name: check_request(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.check_request() RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  req_method text := current_setting('request.method', true);
  req_ip inet := split_part(current_setting('request.headers', true)::json->>'x-forwarded-for', ',', 1)::inet;
  count_in_window integer;
BEGIN
  -- Only enforce rate limit for write methods; GET/HEAD are read-only
  IF req_method IS NULL OR req_ip IS NULL THEN
    RETURN;
  END IF;

  IF req_method = 'GET' OR req_method = 'HEAD' THEN
    RETURN;
  END IF;

  SELECT count(*) INTO count_in_window
  FROM private.rate_limits
  WHERE ip = req_ip
    AND request_at between now() - interval '5 minutes' and now();

  -- Threshold: 100 writes / 5 min per IP
  IF count_in_window >= 100 THEN
    raise sqlstate 'PGRST' using
      message = json_build_object(
        'message', 'Rate limit exceeded, try again later'
      )::text,
      detail = json_build_object(
        'status', 420,
        'status_text', 'Enhance Your Calm'
      )::text;
  END IF;

  INSERT INTO private.rate_limits (ip, request_at)
  VALUES (req_ip, now());
END;
$$;


ALTER FUNCTION public.check_request() OWNER TO postgres;

--
-- Name: handle_new_user(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.handle_new_user() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
begin
  insert into public.profiles (id, email, company_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'company_name', 'Mon Entreprise')
  );
  return new;
end;
$$;


ALTER FUNCTION public.handle_new_user() OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: clients; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.clients (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    user_id uuid,
    nom text NOT NULL,
    ifu text,
    telephone text,
    adresse text
);


ALTER TABLE public.clients OWNER TO postgres;

--
-- Name: facture_articles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.facture_articles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    facture_id uuid,
    produit_id uuid,
    designation text NOT NULL,
    quantite integer DEFAULT 1 NOT NULL,
    prix_unitaire numeric NOT NULL,
    montant numeric GENERATED ALWAYS AS (((quantite)::numeric * prix_unitaire)) STORED
);


ALTER TABLE public.facture_articles OWNER TO postgres;

--
-- Name: factures; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.factures (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    user_id uuid,
    numero text NOT NULL,
    date_facture date NOT NULL,
    statut text DEFAULT 'brouillon'::text,
    client_id uuid,
    client_nom text,
    client_ifu text,
    client_telephone text,
    client_adresse text,
    montant_ttc numeric DEFAULT 0,
    apply_tva boolean DEFAULT false,
    apply_mtcc boolean DEFAULT false,
    apply_tcc boolean DEFAULT false,
    montant_ht numeric DEFAULT 0,
    montant_tva numeric DEFAULT 0,
    montant_mtcc numeric DEFAULT 0,
    montant_tcc numeric DEFAULT 0
);


ALTER TABLE public.factures OWNER TO postgres;

--
-- Name: produits; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.produits (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    user_id uuid,
    designation text NOT NULL,
    categorie text NOT NULL,
    prix_unitaire numeric DEFAULT 0,
    prix_gros numeric,
    qte_carton integer,
    unite text
);


ALTER TABLE public.produits OWNER TO postgres;

--
-- Name: profiles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.profiles (
    id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    company_name text DEFAULT 'Mon Entreprise'::text NOT NULL,
    company_address text,
    company_city text,
    phone_whatsapp text,
    email text,
    regime_fiscal text DEFAULT 'inconnu'::text
);


ALTER TABLE public.profiles OWNER TO postgres;

--
-- Name: clients clients_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.clients
    ADD CONSTRAINT clients_pkey PRIMARY KEY (id);


--
-- Name: facture_articles facture_articles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.facture_articles
    ADD CONSTRAINT facture_articles_pkey PRIMARY KEY (id);


--
-- Name: factures factures_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.factures
    ADD CONSTRAINT factures_pkey PRIMARY KEY (id);


--
-- Name: produits produits_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.produits
    ADD CONSTRAINT produits_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);


--
-- Name: clients clients_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.clients
    ADD CONSTRAINT clients_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: facture_articles facture_articles_facture_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.facture_articles
    ADD CONSTRAINT facture_articles_facture_id_fkey FOREIGN KEY (facture_id) REFERENCES public.factures(id) ON DELETE CASCADE;


--
-- Name: facture_articles facture_articles_produit_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.facture_articles
    ADD CONSTRAINT facture_articles_produit_id_fkey FOREIGN KEY (produit_id) REFERENCES public.produits(id) ON DELETE SET NULL;


--
-- Name: factures factures_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.factures
    ADD CONSTRAINT factures_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE SET NULL;


--
-- Name: factures factures_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.factures
    ADD CONSTRAINT factures_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: produits produits_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.produits
    ADD CONSTRAINT produits_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: profiles profiles_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: clients Users can insert own clients; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can insert own clients" ON public.clients FOR INSERT TO authenticated WITH CHECK (true);


--
-- Name: produits Users can insert own produits; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can insert own produits" ON public.produits FOR INSERT TO authenticated WITH CHECK (true);


--
-- Name: profiles Users manage their own profile; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users manage their own profile" ON public.profiles USING ((auth.uid() = id)) WITH CHECK ((auth.uid() = id));


--
-- Name: clients; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

--
-- Name: clients clients: select own; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "clients: select own" ON public.clients FOR SELECT TO authenticated USING (((auth.uid() IS NOT NULL) AND (user_id = auth.uid())));


--
-- Name: clients clients: write own; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "clients: write own" ON public.clients TO authenticated USING (((auth.uid() IS NOT NULL) AND (user_id = auth.uid()))) WITH CHECK (((auth.uid() IS NOT NULL) AND (user_id = auth.uid())));


--
-- Name: facture_articles; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.facture_articles ENABLE ROW LEVEL SECURITY;

--
-- Name: facture_articles facture_articles: select own; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "facture_articles: select own" ON public.facture_articles FOR SELECT TO authenticated USING (((auth.uid() IS NOT NULL) AND (facture_id IN ( SELECT factures.id
   FROM public.factures
  WHERE (factures.user_id = auth.uid())))));


--
-- Name: facture_articles facture_articles: write own; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "facture_articles: write own" ON public.facture_articles TO authenticated USING (((auth.uid() IS NOT NULL) AND (facture_id IN ( SELECT factures.id
   FROM public.factures
  WHERE (factures.user_id = auth.uid()))))) WITH CHECK (((auth.uid() IS NOT NULL) AND (facture_id IN ( SELECT factures.id
   FROM public.factures
  WHERE (factures.user_id = auth.uid())))));


--
-- Name: factures; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.factures ENABLE ROW LEVEL SECURITY;

--
-- Name: factures factures: select own; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "factures: select own" ON public.factures FOR SELECT TO authenticated USING (((auth.uid() IS NOT NULL) AND (user_id = auth.uid())));


--
-- Name: factures factures: write own; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "factures: write own" ON public.factures TO authenticated USING (((auth.uid() IS NOT NULL) AND (user_id = auth.uid()))) WITH CHECK (((auth.uid() IS NOT NULL) AND (user_id = auth.uid())));


--
-- Name: facture_articles own articles; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "own articles" ON public.facture_articles USING ((facture_id IN ( SELECT factures.id
   FROM public.factures
  WHERE (factures.user_id = auth.uid()))));


--
-- Name: clients own clients; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "own clients" ON public.clients USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));


--
-- Name: factures own factures; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "own factures" ON public.factures USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));


--
-- Name: produits own produits; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "own produits" ON public.produits USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));


--
-- Name: profiles own profile; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "own profile" ON public.profiles USING ((auth.uid() = id)) WITH CHECK ((auth.uid() = id));


--
-- Name: produits; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.produits ENABLE ROW LEVEL SECURITY;

--
-- Name: produits produits: select own; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "produits: select own" ON public.produits FOR SELECT TO authenticated USING (((auth.uid() IS NOT NULL) AND (user_id = auth.uid())));


--
-- Name: produits produits: write own; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "produits: write own" ON public.produits TO authenticated USING (((auth.uid() IS NOT NULL) AND (user_id = auth.uid()))) WITH CHECK (((auth.uid() IS NOT NULL) AND (user_id = auth.uid())));


--
-- Name: profiles; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: pg_database_owner
--

GRANT USAGE ON SCHEMA public TO postgres;
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO service_role;


--
-- Name: FUNCTION check_request(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.check_request() TO anon;
GRANT ALL ON FUNCTION public.check_request() TO authenticated;
GRANT ALL ON FUNCTION public.check_request() TO service_role;


--
-- Name: FUNCTION handle_new_user(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.handle_new_user() TO anon;
GRANT ALL ON FUNCTION public.handle_new_user() TO authenticated;
GRANT ALL ON FUNCTION public.handle_new_user() TO service_role;


--
-- Name: TABLE clients; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.clients TO anon;
GRANT ALL ON TABLE public.clients TO authenticated;
GRANT ALL ON TABLE public.clients TO service_role;


--
-- Name: TABLE facture_articles; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.facture_articles TO anon;
GRANT ALL ON TABLE public.facture_articles TO authenticated;
GRANT ALL ON TABLE public.facture_articles TO service_role;


--
-- Name: TABLE factures; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.factures TO anon;
GRANT ALL ON TABLE public.factures TO authenticated;
GRANT ALL ON TABLE public.factures TO service_role;


--
-- Name: TABLE produits; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.produits TO anon;
GRANT ALL ON TABLE public.produits TO authenticated;
GRANT ALL ON TABLE public.produits TO service_role;


--
-- Name: TABLE profiles; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.profiles TO anon;
GRANT ALL ON TABLE public.profiles TO authenticated;
GRANT ALL ON TABLE public.profiles TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: public; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: public; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON FUNCTIONS TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON FUNCTIONS TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON FUNCTIONS TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON FUNCTIONS TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON TABLES TO service_role;


--
-- PostgreSQL database dump complete
--

\unrestrict K4zcXaiQfY4JDUTTof36MP4LcY8tdQ4X6c8RUkvwMu7aUoTmIeDT2UeBVgYaAG4

