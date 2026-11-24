# Import fixtures

Dumps made by the dump tools of each engine, imported by [pgDumpImport.spec.ts](../../integration/pgDumpImport.spec.ts) and
[mysqlDumpImport.spec.ts](../../integration/mysqlDumpImport.spec.ts) with the import worker importers. The values are chosen
to break naive splitters: quotes, backslashes, comment, dollar-quote and delimiter look-alikes, names with `'` and `;`.

## PostgreSQL

Plain dumps made by **pg_dump 16.16** (the tool behind pgAdmin backups):

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

## MySQL / MariaDB

- `mysqldump.sql`: **mysqldump 8.4**, imported into MySQL
- `mariadb-dump.sql`: **mariadb-dump 11.4**, imported into MariaDB

Both made with `--hex-blob --routines --triggers --databases it_dump`. Without `--hex-blob` binary columns are written
as raw bytes, which are not valid UTF-8: the importer reads scripts as UTF-8, so those values are not imported as they are.

To re-create them, run this script in each docker server
(`docker exec -i antares-test-mysql-1 mysql --default-character-set=utf8mb4 -uroot -pantares < setup.sql`, `mariadb` in
`antares-test-mariadb-1`), then
`docker exec antares-test-mysql-1 mysqldump -uroot -pantares --hex-blob --routines --triggers --databases it_dump > mysqldump.sql`
(`mariadb-dump` in `antares-test-mariadb-1` for `mariadb-dump.sql`).

```sql
DROP DATABASE IF EXISTS it_dump;
CREATE DATABASE it_dump CHARACTER SET utf8mb4;
USE it_dump;
CREATE TABLE `o'brien` (
   id int AUTO_INCREMENT PRIMARY KEY,
   name varchar(100) DEFAULT 'it''s',
   path varchar(100),
   note text,
   `delimiter` varchar(10),
   `a;b` int,
   j json,
   bin varbinary(10)
) COMMENT 'Windows path: C:\\temp\\ and it''s; fine';
INSERT INTO `o'brien` (name, path, note, `delimiter`, `a;b`, j, bin) VALUES
   ('O''Brien; Jr.', 'C:\\dir\\', '-- not a comment', ';;', 1, '{"k": "a\\"b\\\\c"}', 0x00ff5c27),
   ('tab\there\nnewline', '\\\\server\\share\\', '/* not a comment', '$$', 2, '{"q": "it''s"}', NULL),
   ('# hash', '\\', 'DELIMITER ;;', '//', NULL, NULL, 0x5c2e),
   ('ünïcödé ✓ 😀', '\\''', '\\N', NULL, NULL, 'null', X'');
CREATE TABLE log (msg varchar(100));
DELIMITER ;;
CREATE TRIGGER `trg;1` BEFORE INSERT ON `o'brien` FOR EACH ROW
BEGIN
   -- don't break; here
   SET NEW.note = CONCAT(IFNULL(NEW.note, ''), ';');
   INSERT INTO log VALUES ('it''s; logged');
END;;
CREATE PROCEDURE `it's`(IN x varchar(10))
BEGIN
   DECLARE y int DEFAULT 0;
   /* a; b */
   IF x = ';' THEN
      SET y = 1;
   END IF;
   SELECT CONCAT(x, 'a\\', y) AS r;
END;;
CREATE FUNCTION f(x int) RETURNS varchar(20) DETERMINISTIC
BEGIN
   CASE WHEN x > 0 THEN RETURN 'pos;'; ELSE RETURN 'neg'; END CASE;
END;;
DELIMITER ;
CREATE VIEW `v;1` AS SELECT CONCAT(name, ';') AS n FROM `o'brien`;
```
