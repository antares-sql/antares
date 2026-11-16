/**
 * Known bugs found while writing the test suite, pinned as expected failures (`it.fails`).
 * When a bug gets fixed, the test starts "unexpectedly passing": turn it into a regular `it`.
 */
import { describe, expect, it } from 'vitest';

import { getTestEngines } from './helpers/engines';

const firebird = getTestEngines().find(e => e.name === 'firebird');

describe.skipIf(!firebird)('firebird known issues', () => {
   // FirebirdSQLClient.raw() always detach()es the connection after an autocommit query.
   // That's right for pooled connections, but in single connection mode (poolSize 0)
   // it closes the only connection: following queries fail or hang.
   it.fails('single connection mode survives more than one query', async () => {
      const client = await firebird.connect({ poolSize: 0 });

      try {
         await client.raw('SELECT 1 AS X FROM RDB$DATABASE');
         const second = client.raw('SELECT 2 AS X FROM RDB$DATABASE');
         const timeout = new Promise((_resolve, reject) => setTimeout(() => reject(new Error('query hung')), 3000));

         await expect(Promise.race([second, timeout])).resolves.toBeDefined();
      }
      finally {
         client.destroy();
      }
   });

   // The query builder renders multi-row inserts as `INSERT ... VALUES (...), (...)`,
   // which Firebird doesn't support. Hit by "insert fake rows" with quantity > 1 (ipc-handlers/tables.ts).
   it.fails('inserts multiple rows with the query builder', async () => {
      const client = await firebird.connect();
      const table = '"it_multi_insert"';

      try {
         await client.raw(`CREATE TABLE ${table} ("id" INTEGER NOT NULL)`);
         await client.schema(firebird.schema).into('it_multi_insert').insert([{ id: 1 }, { id: 2 }]).run();
         const { rows } = await client.raw(`SELECT * FROM ${table}`);
         expect(rows).toHaveLength(2);
      }
      finally {
         await client.raw(`DROP TABLE ${table}`).catch((): null => null);
         client.destroy();
      }
   });
});
