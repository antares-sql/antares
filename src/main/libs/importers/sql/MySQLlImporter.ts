import * as importer from 'common/interfaces/importer';
import * as fs from 'fs/promises';
import * as mysql from 'mysql2';

import MySQLParser from '../../parsers/MySQLParser';
import { BaseImporter } from '../BaseImporter';

export default class MySQLImporter extends BaseImporter {
   protected _client: mysql.Pool

   constructor (client: mysql.Pool, options: importer.ImportOptions) {
      super(options);
      this._client = client;
   }

   async import (): Promise<void> {
      try {
         const { size: totalFileSize } = await fs.stat(this._options.file);
         const parser = new MySQLParser();
         let readPosition = 0;
         let queryCount = 0;

         this.emitUpdate({
            fileSize: totalFileSize,
            readPosition: 0,
            percentage: 0,
            queryCount: 0
         });

         return new Promise((resolve, reject) => {
            this._fileHandler.pipe(parser);

            parser.on('error', reject);

            parser.on('close', async () => {
               // console.log('TOTAL QUERIES', queryCount);
               // console.log('import end');
               resolve();
            });

            parser.on('data', async (query) => {
               queryCount++;
               parser.pause();

               try {
                  await this._client.query(query);
               }
               catch (error) {
                  this.emit('query-error', {
                     sql: query,
                     message: error.sqlMessage || error.message,
                     sqlSnippet: error.sql,
                     time: new Date().getTime()
                  });
               }

               this.emitUpdate({
                  queryCount,
                  readPosition,
                  percentage: readPosition / totalFileSize * 100
               });
               this._fileHandler.pipe(parser);
               parser.resume();
            });

            parser.on('pause', () => {
               this._fileHandler.unpipe(parser);
               // eslint-disable-next-line @typescript-eslint/no-explicit-any
               (this._fileHandler as any).readableFlowing = false;
            });

            this._fileHandler.on('data', (chunk) => {
               readPosition += chunk.length;
            });

            this._fileHandler.on('error', (err) => {
               console.log(err);
               reject(err);
            });
         });
      }
      catch (err) {
         console.log(err);
      }
   }
}
