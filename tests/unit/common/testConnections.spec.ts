import { DEBUG_CONNECTION_PREFIX, getDebugConnections } from 'common/libs/testConnections';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { afterEach, describe, expect, it } from 'vitest';

const noSamples = { ANTARES_TEST_SQLITE_DIR: path.join(os.tmpdir(), 'antares-no-samples') };

describe('getDebugConnections', () => {
   it('creates a direct connection per engine and an SSH one only where SSH is supported', () => {
      const uids = getDebugConnections(noSamples).map(c => c.uid);

      expect(uids).toEqual([
         'CDEBUGMYSQL', 'CDEBUGMYSQLSSH',
         'CDEBUGMARIA', 'CDEBUGMARIASSH',
         'CDEBUGPG', 'CDEBUGPGSSH',
         'CDEBUGFIREBIRD'
      ]);
      expect(uids.every(uid => uid.startsWith(DEBUG_CONNECTION_PREFIX))).toBe(true);
   });

   it('uses docker-compose ports and honors env overrides', () => {
      const pg = getDebugConnections({ ...noSamples, ANTARES_TEST_PG_PORT: '6000' }).find(c => c.uid === 'CDEBUGPG');
      const pgSsh = getDebugConnections(noSamples).find(c => c.uid === 'CDEBUGPGSSH');

      expect(pg).toMatchObject({ client: 'pg', host: '127.0.0.1', port: 6000, database: 'antares_test', ssh: false });
      expect(pgSsh).toMatchObject({ host: 'postgres', port: 5432, ssh: true, sshPort: 32222, sshUser: 'antares' });
   });

   describe('SQLite samples', () => {
      let dir: string;

      afterEach(() => {
         if (dir) fs.rmSync(dir, { recursive: true, force: true });
      });

      it('adds a connection per .db file of the samples folder', () => {
         dir = fs.mkdtempSync(path.join(os.tmpdir(), 'antares-samples-'));
         for (const file of ['northwind.db', 'chinook.db', 'notes.md'])
            fs.writeFileSync(path.join(dir, file), '');

         const sqlite = getDebugConnections({ ANTARES_TEST_SQLITE_DIR: dir }).filter(c => c.client === 'sqlite');

         expect(sqlite.map(c => [c.uid, c.name, c.databasePath])).toEqual([
            ['CDEBUGSQLITECHINOOK', 'SQLite chinook', path.join(dir, 'chinook.db')],
            ['CDEBUGSQLITENORTHWIND', 'SQLite northwind', path.join(dir, 'northwind.db')]
         ]);
      });
   });
});
