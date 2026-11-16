import * as antares from 'common/interfaces/antares';

import { DatabaseClient } from './db/core/contracts';
import { createClient } from './db/EngineRegistry';

/** @deprecated use createClient() from db/EngineRegistry */
export class ClientsFactory {
   static getClient (args: antares.ClientParams): DatabaseClient {
      return createClient(args);
   }
}
