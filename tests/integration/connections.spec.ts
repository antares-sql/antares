/**
 * Connection management: pool/single connection, error recovery, query tabs with autocommit off,
 * query cancellation and SSH tunnels.
 */
import { execSync } from 'child_process';
import * as path from 'path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { hasCapability } from '../../src/main/libs/db/core/contracts';
import { getTestEngines } from './helpers/engines';

const TABLE = 'it_tx';
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

for (const engine of getTestEngines()) {
   const { schema } = engine;

   describe.sequential(`${engine.name} connections`, () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let client: any;
      const q = (id: string) => client.dialect.quoteIdentifier(id);
      const table = () => engine.name === 'firebird' ? q(TABLE) : `${q(schema)}.${q(TABLE)}`;
      const count = async () => {
         const { rows } = await client.raw(`SELECT COUNT(*) AS n FROM ${table()}`);
         return Number(rows[0].n ?? rows[0].N);
      };
      const tab = (tabUid: string) => ({ autocommit: false, tabUid, schema });

      beforeAll(async () => {
         client = await engine.connect();
         await client.raw(`DROP TABLE ${table()}`).catch((): null => null);
         await client.raw(`CREATE TABLE ${table()} (${q('id')} INTEGER)`);
      });

      afterAll(async () => {
         if (!client) return;
         await client.raw(`DROP TABLE ${table()}`).catch((): null => null);
         await client.destroy();
      });

      it('keeps working after a failed query', async () => {
         await expect(client.raw('SELECT * FROM it_not_existing_table')).rejects.toThrow();
         await expect(client.raw(`SELECT COUNT(*) AS n FROM ${table()}`)).resolves.toBeDefined();
      });

      it('runs many queries concurrently on the pool', async () => {
         const results = await Promise.all(Array.from({ length: 20 }, () => count()));
         expect(results.every(n => n === 0)).toBe(true);
      });

      it('rolls back a tab transaction', async () => {
         await client.raw(`INSERT INTO ${table()} (${q('id')}) VALUES (1)`, tab('t1'));
         expect(await count()).toBe(0); // not visible outside the transaction

         await client.rollbackTab('t1');
         expect(await count()).toBe(0);
      });

      it('commits a tab transaction', async () => {
         await client.raw(`INSERT INTO ${table()} (${q('id')}) VALUES (2)`, tab('t2'));
         await client.raw(`INSERT INTO ${table()} (${q('id')}) VALUES (3)`, tab('t2'));
         expect(await count()).toBe(0);

         await client.commitTab('t2');
         expect(await count()).toBe(2);
         client.destroyConnectionToCommit('t2');
      });

      it('keeps tab transactions independent', async () => {
         await client.raw(`INSERT INTO ${table()} (${q('id')}) VALUES (4)`, tab('a'));
         // A second tab only reads: concurrent writers would just wait on locks (SQLite allows one writer)
         const { rows } = await client.raw(`SELECT COUNT(*) AS n FROM ${table()}`, tab('b'));
         expect(Number(rows[0].n ?? rows[0].N)).toBe(2);
         await client.rollbackTab('b');
         await client.commitTab('a');
         client.destroyConnectionToCommit('a');
         client.destroyConnectionToCommit('b');
         expect(await count()).toBe(3);
      });

      it('cancels a running tab query', async ({ skip }) => {
         if (!hasCapability(client, 'cancelQueries')) skip();
         const sleep = engine.name === 'pg' ? 'SELECT pg_sleep(20)' : 'SELECT SLEEP(20)';
         const started = Date.now();
         const running = client.raw(sleep, { autocommit: true, tabUid: 'slow' }).catch((err: Error) => err);

         await delay(500);
         await client.killTabQuery('slow');
         await running;

         expect(Date.now() - started).toBeLessThan(10_000);
         // The connection is still usable afterwards
         expect(await count()).toBe(3);
      });

      it('supports single connection mode', async () => {
         const one = engine.name === 'firebird' ? 'SELECT 1 AS x FROM RDB$DATABASE' : 'SELECT 1 AS x';
         const single = await engine.connect({ poolSize: 0 });
         try {
            for (let i = 0; i < 3; i++)
               await expect(single.raw(one)).resolves.toBeDefined();
            await expect(single.raw('SELECT * FROM it_not_existing_table')).rejects.toThrow();
            await expect(single.raw(one)).resolves.toBeDefined();
         }
         finally {
            await single.destroy();
         }
      });
   });
}

// SSH tunnels: databases are reached through the `ssh` service of docker/docker-compose.yml
const compose = `docker compose -f "${path.join(__dirname, '../../docker/docker-compose.yml')}"`;
const sshSessions = () => Number(execSync(`${compose} exec -T ssh sh -c "netstat -tn | grep ':2222 ' | grep -c ESTABLISHED || true"`).toString().trim());

const sshTargets = getTestEngines()
   .filter(e => e.customizations.sshConnection)
   .map(e => ({ engine: e, remote: { mysql: ['mysql', 3306], maria: ['mariadb', 3306], pg: ['postgres', 5432] }[e.name as 'mysql'] }));

describe.skipIf(sshTargets.length === 0)('SSH tunnels', () => {
   for (const { engine, remote } of sshTargets) {
      it(`${engine.name} through an SSH tunnel opens one SSH session and closes it on destroy`, async () => {
         const ssh = { host: '127.0.0.1', port: 32222, username: 'antares', password: 'antares' };
         const before = sshSessions();
         const client = await engine.connect({ overrides: { host: remote[0], port: remote[1], ssh } });

         try {
            await client.raw('SELECT 1 AS x');
            // A query tab with autocommit off opens its own DB connection
            await client.raw('SELECT 1 AS x', { autocommit: false, tabUid: 'ssh-tab' });
            await client.rollbackTab('ssh-tab');
            client.destroyConnectionToCommit('ssh-tab');

            expect(sshSessions() - before).toBe(1);
         }
         finally {
            await client.destroy();
         }

         await delay(500);
         expect(sshSessions()).toBe(before);
      });
   }
});
