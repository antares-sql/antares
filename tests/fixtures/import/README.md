# Import fixtures

Plain dumps made by **pg_dump 16.16** (the tool behind pgAdmin backups) for [pgDumpImport.spec.ts](../../integration/pgDumpImport.spec.ts):

- `pg_dump.sql`: default format, table data as `COPY ... FROM stdin`
- `pg_dump_inserts.sql`: `--inserts`

Both start with the `\restrict` / `\unrestrict` psql meta-commands added by pg_dump 17.6/16.10 (CVE-2025-8714).

To re-create them, run this script in the docker PostgreSQL (`docker exec -i antares-test-postgres-1 psql -U postgres -d antares_test < setup.sql`), then
`docker exec antares-test-postgres-1 pg_dump -U postgres -d antares_test --schema=it_pg_dump --no-owner [--inserts] > <fixture>`.

```sql
DROP SCHEMA IF EXISTS it_pg_dump CASCADE;
CREATE SCHEMA it_pg_dump;
SET search_path = it_pg_dump;
CREATE TABLE "o'brien" (
   id serial PRIMARY KEY,
   name text DEFAULT 'it''s',
   path text,
   note text,
   tags text[],
   j jsonb,
   bin bytea
);
COMMENT ON TABLE "o'brien" IS 'Windows path: C:\temp\ and it''s; fine';
COMMENT ON COLUMN "o'brien".path IS 'ends with \';
INSERT INTO "o'brien" (name, path, note, tags, j, bin) VALUES
   ('O''Brien; Jr.', 'C:\dir\', '-- not a comment', '{"a b","it''s","x\"y"}', '{"k": "a\"b\\c"}', '\x00ff5c27'),
   (E'tab\there\nnewline', '\server\share\', '/* not a comment', '{}', '{"q": "it''s"}', NULL),
   ('$$ dollar $tag$', '\.', E'\\.\nline', NULL, NULL, '\x5c2e'),
   ('ünïcödé ✓ 😀', '\', '\N', '{NULL}', 'null', '\x');
CREATE FUNCTION "it's"(x text) RETURNS text LANGUAGE plpgsql AS $_$
BEGIN
   -- don't break; here
   RETURN x || 'a\' || $$;$$;
END;
$_$;
CREATE VIEW "v;1" AS SELECT name || ';' AS n FROM "o'brien";
```
