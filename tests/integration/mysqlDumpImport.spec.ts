/**
 * Import of dumps made by mysqldump 8.4 and mariadb-dump 11.4 (with routines and triggers), with the
 * import worker importer: quotes, backslashes, comment and delimiter look-alikes, DELIMITER blocks.
 * The fixtures were dumped from the database created in tests/fixtures/import/README.md.
 */
import * as path from 'path';
import { afterAll, describe, expect, it } from 'vitest';

import { createClient, getEngine } from '../../src/main/libs/db/EngineRegistry';
import { EngineName, getTestEngines } from './helpers/engines';

const DATABASE = 'it_dump';
const FIXTURES = path.join(__dirname, '../fixtures/import');
const fixtures: Partial<Record<EngineName, string>> = { mysql: 'mysqldump.sql', maria: 'mariadb-dump.sql' };

const expectedRows = [
   { id: 1, name: 'O\'Brien; Jr.', path: 'C:\\dir\\', note: '-- not a comment', delimiter: ';;', ab: 1, k: 'a"b\\c', bin: '00FF5C27' },
   { id: 2, name: 'tab\there\nnewline', path: '\\\\server\\share\\', note: '/* not a comment', delimiter: '$$', ab: 2, k: null, bin: null },
   { id: 3, name: '# hash', path: '\\', note: 'DELIMITER ;;', delimiter: '//', ab: null, k: null, bin: '5C2E' },
   { id: 4, name: 'ünïcödé ✓ 😀', path: '\\\'', note: '\\N', delimiter: null, ab: null, k: null, bin: '' }
];

for (const engine of getTestEngines().filter(e => fixtures[e.name])) {
   describe(`${engine.name} dump import`, () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let client: any;

      afterAll(async () => {
         await client?.raw(`DROP DATABASE IF EXISTS ${DATABASE}`);
         client?.destroy();
      });

      it(`imports ${fixtures[engine.name]}`, async () => {
         client = await engine.connect({ poolSize: 1 });
         await client.raw(`DROP DATABASE IF EXISTS ${DATABASE}`);

         const importClient = createClient({
            client: engine.name,
            params: { ...await client.getDbConfig(), schema: '' },
            poolSize: 1
         });
         const importer = await getEngine(engine.name).createImporter(importClient, {
            uid: 'it',
            schema: '',
            type: engine.name,
            file: path.join(FIXTURES, fixtures[engine.name])
         });
         const errors: string[] = [];
         importer.on('query-error', (err: { message: string; sql: string }) => errors.push(`${err.message}\n${err.sql}`));
         const done = new Promise<void>((resolve, reject) => {
            importer.once('end', () => resolve());
            importer.once('error', reject);
         });
         importer.run();
         await done;
         importClient.destroy();

         expect(errors).toEqual([]);

         const { rows } = await client.raw(`SELECT id, name, path, note, \`delimiter\`, \`a;b\` AS ab,
            JSON_UNQUOTE(JSON_EXTRACT(j, '$.k')) AS k, HEX(bin) AS bin FROM ${DATABASE}.\`o'brien\` ORDER BY id`);
         expect(JSON.parse(JSON.stringify(rows))).toEqual(expectedRows);

         const { rows: [checks] } = await client.raw(`SELECT ${DATABASE}.f(1) AS pos, ${DATABASE}.f(-1) AS neg,
            (SELECT COUNT(*) FROM ${DATABASE}.\`v;1\`) AS view,
            (SELECT GROUP_CONCAT(ROUTINE_NAME ORDER BY ROUTINE_NAME) FROM information_schema.ROUTINES WHERE ROUTINE_SCHEMA = '${DATABASE}') AS routines,
            (SELECT TABLE_COMMENT FROM information_schema.TABLES WHERE TABLE_SCHEMA = '${DATABASE}' AND TABLE_NAME = 'o''brien') AS comment`);
         expect({ ...checks, view: Number(checks.view) }).toEqual({
            pos: 'pos;',
            neg: 'neg',
            view: 4,
            routines: 'f,it\'s',
            comment: 'Windows path: C:\\temp\\ and it\'s; fine'
         });

         // The trigger works
         await client.raw(`INSERT INTO ${DATABASE}.\`o'brien\` (name) VALUES ('new')`);
         const { rows: [added] } = await client.raw(`SELECT id, note, (SELECT GROUP_CONCAT(msg) FROM ${DATABASE}.log) AS log FROM ${DATABASE}.\`o'brien\` WHERE name = 'new'`);
         expect(added).toEqual({ id: 5, note: ';', log: 'it\'s; logged' });
      }, 60000);
   });
}
