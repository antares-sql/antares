import { FirebirdSQLClient } from '../../../clients/FirebirdSQLClient';
import FirebirdExporter from '../../../exporters/sql/FirebirdExporter';
import FirebirdImporter from '../../../importers/sql/FirebirdImporter';
import type { EngineDefinition } from '../../EngineRegistry';

export const firebirdEngine: EngineDefinition = {
   codes: ['firebird'],
   createClient: args => new FirebirdSQLClient(args),
   createExporter: (client, tables, options) => new FirebirdExporter(client as FirebirdSQLClient, tables, options),
   createImporter: async (client, options) => new FirebirdImporter(client as FirebirdSQLClient, options)
};
