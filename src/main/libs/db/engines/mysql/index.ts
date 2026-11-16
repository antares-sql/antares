import * as mysql from 'mysql2';

import { MySQLClient } from '../../../clients/MySQLClient';
import MysqlExporter from '../../../exporters/sql/MysqlExporter';
import MySQLImporter from '../../../importers/sql/MySQLlImporter';
import type { EngineDefinition } from '../../EngineRegistry';

export const mysqlEngine: EngineDefinition = {
   codes: ['mysql', 'maria'],
   createClient: args => new MySQLClient(args),
   createExporter: (client, tables, options) => new MysqlExporter(client as MySQLClient, tables, options),
   createImporter: async (client, options) => new MySQLImporter(await (client as MySQLClient).getConnectionPool() as unknown as mysql.Pool, options)
};
