/**
 * Partial indexes (WHERE clause) as the table props tab sends them: read back, changed, dropped,
 * kept when SQLite rebuilds the table.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { getTestEngines } from './helpers/engines';

const TABLE = 'it_partial_indexes';

for (const engine of getTestEngines().filter(e => e.customizations.partialIndexes)) {
   describe.sequential(`${engine.name} partial indexes`, () => {
      const { schema } = engine;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let client: any;
      const table = engine.name === 'sqlite' ? `"${TABLE}"` : `"${schema}"."${TABLE}"`;
      const noChanges = { additions: [] as unknown[], changes: [] as unknown[], deletions: [] as unknown[] };

      /** Indexes grouped as the table props tab does */
      const readIndexes = async () => {
         const rows: { name: string; column: string; type: string; where?: string }[] = await client.getTableIndexes({ schema, table: TABLE });
         return rows
            .filter(row => row.type !== 'PRIMARY')
            .reduce((acc, row) => {
               const index = acc.find(i => i.name === row.name);
               if (index) index.fields.push(row.column);
               else acc.push({ name: row.name, type: row.type, fields: [row.column], ...(row.where ? { where: row.where } : {}) });
               return acc;
            }, [] as { name: string; type: string; fields: string[]; where?: string }[]);
      };

      const alterIndexes = async (indexChanges: Record<string, unknown[]>, additions: unknown[] = []) => {
         const fields = await client.getTableColumns({ schema, table: TABLE });
         const indexes = await readIndexes();
         await client.alterTable({
            schema,
            table: TABLE,
            additions,
            changes: [],
            deletions: [],
            tableStructure: {
               name: TABLE,
               fields: [...fields, ...additions],
               foreigns: [],
               indexes: [ // What the tab shows after the changes
                  { name: 'PRIMARY', type: 'PRIMARY', fields: ['id'] },
                  ...indexes
                     .filter(i => ![...(indexChanges.deletions ?? []), ...(indexChanges.changes ?? [])].some((d: { name: string }) => d.name === i.name)),
                  ...(indexChanges.changes ?? []),
                  ...(indexChanges.additions ?? [])
               ]
            },
            indexChanges: { ...noChanges, ...indexChanges },
            foreignChanges: noChanges,
            checkChanges: noChanges,
            options: {}
         });
      };

      beforeAll(async () => {
         client = await engine.connect();
         await client.raw(`DROP TABLE IF EXISTS ${table}`);
         await client.raw(`CREATE TABLE ${table} (id INTEGER NOT NULL PRIMARY KEY, email VARCHAR(100), deleted INTEGER)`);
      });

      afterAll(async () => {
         if (client) {
            await client.raw(`DROP TABLE IF EXISTS ${table}`).catch((): null => null);
            await client.destroy();
         }
      });

      it('adds a partial unique index and reads its condition back', async () => {
         await alterIndexes({ additions: [{ name: 'email_uq', type: 'UNIQUE', fields: ['email'], where: 'deleted = 0' }] });

         const [index] = await readIndexes();
         expect(index).toMatchObject({ name: 'email_uq', type: 'UNIQUE', fields: ['email'] });
         expect(index.where).toMatch(/deleted = 0/);

         // Unique only among the rows matching the condition
         await client.raw(`INSERT INTO ${table} (id, email, deleted) VALUES (1, 'a@b.c', 1), (2, 'a@b.c', 1), (3, 'a@b.c', 0)`);
         await expect(client.raw(`INSERT INTO ${table} (id, email, deleted) VALUES (4, 'a@b.c', 0)`)).rejects.toThrow();
      });

      it('keeps the condition when the table is altered', async () => {
         await alterIndexes({}, [{ name: 'note', type: engine.types.varchar, charLength: 20, nullable: true, default: null, numScale: null, order: 4 }]);

         const [index] = await readIndexes();
         expect(index.where).toMatch(/deleted = 0/);
      });

      it('turns the partial index into a full unique index with the same name', async () => {
         await client.raw(`DELETE FROM ${table} WHERE id <> 3`);
         const [index] = await readIndexes();
         await alterIndexes({ changes: [{ ...index, where: undefined, oldName: index.name, oldType: index.type, oldWhere: index.where }] });

         expect(await readIndexes()).toEqual([{ name: 'email_uq', type: 'UNIQUE', fields: ['email'] }]);
      });

      it('turns a unique index into a partial one with the same name', async () => {
         const [index] = await readIndexes();
         await alterIndexes({ changes: [{ ...index, where: 'deleted = 0', oldName: index.name, oldType: index.type }] });

         const [changed] = await readIndexes();
         expect(changed.where).toMatch(/deleted = 0/);
      });

      it('drops a partial index', async () => {
         const [index] = await readIndexes();
         await alterIndexes({ deletions: [index] });

         expect(await readIndexes()).toEqual([]);
      });
   });
}
