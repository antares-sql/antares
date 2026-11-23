import { ClientCode } from 'common/interfaces/antares';
import { splitStatements } from 'common/libs/sqlScanner';
import * as fs from 'fs';
import { StringDecoder } from 'string_decoder';

import { BaseImporter } from '../BaseImporter';

/** The pending text is split again only once it grew by this size (or got a terminator) */
const MIN_SCAN_SIZE = 64 * 1024;

/**
 * Import of an SQL script, read in chunks and split with the query splitter of the editor (strings,
 * comments, routine bodies, Firebird SET TERM). Statements failing are reported and skipped.
 * A cancel stops the import between two statements.
 */
export abstract class ScriptImporter extends BaseImporter {
   protected abstract readonly _dialect: ClientCode;

   /** The worker waits for the end of the import (resources released) instead of killing the thread */
   get stopsOnCancel () {
      return true;
   }

   /** Opens the connection */
   protected abstract open (): Promise<void>;

   /** Runs a statement of the script */
   protected abstract execute (sql: string): Promise<void>;

   /** Ends the import: commits what is pending if completed, closes the connection */
   protected abstract close (completed: boolean): Promise<void>;

   async import (): Promise<void> {
      const { size: fileSize } = await fs.promises.stat(this._options.file);
      const decoder = new StringDecoder('utf8');
      let readPosition = 0;
      let queryCount = 0;
      let pending = '';
      let scannedLength = 0;
      let terminator: string;
      let lastUpdate = 0;

      const emitProgress = (force = false) => {
         const now = Date.now();
         if (!force && now - lastUpdate < 200) return;
         lastUpdate = now;
         this.emitUpdate({ fileSize, readPosition, percentage: fileSize ? readPosition / fileSize * 100 : 100, queryCount });
      };

      const run = async (statements: string[]) => {
         for (const sql of statements) {
            if (this._isCancelled) return;
            queryCount++;

            try {
               await this.execute(sql);
            }
            catch (error) {
               this.emit('query-error', {
                  sql,
                  message: error.message ?? String(error),
                  time: new Date().getTime()
               });
            }

            emitProgress();
         }
      };

      emitProgress(true);
      await this.open();
      let completed = false;

      try {
         for await (const chunk of this._fileHandler as AsyncIterable<Buffer>) {
            if (this._isCancelled) break;

            readPosition += chunk.length;
            const text = decoder.write(chunk);
            pending += text;

            // A statement ends only at a terminator: no need to split until one arrives
            const hasTerminator = text.includes(';') || (terminator && text.includes(terminator));
            if (!hasTerminator && pending.length - scannedLength < MIN_SCAN_SIZE) continue;

            const result = splitStatements(pending, this._dialect, { terminator });
            pending = result.rest;
            scannedLength = pending.length;
            terminator = result.terminator;
            await run(result.statements);
         }

         if (!this._isCancelled) {
            pending += decoder.end();
            await run(splitStatements(pending, this._dialect, { terminator, final: true }).statements);
            completed = !this._isCancelled;
         }
      }
      finally {
         await this.close(completed);
         emitProgress(true);
      }
   }
}
