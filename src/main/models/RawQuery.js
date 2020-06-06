'use strict';
import { EventEmitter } from 'events';

export class RawQuery extends EventEmitter {
   constructor ({ knexIstance, database }) {
      super();
      this.conn = knexIstance;
      this.database = database;
   }

   async runQuery (query) {
      if (this.database) await this.conn.raw(`USE \`${this.database}\``);
      const stream = this.conn.raw(query).stream();
      stream.on('data', row => {
         this.emit('row', row);
      });

      stream.on('error', err => {
         this.emit('error', err);
      });
   }
}
