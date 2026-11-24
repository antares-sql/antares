/**
 * getTableIndexes must return the columns of a composite index in key order, not in table order (#1015).
 * The indexes modal shows that position next to each field.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { getTestEngines } from './helpers/engines';

const TABLE = 'it_index_order';

for (const engine of getTestEngines()) {
   describe.sequential(`${engine.name} index column order`, () => {
      const { schema } = engine;
      const isMy = engine.name === 'mysql' || engine.name === 'maria';
      const q = (name: string) => isMy ? `\`${name}\`` : `"${name}"`;
      const table = engine.name === 'firebird' ? q(TABLE) : `${q(schema)}.${q(TABLE)}`;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let client: any;

      const dropTable = () => engine.name === 'firebird'
         ? client.raw(`DROP TABLE ${table}`).catch((): null => null)
         : client.raw(`DROP TABLE IF EXISTS ${table}`);

      /** Columns of each index, in the order returned by the client */
      const indexColumns = async () => {
         const rows: { name: string; column: string; type: string }[] = await client.getTableIndexes({ schema, table: TABLE });
         return rows.reduce((acc, row) => {
            acc[row.name] = acc[row.name] || { type: row.type, columns: [] };
            acc[row.name].columns.push(row.column);
            return acc;
         }, {} as Record<string, { type: string; columns: string[] }>);
      };

      beforeAll(async () => {
         client = await engine.connect();
         await dropTable();
         // Key order differs from table order (a, b, c) in both keys
         await client.raw(`CREATE TABLE ${table} (
            ${q('a')} INTEGER NOT NULL,
            ${q('b')} INTEGER NOT NULL,
            ${q('c')} INTEGER NOT NULL,
            CONSTRAINT ${q('it_index_order_pk')} PRIMARY KEY (${q('b')}, ${q('a')}),
            CONSTRAINT ${q('it_index_order_uq')} UNIQUE (${q('c')}, ${q('a')})
         )`);
      });

      afterAll(async () => {
         if (client) {
            await dropTable();
            await client.destroy();
         }
      });

      it('returns the primary key columns in key order', async () => {
         const primary = Object.values(await indexColumns()).find(index => index.type === 'PRIMARY');
         expect(primary?.columns).toEqual(['b', 'a']);
      });

      it('returns the unique key columns in key order', async () => {
         const unique = Object.values(await indexColumns()).filter(index => index.columns.includes('c'));
         expect(unique.map(index => index.columns)).toEqual([['c', 'a']]);
      });
   });
}
