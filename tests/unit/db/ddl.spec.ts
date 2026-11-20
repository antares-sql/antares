/**
 * DDL generators are pure: they build SQL without a connection.
 * The clients must execute exactly what the generators build.
 */
import { describe, expect, it } from 'vitest';

import { FirebirdSQLClient } from '../../../src/main/libs/clients/FirebirdSQLClient';
import { MySQLClient } from '../../../src/main/libs/clients/MySQLClient';
import { PostgreSQLClient } from '../../../src/main/libs/clients/PostgreSQLClient';
import { SQLiteClient } from '../../../src/main/libs/clients/SQLiteClient';
import { DdlGenerator } from '../../../src/main/libs/db/core/DdlGenerator';
import { FirebirdDdl } from '../../../src/main/libs/db/engines/firebird/FirebirdDdl';
import { MySQLDdl } from '../../../src/main/libs/db/engines/mysql/MySQLDdl';
import { PostgreSQLDdl } from '../../../src/main/libs/db/engines/postgresql/PostgreSQLDdl';
import { SQLiteDdl } from '../../../src/main/libs/db/engines/sqlite/SQLiteDdl';
import { buildFixtures, engineTypes } from '../clients/fixtures';
import { captureRaw, normalizeSql } from '../helpers/captureSql';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;

const engines: [string, DdlGenerator, () => Any, keyof typeof engineTypes][] = [
   ['mysql', new MySQLDdl(), () => new MySQLClient({ client: 'mysql', uid: 't', params: {} as never }), 'mysql'],
   ['pg', new PostgreSQLDdl(), () => new PostgreSQLClient({ client: 'pg', uid: 't', params: {} as never }), 'pg'],
   ['sqlite', new SQLiteDdl(), () => new SQLiteClient({ client: 'sqlite', uid: 't', params: {} as never }), 'sqlite'],
   ['firebird', new FirebirdDdl(), () => new FirebirdSQLClient({ client: 'firebird', uid: 't', params: {} as never }), 'firebird']
];

describe.each(engines)('%s DDL generator', (_name, ddl: Any, createClient, types) => {
   const f = buildFixtures(engineTypes[types]);

   it('builds CREATE TABLE without a connection', () => {
      const sql = ddl.createTable(f.createTable);
      expect(sql).toMatch(/^CREATE TABLE/);
      expect(sql).toContain('products');
   });

   it('resolves types from the engine catalog', () => {
      expect(ddl.getTypeInfo(engineTypes[types].varchar.toLowerCase())).toMatchObject({ name: engineTypes[types].varchar });
      // #979: types missing from the catalog (enums, domains...) must not break ALTER TABLE
      expect(ddl.getTypeInfo('not_a_type')).toEqual({ name: 'NOT_A_TYPE', length: false, scale: false, collation: false, unsigned: false, zerofill: false });
   });

   it.each(['createTable', 'dropTable', 'createView', 'createTrigger', 'dropTrigger'])('client executes what %s builds', async method => {
      const client = createClient();
      const capture = captureRaw(client);
      const params: Record<string, unknown> = {
         createTable: f.createTable,
         dropTable: { schema: f.schema, table: f.table },
         createView: f.view,
         createTrigger: f.trigger,
         dropTrigger: { schema: f.schema, trigger: f.trigger.name }
      };

      await client[method](params[method]);

      expect(capture.sql.at(-1)).toBe(normalizeSql(ddl[method](params[method])));
   });
});

describe('MySQL DDL column CHECK', () => {
   const ddl = new MySQLDdl();
   const field = { name: 'payload', orgName: 'data', type: 'LONGTEXT', nullable: true, default: 'NULL', check: 'json_valid(`data`)' };
   const params = (changes: Any[], additions: Any[] = []): Any => ({
      schema: 's',
      table: 't',
      additions,
      changes,
      deletions: [],
      tableStructure: { name: 't', fields: [...changes, ...additions], foreigns: [], indexes: [] },
      indexChanges: { additions: [], changes: [], deletions: [] },
      foreignChanges: { additions: [], changes: [], deletions: [] },
      checkChanges: { additions: [], changes: [], deletions: [] },
      options: {}
   });

   it('keeps the CHECK of a changed column, following its rename (#757)', () => {
      const sql = normalizeSql(ddl.alterTable(params([field])));
      expect(sql).toContain('CHANGE COLUMN `data` `payload` LONGTEXT NULL DEFAULT NULL CHECK (json_valid(`payload`))');
   });

   it('does not copy a CHECK into added columns', () => {
      const sql = normalizeSql(ddl.alterTable(params([], [{ ...field, orgName: undefined }])));
      expect(sql).not.toContain('CHECK');
   });
});
