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

      // The query tab removes comments and splits the script: string literals must reach the server unchanged
      it('sends string literals unchanged', async () => {
         const client = await engine.connect();
         try {
            const literal = 'a;\n   b /* c */ --d #e';
            const from = engine.name === 'firebird' ? ' FROM RDB$DATABASE' : '';
            const sql = `-- first;\nSELECT 1 AS n${from}; /* second; */ SELECT ${client.dialect.quoteString(literal)} AS v${from};`;
            const results = await client.raw(sql, { nest: true, details: false, comments: false, schema: engine.schema, autocommit: true });

            expect(results).toHaveLength(2);
            const row: Record<string, unknown> = results[1].rows[0];
            expect(Object.values(row)[0]).toBe(literal);
         }
         finally {
            await client.destroy();
         }
      });
   });
}
