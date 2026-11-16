/**
 * SQL export and import, created through the EngineRegistry like the worker threads do:
 * dump a schema to a file, import it into another schema, compare the data.
 */
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { afterAll, describe, expect, it } from 'vitest';

import { createClient, getEngine } from '../../src/main/libs/db/EngineRegistry';
import { getTestEngines } from './helpers/engines';

const SRC = 'it_export_src';
const DST = 'it_export_dst';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const waitFor = (emitter: any) => new Promise<void>((resolve, reject) => {
   emitter.once('end', () => resolve());
   emitter.once('error', reject);
});

for (const engine of getTestEngines().filter(e => getEngine(e.name).createExporter)) {
   describe.sequential(`${engine.name} export → import`, () => {
      const file = path.join(os.tmpdir(), `antares-it-dump-${engine.name}-${process.pid}.sql`);
      const isPg = engine.name === 'pg';
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let client: any;

      const dropSchemas = async () => {
         for (const schema of [SRC, DST])
            await client.raw(isPg ? `DROP SCHEMA IF EXISTS ${schema} CASCADE` : `DROP DATABASE IF EXISTS ${schema}`).catch((): null => null);
      };

      afterAll(async () => {
         if (client) {
            await dropSchemas();
            await client.destroy();
         }
         if (!process.env.ANTARES_KEEP_DUMPS) fs.rmSync(file, { force: true });
      });

      it('exports a schema and imports it back', async () => {
         client = await engine.connect();
         await dropSchemas();

         const q = (id: string) => client.dialect.quoteIdentifier(id);
         await client.raw(isPg ? `CREATE SCHEMA ${SRC}` : `CREATE DATABASE ${SRC}`);
         await client.raw(isPg ? `CREATE SCHEMA ${DST}` : `CREATE DATABASE ${DST}`);
         await client.raw(`CREATE TABLE ${q(SRC)}.${q('t')} (${q('id')} INTEGER NOT NULL PRIMARY KEY, ${q('name')} VARCHAR(50))`);
         await client.raw(`INSERT INTO ${q(SRC)}.${q('t')} VALUES (1, 'plain'), (2, ${client.dialect.quoteString('it\'s "quoted" \\ ok')}), (3, NULL)`);

         // Export
         const tables = [{ table: 't', includeStructure: true, includeContent: true, includeDropStatement: true }];
         const exporter = getEngine(engine.name).createExporter(client, tables, {
            schema: SRC,
            tables,
            includes: {},
            outputFormat: 'sql',
            outputFile: file,
            sqlInsertAfter: 250,
            sqlInsertDivider: 'rows'
         });
         const exported = waitFor(exporter);
         exporter.run();
         await exported;
         expect(fs.readFileSync(file, 'utf8')).toContain('plain');

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
         const imported = waitFor(importer);
         importer.run();
         await imported;

         const { rows } = await client.raw(`SELECT ${q('name')} FROM ${q(target)}.${q('t')} ORDER BY ${q('id')}`);
         expect(rows.map((r: { name: string }) => r.name)).toEqual(['plain', 'it\'s "quoted" \\ ok', null]);
      });
   });
}
