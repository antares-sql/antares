'use strict';
import mysql from 'mysql2';

export class AntaresConnector {
   constructor (args) {
      this.client = args.client;
      this.params = args.params;
      this.poolSize = args.poolSize || false;
      this.connection = null;

      this.query = {
         select: [],
         from: '',
         where: [],
         groupBy: [],
         orderBy: [],
         join: [],
         update: [],
         insert: []
      };
   }

   connect () {
      switch (this.client) {
         case 'maria':
         case 'mysql':
            if (!this.poolSize) {
               const connection = mysql.createConnection(this.params);
               this.connection = connection.promise();
            }
            else {
               const pool = mysql.createPool({ ...this.params, connectionLimit: this.poolSize });
               this.connection = pool.promise();
            }
            break;

         default:
            break;
      }
   }

   // select (args) {
   //    const type = typeof args;

   //    switch (type) {
   //       case string:
   //       case number:
   //          this.query.select;
   //          break;

   //       default:
   //          break;
   //    }
   // }

   async raw (sql) {
      switch (this.client) {
         case 'maria':
         case 'mysql': {
            const [rows, fields] = await this.connection.query(sql);
            return { rows, fields };
         }
         default:
            break;
      }
   }

   destroy () {
      switch (this.client) {
         case 'maria':
         case 'mysql': {
            this.connection.end();
            break;
         }
         default:
            break;
      }
   }
}
