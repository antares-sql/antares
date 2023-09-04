import * as exporter from 'common/interfaces/exporter';
import * as EventEmitter from 'events';
import * as fs from 'fs';
import * as path from 'path';
import { createGzip, Gzip } from 'zlib';

export class BaseExporter extends EventEmitter {
   protected _tables;
   protected _options;
   protected _isCancelled;
   protected _outputFileStream: fs.WriteStream;
   protected _processedStream: fs.WriteStream | Gzip;
   protected _state;

   constructor (tables: exporter.TableParams[], options: exporter.ExportOptions) {
      super();
      this._tables = tables;
      this._options = options;
      this._isCancelled = false;
      this._outputFileStream = fs.createWriteStream(this._options.outputFile, { flags: 'w' });
      this._processedStream = null;
      this._state = {};

      if (this._options.outputFormat === 'sql.zip') {
         const outputZipStream = createGzip();
         outputZipStream.pipe(this._outputFileStream);
         this._processedStream = outputZipStream;
      }
      else
         this._processedStream = this._outputFileStream;

      this._processedStream.once('error', err => {
         this._isCancelled = true;
         this.emit('error', err);
      });
   }

   async run () {
      try {
         this.emit('start', this);
         await this.dump();
      }
      catch (err) {
         this.emit('error', err);
         throw err;
      }
      finally {
         this._processedStream.end();
         this.emit('end');
      }
   }

   get isCancelled () {
      return this._isCancelled;
   }

   get outputFile () {
      return this._options.outputFile;
   }

   outputFileExists () {
      return fs.existsSync(this._options.outputFile);
   }

   cancel () {
      this._isCancelled = true;
      this.emit('cancel');
      this.emitUpdate({ op: 'cancelling' });
   }

   emitUpdate (state: exporter.ExportState) {
      this.emit('progress', { ...this._state, ...state });
   }

   writeString (data: string) {
      if (this._isCancelled) return;

      try {
         fs.accessSync(this._options.outputFile);
      }
      catch (err) {
         this._isCancelled = true;

         const fileName = path.basename(this._options.outputFile);
         this.emit('error', `The file ${fileName} is not accessible`);
      }
      this._processedStream.write(data);
   }

   dump () {
      throw new Error('Exporter must implement the "dump" method');
   }
}
