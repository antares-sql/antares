/**
 * Characterization of the query builder SQL for every engine.
 * Cases mirror real call sites (ipc-handlers/tables.ts, clients) plus edge cases.
 */
import { describe, expect, it } from 'vitest';

import { FirebirdSQLClient } from '../../../src/main/libs/clients/FirebirdSQLClient';
import { MySQLClient } from '../../../src/main/libs/clients/MySQLClient';
import { PostgreSQLClient } from '../../../src/main/libs/clients/PostgreSQLClient';
import { SQLiteClient } from '../../../src/main/libs/clients/SQLiteClient';
import { captureRaw } from '../helpers/captureSql';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyClient = any;

const engines: [string, () => AnyClient][] = [
   ['mysql', () => new MySQLClient({ client: 'mysql', uid: 'test', params: {} as never })],
   ['pg', () => new PostgreSQLClient({ client: 'pg', uid: 'test', params: {} as never })],
   ['sqlite', () => new SQLiteClient({ client: 'sqlite', uid: 'test', params: {} as never })],
   ['firebird', () => new FirebirdSQLClient({ client: 'firebird', uid: 'test', params: {} as never })]
];

const cases: Record<string, (c: AnyClient) => Promise<unknown>> = {
   // ipc-handlers/tables.ts: get-table-data
   'table data page': c => c.select('*').schema('s').from('t').limit(1000).offset(2000)
      .orderBy({ name: 'DESC' }).where('`id` > 5').run({ details: true, schema: 's' }),
   // ipc-handlers/tables.ts: update-table-cell
   'update cell': c => c.schema('s').update({ name: '= \'foo\'' }).from('t').where({ id: '= 3' }).limit(1).run(),
   // ipc-handlers/tables.ts: delete-table-rows with primary key
   'delete by primary': c => c.schema('s').delete('t').where({ id: 'IN (1,2,3)' }).limit(3).run(),
   // ipc-handlers/tables.ts: delete-table-rows without primary key
   'delete by row': c => c.schema('s').delete('t').where({ a: '= 1', b: 'IS NULL', c: '= null' }).limit(1).run(),
   // ipc-handlers/tables.ts: insert-table-fake-rows
   'insert rows': c => c.schema('s').into('t').insert([{ a: 1, b: '\'x\'' }, { a: 2, b: 'NULL' }]).run(),
   // ipc-handlers/tables.ts: get-foreign-list (select added after the chain)
   'foreign list': c => {
      const query = c.select('"id" AS foreign_column').schema('s').from('t').orderBy('foreign_column ASC');
      query.select('LEFT("name", 20) AS foreign_description');
      return query.run();
   },
   // clients: ping
   ping: c => c.select('1+1').run(),
   'select without schema': c => c.select('a', 'b').from('t').run(),
   'select array args': c => c.select(['a', 'b']).from('t').where(['x = 1', 'y = 2']).run(),
   'group by': c => c.select('a', 'COUNT(*)').schema('s').from('t').groupBy('a').orderBy('a').run(),
   'offset only': c => c.select('*').schema('s').from('t').offset(10).run(),
   'multiple where objects': c => c.select('*').schema('s').from('t').where({ a: '= 1' }, { b: '= 2' }).run(),
   'mixed where': c => c.select('*').schema('s').from('t').where('x > 0', { a: '= 1' }).run(),
   'multiple update objects': c => c.schema('s').update({ a: '= 1' }, { b: '= 2' }).from('t').run(),
   'update without limit': c => c.schema('s').update({ a: '= 1' }).from('t').where({ id: '= 1' }).run()
};

for (const [name, create] of engines) {
   describe(`${name} query builder`, () => {
      for (const [label, run] of Object.entries(cases)) {
         it(label, async () => {
            const client = create();
            const capture = captureRaw(client);
            await run(client);
            expect(capture.queries).toMatchSnapshot();
         });
      }

      it('two chains on the same client do not share state', async () => {
         const client = create();
         const capture = captureRaw(client);

         await client.select('a').from('t1').where('x = 1').run();
         await client.select('b').from('t2').run();

         expect(capture.sql[1]).not.toContain('t1');
         expect(capture.sql[1]).not.toContain('x = 1');
      });
   });
}
