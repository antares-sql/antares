'use strict';
import { MySQLClient } from './clients/MySQLClient';

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
    * @param {Number=} args.poolSize
    * @returns Database Connection
    * @memberof ClientsFactory
    */
   static getConnection (args) {
      switch (args.client) {
         case 'mysql':
         case 'maria':
            return new MySQLClient(args);
         default:
            return new Error(`Unknown database client: ${args.client}`);
      }
   }
}
