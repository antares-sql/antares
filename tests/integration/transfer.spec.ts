/**
 * SQL export and import, created through the EngineRegistry like the worker threads do:
 * dump a schema with tricky objects and values to a file, import it back, compare the data.
 */
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { afterAll, describe, expect, it } from 'vitest';

import { createClient, getEngine } from '../../src/main/libs/db/EngineRegistry';
import { EngineName, getTestEngines } from './helpers/engines';

const SRC = 'it_export_src';
const DST = 'it_export_dst';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const waitFor = (emitter: any) => new Promise<void>((resolve, reject) => {
   emitter.once('end', () => resolve());
   emitter.once('error', reject);
});

interface Scenario {
   /** Creates the source objects (the client is in the source schema) */
   setup: string[];
   /** Queries whose results must be the same after the import ({schema} = schema name) */
   checks: string[];
   /** Statements that must work after the import (e.g. sequences continue from the imported values) */
   after?: string[];
   includes: Record<string, boolean>;
}

const scenarios: Partial<Record<EngineName, Scenario>> = {
   pg: {
      setup: [
         'CREATE TYPE mood AS ENUM (\'sad\', \'happy\')',
         'CREATE DOMAIN positive AS integer CHECK (VALUE > 0)',
         'CREATE TABLE parent (a int, b int, PRIMARY KEY (a, b))',
         `CREATE TABLE child (
            id serial PRIMARY KEY, pa int, pb int, ts timestamptz, t timestamp(6), tags text[], m mood, p positive,
            big numeric(40, 10), f float8, j jsonb, bin bytea, iv interval, flag boolean,
            gen int GENERATED ALWAYS AS (pa * 2) STORED, ident int GENERATED ALWAYS AS IDENTITY,
            CONSTRAINT fk_comp FOREIGN KEY (pa, pb) REFERENCES parent (a, b), CONSTRAINT ck CHECK (pa > 0)
         )`,
         'COMMENT ON TABLE child IS \'it\'\'s a child\'',
         'CREATE INDEX child_gin ON child USING gin (tags)',
         'CREATE INDEX child_partial ON child (pa) WHERE pa > 10',
         'INSERT INTO parent VALUES (1, 2), (3, 4)',
         `INSERT INTO child (pa, pb, ts, t, tags, m, p, big, f, j, bin, iv, flag) VALUES
            (1, 2, '2024-01-01 10:00:00.123456+05', '2024-01-01 10:00:00.123456', '{"a b","it''s","x\\"y",NULL}', 'happy', 7,
               123456789012345678901234567890.0123456789, 'NaN', '{"k": [1, 2.50, "x"]}', '\\x00ff10', '1 day 02:03:04', true),
            (3, 4, NULL, NULL, '{}', NULL, NULL, -0.5, 1.0000000000000002, NULL, NULL, NULL, false)`,
         'CREATE TABLE empty_seq (id serial PRIMARY KEY)',
         'INSERT INTO empty_seq DEFAULT VALUES',
         'DELETE FROM empty_seq',
         'CREATE FUNCTION f(x int) RETURNS int LANGUAGE sql AS $$ SELECT x $$',
         'CREATE FUNCTION f(x text) RETURNS text LANGUAGE sql AS $$ SELECT x $$',
         'CREATE AGGREGATE my_sum(int) (SFUNC = int4pl, STYPE = int, INITCOND = \'0\')',
         'CREATE PROCEDURE pr() LANGUAGE sql AS $$ SELECT 1 $$',
         'CREATE VIEW v2_base AS SELECT * FROM parent',
         'CREATE VIEW v1_top AS SELECT a FROM v2_base',
         'CREATE MATERIALIZED VIEW mv AS SELECT count(*) AS n FROM child',
         'CREATE FUNCTION trg() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN NEW.pb = NEW.pb; RETURN NEW; END $$',
         'CREATE TRIGGER tr BEFORE INSERT OR UPDATE ON child FOR EACH ROW WHEN (NEW.pa > 0) EXECUTE FUNCTION trg()'
      ],
      checks: [
         'SELECT id, pa, pb, ts::text, t::text, tags::text, m::text, p, big::text, f::text, j::text, bin::text, iv::text, flag, gen, ident FROM {schema}.child ORDER BY id',
         'SELECT * FROM {schema}.v1_top ORDER BY a',
         'SELECT * FROM {schema}.mv',
         'SELECT {schema}.f(1) AS i, {schema}.f(\'x\'::text) AS t, (SELECT {schema}.my_sum(a) FROM {schema}.parent) AS s',
         'SELECT pg_get_indexdef(indexrelid) AS def FROM pg_index WHERE indrelid = \'{schema}.child\'::regclass ORDER BY 1',
         'SELECT conname, pg_get_constraintdef(oid) AS def FROM pg_constraint WHERE conrelid = \'{schema}.child\'::regclass ORDER BY 1',
         'SELECT tgname, tgtype FROM pg_trigger WHERE tgrelid = \'{schema}.child\'::regclass AND NOT tgisinternal',
         'SELECT obj_description(\'{schema}.child\'::regclass, \'pg_class\') AS comment'
      ],
      after: [
         'INSERT INTO {schema}.child (pa, pb) VALUES (1, 2)',
         'INSERT INTO {schema}.empty_seq DEFAULT VALUES',
         'CALL {schema}.pr()'
      ],
      includes: { functions: true, views: true, triggers: true, routines: true }
   },
   mysql: {
      setup: [
         `CREATE TABLE t (id int PRIMARY KEY AUTO_INCREMENT, dt datetime(6), ts timestamp(3) NULL, d date, s varchar(50),
            b varbinary(10), bi bit(4), j json, ub bigint unsigned, de decimal(30, 10), pt point,
            g int GENERATED ALWAYS AS (char_length(s)) VIRTUAL, gs int GENERATED ALWAYS AS (char_length(s)) STORED)`,
         'SET SESSION sql_mode = \'\'',
         `INSERT INTO t (dt, ts, d, s, b, bi, j, ub, de, pt) VALUES
            ('2024-01-01 10:00:00.123456', '2024-01-01 10:00:00.123', '0000-00-00', '50% \\\\ "x" \\'y\\'\\n\\0z', 0x00FF, b'1010',
               '{"big": 12345678901234567890, "f": 1.50}', 18446744073709551615, 12345678901234567890.0123456789, ST_GeomFromText('POINT(1 2)')),
            (NULL, NULL, '2024-02-29', '', '', b'0', NULL, 0, -0.5, NULL)`,
         'CREATE VIEW v1 AS SELECT id, s FROM t',
         'CREATE VIEW v0 AS SELECT id FROM v1',
         'CREATE FUNCTION f(x int) RETURNS int DETERMINISTIC RETURN x * 2',
         'CREATE PROCEDURE pr() SELECT 1',
         'CREATE TRIGGER tr BEFORE INSERT ON t FOR EACH ROW SET NEW.s = COALESCE(NEW.s, \'default\')'
      ],
      checks: [
         'SELECT id, dt, ts, CAST(d AS CHAR) AS d, s, HEX(b) AS b, HEX(bi) AS bi, CAST(j AS CHAR) AS j, ub, de, ST_AsText(pt) AS pt, g, gs FROM {schema}.t ORDER BY id',
         'SELECT * FROM {schema}.v0 ORDER BY id',
         'SELECT {schema}.f(2) AS r'
      ],
      after: [
         'INSERT INTO {schema}.t (s) VALUES (NULL)'
      ],
      includes: { functions: true, views: true, triggers: true, routines: true }
   }
};
scenarios.maria = {
   ...scenarios.mysql,
   setup: scenarios.mysql.setup.map(sql => sql.replace('j json', 'j longtext'))
};

for (const engine of getTestEngines().filter(e => getEngine(e.name).createExporter && scenarios[e.name])) {
   describe.sequential(`${engine.name} export → import`, () => {
      const scenario = scenarios[engine.name];
      const file = path.join(os.tmpdir(), `antares-it-dump-${engine.name}-${process.pid}.sql`);
      const isPg = engine.name === 'pg';
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let client: any;

      const dropSchemas = async () => {
         for (const schema of [SRC, DST])
            await client.raw(isPg ? `DROP SCHEMA IF EXISTS ${schema} CASCADE` : `DROP DATABASE IF EXISTS ${schema}`).catch((): null => null);
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const runChecks = async (schema: string) => {
         const results = [];
         // Catalog definitions are printed with schema qualified names only if the schema is not in the search_path
         if (isPg) await client.raw('SET search_path = \'\'');
         for (const sql of scenario.checks) {
            const { rows } = await client.raw(sql.replaceAll('{schema}', schema));
            results.push(JSON.parse(JSON.stringify(rows)));
         }
         return results;
      };

      afterAll(async () => {
         if (client) {
            await dropSchemas();
            await client.destroy();
         }
         if (!process.env.ANTARES_KEEP_DUMPS) fs.rmSync(file, { force: true });
      });

      it('exports a schema and imports it back', async () => {
         client = await engine.connect({ poolSize: 1 });
         await dropSchemas();

         await client.raw(isPg ? `CREATE SCHEMA ${SRC}` : `CREATE DATABASE ${SRC}`);
         await client.raw(isPg ? `CREATE SCHEMA ${DST}` : `CREATE DATABASE ${DST}`);
         await client.raw(isPg ? `SET search_path = ${SRC}` : `USE ${SRC}`);
         for (const sql of scenario.setup)
            await client.raw(sql, { split: false });

         const expected = await runChecks(SRC);

         // Export
         const structure = await client.getStructure(new Set([SRC]));
         const tables = structure
            .find((s: { name: string }) => s.name === SRC).tables
            .filter((t: { type: string }) => t.type === 'table')
            .map((t: { name: string }) => ({ table: t.name, includeStructure: true, includeContent: true, includeDropStatement: true }));
         const exporter = getEngine(engine.name).createExporter(client, tables, {
            schema: SRC,
            tables,
            includes: scenario.includes,
            outputFormat: 'sql',
            outputFile: file,
            sqlInsertAfter: 1,
            sqlInsertDivider: 'rows'
         });
         const exported = waitFor(exporter);
         exporter.run().catch((): null => null);
         await exported;

         // PostgreSQL dumps use schema-qualified names: the import recreates the source schema
         const target = isPg ? SRC : DST;
         if (isPg) await client.raw(`DROP SCHEMA ${SRC} CASCADE`);

         // Import, with a client configured like the import worker does
         const importClient = createClient({
            client: engine.name,
            params: { ...await client.getDbConfig(), schema: target },
            poolSize: 1
         });
         const importer = await getEngine(engine.name).createImporter(importClient, { uid: 'it', schema: target, type: engine.name, file });
         const errors: string[] = [];
         importer.on('query-error', (err: { message: string; sql: string }) => errors.push(`${err.message}\n${err.sql}`));
         const imported = waitFor(importer);
         importer.run();
         await imported;

         expect(errors).toEqual([]);
         expect(await runChecks(target)).toEqual(expected);

         for (const sql of scenario.after ?? [])
            await client.raw(sql.replaceAll('{schema}', target));
      }, 60000);

      it('deletes the partial file when cancelled', async () => {
         const q = (id: string) => client.dialect.quoteIdentifier(id);
         const big = `${q(DST)}.${q('big')}`;
         await client.raw(`CREATE TABLE ${big} (${q('id')} INTEGER, ${q('s')} VARCHAR(50))`);
         await client.raw(`INSERT INTO ${big} VALUES (1, 'row')`);
         for (let i = 0; i < 16; i++) // 65536 rows
            await client.raw(`INSERT INTO ${big} SELECT ${q('id')} + (SELECT MAX(${q('id')}) FROM ${big}), ${q('s')} FROM ${big}`);

         const tables = [{ table: 'big', includeStructure: true, includeContent: true, includeDropStatement: true }];
         const exporter = getEngine(engine.name).createExporter(client, tables, {
            schema: DST,
            tables,
            includes: {},
            outputFormat: 'sql.zip',
            outputFile: file,
            sqlInsertAfter: 1,
            sqlInsertDivider: 'rows'
         });
         exporter.on('progress', (state: { op: string }) => {
            if (state.op === 'WRITE') setTimeout(() => exporter.cancel(), 5);
         });
         const exported = waitFor(exporter);
         exporter.run().catch((): null => null);
         await exported;

         expect(exporter.isCancelled).toBe(true);
         expect(fs.existsSync(file)).toBe(false);
         // The connection of the dump was released
         expect((await client.raw(`SELECT COUNT(*) AS n FROM ${big}`)).rows[0].n).toBeTruthy();
      }, 60000);
   });
}
