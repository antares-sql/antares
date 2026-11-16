import { SQLiteClient } from '../../../clients/SQLiteClient';
import type { EngineDefinition } from '../../EngineRegistry';

export const sqliteEngine: EngineDefinition = {
   codes: ['sqlite'],
   createClient: args => new SQLiteClient(args)
};
