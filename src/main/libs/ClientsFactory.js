'use strict';
import { MySQLClient } from './clients/MySQLClient';
import { PostgreSQLClient } from './clients/PostgreSQLClient';

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
<<<<<<< HEAD
=======
    * @param {String=} args.params.database
    * @param {String=} args.params.schema
>>>>>>> upstream/master
    * @param {String} args.params.ssh.host
    * @param {String} args.params.ssh.username
    * @param {String} args.params.ssh.password
    * @param {Number} args.params.ssh.port
    * @param {Number=} args.poolSize
    * @returns Database Connection
    * @memberof ClientsFactory
    */
   static getConnection (args) {
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
