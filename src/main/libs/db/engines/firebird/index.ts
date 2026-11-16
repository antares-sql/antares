import { FirebirdSQLClient } from '../../../clients/FirebirdSQLClient';
import type { EngineDefinition } from '../../EngineRegistry';

export const firebirdEngine: EngineDefinition = {
   codes: ['firebird'],
   createClient: args => new FirebirdSQLClient(args)
};
