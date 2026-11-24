/**
 * Firebird indexes created with CREATE [UNIQUE] INDEX (not backed by a constraint):
 * listed by getTableIndexes and created, changed and dropped through alterTable.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { getTestEngines } from './helpers/engines';

const TABLE = 'it_fb_indexes';
const PARENT = 'it_fb_indexes_parent';

for (const engine of getTestEngines().filter(e => e.name === 'firebird')) {
   describe.sequential('firebird plain indexes', () => {
      const { schema } = engine;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let client: any;
      const noChanges = { additions: [] as unknown[], changes: [] as unknown[], deletions: [] as unknown[] };

      const drop = (name: string) => client.raw(`DROP TABLE "${name}"`).catch((): null => null);

      /** { name: { type, columns } } as returned by the client */
      const indexes = async () => {
         const rows: { name: string; column: string; type: string }[] = await client.getTableIndexes({ schema, table: TABLE });
         return rows.reduce((acc, row) => {
            acc[row.name] = acc[row.name] || { type: row.type, columns: [] };
            acc[row.name].columns.push(row.column);
            return acc;
         }, {} as Record<string, { type: string; columns: string[] }>);
      };

      /** Index list in the shape the table props tab sends */
      const tabIndexes = async () => Object.entries(await indexes())
         .filter(([, index]) => index.type !== 'FOREIGN KEY')
         .map(([name, index]) => ({ _antares_id: name, name, type: index.type, fields: index.columns }));

      const alterIndexes = async (indexChanges: Record<string, unknown[]>) => {
         const fields = await client.getTableColumns({ schema, table: TABLE });
         await client.alterTable({
            schema,
            table: TABLE,
            additions: [],
            changes: [],
            deletions: [],
            tableStructure: { name: TABLE, fields, foreigns: [], indexes: await tabIndexes() },
            indexChanges: { ...noChanges, ...indexChanges },
            foreignChanges: noChanges,
            checkChanges: noChanges,
            options: {}
         });
      };

      beforeAll(async () => {
         client = await engine.connect();
         await drop(TABLE);
         await drop(PARENT);
         await client.raw(`CREATE TABLE "${PARENT}" ("id" INTEGER NOT NULL PRIMARY KEY)`);
         await client.raw(`CREATE TABLE "${TABLE}" (
            "id" INTEGER NOT NULL,
            "a" INTEGER,
            "b" INTEGER,
            "parent_id" INTEGER,
            CONSTRAINT "it_fb_pk" PRIMARY KEY ("id"),
            CONSTRAINT "it_fb_uq" UNIQUE ("a", "b"),
            CONSTRAINT "it_fb_fk" FOREIGN KEY ("parent_id") REFERENCES "${PARENT}" ("id")
         )`);
         await client.raw(`CREATE INDEX "it_fb_idx" ON "${TABLE}" ("b", "a")`);
         await client.raw(`CREATE UNIQUE INDEX "it_fb_unique_idx" ON "${TABLE}" ("a", "id")`);
      });

      afterAll(async () => {
         if (client) {
            await drop(TABLE);
            await drop(PARENT);
            await client.destroy();
         }
      });

      it('lists the indexes that are not backed by a constraint', async () => {
         expect(await indexes()).toEqual({
            it_fb_pk: { type: 'PRIMARY', columns: ['id'] },
            it_fb_uq: { type: 'UNIQUE', columns: ['a', 'b'] },
            it_fb_fk: { type: 'FOREIGN KEY', columns: ['parent_id'] },
            it_fb_idx: { type: 'INDEX', columns: ['b', 'a'] },
            it_fb_unique_idx: { type: 'UNIQUE', columns: ['a', 'id'] }
         });
      });

      it('adds a plain index', async () => {
         await alterIndexes({ additions: [{ _antares_id: 'new', name: 'it_fb_new_idx', type: 'INDEX', fields: ['parent_id', 'b'] }] });
         expect((await indexes()).it_fb_new_idx).toEqual({ type: 'INDEX', columns: ['parent_id', 'b'] });
      });

      it('changes a plain index', async () => {
         await alterIndexes({
            changes: [{ _antares_id: 'it_fb_idx', name: 'it_fb_idx2', type: 'INDEX', fields: ['a'], oldName: 'it_fb_idx', oldType: 'INDEX' }]
         });
         const current = await indexes();
         expect(current.it_fb_idx).toBeUndefined();
         expect(current.it_fb_idx2).toEqual({ type: 'INDEX', columns: ['a'] });
      });

      it('drops a plain index and a unique index without constraint', async () => {
         await alterIndexes({
            deletions: [
               { _antares_id: 'it_fb_new_idx', name: 'it_fb_new_idx', type: 'INDEX', fields: ['parent_id', 'b'] },
               { _antares_id: 'it_fb_unique_idx', name: 'it_fb_unique_idx', type: 'UNIQUE', fields: ['a', 'id'] }
            ]
         });
         expect(Object.keys(await indexes()).sort()).toEqual(['it_fb_fk', 'it_fb_idx2', 'it_fb_pk', 'it_fb_uq']);
      });
   });
}
