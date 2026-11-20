/**
 * Users management builders are pure: they turn what the users modal sends into SQL.
 */
import * as antares from 'common/interfaces/antares';
import { describe, expect, it } from 'vitest';

import { changedAttributes, listDiff, maskSecrets, scopeDiff } from '../../../src/main/libs/db/core/users';
import { FirebirdUsers } from '../../../src/main/libs/db/engines/firebird/FirebirdUsers';
import { MariaDBDialect } from '../../../src/main/libs/db/engines/mysql/MySQLDialect';
import { MySQLUsers } from '../../../src/main/libs/db/engines/mysql/MySQLUsers';
import { PostgreSQLUsers } from '../../../src/main/libs/db/engines/postgresql/PostgreSQLUsers';

const details = (user: Partial<antares.UserDetails>): antares.UserDetails => ({
   name: 'john',
   attributes: {},
   globalPrivileges: [],
   privileges: {},
   roles: [],
   ...user
});

describe('users helpers', () => {
   it('diffs lists and scopes', () => {
      expect(listDiff(['A', 'B'], ['B', 'C'])).toEqual({ added: ['C'], removed: ['A'] });
      expect(scopeDiff({ db1: ['SELECT'], db2: ['INSERT'] }, { db1: ['SELECT'], db3: ['UPDATE'] })).toEqual([
         { object: 'db2', added: [], removed: ['INSERT'] },
         { object: 'db3', added: ['UPDATE'], removed: [] }
      ]);
   });

   it('returns only changed attributes', () => {
      const original = details({ attributes: { a: 1, b: true, c: null } });
      expect(changedAttributes(details({ attributes: { a: 1, b: false, c: null } }), original)).toEqual({ b: false });
      expect(changedAttributes(original)).toEqual({ a: 1, b: true, c: null });
   });

   it('masks passwords', () => {
      expect(maskSecrets('CREATE USER x IDENTIFIED BY \'p;w\'', ['\'p;w\''])).toBe('CREATE USER x IDENTIFIED BY \'********\'');
   });
});

describe('MySQL users', () => {
   const users = new MySQLUsers();
   const original = details({
      host: '%',
      attributes: { accountLocked: false, maxQueriesPerHour: 0, maxUserConnections: 0, plugin: 'caching_sha2_password' },
      globalPrivileges: ['SELECT', 'PROCESS'],
      privileges: { database: { shop: ['SELECT', 'INSERT'], old: ['SELECT'] } }
   });

   it('reads privileges from grant table columns', () => {
      expect(users.privilegesFromColumns(['Host', 'User', 'Select_priv', 'Grant_priv', 'Unknown_priv', 'Show_db_priv'])).toEqual(['SELECT', 'GRANT OPTION', 'SHOW DATABASES']);
      expect(users.privilegesOfRow({ User: 'x', Select_priv: 'Y', Insert_priv: 'N', Grant_priv: 'Y' })).toEqual(['SELECT', 'GRANT OPTION']);
      expect(users.attributesOfRow({ account_locked: 'Y', plugin: 'mysql_native_password', max_questions: '5', max_user_connections: 0 }))
         .toEqual({ accountLocked: true, plugin: 'mysql_native_password', maxQueriesPerHour: 5, maxUserConnections: 0 });
      expect(users.attributesOfRow({ max_updates: 1 }, true)).toEqual({ accountLocked: true, maxUpdatesPerHour: 1 });
   });

   it('creates users', () => {
      expect(users.createUser({
         user: details({ host: 'localhost', attributes: { accountLocked: true, maxQueriesPerHour: 10, maxUserConnections: 2 }, globalPrivileges: ['PROCESS', 'GRANT OPTION'], privileges: { database: { 'my`db': ['SELECT'] } } }),
         password: 'it\'s'
      })).toMatchSnapshot();
      expect(users.createUser({ user: details({ host: '' }) })).toEqual(['CREATE USER \'john\'@\'%\'']);
   });

   it('alters only what changed', () => {
      const user = details({
         ...original,
         name: 'jane',
         attributes: { ...original.attributes, accountLocked: true, maxUserConnections: 3 },
         globalPrivileges: ['SELECT', 'GRANT OPTION'],
         privileges: { database: { shop: ['SELECT', 'UPDATE'], new: ['ALL PRIVILEGES'] } }
      });

      expect(users.alterUser({ original, user, password: 'secret' })).toMatchSnapshot();
      expect(users.alterUser({ original, user: original })).toEqual([]);
   });

   it('changes passwords with SET PASSWORD on MariaDB', () => {
      expect(new MySQLUsers(new MariaDBDialect(), true).alterUser({ original, user: original, password: 'x' }))
         .toEqual(['SET PASSWORD FOR \'john\'@\'%\' = PASSWORD(\'x\')']);
   });

   it('drops users', () => {
      expect(users.dropUser({ name: 'john', host: 'localhost' })).toEqual(['DROP USER \'john\'@\'localhost\'']);
   });
});

describe('PostgreSQL users', () => {
   const users = new PostgreSQLUsers();
   const original = details({
      attributes: { canLogin: true, superuser: false, createDb: false, connectionLimit: -1, validUntil: null },
      privileges: { database: { shop: ['CONNECT'] }, schema: { public: ['USAGE', 'CREATE'] } },
      roles: ['pg_monitor']
   });

   it('reads pg_roles rows', () => {
      expect(users.attributesOfRow({ rolcanlogin: true, rolsuper: false, rolconnlimit: 5, valid_until: '2030-01-01 00:00:00' }))
         .toEqual({ canLogin: true, superuser: false, connectionLimit: 5, validUntil: '2030-01-01 00:00:00' });
   });

   it('creates roles', () => {
      expect(users.createUser({ user: original, password: 'p\'w' })).toMatchSnapshot();
   });

   it('alters only what changed', () => {
      const user = details({
         ...original,
         name: 'Jane "J"',
         attributes: { ...original.attributes, canLogin: false, connectionLimit: 2, validUntil: '2030-01-01' },
         privileges: { database: { shop: ['CONNECT', 'TEMPORARY'] }, schema: {} },
         roles: ['pg_read_all_data']
      });

      expect(users.alterUser({ original, user, password: 'x' })).toMatchSnapshot();
      expect(users.alterUser({ original, user: original })).toEqual([]);
   });

   it('revokes managed privileges before dropping', () => {
      expect(users.dropUser(original)).toEqual([
         'REVOKE ALL ON DATABASE "shop" FROM "john"',
         'REVOKE ALL ON SCHEMA "public" FROM "john"',
         'DROP ROLE "john"'
      ]);
   });
});

describe('Firebird users', () => {
   const users = new FirebirdUsers();
   const original = details({
      name: 'JOHN',
      plugin: 'Srp',
      attributes: { firstName: 'John', middleName: null, lastName: null, active: true, admin: false },
      roles: ['READER']
   });

   it('keeps the case of user names', () => {
      expect(users.userName('john', true)).toBe('john');
      expect(users.userName('JOHN')).toBe('JOHN');
      expect(users.userName('john')).toBe('"john"');
      expect(users.userName('mr john', true)).toBe('"mr john"');
   });

   it('reads SEC$USERS rows', () => {
      expect(users.attributesOfRow({ SEC$FIRST_NAME: 'John   ', SEC$MIDDLE_NAME: null, SEC$LAST_NAME: '', SEC$ACTIVE: true, SEC$ADMIN: false }))
         .toEqual({ firstName: 'John', middleName: null, lastName: null, active: true, admin: false });
   });

   it('creates users', () => {
      expect(users.createUser({ user: details({ name: 'jane', attributes: { firstName: 'Jane', active: true, admin: false }, roles: ['READER'] }), password: 'pw' }))
         .toEqual([
            'CREATE USER jane PASSWORD \'pw\' FIRSTNAME \'Jane\' ACTIVE',
            'GRANT "READER" TO USER jane'
         ]);
   });

   it('alters only what changed', () => {
      const user = details({ ...original, attributes: { ...original.attributes, lastName: 'O\'Brien', active: false, admin: true }, roles: [] });

      expect(users.alterUser({ original, user, password: 'x' })).toEqual([
         'ALTER USER JOHN SET PASSWORD \'x\' LASTNAME \'O\'\'Brien\' INACTIVE GRANT ADMIN ROLE USING PLUGIN Srp',
         'REVOKE "READER" FROM USER JOHN'
      ]);
      expect(users.alterUser({ original, user: original })).toEqual([]);
   });

   it('revokes roles before dropping', () => {
      expect(users.dropUser(original)).toEqual(['REVOKE "READER" FROM USER JOHN', 'DROP USER JOHN USING PLUGIN Srp']);
   });
});
