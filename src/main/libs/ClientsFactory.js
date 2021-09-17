'use strict';
import { MySQLClient } from './clients/MySQLClient';
import { PostgreSQLClient } from './clients/PostgreSQLClient';

const queryLogger = sql => {
   // Remove comments, newlines and multiple spaces
   const escapedSql = sql.replace(/(\/\*(.|[\r\n|\n|\r])*?\*\/)|(--(.*|[\r\n|\n|\r]))/gm, '').replace(/\s\s+/g, ' ');
   console.log(escapedSql);
};

export class ClientsFactory {
   /**
    * Returns a database connection based on received args.
    *
    * @param {Object} args
    * @param {String} args.client
    * @param {Object} args.params
    * @param {String} args.params.host
    * @param {Number} args.params.port
    * @param {String} args.params.password
    * @param {String=} args.params.database
    * @param {String=} args.params.schema
    * @param {String} args.params.ssh.host
    * @param {String} args.params.ssh.username
    * @param {String} args.params.ssh.password
    * @param {Number} args.params.ssh.port
    * @param {Number=} args.poolSize
    * @returns Database Connection
    * @memberof ClientsFactory
    */
   static getConnection (args) {
      args.logger = queryLogger;

      switch (args.client) {
         case 'mysql':
         case 'maria':
            return new MySQLClient(args);
         case 'pg':
            return new PostgreSQLClient(args);
         default:
            throw new Error(`Unknown database client: ${args.client}`);
      }
   }
}
