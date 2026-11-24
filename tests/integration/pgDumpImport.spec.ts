/**
 * Import of plain dumps made by pg_dump 16 (the tool behind pgAdmin backups), with the import worker
 * importer: COPY data and INSERTs with quotes, backslashes, comment and dollar-quote look-alikes.
 * The fixtures were dumped from the schema created in tests/fixtures/import/README.md.
 */
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { afterAll, describe, expect, it } from 'vitest';

import { createClient, getEngine } from '../../src/main/libs/db/EngineRegistry';
import { getTestEngines } from './helpers/engines';

const SCHEMA = 'it_pg_dump';
const FIXTURES = path.join(__dirname, '../fixtures/import');

const expectedRows = [
   { id: 1, name: 'O\'Brien; Jr.', path: 'C:\\dir\\', note: '-- not a comment', tags: '{"a b",it\'s,"x\\"y"}', j: '{"k": "a\\"b\\\\c"}', bin: '00ff5c27' },
   { id: 2, name: 'tab\there\nnewline', path: '\\server\\share\\', note: '/* not a comment', tags: '{}', j: '{"q": "it\'s"}', bin: null },
   { id: 3, name: '$$ dollar $tag$', path: '\\.', note: '\\.\nline', tags: null, j: null, bin: '5c2e' },
   { id: 4, name: 'ünïcödé ✓ 😀', path: '\\', note: '\\N', tags: '{NULL}', j: 'null', bin: '' }
];

const engine = getTestEngines().find(e => e.name === 'pg');

describe.runIf(engine)('pg_dump import', () => {
   // eslint-disable-next-line @typescript-eslint/no-explicit-any
   let client: any;

   afterAll(async () => {
      await client?.raw(`DROP SCHEMA IF EXISTS ${SCHEMA} CASCADE`);
      client?.destroy();
   });

   /** Imports a file like the import worker: returns the query errors */
   // eslint-disable-next-line @typescript-eslint/no-explicit-any
   async function importFile (file: string, schema = '', onImporter?: (importer: any) => void) {
      client ??= await engine.connect({ poolSize: 1 });
      const importClient = createClient({
         client: 'pg',
         params: { ...await client.getDbConfig(), schema },
         poolSize: 1
      });
      const importer = await getEngine('pg').createImporter(importClient, { uid: 'it', schema, type: 'pg', file });
      const errors: string[] = [];
      importer.on('query-error', (err: { message: string; sql: string }) => errors.push(`${err.message}\n${err.sql}`));
      onImporter?.(importer);
      const done = new Promise<void>((resolve, reject) => {
         importer.once('end', () => resolve());
         importer.once('error', reject);
      });
      importer.run();
      await done;
      importClient.destroy();
      return errors;
   }

   it('reports a failed COPY, skips its data and goes on', async () => {
      client ??= await engine.connect({ poolSize: 1 });
      await client.raw(`DROP SCHEMA IF EXISTS ${SCHEMA} CASCADE`);
      await client.raw(`CREATE SCHEMA ${SCHEMA}`);
      await client.raw(`CREATE TABLE ${SCHEMA}.t (a int, b text)`);

      const file = path.join(os.tmpdir(), `antares-it-pg-copy-${process.pid}.sql`);
      const rows = Array.from({ length: 5000 }, (_, i) => `${i}\trow ${i}`).join('\n');
      fs.writeFileSync(file, [
         'COPY missing (a) FROM stdin;',
         'it\'s; not SQL',
         '\\.',
         'COPY t (a, b) FROM stdin;', // Fails at the row 1000, while the data is being sent
         rows.replace('1000\trow 1000', 'x\tbad'),
         '\\.',
         'COPY t (a, b) FROM stdin;',
         '1\tO\'Brien',
         '\\.',
         'INSERT INTO t VALUES (2, \'after\');',
         '\\connect other',
         'SELECT 1;'
      ].join('\n'));

      try {
         const errors = await importFile(file, SCHEMA);
         expect(errors.map(error => error.split('\n')[0])).toEqual([
            'relation "missing" does not exist',
            'invalid input syntax for type integer: "x"',
            'psql meta-commands are not supported: skipped'
         ]);
         const { rows: imported } = await client.raw(`SELECT a, b FROM ${SCHEMA}.t ORDER BY a`);
         expect(imported).toEqual([{ a: 1, b: 'O\'Brien' }, { a: 2, b: 'after' }]);
      }
      finally {
         fs.rmSync(file, { force: true });
      }
   }, 60000);

   it('rolls back the COPY in progress when cancelled', async () => {
      client ??= await engine.connect({ poolSize: 1 });
      await client.raw(`DROP SCHEMA IF EXISTS ${SCHEMA} CASCADE`);
      await client.raw(`CREATE SCHEMA ${SCHEMA}`);
      await client.raw(`CREATE TABLE ${SCHEMA}.t (a int, b text)`);

      const file = path.join(os.tmpdir(), `antares-it-pg-copy-cancel-${process.pid}.sql`);
      const rows = Array.from({ length: 50000 }, (_, i) => `${i}\trow ${i}`).join('\n');
      fs.writeFileSync(file, `COPY t (a, b) FROM stdin;\n${rows}\n\\.\nINSERT INTO t VALUES (-1, 'after');\n`);

      try {
         let writes = 0;
         const errors = await importFile(file, SCHEMA, importer => {
            const openInlineData = importer.openInlineData.bind(importer);
            importer.openInlineData = async (sql: string) => {
               const sink = await openInlineData(sql);
               return {
                  ...sink,
                  write: async (data: string) => {
                     await sink.write(data);
                     if (++writes === 20) importer.cancel();
                  }
               };
            };
         });

         expect(errors).toEqual([]);
         expect(writes).toBe(20);
         const { rows: [{ n }] } = await client.raw(`SELECT count(*) AS n FROM ${SCHEMA}.t`);
         expect(n).toBe('0');
      }
      finally {
         fs.rmSync(file, { force: true });
      }
   }, 60000);

   for (const fixture of ['pg_dump.sql', 'pg_dump_inserts.sql']) {
      it(`imports ${fixture}`, async () => {
         client ??= await engine.connect({ poolSize: 1 });
         await client.raw(`DROP SCHEMA IF EXISTS ${SCHEMA} CASCADE`);

         const errors = await importFile(path.join(FIXTURES, fixture));
         expect(errors).toEqual([]);

         const { rows } = await client.raw(`SELECT id, name, path, note, tags::text, j::text, encode(bin, 'hex') AS bin FROM ${SCHEMA}."o'brien" ORDER BY id`);
         expect(rows).toEqual(expectedRows);

         const { rows: [checks] } = await client.raw(`SELECT ${SCHEMA}."it's"('x') AS fn,
            (SELECT string_agg(n, ',' ORDER BY n) FROM ${SCHEMA}."v;1") AS view,
            obj_description('${SCHEMA}."o''brien"'::regclass, 'pg_class') AS comment,
            nextval('${SCHEMA}."o''brien_id_seq"') AS next`);
         expect(checks).toEqual({
            fn: 'xa\\;',
            view: expectedRows.map(row => `${row.name};`).sort().join(','),
            comment: 'Windows path: C:\\temp\\ and it\'s; fine',
            next: '5'
         });
      }, 60000);
   }
});
