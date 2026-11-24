/**
 * SQL export and import, created through the EngineRegistry like the worker threads do:
 * dump a schema with tricky objects and values to a file, import it back, compare the data.
 */
import Database from 'better-sqlite3';
import { getTestDatabases } from 'common/libs/testConnections';
import * as fs from 'fs';
import * as firebird from 'node-firebird';
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

/**
 * Engines without schemas (a database is a file): the dump of a new database is run
 * by the client (query splitter, like the query editor) on another new database.
 */
interface FileDatabase {
   // eslint-disable-next-line @typescript-eslint/no-explicit-any
   client: any;
   drop: () => Promise<void>;
}

const fbParams = (name: string) => {
   const { host, port, user, password } = getTestDatabases().firebird;
   return { host, port, user, password, database: `/var/lib/firebird/data/${name}.fdb` };
};

const fileDatabases: Partial<Record<EngineName, (name: string) => Promise<FileDatabase>>> = {
   sqlite: async name => {
      const databasePath = path.join(os.tmpdir(), `antares-${name}-${process.pid}.db`);
      fs.rmSync(databasePath, { force: true });
      new Database(databasePath).close();
      const client = createClient({ client: 'sqlite', uid: name, params: { databasePath, readonly: false } as never });
      await client.connect();
      return {
         client,
         drop: async () => {
            await client.destroy();
            fs.rmSync(databasePath, { force: true });
         }
      };
   },
   firebird: async name => {
      const params = fbParams(name);
      const dropDatabase = () => new Promise<void>(resolve => {
         firebird.attach(params, (err, db) => {
            if (err) return resolve(); // Not existing
            db.drop(() => resolve());
         });
      });
      await dropDatabase();
      await new Promise<void>((resolve, reject) => {
         firebird.create(params, (err, db) => {
            if (err) return reject(err);
            db.detach(() => resolve());
         });
      });

      const client = createClient({ client: 'firebird', uid: name, params: params as never, poolSize: 1 });
      await client.connect();
      return {
         client,
         drop: async () => {
            await client.destroy();
            await dropDatabase();
         }
      };
   }
};

const quoted = (text: string) => `'${text.replaceAll('\'', '\'\'')}'`;
const longText = 'àé\'"x'.repeat(4000); // 20000 characters: split in several literals
const longBinary = Buffer.from(Array.from({ length: 20000 }, (_, i) => i % 256));

const fileScenarios: Partial<Record<EngineName, Scenario & { schema: string; afterChecks: [string, unknown][]; /** The dump also runs on the database it created (DROP statements) */ rerun?: boolean }>> = {
   sqlite: {
      schema: 'main',
      setup: [
         'CREATE TABLE parent (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL)',
         `CREATE TABLE child (id INTEGER PRIMARY KEY, parent_id INTEGER REFERENCES parent (id), r REAL, big INTEGER, b BLOB,
            t TEXT, anyv, g INTEGER GENERATED ALWAYS AS (id * 2) VIRTUAL)`,
         'CREATE INDEX child_parent ON child (parent_id)',
         'CREATE UNIQUE INDEX child_t ON child (t) WHERE t IS NOT NULL',
         'INSERT INTO parent (name) VALUES (\'a\'), (\'it\'\'s\')',
         'DELETE FROM parent WHERE id = 2',
         `INSERT INTO child VALUES
            (1, 1, 1.0, 9223372036854775807, x'00ff', ${quoted('line1\nline2 \'q\' "x" \\ ')}, 3.5),
            (2, NULL, -0.5, -1, x'', '', 'text'),
            (3, 1, 1e300, 0, NULL, NULL, x'01')`,
         'CREATE VIEW v AS SELECT id, t FROM child',
         'CREATE TRIGGER tr AFTER INSERT ON parent BEGIN UPDATE child SET t = t WHERE id = NEW.id; SELECT 1; END',
         'CREATE VIRTUAL TABLE fts USING fts5(body)',
         'INSERT INTO fts VALUES (\'hello world\')'
      ],
      checks: [
         'SELECT id, parent_id, r, typeof(r) AS tr, CAST(big AS TEXT) AS big, hex(b) AS b, t, typeof(anyv) AS ta, CAST(anyv AS TEXT) AS anyv, g FROM child ORDER BY id',
         'SELECT * FROM v ORDER BY id',
         'SELECT name, seq FROM sqlite_sequence',
         'SELECT type, name, tbl_name, sql FROM sqlite_master WHERE type IN (\'index\', \'trigger\', \'view\') ORDER BY name',
         'SELECT body FROM fts WHERE fts MATCH \'hello\''
      ],
      afterChecks: [
         ['INSERT INTO parent (name) VALUES (\'x\')', undefined],
         ['SELECT MAX(id) AS id FROM parent', [{ id: 3 }]]
      ],
      includes: { views: true, triggers: true },
      rerun: true
   },
   firebird: {
      schema: 'it_export_src.fdb',
      setup: [
         'CREATE DOMAIN D_POSITIVE AS INTEGER CHECK (VALUE > 0)',
         'CREATE SEQUENCE SEQ_A',
         'SELECT NEXT VALUE FOR SEQ_A FROM RDB$DATABASE',
         'SELECT NEXT VALUE FOR SEQ_A FROM RDB$DATABASE',
         'CREATE EXCEPTION E_BAD \'it\'\'s bad\'',
         'CREATE TABLE PARENT (A INTEGER NOT NULL, B INTEGER NOT NULL, CONSTRAINT PK_PARENT PRIMARY KEY (A, B))',
         `CREATE TABLE CHILD (
            ID INTEGER GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
            PA INTEGER, PB INTEGER, P D_POSITIVE,
            NAME VARCHAR(50) CHARACTER SET UTF8 COLLATE UNICODE_CI,
            N NUMERIC(18, 4), BIG BIGINT, I128 INT128, DF DECFLOAT(34), F DOUBLE PRECISION,
            TS TIMESTAMP, TSZ TIMESTAMP WITH TIME ZONE, D DATE, T TIME, FLAG BOOLEAN,
            TXT BLOB SUB_TYPE TEXT, BIN BLOB SUB_TYPE BINARY, OCT CHAR(4) CHARACTER SET OCTETS,
            CALC COMPUTED BY (PA * 2),
            CONSTRAINT FK_CHILD FOREIGN KEY (PA, PB) REFERENCES PARENT (A, B) ON DELETE CASCADE,
            CONSTRAINT CK_CHILD CHECK (PA > 0)
         )`,
         'COMMENT ON TABLE CHILD IS \'it\'\'s a child\'',
         'CREATE DESCENDING INDEX IX_CHILD_NAME ON CHILD (NAME)',
         'CREATE INDEX IX_CHILD_EXPR ON CHILD COMPUTED BY (UPPER(NAME))',
         'INSERT INTO PARENT VALUES (1, 2)',
         'CREATE TABLE GEN_ALWAYS (ID INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY, V VARCHAR(10))',
         'INSERT INTO GEN_ALWAYS (V) VALUES (\'a\')',
         'INSERT INTO GEN_ALWAYS (V) VALUES (\'b\')',
         `INSERT INTO CHILD (PA, PB, P, NAME, N, BIG, I128, DF, F, TS, TSZ, D, T, FLAG, TXT, BIN, OCT) VALUES (
            1, 2, 5, 'Àccent ''q''', 12345678901234.5678, 9223372036854775807, 170141183460469231731687303715884105727,
            1.5E+300, 0.1, '2024-01-01 10:00:00.1234', '2024-01-01 10:00:00.1234 Europe/Rome', '2024-02-29', '23:59:59.9999', TRUE,
            CAST(${quoted(longText.slice(0, 7000))} AS BLOB SUB_TYPE TEXT) || ${quoted(longText.slice(7000, 14000))} || ${quoted(longText.slice(14000))},
            CAST(x'${longBinary.subarray(0, 10000).toString('hex')}' AS BLOB SUB_TYPE BINARY) || x'${longBinary.subarray(10000).toString('hex')}',
            x'01020304'
         )`,
         'INSERT INTO CHILD (PA, PB) VALUES (1, 2)',
         'CREATE VIEW V_BASE AS SELECT A, B FROM PARENT',
         'CREATE VIEW V_TOP (A2) AS SELECT A FROM V_BASE',
         'CREATE PROCEDURE P_SUM (X INTEGER) RETURNS (Y INTEGER) AS DECLARE C INTEGER; BEGIN SELECT COUNT(*) FROM V_TOP INTO :C; Y = X + C; SUSPEND; END',
         'CREATE TRIGGER TR_CHILD FOR CHILD ACTIVE BEFORE INSERT OR UPDATE POSITION 5 AS BEGIN IF (NEW.NAME = \'bad\') THEN EXCEPTION E_BAD; END'
      ],
      checks: [
         `SELECT ID, PA, PB, P, NAME, CAST(N AS VARCHAR(40)) AS N, CAST(BIG AS VARCHAR(40)) AS BIG, CAST(I128 AS VARCHAR(50)) AS I128,
            CAST(DF AS VARCHAR(50)) AS DF, F, CAST(TS AS VARCHAR(40)) AS TS, CAST(TSZ AS VARCHAR(60)) AS TSZ, CAST(D AS VARCHAR(20)) AS D,
            CAST(T AS VARCHAR(20)) AS T, FLAG, CHAR_LENGTH(TXT) AS TXT_LENGTH, CAST(HASH(TXT) AS VARCHAR(30)) AS TXT_HASH,
            OCTET_LENGTH(BIN) AS BIN_LENGTH, CAST(HASH(BIN) AS VARCHAR(30)) AS BIN_HASH, OCT, CALC
         FROM CHILD ORDER BY ID`,
         'SELECT * FROM V_TOP',
         'SELECT * FROM GEN_ALWAYS ORDER BY ID',
         // Results of Firebird 4 types (INT128, time zones) used to leave the query pending
         'SELECT SUM(N) AS S, MAX(TSZ) AS TSZ FROM CHILD',
         // DECFLOAT results failed with error -804 (node-firebird): read as strings
         'SELECT DF FROM CHILD ORDER BY ID',
         'SELECT Y FROM P_SUM(1)',
         `SELECT TRIM(RDB$INDEX_NAME) AS NAME, RDB$INDEX_TYPE AS DESCENDING, RDB$EXPRESSION_SOURCE AS EXPRESSION FROM RDB$INDICES
         WHERE RDB$RELATION_NAME = 'CHILD' AND RDB$INDEX_NAME NOT STARTING WITH 'RDB$' ORDER BY 1`,
         `SELECT TRIM(RDB$CONSTRAINT_NAME) AS NAME, TRIM(RDB$CONSTRAINT_TYPE) AS TYPE FROM RDB$RELATION_CONSTRAINTS
         WHERE RDB$RELATION_NAME IN ('CHILD', 'PARENT') AND RDB$CONSTRAINT_NAME NOT STARTING WITH 'INTEG_' ORDER BY 1`,
         'SELECT RDB$DESCRIPTION AS DESCRIPTION FROM RDB$RELATIONS WHERE RDB$RELATION_NAME = \'CHILD\'',
         'SELECT TRIM(RDB$TRIGGER_NAME) AS NAME, RDB$TRIGGER_TYPE AS TYPE, RDB$TRIGGER_SEQUENCE AS POS FROM RDB$TRIGGERS WHERE RDB$TRIGGER_NAME = \'TR_CHILD\'',
         'SELECT GEN_ID(SEQ_A, 0) AS SEQ FROM RDB$DATABASE'
      ],
      afterChecks: [
         ['INSERT INTO CHILD (PA, PB) VALUES (1, 2)', undefined],
         ['SELECT MAX(ID) AS ID FROM CHILD', [{ ID: 3 }]],
         ['INSERT INTO GEN_ALWAYS (V) VALUES (\'c\')', undefined],
         ['SELECT MAX(ID) AS ID FROM GEN_ALWAYS', [{ ID: 3 }]],
         ['SELECT NEXT VALUE FOR SEQ_A AS SEQ FROM RDB$DATABASE', [{ SEQ: 3 }]]
      ],
      includes: { views: true, triggers: true, routines: true }
   }
};

for (const engine of getTestEngines().filter(e => fileScenarios[e.name])) {
   describe.sequential(`${engine.name} export → import`, () => {
      const scenario = fileScenarios[engine.name];
      const file = path.join(os.tmpdir(), `antares-it-dump-${engine.name}-${process.pid}.sql`);
      const databases: FileDatabase[] = [];

      afterAll(async () => {
         for (const database of databases) await database.drop();
         if (!process.env.ANTARES_KEEP_DUMPS) fs.rmSync(file, { force: true });
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const runChecks = async (client: any) => {
         const results = [];
         for (const sql of scenario.checks)
            results.push(JSON.parse(JSON.stringify((await client.raw(sql)).rows)));
         return results;
      };

      it('exports a database and runs the dump on a new one', async () => {
         const source = await fileDatabases[engine.name](SRC);
         databases.push(source);
         for (const sql of scenario.setup)
            await source.client.raw(sql, { split: false });

         const expected = await runChecks(source.client);

         const structure = await source.client.getStructure(new Set([scenario.schema]));
         const tables = structure[0].tables
            .filter((t: { type: string }) => t.type === 'table')
            .map((t: { name: string }) => ({ table: t.name, includeStructure: true, includeContent: true, includeDropStatement: true }));
         const exporter = getEngine(engine.name).createExporter(source.client, tables, {
            schema: scenario.schema,
            tables,
            includes: scenario.includes,
            outputFormat: 'sql',
            outputFile: file,
            sqlInsertAfter: 2,
            sqlInsertDivider: 'rows'
         });
         const exported = waitFor(exporter);
         exporter.run().catch((): null => null);
         await exported;

         // Import worker
         const imported = await fileDatabases[engine.name](DST);
         databases.push(imported);
         for (let run = 0; run < (scenario.rerun ? 2 : 1); run++) {
            const errors = await importFile(imported.client, engine.name, file);
            expect(errors).toEqual([]);
         }

         // Query editor
         const edited = await fileDatabases[engine.name](`${DST}_editor`);
         databases.push(edited);
         const dump = fs.readFileSync(file, 'utf8');
         await edited.client.raw(dump);
         if (scenario.rerun) await edited.client.raw(dump);

         for (const target of [imported, edited]) {
            expect(await runChecks(target.client)).toEqual(expected);

            for (const [sql, result] of scenario.afterChecks) {
               const { rows } = await target.client.raw(sql);
               if (result !== undefined) expect(JSON.parse(JSON.stringify(rows))).toEqual(result);
            }
         }
      }, 120000);
   });
}

/** Imports a file with the importer of the engine, like the import worker: returns the query errors */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function importFile (client: any, type: EngineName, file: string, onImporter?: (importer: any) => void) {
   const importer = await getEngine(type).createImporter(client, { uid: 'it', schema: '', type, file });
   const errors: string[] = [];
   importer.on('query-error', (err: { message: string; sql: string }) => errors.push(`${err.message}\n${err.sql.slice(0, 300)}`));
   onImporter?.(importer);
   const done = waitFor(importer);
   importer.run().catch((): null => null);
   await done;
   return errors;
}

describe.runIf(getTestEngines().some(e => e.name === 'sqlite'))('sqlite import', () => {
   it('rolls back and closes the database when cancelled', async () => {
      const file = path.join(os.tmpdir(), `antares-it-import-${process.pid}.sql`);
      const rows = Array.from({ length: 20000 }, (_, i) => `INSERT INTO t VALUES (${i}, 'row ${i}');`).join('\n');
      fs.writeFileSync(file, `CREATE TABLE t (id INTEGER, s TEXT);\n${rows}\n`);

      const database = await fileDatabases.sqlite('it_import_cancel');
      try {
         let cancelled = false;
         const errors = await importFile(database.client, 'sqlite', file, importer => {
            // Cancelled after 1000 statements
            const execute = importer.execute.bind(importer);
            let count = 0;
            importer.execute = async (sql: string) => {
               await execute(sql);
               if (++count === 1000) {
                  cancelled = true;
                  importer.cancel();
               }
            };
         });

         expect(errors).toEqual([]);
         expect(cancelled).toBe(true);
         // Nothing of the interrupted transaction is kept
         const { rows: tables } = await database.client.raw('SELECT name FROM sqlite_master WHERE name = \'t\'');
         expect(tables).toEqual([]);
      }
      finally {
         await database.drop(); // Fails on Windows if the importer left the file open
         fs.rmSync(file, { force: true });
      }
   });
});
