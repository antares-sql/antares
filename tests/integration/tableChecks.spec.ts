/**
 * Table CHECK constraints read by getTableChecks.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

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

      beforeAll(async () => {
         client = await engine.connect();
         await dropTables();
         await client.raw(`CREATE TABLE \`${schema}\`.\`${TABLE_A}\` (a INT, CONSTRAINT it_chk CHECK (a > 0))`);
         await client.raw(`CREATE TABLE \`${schema}\`.\`${TABLE_B}\` (b INT, CONSTRAINT ${nameB} CHECK (b < 10))`);
      });

      afterAll(async () => {
         if (client) {
            await dropTables().catch((): null => null);
            await client.destroy();
         }
      });

      it('returns only the checks of the requested table', async () => {
         const checksA = await client.getTableChecks({ schema, table: TABLE_A });
         const checksB = await client.getTableChecks({ schema, table: TABLE_B });

         expect(checksA).toHaveLength(1);
         expect(checksA[0].name).toBe('it_chk');
         expect(checksA[0].clause).toMatch(/`a` > 0/);
         expect(checksB).toHaveLength(1);
         expect(checksB[0].name).toBe(nameB);
         expect(checksB[0].clause).toMatch(/`b` < 10/);
      });
   });
}
