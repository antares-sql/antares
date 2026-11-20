import customizations from 'common/customizations';
import { Customizations } from 'common/interfaces/customizations';
import { describe, expect, it } from 'vitest';

import { FirebirdSQLClient } from '../../../src/main/libs/clients/FirebirdSQLClient';
import { MySQLClient } from '../../../src/main/libs/clients/MySQLClient';
import { PostgreSQLClient } from '../../../src/main/libs/clients/PostgreSQLClient';
import { SQLiteClient } from '../../../src/main/libs/clients/SQLiteClient';
import {
   Capability,
   capabilityMethods,
   DatabaseClient,
   hasCapability,
   requireCapability,
   UnsupportedCapabilityError
} from '../../../src/main/libs/db/core/contracts';

const engines: [keyof typeof customizations, () => DatabaseClient][] = [
   ['mysql', () => new MySQLClient({ client: 'mysql', uid: 'test', params: {} as never })],
   ['maria', () => new MySQLClient({ client: 'maria', uid: 'test', params: {} as never })],
   ['pg', () => new PostgreSQLClient({ client: 'pg', uid: 'test', params: {} as never })],
   ['sqlite', () => new SQLiteClient({ client: 'sqlite', uid: 'test', params: {} as never })],
   ['firebird', () => new FirebirdSQLClient({ client: 'firebird', uid: 'test', params: {} as never })]
];

/** Capabilities backing a UI feature flag: if the UI enables the feature, the client must implement it */
const uiFlags: Partial<Record<Capability, keyof Customizations>> = {
   schemas: 'schemaEdit',
   routines: 'routines',
   functions: 'functions',
   triggerFunctions: 'triggerFunctions',
   materializedViews: 'materializedViews',
   schedulers: 'schedulers',
   tableCheck: 'tableCheck',
   tableDdl: 'tableDdl',
   cancelQueries: 'cancelQueries',
   users: 'usersManagement',
   userTypes: 'userTypes'
};

const capabilitiesOf = (client: DatabaseClient) =>
   (Object.keys(capabilityMethods) as Capability[]).filter(cap => hasCapability(client, cap));

describe('client capabilities', () => {
   it.each(engines)('%s capabilities', (_name, create) => {
      expect(capabilitiesOf(create())).toMatchSnapshot();
   });

   it.each(engines)('%s implements every capability its UI enables', (name, create) => {
      const client = create();
      const missing = Object.entries(uiFlags)
         .filter(([, flag]) => customizations[name][flag])
         .map(([cap]) => cap as Capability)
         .filter(cap => !hasCapability(client, cap));

      expect(missing).toEqual([]);
   });

   it('implements a capability fully or not at all', () => {
      for (const [, create] of engines) {
         const client = create();
         for (const [cap, methods] of Object.entries(capabilityMethods)) {
            const implemented = (methods as string[]).filter(m => typeof (client as never)[m] === 'function');
            expect([0, methods.length], `${client._client} ${cap}: ${implemented}`).toContain(implemented.length);
         }
      }
   });

   it('requireCapability throws a typed error for unsupported features', () => {
      const sqlite = engines[3][1]();
      expect(() => requireCapability(sqlite, 'routines')).toThrow(UnsupportedCapabilityError);
      expect(() => requireCapability(sqlite, 'routines')).toThrow('"routines" is not supported by sqlite');
   });

   it('requireCapability returns the client when supported', () => {
      const pg = engines[2][1]();
      expect(requireCapability(pg, 'materializedViews')).toBe(pg);
   });
});
