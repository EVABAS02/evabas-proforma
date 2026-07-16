--
-- PostgreSQL database dump
--

\restrict OJr65CmkpZQ1A8HcPsZUprD6ljxuqOAetMI6cW7nycqWfRfZr4dTiGeLK1uSE41

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
-- Name: private; Type: SCHEMA; Schema: -; Owner: postgres
--

CREATE SCHEMA private;


ALTER SCHEMA private OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: rate_limits; Type: TABLE; Schema: private; Owner: postgres
--

CREATE TABLE private.rate_limits (
    ip inet,
    request_at timestamp with time zone
);


ALTER TABLE private.rate_limits OWNER TO postgres;

--
-- Name: rate_limits_ip_request_at_idx; Type: INDEX; Schema: private; Owner: postgres
--

CREATE INDEX rate_limits_ip_request_at_idx ON private.rate_limits USING btree (ip, request_at DESC);


--
-- PostgreSQL database dump complete
--

\unrestrict OJr65CmkpZQ1A8HcPsZUprD6ljxuqOAetMI6cW7nycqWfRfZr4dTiGeLK1uSE41

