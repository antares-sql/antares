/**
 * PostgreSQL user-defined types: what the type tabs and the table editor do, against the real server.
 */
import * as antares from 'common/interfaces/antares';
import * as os from 'os';
import * as path from 'path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import PostgreSQLExporter from '../../src/main/libs/exporters/sql/PostgreSQLExporter';
import { getTestEngines } from './helpers/engines';

const S = 'antares_it_types';
const COPY = 'antares_it_types_copy';

const details = (type: Partial<antares.UserTypeDetails>): antares.UserTypeDetails => ({
   schema: S,
   name: '',
   kind: 'enum',
   comment: '',
   values: [],
   attributes: [],
   baseType: '',
   notNull: false,
   default: '',
   checks: [],
   ...type
});

for (const engine of getTestEngines().filter(e => e.customizations.userTypes)) {
   describe.sequential(`${engine.name} user-defined types`, () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let client: any;
      const read = (userType: string): Promise<antares.UserTypeDetails> => client.getUserTypeInformations({ schema: S, userType });
      const structureTypes = async (): Promise<antares.UserTypeInfos[]> => (await client.getStructure(new Set([S])))
         .find((s: { name: string }) => s.name === S).userTypes
         .sort((a: antares.UserTypeInfos, b: antares.UserTypeInfos) => a.name.localeCompare(b.name));

      beforeAll(async () => {
         client = await engine.connect();
         await client.raw(`DROP SCHEMA IF EXISTS ${S} CASCADE; DROP SCHEMA IF EXISTS ${COPY} CASCADE; CREATE SCHEMA ${S}`);
      });

      afterAll(async () => {
         if (client) {
            await client.raw(`DROP SCHEMA IF EXISTS ${S} CASCADE; DROP SCHEMA IF EXISTS ${COPY} CASCADE`).catch((): null => null);
            await client.destroy();
         }
      });

      it('creates every kind of type and lists them in the structure', async () => {
         await client.createUserType(details({ name: 'status', values: [{ name: 'draft' }, { name: 'it\'s live' }], comment: 'Lifecycle' }));
         await client.createUserType(details({ name: 'Weight', kind: 'domain', baseType: 'numeric(8,3)', default: '0', notNull: true, checks: [{ name: 'positive', clause: 'VALUE >= 0' }] }));
         await client.createUserType(details({ name: 'size', kind: 'composite', attributes: [{ name: 'w', type: 'integer' }, { name: 'state', type: 'status' }] }));
         await client.createUserType(details({ name: 'span', kind: 'range', baseType: 'numeric' }));

         expect(await structureTypes()).toEqual([
            { name: 'size', kind: 'composite' },
            { name: 'span', kind: 'range' },
            { name: 'status', kind: 'enum' },
            { name: 'Weight', kind: 'domain' }
         ]);

         expect(await read('status')).toMatchObject({ comment: 'Lifecycle', values: [{ name: 'draft', oldName: 'draft' }, { name: 'it\'s live', oldName: 'it\'s live' }] });
         expect(await read('Weight')).toMatchObject({ baseType: 'numeric(8,3)', default: '0', notNull: true, checks: [{ name: 'positive', clause: '(VALUE >= (0)::numeric)' }] });
         // Types of the same schema are not qualified
         expect((await read('size')).attributes).toEqual([{ name: 'w', type: 'integer', oldName: 'w' }, { name: 'state', type: 'status', oldName: 'state' }]);
         expect(await read('span')).toMatchObject({ baseType: 'numeric' });
      });

      it('adds enum values next to values added in the same transaction', async () => {
         const original = await read('status');
         await client.alterUserType({
            original,
            type: {
               ...original,
               values: [{ name: 'new' }, { name: 'Draft', oldName: 'draft' }, { name: 'review' }, { name: 'approved' }, { name: 'it\'s live', oldName: 'it\'s live' }]
            }
         });

         expect((await read('status')).values.map(v => v.name)).toEqual(['new', 'Draft', 'review', 'approved', 'it\'s live']);
      });

      it('alters composite types and domains, then renames them', async () => {
         const size = await read('size');
         await client.alterUserType({
            original: size,
            type: { ...size, name: 'dimensions', comment: 'Box', attributes: [{ name: 'width', type: 'bigint', oldName: 'w' }, { name: 'unit', type: 'varchar(5)' }] }
         });
         expect(await read('dimensions')).toMatchObject({
            comment: 'Box',
            attributes: [{ name: 'width', type: 'bigint' }, { name: 'unit', type: 'character varying(5)' }]
         });

         const weight = await read('Weight');
         await client.alterUserType({
            original: weight,
            type: { ...weight, default: '', notNull: false, checks: [{ name: 'below_1000', clause: 'VALUE < 1000' }] }
         });
         expect(await read('Weight')).toMatchObject({ default: '', notNull: false, checks: [{ name: 'below_1000' }] });
      });

      it('uses the types in table columns', async () => {
         await client.createTable({
            schema: S,
            options: { name: 'items', comment: null },
            fields: [
               { name: 'id', type: 'INTEGER', nullable: false, default: null },
               { name: 'state', type: 'STATUS', nullable: true, default: null },
               { name: 'weight', type: '"Weight"', nullable: true, default: null }
            ],
            foreigns: [],
            indexes: []
         } as unknown as antares.CreateTableParams);

         const columns = await client.getTableColumns({ schema: S, table: 'items' });
         const column = (name: string) => columns.find((c: antares.TableField) => c.name === name);
         expect(column('state')).toMatchObject({ type: 'STATUS', enumValues: '\'new\',\'Draft\',\'review\',\'approved\',\'it\'\'s live\'' });
         expect(column('weight').type).toBe('"Weight"');

         // Changing an unrelated attribute keeps the user-defined type
         await client.alterTable({
            schema: S,
            table: 'items',
            additions: [{ name: 'size', type: 'DIMENSIONS', nullable: true, default: null }],
            changes: [{ ...column('weight'), orgName: 'weight', nullable: false, default: null }],
            deletions: [],
            indexChanges: { additions: [], changes: [], deletions: [] },
            foreignChanges: { additions: [], changes: [], deletions: [] },
            options: {}
         } as unknown as antares.AlterTableParams);

         const altered = await client.getTableColumns({ schema: S, table: 'items' });
         expect(altered.map((c: antares.TableField) => [c.name, c.type, c.nullable])).toEqual([
            ['id', 'INTEGER', false],
            ['state', 'STATUS', true],
            ['weight', '"Weight"', false],
            ['size', 'DIMENSIONS', true]
         ]);
      });

      it('dumps the types with qualified names', async () => {
         const exporter = new PostgreSQLExporter(client, [], { schema: S, outputFile: path.join(os.tmpdir(), 'antares-it-types.sql') } as never);
         const dump = await exporter.getCreateTypes();

         expect(dump).toContain(`CREATE TYPE "${S}"."status" AS ENUM ('new', 'Draft', 'review', 'approved', 'it''s live');`);
         expect(dump).toContain(`CREATE TYPE "${S}"."dimensions" AS ("width" bigint, "unit" character varying(5));`);
         expect(dump).toContain(`CREATE DOMAIN "${S}"."Weight" AS numeric(8,3) CONSTRAINT "below_1000" CHECK ((VALUE < (1000)::numeric));`);

         // Replayed in another schema with an empty search path, like a dump import
         await client.raw(`CREATE SCHEMA ${COPY}; SET search_path TO ''; ${dump.replaceAll(`"${S}"`, `"${COPY}"`)}`, { split: false });
         expect(await client.getUserTypeInformations({ schema: COPY, userType: 'status' })).toMatchObject({ comment: 'Lifecycle' });
      });

      it('refuses to drop a type in use, drops it when unused', async () => {
         await expect(client.dropUserType({ schema: S, userType: 'status' })).rejects.toThrow(/depend/);

         await client.dropUserType({ schema: S, userType: 'span' });
         await client.dropUserType({ schema: S, userType: 'Weight' }).catch((): null => null); // used by items
         await client.raw(`DROP TABLE ${S}.items`);
         await client.dropUserType({ schema: S, userType: 'Weight' });

         expect((await structureTypes()).map(t => t.name)).toEqual(['dimensions', 'status']);
      });
   });
}
