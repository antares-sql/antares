import fs from 'fs';
import path from 'path';
import EventEmitter from 'events';

export class BaseExporter extends EventEmitter {
   constructor (tables, options) {
      super();
      this._tables = tables;
      this._options = options;
      this._isCancelled = false;
      this._outputStream = fs.createWriteStream(this._options.outputFile, {
         flags: 'w'
      });
      this._state = {};

      this._outputStream.once('error', err => {
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
         this._outputStream.end();
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

   emitUpdate (state) {
      this.emit('progress', { ...this._state, ...state });
   }

   writeString (data) {
      if (this._isCancelled) return;

      try {
         fs.accessSync(this._options.outputFile);
      }
      catch (err) {
         this._isCancelled = true;

         const fileName = path.basename(this._options.outputFile);
         this.emit('error', `The file ${fileName} is not accessible`);
      }
      this._outputStream.write(data);
   }

   dump () {
      throw new Error('Exporter must implement the "dump" method');
   }
}
