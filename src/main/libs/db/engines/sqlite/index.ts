import { SQLiteClient } from '../../../clients/SQLiteClient';
import SQLiteExporter from '../../../exporters/sql/SQLiteExporter';
import type { EngineDefinition } from '../../EngineRegistry';

export const sqliteEngine: EngineDefinition = {
   codes: ['sqlite'],
   createClient: args => new SQLiteClient(args),
   createExporter: (client, tables, options) => new SQLiteExporter(client as SQLiteClient, tables, options)
};
