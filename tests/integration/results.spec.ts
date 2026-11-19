/**
 * Query results as the query tab receives them (nest + details).
 */
import { describe, expect, it } from 'vitest';

import { getTestEngines } from './helpers/engines';

interface Field { name: string; alias: string; table: string }

for (const engine of getTestEngines()) {
   describe(`${engine.name} query results`, () => {
      // #634, #975: columns with the same name were hidden or showed the values of another column
      it('keeps every column when names are duplicated', async () => {
         const client = await engine.connect();
         try {
            const from = engine.name === 'firebird' ? ' FROM RDB$DATABASE' : '';
            const result = await client.raw(`SELECT 1 AS a, 2 AS a, 3 AS b${from}`, { nest: true, details: true, comments: false, schema: engine.schema, autocommit: true });
            const { fields, rows } = Array.isArray(result) ? result[0] : result;
            const row: Record<string, unknown> = rows[0];

            // The value of each column, found with the keys the result table uses (alias, table.alias)
            const values = (fields as Field[]).map(field => {
               const key = [field.alias, `${field.table ?? ''}.${field.alias}`].find(k => k in row);
               return Number(row[key]);
            });

            expect(fields).toHaveLength(3);
            expect(Object.keys(row)).toHaveLength(3);
            expect(values).toEqual([1, 2, 3]);
         }
         finally {
            await client.destroy();
         }
      });

   });
}
