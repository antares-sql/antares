/**
 * The query builder state must not live on the shared connection instance:
 * every chain gets its own QueryBuilder, so an abandoned chain (e.g. an exception between
 * building and running) can't leak its clauses into the next query.
 */
import { describe, expect, it } from 'vitest';

import { MySQLClient } from '../../../src/main/libs/clients/MySQLClient';
import { QueryBuilder } from '../../../src/main/libs/db/core/QueryBuilder';
import { MySQLDialect } from '../../../src/main/libs/db/engines/mysql/MySQLDialect';
import { captureRaw } from '../helpers/captureSql';

describe('query builder state', () => {
   it('does not leak clauses from an abandoned chain into the next query', async () => {
      const client = new MySQLClient({ client: 'mysql', uid: 'test', params: {} as never });
      const capture = captureRaw(client);

      // Abandoned chain: never run
      client.select('secret_column').from('other_table').where('1 = 0');

      await client.select('id').schema('s').from('products').run();

      expect(capture.sql[0]).toBe('SELECT id FROM `s`.`products`');
   });

   it('interleaved chains are independent', async () => {
      const client = new MySQLClient({ client: 'mysql', uid: 'test', params: {} as never });
      const capture = captureRaw(client);

      const first = client.select('a').from('t1');
      const second = client.select('b').from('t2');
      first.where('x = 1');

      await second.run();
      await first.run();

      expect(capture.sql).toEqual([
         'SELECT b FROM `t2`',
         'SELECT a FROM `t1` WHERE x = 1'
      ]);
   });

   it('renders without a connection', () => {
      const sql = new QueryBuilder(new MySQLDialect()).select('*').from('t').limit(1).toSQL();
      expect(sql.trim()).toBe('SELECT * FROM `t` LIMIT 1');
   });

   it('refuses to run without an executor', () => {
      expect(() => new QueryBuilder(new MySQLDialect()).select('1').run()).toThrow(/no executor/);
   });
});
