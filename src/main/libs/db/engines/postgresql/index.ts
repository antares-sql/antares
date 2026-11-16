import * as pg from 'pg';

import { PostgreSQLClient } from '../../../clients/PostgreSQLClient';
import PostgreSQLExporter from '../../../exporters/sql/PostgreSQLExporter';
import PostgreSQLImporter from '../../../importers/sql/PostgreSQLImporter';
import type { EngineDefinition } from '../../EngineRegistry';

export const postgresqlEngine: EngineDefinition = {
   codes: ['pg'],
   createClient: args => new PostgreSQLClient(args),
   createExporter: (client, tables, options) => new PostgreSQLExporter(client as PostgreSQLClient, tables, options),
   createImporter: async (client, options) => new PostgreSQLImporter(await (client as PostgreSQLClient).getConnectionPool() as unknown as pg.PoolClient, options)
};
