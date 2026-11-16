/**
 * Round-trip of values written the same way ipc-handlers/tables.ts does
 * ("update table cell", "delete table rows"), through formatValue() and the engine dialect.
 */
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { formatValue } from '../../src/main/libs/db/core/formatValue';
import { EngineName, getTestEngines } from './helpers/engines';

const TABLE = 'it_values';

/** Column types per engine: [DDL, type name sent by the UI] */
const columns: Record<EngineName, Record<'txt' | 'bin' | 'flag' | 'doc', [string, string] | null>> = {
   mysql: { txt: ['TEXT', 'TEXT'], bin: ['BLOB', 'BLOB'], flag: null, doc: ['JSON', 'JSON'] },
   maria: { txt: ['TEXT', 'TEXT'], bin: ['BLOB', 'BLOB'], flag: null, doc: ['JSON', 'JSON'] },
   pg: { txt: ['TEXT', 'TEXT'], bin: ['BYTEA', 'BYTEA'], flag: ['BOOLEAN', 'BOOLEAN'], doc: ['JSON', 'JSON'] },
   sqlite: { txt: ['TEXT', 'TEXT'], bin: ['BLOB', 'BLOB'], flag: ['BOOLEAN', 'BOOLEAN'], doc: ['TEXT', 'TEXT'] },
   firebird: { txt: ['VARCHAR(200)', 'VARCHAR'], bin: ['BLOB SUB_TYPE BINARY', 'BLOB'], flag: ['BOOLEAN', 'BOOLEAN'], doc: null }
};

const tricky = 'it\'s "quoted" \\ back\\slash 50% _ünïcødé_\nnew line';
const bytes = Buffer.from([0, 1, 127, 128, 255, 104, 105]);

for (const engine of getTestEngines()) {
   describe.sequential(`${engine.name} values round-trip`, () => {
      const cols = columns[engine.name];
      const { schema } = engine;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let client: any;
      const blobFile = path.join(os.tmpdir(), `antares-it-blob-${engine.name}-${process.pid}.bin`);
      const q = (id: string) => client.dialect.quoteIdentifier(id);
      const table = () => engine.name === 'firebird' ? q(TABLE) : `${q(schema)}.${q(TABLE)}`;

      const write = (column: string, type: string, value: unknown) => {
         const { sql } = formatValue(client.dialect, type, value, { readFile: fs.readFileSync });
         return client.update({ [column]: `= ${sql}` }).schema(schema).from(TABLE).where({ id: '= 1' }).limit(1).run();
      };
      const read = async (column: string) => {
         const { rows } = await client.raw(`SELECT ${q(column)} FROM ${table()} WHERE ${q('id')} = 1`);
         const row = rows[0];
         return column in row ? row[column] : row[column.toUpperCase()];
      };

      beforeAll(async () => {
         client = await engine.connect();
         fs.writeFileSync(blobFile, bytes);
         await client.raw(`DROP TABLE ${table()}`).catch((): null => null);

         const defs = Object.entries(cols).filter(([, c]) => c).map(([name, c]) => `${q(name)} ${c[0]}`);
         await client.raw(`CREATE TABLE ${table()} (${q('id')} INTEGER NOT NULL PRIMARY KEY, ${defs.join(', ')})`);
         await client.schema(schema).into(TABLE).insert([{ id: 1 }]).run();
      });

      afterAll(async () => {
         if (client) {
            await client.raw(`DROP TABLE ${table()}`).catch((): null => null);
            await client.destroy();
         }
         fs.rmSync(blobFile, { force: true });
      });

      it('stores text with quotes, backslashes and unicode verbatim', async () => {
         await write('txt', cols.txt[1], tricky);
         expect(await read('txt')).toBe(tricky);
      });

      it('stores NULL', async () => {
         await write('txt', cols.txt[1], null);
         expect(await read('txt')).toBeNull();
      });

      it('stores binary data from a file', async () => {
         await write('bin', cols.bin[1], blobFile);
         const value = await read('bin');
         const buffer = Buffer.isBuffer(value) ? value : Buffer.from(value, 'binary');
         expect(buffer.toString('hex')).toBe(bytes.toString('hex'));
      });

      it('stores an empty blob', async () => {
         await write('bin', cols.bin[1], '');
         const value = await read('bin');
         expect(value === null ? null : (Buffer.isBuffer(value) ? value : Buffer.from(value, 'binary')).length).toBe(0);
      });

      it('stores booleans', async ({ skip }) => {
         if (!cols.flag) skip();
         await write('flag', cols.flag[1], 'true');
         expect([true, 1]).toContain(await read('flag'));
         await write('flag', cols.flag[1], 'false');
         expect([false, 0]).toContain(await read('flag'));
      });

      it('finds rows by string id with quotes (delete/update by primary)', async () => {
         await write('txt', cols.txt[1], 'needle');
         const where = `= ${client.dialect.quoteString(tricky)}`;
         // No row has this value: the statement must be valid and affect nothing
         await client.update({ txt: '= \'x\'' }).schema(schema).from(TABLE).where({ txt: where }).limit(1).run();
         expect(await read('txt')).toBe('needle');
      });

      it('matches JSON values in WHERE (update without primary key)', async ({ skip }) => {
         if (!cols.doc) skip();
         const doc = { name: 'it\'s', tags: ['a', 'b'], n: 1 };
         await write('doc', cols.doc[1], JSON.stringify(doc));
         await client.update({ txt: '= \'json-hit\'' }).schema(schema).from(TABLE).where({ doc: client.dialect.jsonEquals(doc).trim() }).limit(1).run();
         expect(await read('txt')).toBe('json-hit');
      });
   });
}
