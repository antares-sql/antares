import { describe, expect, it } from 'vitest';

import { FirebirdSQLClient } from '../../../src/main/libs/clients/FirebirdSQLClient';
import { MySQLClient } from '../../../src/main/libs/clients/MySQLClient';
import { PostgreSQLClient } from '../../../src/main/libs/clients/PostgreSQLClient';
import { SQLiteClient } from '../../../src/main/libs/clients/SQLiteClient';
import { buildClientParams } from '../../../src/main/libs/db/core/connectionParams';
import { createClient, getEngine, registeredClientCodes } from '../../../src/main/libs/db/EngineRegistry';

describe('EngineRegistry', () => {
   it.each([
      ['mysql', MySQLClient],
      ['maria', MySQLClient],
      ['pg', PostgreSQLClient],
      ['sqlite', SQLiteClient],
      ['firebird', FirebirdSQLClient]
   ] as const)('creates the %s client', (code, Client) => {
      const client = createClient({ client: code, uid: 'x', params: {} as never });
      expect(client).toBeInstanceOf(Client);
      expect(client._client).toBe(code);
   });

   it('knows which engines can export and import', () => {
      const transfer = registeredClientCodes().map(code => [code, !!getEngine(code).createExporter, !!getEngine(code).createImporter]);
      expect(transfer).toEqual([
         ['mysql', true, true],
         ['maria', true, true],
         ['pg', true, true],
         ['sqlite', true, true],
         ['firebird', true, true]
      ]);
   });

   it('rejects unknown engines', () => {
      expect(() => getEngine('oracle' as never)).toThrow('Unknown database client: oracle');
   });
});

describe('buildClientParams', () => {
   const base = {
      uid: 'c1',
      client: 'mysql' as const,
      host: 'db',
      port: '3306' as unknown as number,
      user: 'u',
      password: 'p',
      ask: false,
      readonly: false,
      singleConnectionMode: false,
      ssl: false,
      untrustedConnection: false,
      ssh: false
   };

   it('maps the connection saved by the UI', () => {
      expect(buildClientParams({ ...base, schema: 'app', database: 'main' })).toEqual({
         host: 'db',
         port: 3306,
         user: 'u',
         password: 'p',
         application_name: 'Antares SQL',
         readonly: false,
         showTableSize: false,
         connectionString: undefined,
         database: 'main',
         schema: 'app',
         databasePath: '',
         ssl: undefined,
         ssh: undefined
      });
   });

   it('passes the per-connection table size option', () => {
      expect(buildClientParams({ ...base, showTableSize: true }).showTableSize).toBe(true);
   });

   it('reads SSL files and SSH keys through the injected reader', () => {
      const read = (path: string) => `content of ${path}`;
      const params = buildClientParams({
         ...base,
         ssl: true,
         key: 'k.pem',
         ca: 'ca.pem',
         untrustedConnection: true,
         ssh: true,
         sshHost: 'bastion',
         sshUser: 'me',
         sshPass: '',
         sshKey: 'id_rsa',
         sshKeepAliveInterval: 30
      }, read);

      expect(params.ssl).toEqual({ key: 'content of k.pem', cert: null, ca: 'content of ca.pem', ciphers: undefined, rejectUnauthorized: false });
      expect(params.ssh).toEqual({
         host: 'bastion', username: 'me', password: '', port: 22, privateKey: 'content of id_rsa', passphrase: undefined, keepaliveInterval: 30000
      });
   });
});
