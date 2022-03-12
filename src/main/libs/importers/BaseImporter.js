import fs from 'fs';
import EventEmitter from 'events';

export class BaseImporter extends EventEmitter {
   constructor (options) {
      super();
      this._options = options;
      this._isCancelled = false;
      this._fileHandler = fs.createReadStream(this._options.file, {
         flags: 'r',
         highWaterMark: 4 * 1024
      });
      this._state = {};

      this._fileHandler.once('error', err => {
         this._isCancelled = true;
         this.emit('error', err);
      });
   }

   async run () {
      try {
         this.emit('start', this);
         await this.import();
      }
      catch (err) {
         this.emit('error', err);
         throw err;
      }
      finally {
         this._fileHandler.close();
         this.emit('end');
      }
   }

   get isCancelled () {
      return this._isCancelled;
   }

   cancel () {
      this._isCancelled = true;
      this.emit('cancel');
      this.emitUpdate({ op: 'cancelling' });
   }

   emitUpdate (state) {
      this.emit('progress', { ...this._state, ...state });
   }

   import () {
      throw new Error('Exporter must implement the "import" method');
   }
}
