/**
 * Documents a latent hazard of the current design: the query builder state lives on the
 * shared connection instance (`this._query`) and is reset only by `run()`.
 * A builder chain that is abandoned (e.g. an exception between building and running)
 * leaks its clauses into the next query on the same connection.
 *
 * Phase 1 of the refactor (stateless QueryBuilder) must flip this test:
 * replace `.toContain` with `.not.toContain`.
 */
import { describe, expect, it } from 'vitest';

import { MySQLClient } from '../../../src/main/libs/clients/MySQLClient';
import { captureRaw } from '../helpers/captureSql';

describe('query builder state (current behavior)', () => {
   it('leaks clauses from an abandoned chain into the next query', async () => {
      const client = new MySQLClient({ client: 'mysql', uid: 'test', params: {} as never });
      const capture = captureRaw(client);

      // Abandoned chain: never run
      client.select('secret_column').from('other_table').where('1 = 0');

      await client.select('id').schema('s').from('products').run();

      expect(capture.sql[0]).toContain('secret_column');
      expect(capture.sql[0]).toContain('1 = 0');
   });
});
