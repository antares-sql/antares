/**
 * Table CHECK constraints: read by getTableChecks, edited by alterTable as the table props tab sends them.
 */
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { getTestEngines } from './helpers/engines';

const TABLE_A = 'it_checks_a';
const TABLE_B = 'it_checks_b';

for (const engine of getTestEngines().filter(e => e.name === 'mysql' || e.name === 'maria')) {
   describe.sequential(`${engine.name} table checks`, () => {
      const { schema } = engine;
      // MySQL check names are unique in the schema, MariaDB ones only in the table
      const nameB = engine.name === 'maria' ? 'it_chk' : 'it_chk_b';
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let client: any;

      const dropTables = () => client.raw(`DROP TABLE IF EXISTS \`${schema}\`.\`${TABLE_A}\`, \`${schema}\`.\`${TABLE_B}\``);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const getChecks = (table = TABLE_A): Promise<any[]> => client.getTableChecks({ schema, table });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const getColumns = (): Promise<any[]> => client.getTableColumns({ schema, table: TABLE_A });
      const noChanges = { additions: [] as unknown[], changes: [] as unknown[], deletions: [] as unknown[] };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const alter = async ({ additions = [], changes = [], fields, checkChanges }: { additions?: any[]; changes?: any[]; fields?: any[]; checkChanges: any }) => {
         const columns = await getColumns();
         await client.alterTable({
            schema,
            table: TABLE_A,
            additions,
            changes,
            deletions: [],
            tableStructure: { name: TABLE_A, fields: fields || columns, foreigns: [], indexes: [] },
            indexChanges: noChanges,
            foreignChanges: noChanges,
            checkChanges: { ...noChanges, ...checkChanges },
            options: {}
         });
      };

      beforeAll(async () => {
         client = await engine.connect();
      });

      beforeEach(async () => {
         await dropTables();
         await client.raw(`CREATE TABLE \`${schema}\`.\`${TABLE_A}\` (a INT, j JSON, CONSTRAINT it_chk CHECK (a > 0))`);
         await client.raw(`CREATE TABLE \`${schema}\`.\`${TABLE_B}\` (b INT, CONSTRAINT ${nameB} CHECK (b < 10))`);
      });

      afterAll(async () => {
         if (client) {
            await dropTables().catch((): null => null);
            await client.destroy();
         }
      });

      it('returns only the table-level checks of the requested table', async () => {
         const checksA = await getChecks();
         const checksB = await getChecks(TABLE_B);

         // MariaDB JSON columns have a column-level json_valid() check: not a table check
         expect(checksA).toHaveLength(1);
         expect(checksA[0].name).toBe('it_chk');
         expect(checksA[0].clause).toMatch(/`a` > 0/);
         expect(checksB).toHaveLength(1);
         expect(checksB[0].name).toBe(nameB);
         expect(checksB[0].clause).toMatch(/`b` < 10/);
      });

      it('renames a check and changes its clause', async () => {
         await alter({ checkChanges: { changes: [{ name: 'it_chk_renamed', clause: 'a > 5', oldName: 'it_chk' }] } });

         const checks = await getChecks();
         expect(checks.map(c => c.name)).toEqual(['it_chk_renamed']);
         expect(checks[0].clause).toMatch(/`a` > 5/);
      });

      it('changes a check to use a renamed and an added column', async () => {
         const columns = await getColumns();
         const a = columns.find(c => c.name === 'a');
         const renamed = { ...a, name: 'x', orgName: 'a' };
         const added = { ...a, name: 'y', orgName: 'y' };

         await alter({
            additions: [added],
            changes: [renamed],
            fields: [renamed, ...columns.filter(c => c.name !== 'a'), added],
            checkChanges: { changes: [{ name: 'it_chk', clause: 'x > y', oldName: 'it_chk' }] }
         });

         const checks = await getChecks();
         expect(checks).toHaveLength(1);
         expect(checks[0].clause).toMatch(/`x` > `y`/);
      });

      it('drops a check whose clause was emptied', async () => {
         await alter({ checkChanges: { changes: [{ name: 'it_chk', clause: ' ', oldName: 'it_chk' }] } });

         expect(await getChecks()).toEqual([]);
      });

      it('adds and deletes checks', async () => {
         await alter({
            checkChanges: {
               additions: [{ name: 'it_chk_new', clause: 'a < 100' }],
               deletions: [{ name: 'it_chk', clause: 'a > 0' }]
            }
         });

         expect((await getChecks()).map(c => c.name)).toEqual(['it_chk_new']);
      });
   });
}
