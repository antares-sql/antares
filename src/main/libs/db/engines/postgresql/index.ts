import { PostgreSQLClient } from '../../../clients/PostgreSQLClient';
import PostgreSQLExporter from '../../../exporters/sql/PostgreSQLExporter';
import PostgreSQLImporter from '../../../importers/sql/PostgreSQLImporter';
import type { EngineDefinition } from '../../EngineRegistry';

export const postgresqlEngine: EngineDefinition = {
   codes: ['pg'],
   createClient: args => new PostgreSQLClient(args),
   createExporter: (client, tables, options) => new PostgreSQLExporter(client as PostgreSQLClient, tables, options),
   createImporter: async (client, options) => new PostgreSQLImporter(client as PostgreSQLClient, options)
};
