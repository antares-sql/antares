import * as exporter from 'common/interfaces/exporter';
import { EventEmitter } from 'events';
import * as fs from 'fs';
import * as path from 'path';
import { createGzip, Gzip } from 'zlib';

/** Output is collected in chunks of this size: one stream write per row would make gzip and fs much slower */
const WRITE_CHUNK_SIZE = 64 * 1024;

export class BaseExporter extends EventEmitter {
   protected _tables;
   protected _options;
   protected _isCancelled;
   /** Cancelled by the user (not by an error): the partial file is deleted */
   private _cancelRequested = false;
   protected _outputFileStream: fs.WriteStream;
   protected _processedStream: fs.WriteStream | Gzip;
   protected _state;
   private _lastAccessCheck = 0;
   private _buffer = '';

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

      this._processedStream.once('error', (err: Error) => {
         this._isCancelled = true;
         this.emit('error', err);
      });
   }

   async run () {
      try {
         this.emit('start', this);
         await this.dump();
         await this.flush();
      }
      catch (err) {
         this.emit('error', err);
         throw err;
      }
      finally {
         try {
            await this.cleanup();
         }
         catch (_) {} // Closing database resources must not hide the export result

         // Emit 'end' only once the file is fully written (otherwise it may be read truncated)
         await new Promise<void>(resolve => {
            this._outputFileStream.once('finish', resolve);
            this._outputFileStream.once('error', () => resolve());
            this._processedStream.end();
         });

         if (this._cancelRequested)
            fs.rmSync(this._options.outputFile, { force: true });

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
      this._cancelRequested = true;
      this.emit('cancel');
      this.emitUpdate({ op: 'cancelling' });
   }

   emitUpdate (state: exporter.ExportState) {
      this.emit('progress', { ...this._state, ...state });
   }

   /** Appends to the output: data is written in chunks (see flush) */
   async writeString (data: string) {
      if (this._isCancelled || !data) return;

      this._buffer += data;
      if (this._buffer.length >= WRITE_CHUNK_SIZE)
         await this.flush();
   }

   /**
    * Writes the collected output and waits when the stream buffer is full: rows are read from the
    * database faster than they are written (gzip, slow disks), and an unbounded buffer exhausts the
    * worker memory on big tables, freezing the export (#970).
    */
   async flush () {
      if (this._isCancelled || !this._buffer) return;

      const data = this._buffer;
      this._buffer = '';

      // The output file was deleted or moved: checked at most once per second (it is a syscall per write),
      // and only once the stream has created it (it is opened asynchronously)
      const now = Date.now();
      if (!this._outputFileStream.pending && now - this._lastAccessCheck > 1000) {
         this._lastAccessCheck = now;
         try {
            fs.accessSync(this._options.outputFile);
         }
         catch (err) {
            this._isCancelled = true;

            const fileName = path.basename(this._options.outputFile);
            this.emit('error', `The file ${fileName} is not accessible`);
            return;
         }
      }

      if (!this._processedStream.write(data)) {
         await new Promise<void>(resolve => {
            const done = () => {
               this._processedStream.off('drain', done);
               this._processedStream.off('error', done);
               this._processedStream.off('close', done);
               resolve();
            };
            this._processedStream.once('drain', done);
            this._processedStream.once('error', done);
            this._processedStream.once('close', done);
         });
      }
   }

   dump (): Promise<void> {
      throw new Error('Exporter must implement the "dump" method');
   }

   /** Releases the resources of the export (database connections): called once, also on errors and cancel */
   async cleanup (): Promise<void> {
      return undefined;
   }
}
