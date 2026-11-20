/**
 * Users management: what the users modal does, against the real servers.
 */
import * as antares from 'common/interfaces/antares';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { getTestEngines } from './helpers/engines';

const PASSWORD = 'It_Secret;\'1';

for (const engine of getTestEngines().filter(e => e.customizations.usersManagement)) {
   describe.sequential(`${engine.name} users management`, () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let client: any;
      let info: antares.UsersManagementInfo;
      const hasHost = engine.name === 'mysql' || engine.name === 'maria';
      const name = engine.name === 'firebird' ? 'IT_USER' : 'it_user';
      const renamed = engine.name === 'firebird' ? name : 'it_user_renamed';
      const identity = (n: string): antares.UserIdentity => hasHost ? { name: n, host: '%' } : { name: n };

      const dropIfExists = async (n: string) => {
         const users: antares.UserAccount[] = await client.getUsersList();
         const user = users.find(u => u.name === n);
         if (user) await client.dropUser(user);
      };

      beforeAll(async () => {
         client = await engine.connect();
         await dropIfExists(name);
         await dropIfExists(renamed);
      });

      afterAll(async () => {
         if (client) {
            await dropIfExists(name).catch((): null => null);
            await dropIfExists(renamed).catch((): null => null);
            await client.destroy();
         }
      });

      it('describes what the admin can manage', async () => {
         info = await client.getUsersManagementInfo();

         expect(info.canManage).toBe(true);
         expect(info.hasHost).toBe(hasHost);
         expect(info.currentUser.name).toBeTruthy();
         if (hasHost) {
            expect(info.globalPrivileges).toContain('SELECT');
            expect(info.globalPrivileges).toContain('GRANT OPTION');
            expect(info.scopes[0].objects).toContain(engine.schema);
         }
      });

      it('creates a user with privileges', async () => {
         const attributes = Object.fromEntries(info.attributes.filter(a => !a.readonly).map(a => [a.name, a.default ?? null]));
         const user: antares.UserDetails = {
            ...identity(name),
            attributes,
            globalPrivileges: hasHost ? ['PROCESS', 'GRANT OPTION'] : [],
            privileges: engine.name === 'pg'
               ? { database: { antares_test: ['CONNECT', 'TEMPORARY'] }, schema: { public: ['USAGE'] } }
               : hasHost ? { database: { [engine.schema]: ['SELECT', 'INSERT'] } } : {},
            roles: engine.name === 'pg' ? ['pg_read_all_data'] : []
         };
         if (engine.name === 'firebird') attributes.firstName = 'Mario';
         if (engine.name === 'pg') attributes.connectionLimit = 3;
         if (hasHost) attributes.maxUserConnections = 4;

         await client.createUser({ user, password: PASSWORD });

         const list: antares.UserAccount[] = await client.getUsersList();
         expect(list.find(u => u.name === name)).toMatchObject({ editable: true });

         const details: antares.UserDetails = await client.getUserDetails(list.find(u => u.name === name));
         expect(details.globalPrivileges.sort()).toEqual(user.globalPrivileges.sort());
         expect(details.roles).toEqual(user.roles);
         for (const [scope, objects] of Object.entries(user.privileges)) {
            for (const [object, privileges] of Object.entries(objects))
               expect(details.privileges[scope as 'database'][object].sort()).toEqual([...privileges].sort());
         }
         if (engine.name === 'firebird') expect(details.attributes).toMatchObject({ firstName: 'Mario', active: true, admin: false });
         if (engine.name === 'pg') expect(details.attributes).toMatchObject({ canLogin: true, connectionLimit: 3, validUntil: null });
         if (hasHost) expect(details.attributes).toMatchObject({ maxUserConnections: 4, accountLocked: false });
      });

      it('logs in with the new password and sees only what it may manage', async () => {
         const overrides = { user: name, password: PASSWORD };
         const limited = await engine.connect({ overrides, poolSize: 0 });

         try {
            const limitedInfo: antares.UsersManagementInfo = await limited.getUsersManagementInfo();
            expect(limitedInfo.canManage).toBe(false);

            const users: antares.UserAccount[] = await limited.getUsersList();
            const own = users.find(u => u.name === name);
            expect(own.editable).toBe(true);
            expect(users.filter(u => u.editable)).toHaveLength(1);

            // Changes its own password
            await limited.alterUser({ original: await limited.getUserDetails(own), user: await limited.getUserDetails(own), password: `${PASSWORD}2` });
         }
         finally {
            await limited.destroy();
         }
      });

      it('alters attributes, privileges and name', async () => {
         const list: antares.UserAccount[] = await client.getUsersList();
         const original: antares.UserDetails = await client.getUserDetails(list.find(u => u.name === name));
         const user: antares.UserDetails = JSON.parse(JSON.stringify(original));
         user.name = renamed;

         if (hasHost) {
            user.host = 'localhost';
            user.attributes.accountLocked = true;
            user.attributes.maxUserConnections = 0;
            user.globalPrivileges = ['PROCESS'];
            user.privileges.database[engine.schema] = ['SELECT', 'UPDATE', 'GRANT OPTION'];
         }
         if (engine.name === 'pg') {
            user.attributes.canLogin = false;
            user.attributes.validUntil = '2040-01-01 00:00:00';
            user.privileges.database.antares_test = ['CONNECT'];
            user.privileges.schema = {};
            user.roles = [];
         }
         if (engine.name === 'firebird') {
            user.attributes.active = false;
            user.attributes.lastName = 'O\'Rossi';
         }

         await client.alterUser({ original, user, password: 'Changed_1' });

         const users: antares.UserAccount[] = await client.getUsersList();
         const altered = users.find(u => u.name === renamed);
         expect(altered.disabled).toBe(true);

         const details: antares.UserDetails = await client.getUserDetails(altered);
         expect(details.globalPrivileges.sort()).toEqual(user.globalPrivileges.sort());
         expect(details.roles).toEqual(user.roles);
         if (hasHost) {
            expect(details.host).toBe('localhost');
            expect(details.attributes).toMatchObject({ accountLocked: true, maxUserConnections: 0 });
            expect(details.privileges.database[engine.schema].sort()).toEqual(['GRANT OPTION', 'SELECT', 'UPDATE']);
         }
         if (engine.name === 'pg') {
            expect(details.attributes.validUntil).toBe('2040-01-01 00:00:00');
            expect(details.privileges).toEqual({ database: { antares_test: ['CONNECT'] }, schema: {} });
         }
         if (engine.name === 'firebird')
            expect(details.attributes).toMatchObject({ lastName: 'O\'Rossi', firstName: 'Mario' });
      });

      it('drops the user', async () => {
         const users: antares.UserAccount[] = await client.getUsersList();
         await client.dropUser(users.find(u => u.name === renamed));

         const after: antares.UserAccount[] = await client.getUsersList();
         expect(after.find(u => u.name === renamed)).toBeUndefined();
      });
   });
}
