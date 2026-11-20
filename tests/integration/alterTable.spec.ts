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

for (const engine of getTestEngines().filter(e => e.name === 'sqlite')) {
   describe.sequential(`${engine.name} alter table with AUTOINCREMENT`, () => {
      const { schema } = engine;
      const AI_TABLE = 'it_alter_autoincrement';
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let client: any;
      const noChanges = { additions: [] as unknown[], changes: [] as unknown[], deletions: [] as unknown[] };
      const definition = async (): Promise<string> =>
         (await client.raw(`SELECT sql FROM "${schema}".sqlite_master WHERE type = 'table' AND name = '${AI_TABLE}'`)).rows[0].sql;

      beforeAll(async () => {
         client = await engine.connect();
         await client.raw(`DROP TABLE IF EXISTS "${AI_TABLE}"`);
         await client.raw(`CREATE TABLE "${AI_TABLE}" (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT)`);
         await client.raw(`INSERT INTO "${AI_TABLE}" (name) VALUES ('a'), ('b')`);
         await client.raw(`DELETE FROM "${AI_TABLE}" WHERE id = 2`);
      });

      afterAll(async () => {
         if (client) {
            await client.raw(`DROP TABLE IF EXISTS "${AI_TABLE}"`).catch((): null => null);
            await client.destroy();
         }
      });

      // #821: the table was recreated without AUTOINCREMENT, so deleted ids were reused
      it('keeps AUTOINCREMENT when a column is added', async () => {
         const columns = await client.getTableColumns({ schema, table: AI_TABLE });
         expect(columns.find((c: { name: string }) => c.name === 'id').autoIncrement).toBe(true);

         const indexes = [{ _antares_id: '1', name: 'PRIMARY', type: 'PRIMARY', fields: ['id'] }];
         const note = { ...columns[1], name: 'note', orgName: 'note', type: 'TEXT', nullable: true, default: null as string };

         await client.alterTable({
            schema,
            table: AI_TABLE,
            additions: [note],
            changes: [],
            deletions: [],
            tableStructure: { name: AI_TABLE, fields: [...columns, note], foreigns: [], indexes },
            indexChanges: noChanges,
            foreignChanges: noChanges,
            checkChanges: noChanges,
            options: {}
         });

         expect(await definition()).toMatch(/"id"\s+INTEGER\s[^,]*PRIMARY KEY AUTOINCREMENT/i);
         await client.raw(`INSERT INTO "${AI_TABLE}" (name) VALUES ('c')`);
         const { rows } = await client.raw(`SELECT id FROM "${AI_TABLE}" WHERE name = 'c'`);
         expect(Number(rows[0].id)).toBe(3); // Not 2: AUTOINCREMENT never reuses ids
      });
   });
}
