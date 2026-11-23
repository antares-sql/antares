import { FirebirdSQLClient } from '../../../clients/FirebirdSQLClient';
import FirebirdExporter from '../../../exporters/sql/FirebirdExporter';
import type { EngineDefinition } from '../../EngineRegistry';

export const firebirdEngine: EngineDefinition = {
   codes: ['firebird'],
   createClient: args => new FirebirdSQLClient(args),
   createExporter: (client, tables, options) => new FirebirdExporter(client as FirebirdSQLClient, tables, options)
};
