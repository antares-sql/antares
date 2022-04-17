import * as importer from 'common/interfaces/importer';
import * as fs from 'fs';
import * as EventEmitter from 'events';

export class BaseImporter extends EventEmitter {
   protected _options;
   protected _isCancelled;
   protected _fileHandler;
   protected _state;

   constructor (options: importer.ImportOptions) {
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

   emitUpdate (state: importer.ImportState) {
      this.emit('progress', { ...this._state, ...state });
   }

   import () {
      throw new Error('Exporter must implement the "import" method');
   }
}
