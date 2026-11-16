import { DEBUG_CONNECTION_PREFIX, getDebugConnections } from 'common/libs/testConnections';
import { describe, expect, it } from 'vitest';

describe('getDebugConnections', () => {
   it('creates a direct connection per engine and an SSH one only where SSH is supported', () => {
      const uids = getDebugConnections({}).map(c => c.uid);

      expect(uids).toEqual([
         'CDEBUGMYSQL', 'CDEBUGMYSQLSSH',
         'CDEBUGMARIA', 'CDEBUGMARIASSH',
         'CDEBUGPG', 'CDEBUGPGSSH',
         'CDEBUGFIREBIRD'
      ]);
      expect(uids.every(uid => uid.startsWith(DEBUG_CONNECTION_PREFIX))).toBe(true);
   });

   it('uses docker-compose ports and honors env overrides', () => {
      const pg = getDebugConnections({ ANTARES_TEST_PG_PORT: '6000' }).find(c => c.uid === 'CDEBUGPG');
      const pgSsh = getDebugConnections({}).find(c => c.uid === 'CDEBUGPGSSH');

      expect(pg).toMatchObject({ client: 'pg', host: '127.0.0.1', port: 6000, database: 'antares_test', ssh: false });
      expect(pgSsh).toMatchObject({ host: 'postgres', port: 5432, ssh: true, sshPort: 32222, sshUser: 'antares' });
   });
});
