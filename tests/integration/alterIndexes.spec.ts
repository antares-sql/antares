/**
 * Index alterations as the table props tab sends them.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { getTestEngines } from './helpers/engines';

const TABLE = 'it_alter_indexes';

for (const engine of getTestEngines().filter(e => e.name === 'mysql' || e.name === 'maria')) {
   describe.sequential(`${engine.name} alter table indexes`, () => {
      const { schema } = engine;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let client: any;
      const table = `\`${schema}\`.\`${TABLE}\``;
      const noChanges = { additions: [] as unknown[], changes: [] as unknown[], deletions: [] as unknown[] };

      const primaryColumns = async () => {
         const indexes: { name: string; column: string }[] = await client.getTableIndexes({ schema, table: TABLE });
         return indexes.filter(i => i.name === 'PRIMARY').map(i => i.column);
      };

      beforeAll(async () => {
         client = await engine.connect();
         await client.raw(`DROP TABLE IF EXISTS ${table}`);
         await client.raw(`CREATE TABLE ${table} (id INT NOT NULL AUTO_INCREMENT PRIMARY KEY, code INT NOT NULL)`);
      });

      afterAll(async () => {
         if (client) {
            await client.raw(`DROP TABLE IF EXISTS ${table}`).catch((): null => null);
            await client.destroy();
         }
      });

      // #742: a second column is added to the primary key with "Add to index > PRIMARY"
      it('adds a column to an auto increment primary key', async () => {
         const columns = await client.getTableColumns({ schema, table: TABLE });
         const primary = { _antares_id: '1', name: 'PRIMARY', type: 'PRIMARY', fields: ['id', 'code'], oldName: 'PRIMARY', oldType: 'PRIMARY' };

         await client.alterTable({
            schema,
            table: TABLE,
            additions: [],
            changes: [],
            deletions: [],
            tableStructure: { name: TABLE, fields: columns, foreigns: [], indexes: [primary] },
            indexChanges: { ...noChanges, changes: [primary] },
            foreignChanges: noChanges,
            checkChanges: noChanges,
            options: {}
         });

         expect(await primaryColumns()).toEqual(['id', 'code']);
      });
   });
}
