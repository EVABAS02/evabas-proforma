--
-- PostgreSQL database dump
--

\restrict lWVdYxn2grZH9rmSNxbcucWjP56WtEAciYVJc8HN7VRXFw3lc8rrzfybaJCZJ7y

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
-- Data for Name: clients; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.clients (id, created_at, user_id, nom, ifu, telephone, adresse) FROM stdin;
396b9aa5-2fd9-49c9-ba39-91683917ab54	2026-05-26 19:33:40.859081+00	0a2af91d-423c-444c-bcb3-72e8f35399dc	la ruche	\N	\N	\N
8beb43ac-0360-49b5-8f02-9731ed646807	2026-07-14 12:57:10.142708+00	0a2af91d-423c-444c-bcb3-72e8f35399dc	ARCHIPEL LOGISTIQUES	3202687300979	+2290197900754	MAISON AHOTONDJI MEDARD GBAGUIDI , PARAKOU ,BORGOU BENIN
\.


--
-- Data for Name: factures; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.factures (id, created_at, user_id, numero, date_facture, statut, client_id, client_nom, client_ifu, client_telephone, client_adresse, montant_ttc, apply_tva, apply_mtcc, apply_tcc, montant_ht, montant_tva, montant_mtcc, montant_tcc) FROM stdin;
785e4b6f-977c-40cb-9b1c-567bf20ad2c3	2026-05-26 20:15:51.573003+00	0a2af91d-423c-444c-bcb3-72e8f35399dc	FP-2026-551652	2026-05-26	brouillon	396b9aa5-2fd9-49c9-ba39-91683917ab54	la ruche	\N	\N	\N	5400	f	f	f	5400	0	0	0
d50e346f-876d-4e19-b706-ea923976968d	2026-07-14 13:54:40.529104+00	0a2af91d-423c-444c-bcb3-72e8f35399dc	FP-2026-280082	2026-07-14	brouillon	8beb43ac-0360-49b5-8f02-9731ed646807	ARCHIPEL LOGISTIQUES	\N	\N	\N	32400	f	f	f	32400	0	0	0
acd00d02-a854-4b05-a2dd-d3265c76f47f	2026-07-14 13:30:19.584434+00	0a2af91d-423c-444c-bcb3-72e8f35399dc	FP-2026-819819	2026-07-14	brouillon	8beb43ac-0360-49b5-8f02-9731ed646807	ARCHIPEL LOGISTIQUES	\N	\N	\N	227100	f	f	f	227100	0	0	0
\.


--
-- Data for Name: produits; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.produits (id, created_at, user_id, designation, categorie, prix_unitaire, prix_gros, qte_carton, unite) FROM stdin;
bc74e754-a0ec-4068-bb40-79887c143753	2026-05-26 19:53:10.622406+00	0a2af91d-423c-444c-bcb3-72e8f35399dc	CHATEAU BAYART PITON	Vin	5400	\N	\N	CARTON
\.


--
-- Data for Name: facture_articles; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.facture_articles (id, facture_id, produit_id, designation, quantite, prix_unitaire) FROM stdin;
5e22994d-cbbe-48f1-a81f-5febbf6114d1	785e4b6f-977c-40cb-9b1c-567bf20ad2c3	bc74e754-a0ec-4068-bb40-79887c143753	CHATEAU BAYART PITON	1	5400
ecfc40ed-6829-41bc-ae4d-dd3d24e57be7	acd00d02-a854-4b05-a2dd-d3265c76f47f	\N	Savon Liquide Lait et Miel 500 ml	12	1400
65aafe76-0b4e-4121-b05d-50d54a288d4c	acd00d02-a854-4b05-a2dd-d3265c76f47f	\N	Savon Liquide Crémeux Mylabel 500 ml	12	1400
c785563c-93d1-42fe-9b98-52cdda4b1e83	acd00d02-a854-4b05-a2dd-d3265c76f47f	\N	Savon Liquide Coco & Miel 500 ml	12	1400
8511c6a6-cb50-4d49-8842-e9ebfce39dd0	acd00d02-a854-4b05-a2dd-d3265c76f47f	\N	Maïs Doux 300 gr	12	875
410b19f3-056a-48b3-8f5c-0b33bdeec989	acd00d02-a854-4b05-a2dd-d3265c76f47f	\N	Papier Tout Usage Mega 1 Rouleau	6	3500
7cf9ebc5-992e-4b29-b8dd-6c4ac80f4802	acd00d02-a854-4b05-a2dd-d3265c76f47f	\N	Serviette 1 Pli 100u clasico suave folha  	20	800
4fcae5ee-429b-4516-bfba-a98bfa5d533a	acd00d02-a854-4b05-a2dd-d3265c76f47f	\N	Détergent Lave-vaisselle Pomme 1 L	10	2300
be5b76b3-92ef-4221-9764-b336f3eab906	acd00d02-a854-4b05-a2dd-d3265c76f47f	\N	Thé Earl Grey Continente 20 sachets	6	1900
c6f188e5-b6de-4343-b69b-a98820375cf6	acd00d02-a854-4b05-a2dd-d3265c76f47f	\N	Infusion de Camomille 25 sachets	6	1200
42c547b0-0a4e-43a7-a720-0d68001b496a	acd00d02-a854-4b05-a2dd-d3265c76f47f	\N	Infusion de Camomille 10 sachets	6	700
19858dfa-f442-43b2-807e-b6379e3b9f64	acd00d02-a854-4b05-a2dd-d3265c76f47f	\N	Thé Vert 25 sachets	6	1300
2460a108-4ceb-4a6e-9ae3-4e0f99e60a3d	acd00d02-a854-4b05-a2dd-d3265c76f47f	\N	Infusion Orange/Pamplemousse 20 sachets	6	1900
e11c4ec7-d09f-48c8-9e26-2cb26775dcba	acd00d02-a854-4b05-a2dd-d3265c76f47f	\N	Infusion Détox 10 sachets	6	900
1d872014-0de5-4996-8a16-b8e6bd2c65c9	acd00d02-a854-4b05-a2dd-d3265c76f47f	\N	Infusion de Menthe Poivrée 10 sachets	6	700
7ee34376-62ac-44b0-bac9-1c585472755d	acd00d02-a854-4b05-a2dd-d3265c76f47f	\N	Infusion Élégance 10 sachets	6	800
af9f74ab-18ab-4b93-bb9c-495bffa9aa99	acd00d02-a854-4b05-a2dd-d3265c76f47f	\N	Infusion Sommeil Calme 10 sachets	6	900
8b140907-1ce5-4737-9b47-77ede963eb28	acd00d02-a854-4b05-a2dd-d3265c76f47f	\N	Infusion de Citron 25 sachets	6	1500
80d41445-d0b8-4a5e-ae60-4002e20d66f0	acd00d02-a854-4b05-a2dd-d3265c76f47f	\N	Infusion Pomme & Cannelle 25 sachets	6	2200
6ed31566-3dd9-42ba-99ac-044ff1ca8637	acd00d02-a854-4b05-a2dd-d3265c76f47f	\N	Infusion de Tilleul 25 sachets	6	1600
ae91ee94-18e3-49f1-b56c-da8bb9d93069	acd00d02-a854-4b05-a2dd-d3265c76f47f	\N	Infusion de Verveine 10 sachets	6	700
95fe4186-d5d8-456e-a162-d6dd625b687f	acd00d02-a854-4b05-a2dd-d3265c76f47f	\N	Thé Noir 10 sachets	6	700
e3932ad6-9fcd-4fbb-970a-b7bcae0ad496	acd00d02-a854-4b05-a2dd-d3265c76f47f	\N	Thé Vert Citron/Miel/Gin 10 sachets	6	700
c851cd56-325e-48c2-bf1b-371b483cdeb6	d50e346f-876d-4e19-b706-ea923976968d	\N	THE VERT MATCHA 25 SACHETS	6	1700
7bfd95d5-8d6e-41a8-94f4-9fb8d30a0808	d50e346f-876d-4e19-b706-ea923976968d	\N	INFUSION FRUITS ROUGES 25 SACHETS	6	1900
8bef445a-16d8-4230-98b7-b28f25c3a456	d50e346f-876d-4e19-b706-ea923976968d	\N	ESSUIE TOUT COMPACT 2=4 ROULEAUX 	6	1800
\.


--
-- Data for Name: profiles; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.profiles (id, created_at, company_name, company_address, company_city, phone_whatsapp, email, regime_fiscal) FROM stdin;
0a2af91d-423c-444c-bcb3-72e8f35399dc	2026-05-26 15:24:34.618739+00	Sté Moravi 	TOKPA HOHO	\N	0195056261LeonEvabas8900	stemoravi123@gmail.com	inconnu
\.


--
-- PostgreSQL database dump complete
--

\unrestrict lWVdYxn2grZH9rmSNxbcucWjP56WtEAciYVJc8HN7VRXFw3lc8rrzfybaJCZJ7y

