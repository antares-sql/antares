--
-- PostgreSQL database dump
--

\restrict lNGYmKz7MpAn5lrc6JUCDmH0AjbAqhi60go2WrT5xJuxYbFeHF0kyXVdn1VLX5V

-- Dumped from database version 16.16 (Debian 16.16-1.pgdg13+1)
-- Dumped by pg_dump version 16.16 (Debian 16.16-1.pgdg13+1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: it_pg_dump; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA it_pg_dump;


--
-- Name: it's(text); Type: FUNCTION; Schema: it_pg_dump; Owner: -
--

CREATE FUNCTION it_pg_dump."it's"(x text) RETURNS text
    LANGUAGE plpgsql
    AS $_$
BEGIN
   -- don't break; here
   RETURN x || 'a\' || $$;$$;
END;
$_$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: o'brien; Type: TABLE; Schema: it_pg_dump; Owner: -
--

CREATE TABLE it_pg_dump."o'brien" (
    id integer NOT NULL,
    name text DEFAULT 'it''s'::text,
    path text,
    note text,
    tags text[],
    j jsonb,
    bin bytea
);


--
-- Name: TABLE "o'brien"; Type: COMMENT; Schema: it_pg_dump; Owner: -
--

COMMENT ON TABLE it_pg_dump."o'brien" IS 'Windows path: C:\temp\ and it''s; fine';


--
-- Name: COLUMN "o'brien".path; Type: COMMENT; Schema: it_pg_dump; Owner: -
--

COMMENT ON COLUMN it_pg_dump."o'brien".path IS 'ends with \';


--
-- Name: o'brien_id_seq; Type: SEQUENCE; Schema: it_pg_dump; Owner: -
--

CREATE SEQUENCE it_pg_dump."o'brien_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: o'brien_id_seq; Type: SEQUENCE OWNED BY; Schema: it_pg_dump; Owner: -
--

ALTER SEQUENCE it_pg_dump."o'brien_id_seq" OWNED BY it_pg_dump."o'brien".id;


--
-- Name: v;1; Type: VIEW; Schema: it_pg_dump; Owner: -
--

CREATE VIEW it_pg_dump."v;1" AS
 SELECT (name || ';'::text) AS n
   FROM it_pg_dump."o'brien";


--
-- Name: o'brien id; Type: DEFAULT; Schema: it_pg_dump; Owner: -
--

ALTER TABLE ONLY it_pg_dump."o'brien" ALTER COLUMN id SET DEFAULT nextval('it_pg_dump."o''brien_id_seq"'::regclass);


--
-- Data for Name: o'brien; Type: TABLE DATA; Schema: it_pg_dump; Owner: -
--

COPY it_pg_dump."o'brien" (id, name, path, note, tags, j, bin) FROM stdin;
1	O'Brien; Jr.	C:\\dir\\	-- not a comment	{"a b",it's,"x\\"y"}	{"k": "a\\"b\\\\c"}	\\x00ff5c27
2	tab\there\nnewline	\\server\\share\\	/* not a comment	{}	{"q": "it's"}	\N
4	ünïcödé ✓ 😀	\\	\\N	{NULL}	null	\\x
3	$$ dollar $tag$	\\.	\\.\nline	\N	\N	\\x5c2e
\.


--
-- Name: o'brien_id_seq; Type: SEQUENCE SET; Schema: it_pg_dump; Owner: -
--

SELECT pg_catalog.setval('it_pg_dump."o''brien_id_seq"', 4, true);


--
-- Name: o'brien o'brien_pkey; Type: CONSTRAINT; Schema: it_pg_dump; Owner: -
--

ALTER TABLE ONLY it_pg_dump."o'brien"
    ADD CONSTRAINT "o'brien_pkey" PRIMARY KEY (id);


--
-- PostgreSQL database dump complete
--

\unrestrict lNGYmKz7MpAn5lrc6JUCDmH0AjbAqhi60go2WrT5xJuxYbFeHF0kyXVdn1VLX5V

