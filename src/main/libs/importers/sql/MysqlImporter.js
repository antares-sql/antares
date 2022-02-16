import fs from 'fs/promises';
import SqlParser from '../../../../common/libs/sqlParser';
import { BaseImporter } from '../BaseImporter';

export default class MysqlImporter extends BaseImporter {
   constructor (client, options) {
      super(options);
   }

   async import () {
      const { size: totalFileSize } = await fs.stat(this._options.file);
      const parser = new SqlParser();
      let readPosition = 0;
      let queryCount = 0;

      this.emitUpdate({
         fileSize: totalFileSize,
         readPosition: 0,
         percentage: 0
      });

      // 1. detect file encoding
      // 2. set fh encoding
      // 3. detect sql mode
      // 4. restore sql mode in case of exception

      return new Promise((resolve, reject) => {
         this._fileHandler.pipe(parser);

         parser.on('error', (err) => {
            console.log(err);
            reject(err);
         });

         parser.on('finish', () => {
            console.log('TOTAL QUERIES', queryCount);
            console.log('import end');
            resolve();
         });

         parser.on('data', (q) => {
            console.log('query: ', q);
            queryCount++;
         });

         this._fileHandler.on('data', (chunk) => {
            readPosition += chunk.length;
            this.emitUpdate({
               readPosition,
               percentage: readPosition / totalFileSize * 100
            });
         });

         this._fileHandler.on('error', (e) => {
            console.log(e);
            reject(err);
         });
      });
   }
}
