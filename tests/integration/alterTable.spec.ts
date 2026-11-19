/**
 * Table alterations involving columns whose type is not in the engine type catalog
 * (common/data-types), as the table props tab sends them.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { getTestEngines } from './helpers/engines';

const TABLE = 'it_alter_custom_type';
const ENUM = 'it_mood';

for (const engine of getTestEngines().filter(e => e.name === 'pg')) {
   describe.sequential(`${engine.name} alter table with custom types`, () => {
      const { schema } = engine;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let client: any;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const getColumns = (): Promise<any[]> => client.getTableColumns({ schema, table: TABLE });
      const noChanges = { additions: [] as unknown[], changes: [] as unknown[], deletions: [] as unknown[] };

      beforeAll(async () => {
         client = await engine.connect();
         await client.raw(`DROP TABLE IF EXISTS "${schema}"."${TABLE}"`);
         await client.raw(`DROP TYPE IF EXISTS "${schema}"."${ENUM}"`);
         await client.raw(`CREATE TYPE "${schema}"."${ENUM}" AS ENUM ('sad', 'happy')`);
         await client.raw(`CREATE TABLE "${schema}"."${TABLE}" (id integer PRIMARY KEY, mood "${schema}"."${ENUM}")`);
         await client.raw(`INSERT INTO "${schema}"."${TABLE}" VALUES (1, 'happy')`);
      });

      afterAll(async () => {
         if (client) {
            await client.raw(`DROP TABLE IF EXISTS "${schema}"."${TABLE}"`).catch((): null => null);
            await client.raw(`DROP TYPE IF EXISTS "${schema}"."${ENUM}"`).catch((): null => null);
            await client.destroy();
         }
      });

      // #979: "Cannot read properties of undefined (reading 'length')" for types missing from the catalog
      it('renames a column of a custom type and adds a varchar column', async () => {
         const columns = await getColumns();
         const mood = columns.find(c => c.name === 'mood');
         const feeling = { ...mood, name: 'feeling', orgName: 'mood' };
         const note = { ...mood, name: 'note', orgName: 'note', type: 'CHARACTER VARYING', charLength: 20, nullable: true, default: null as string, comment: null as string };

         await client.alterTable({
            schema,
            table: TABLE,
            additions: [note],
            changes: [feeling],
            deletions: [],
            tableStructure: { name: TABLE, fields: [...columns.filter(c => c.name !== 'mood'), feeling, note], foreigns: [], indexes: [] },
            indexChanges: noChanges,
            foreignChanges: noChanges,
            checkChanges: noChanges,
            options: {}
         });

         expect((await getColumns()).map(c => c.name)).toEqual(['id', 'feeling', 'note']);
         const { rows } = await client.raw(`SELECT feeling::text AS feeling FROM "${schema}"."${TABLE}"`);
         expect(rows[0].feeling).toBe('happy');
      });
   });
}
