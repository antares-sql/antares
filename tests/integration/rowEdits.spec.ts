/**
 * Editing and deleting result rows through the real IPC handlers, with rows that went to the renderer
 * and came back like the UI sends them (JSON-cloned by unproxify).
 */
import { LONG_TEXT, STRUCTURED_TEXT } from 'common/fieldTypes';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import tables from '../../src/main/ipc-handlers/tables';
import { fakeIpc } from '../helpers/fakeIpc';
import { EngineName, getTestEngines } from './helpers/engines';

const TABLE = 'it_row_edits';

/** Binary key column per engine (Firebird returns binary strings, not bytes) */
const binaryKey: Partial<Record<EngineName, string>> = {
   mysql: 'BINARY(16)',
   maria: 'BINARY(16)',
   pg: 'BYTEA',
   sqlite: 'BLOB'
};

/** Columns with a syntax of their own (name → type) per engine */
const structuredColumns: Record<EngineName, Record<string, string>> = {
   mysql: { j: 'JSON' },
   maria: { j: 'JSON' },
   pg: { j: 'JSON', jb: 'JSONB', x: 'XML' },
   sqlite: { j: 'JSON' },
   firebird: { j: 'BLOB SUB_TYPE TEXT' }
};

const asRendererSendsIt = <T>(value: T): T => JSON.parse(JSON.stringify(value));

for (const engine of getTestEngines().filter(e => binaryKey[e.name])) {
   describe.sequential(`${engine.name} row edits`, () => {
      const { schema } = engine;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let client: any;
      const uid = 'conn';
      const ipc = fakeIpc();
      const q = (id: string) => client.dialect.quoteIdentifier(id);
      const table = () => `${q(schema)}.${q(TABLE)}`;
      const ids = [Buffer.from('00112233445566778899aabbccddeeff', 'hex'), Buffer.from('ffeeddccbbaa99887766554433221100', 'hex')];

      /** Rows as the query tab receives them */
      const readRows = async () => {
         const { rows } = await client.raw(`SELECT ${q('id')}, ${q('label')} FROM ${table()} ORDER BY ${q('label')}`, { nest: true, details: true, schema, autocommit: true });
         return rows as Record<string, unknown>[];
      };
      const labels = async () => (await readRows()).map(row => Object.entries(row).find(([key]) => key.endsWith('label'))[1]);
      const idOf = (row: Record<string, unknown>) => Object.entries(row).find(([key]) => key.endsWith('id'))[1];

      beforeAll(async () => {
         client = await engine.connect();
         tables({ [uid]: client }, ipc.ipc);
         await client.raw(`DROP TABLE ${table()}`).catch((): null => null);
         await client.raw(`CREATE TABLE ${table()} (${q('id')} ${binaryKey[engine.name]} NOT NULL PRIMARY KEY, ${q('label')} VARCHAR(20))`);
         for (const [i, id] of ids.entries())
            await client.raw(`INSERT INTO ${table()} (${q('id')}, ${q('label')}) VALUES (${client.dialect.blobLiteral(id)}, 'row${i}')`);
      });

      afterAll(async () => {
         if (client) {
            await client.raw(`DROP TABLE ${table()}`).catch((): null => null);
            await client.destroy();
         }
      });

      // #1017: binary keys came back as { "0": 0, "1": 17, ... } and ended up in the SQL as [object Object]
      it('updates a cell of a row with a binary primary key', async () => {
         const row = asRendererSendsIt((await readRows())[1]);
         const result = await ipc.invoke('update-table-cell', {
            uid, schema, table: TABLE, primary: 'id', id: idOf(row), field: 'label', type: 'VARCHAR', content: 'edited', row, orgRow: row
         });

         expect(result).toMatchObject({ status: 'success' });
         expect(await labels()).toEqual(['edited', 'row0']);
      });

      it('deletes a row with a binary primary key', async () => {
         const row = asRendererSendsIt((await readRows())[0]);
         const result = await ipc.invoke('delete-table-rows', { uid, schema, table: TABLE, primary: 'id', field: 'id', rows: [row] });

         expect(result).toMatchObject({ status: 'success' });
         expect(await labels()).toEqual(['row0']);
      });
   });
}

// #892: SQLite left column names unquoted in INSERT/UPDATE/WHERE/ORDER BY (near "-": syntax error)
for (const engine of getTestEngines()) {
   describe.sequential(`${engine.name} row edits on names with hyphens`, () => {
      const { schema } = engine;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let client: any;
      const uid = 'conn';
      const ipc = fakeIpc();
      const TABLE = 'it-row-edits-hyphen';
      const q = (id: string) => client.dialect.quoteIdentifier(id);
      const table = () => engine.name === 'firebird' ? q(TABLE) : `${q(schema)}.${q(TABLE)}`;

      const labels = async () => {
         const result = await ipc.invoke('get-table-data', { uid, schema, table: TABLE, limit: 100, page: 1, sortParams: { field: 'row-label', dir: 'desc' } }) as { response: { rows: Record<string, unknown>[] } };
         expect(result).toMatchObject({ status: 'success' });
         return result.response.rows.map((row: Record<string, unknown>) => row['row-label']);
      };

      beforeAll(async () => {
         client = await engine.connect();
         tables({ [uid]: client }, ipc.ipc);
         await client.raw(`DROP TABLE ${table()}`).catch((): null => null);
         await client.raw(`CREATE TABLE ${table()} (${q('row-id')} INTEGER NOT NULL PRIMARY KEY, ${q('row-label')} VARCHAR(20))`);
      });

      afterAll(async () => {
         if (client) {
            await client.raw(`DROP TABLE ${table()}`).catch((): null => null);
            await client.destroy();
         }
      });

      it('inserts rows', async () => {
         for (const [id, label] of [[1, 'a'], [2, 'b']]) {
            const result = await ipc.invoke('insert-table-fake-rows', {
               uid,
               schema,
               table: TABLE,
               repeat: 1,
               fields: { 'row-id': 'INTEGER', 'row-label': 'VARCHAR' },
               row: { 'row-id': { value: id }, 'row-label': { value: label } }
            });
            expect(result).toMatchObject({ status: 'success' });
         }

         expect(await labels()).toEqual(['b', 'a']);
      });

      it('updates a cell by primary key and by row values', async () => {
         const byKey = await ipc.invoke('update-table-cell', {
            uid, schema, table: TABLE, primary: 'row-id', id: 1, field: 'row-label', type: 'VARCHAR', content: 'c', row: {}, orgRow: {}
         });
         expect(byKey).toMatchObject({ status: 'success' });

         const byRow = await ipc.invoke('update-table-cell', {
            uid, schema, table: TABLE, field: 'row-label', type: 'VARCHAR', content: 'd', row: {}, orgRow: { 'row-id': 2, 'row-label': 'b' }
         });
         expect(byRow).toMatchObject({ status: 'success' });

         expect(await labels()).toEqual(['d', 'c']);
      });

      it('deletes rows by primary key and by row values', async () => {
         const byKey = await ipc.invoke('delete-table-rows', { uid, schema, table: TABLE, primary: 'row-id', field: 'row-id', rows: [{ 'row-id': 1 }] });
         expect(byKey).toMatchObject({ status: 'success' });

         const byRow = await ipc.invoke('delete-table-rows', { uid, schema, table: TABLE, rows: [{ 'row-id': 2, 'row-label': 'd' }] });
         expect(byRow).toMatchObject({ status: 'success' });

         expect(await labels()).toEqual([]);
      });

      // JSONB and XML were edited inline as plain strings instead of in the editor modal
      it('edits structured text columns in the editor modal', async () => {
         const docTable = engine.name === 'firebird' ? q(`${TABLE}_docs`) : `${q(schema)}.${q(`${TABLE}_docs`)}`;
         const columns = structuredColumns[engine.name];
         try {
            await client.raw(`DROP TABLE ${docTable}`).catch((): null => null);
            const defs = Object.entries(columns).map(([name, type]) => `${q(name)} ${type}`).join(', ');
            await client.raw(`CREATE TABLE ${docTable} (${q('id')} INTEGER NOT NULL PRIMARY KEY, ${defs})`);
            await client.raw(`INSERT INTO ${docTable} (${q('id')}) VALUES (1)`);

            const read = async () => {
               const result = await client.raw(`SELECT * FROM ${docTable}`, { nest: true, details: true, schema, autocommit: true });
               return result as { rows: Record<string, unknown>[]; fields: { name: string; type: string }[] };
            };

            const { fields } = await read();
            for (const name of Object.keys(columns)) {
               // The type the renderer receives must open the editor modal
               const { type } = fields.find(field => field.name === name);
               expect([...LONG_TEXT, ...STRUCTURED_TEXT], `${name}: ${type}`).toContain(type);

               const content = name === 'x' ? '<a>it\'s</a>' : '{"a": "it\'s", "b": [1, 2]}';
               const result = await ipc.invoke('update-table-cell', {
                  uid, schema, table: `${TABLE}_docs`, primary: 'id', id: 1, field: name, type, content, row: {}, orgRow: {}
               });
               expect(result).toMatchObject({ status: 'success' });
            }

            const [row] = (await read()).rows;
            for (const name of Object.keys(columns)) {
               const value = Object.entries(row).find(([key]) => key.endsWith(name))[1];
               if (name === 'x') expect(value).toBe('<a>it\'s</a>');
               else expect(typeof value === 'string' ? JSON.parse(value) : value).toEqual({ a: 'it\'s', b: [1, 2] });
            }
         }
         finally {
            await client.raw(`DROP TABLE ${docTable}`).catch((): null => null);
         }
      });
   });
}
