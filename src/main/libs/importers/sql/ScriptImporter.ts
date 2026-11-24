import { ClientCode } from 'common/interfaces/antares';
import { splitStatements } from 'common/libs/sqlScanner';
import * as fs from 'fs';
import { StringDecoder } from 'string_decoder';

import { BaseImporter } from '../BaseImporter';

/** The pending text is split again only once it grew by this size (or got a terminator) */
const MIN_SCAN_SIZE = 64 * 1024;

/** Receives the data that follows a statement in the script (PostgreSQL COPY ... FROM stdin) */
export interface InlineDataSink {
   write (data: string): Promise<void>;
   /** End of the data: resolves when the statement is completed */
   end (): Promise<void>;
   /** The import stops before the end of the data */
   abort (): void;
}

/** Inline data being read: it ends at a line made of "\." (or at the end of the script), like in psql */
interface InlineData {
   sql: string;
   /** Missing when the statement failed: the data is skipped */
   sink?: InlineDataSink;
   /** The rest of the line of the statement is not data */
   skipLine: boolean;
   /** The pending text starts at the beginning of a line */
   lineStart: boolean;
}

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

   /** A statement failed: it is reported and the import goes on */
   protected reportError (sql: string, error: Error) {
      this.emit('query-error', {
         sql,
         message: error.message ?? String(error),
         time: new Date().getTime()
      });
   }

   /** The statement to run (e.g. without client commands): empty to skip it */
   protected prepareStatement (sql: string) {
      return sql;
   }

   /** The statement is followed by inline data, up to a "\." line (PostgreSQL COPY ... FROM stdin) */
   // eslint-disable-next-line @typescript-eslint/no-unused-vars
   protected hasInlineData (_sql: string) {
      return false;
   }

   /** Runs a statement followed by inline data: the data is written to the returned sink */
   // eslint-disable-next-line @typescript-eslint/no-unused-vars
   protected openInlineData (_sql: string): Promise<InlineDataSink> {
      return Promise.reject(new Error('Inline data is not supported'));
   }

   async import (): Promise<void> {
      const { size: fileSize } = await fs.promises.stat(this._options.file);
      const decoder = new StringDecoder('utf8');
      let readPosition = 0;
      let queryCount = 0;
      let pending = '';
      let scannedLength = 0;
      let terminator: string;
      let lastUpdate = 0;
      let data: InlineData | undefined;

      const emitProgress = (force = false) => {
         const now = Date.now();
         if (!force && now - lastUpdate < 200) return;
         lastUpdate = now;
         this.emitUpdate({ fileSize, readPosition, percentage: fileSize ? readPosition / fileSize * 100 : 100, queryCount });
      };

      const reportError = (sql: string, error: Error) => this.reportError(sql, error);

      const runStatement = async (statement: string) => {
         const sql = this.prepareStatement(statement);
         if (!sql) return;
         queryCount++;

         if (this.hasInlineData(sql)) {
            data = { sql, skipLine: true, lineStart: false };
            try {
               data.sink = await this.openInlineData(sql);
            }
            catch (error) {
               reportError(sql, error);
            }
            return;
         }

         try {
            await this.execute(sql);
         }
         catch (error) {
            reportError(sql, error);
         }

         emitProgress();
      };

      const writeData = async (text: string) => {
         if (!text || !data.sink) return;
         try {
            await data.sink.write(text);
         }
         catch (error) {
            // The rest of the data is skipped
            reportError(data.sql, error);
            data.sink.abort();
            data.sink = undefined;
         }
      };

      const endData = async () => {
         try {
            await data.sink?.end();
         }
         catch (error) {
            reportError(data.sql, error);
         }
         data = undefined;
         emitProgress();
      };

      /** Writes the inline data in pending: returns false if the end of the data is not there yet */
      const readData = async (final: boolean) => {
         if (data.skipLine) {
            const newline = pending.indexOf('\n');
            if (newline === -1 && !final) return false;
            pending = newline === -1 ? '' : pending.slice(newline + 1);
            data.skipLine = false;
            data.lineStart = true;
         }

         // Start of the "\." line
         let end = -1;
         if (data.lineStart && pending.startsWith('\\.'))
            end = 0;
         else {
            const newline = pending.indexOf('\n\\.');
            if (newline !== -1) end = newline + 1;
         }

         if (end === -1) {
            if (final) { // Data up to the end of the script
               await writeData(pending);
               pending = '';
               await endData();
               return true;
            }

            // The end of the pending text could be the start of the "\." line
            const keep = pending.endsWith('\n\\') ? 2 : pending.endsWith('\n') || (data.lineStart && pending === '\\') ? 1 : 0;
            const text = pending.slice(0, pending.length - keep);
            await writeData(text);
            pending = pending.slice(text.length);
            if (text) data.lineStart = text.endsWith('\n');
            return false;
         }

         await writeData(pending.slice(0, end));
         const lineEnd = pending.indexOf('\n', end);
         if (lineEnd === -1 && !final) { // The rest of the "\." line is still to read
            pending = pending.slice(end);
            data.lineStart = true;
            return false;
         }

         pending = lineEnd === -1 ? '' : pending.slice(lineEnd + 1);
         await endData();
         return true;
      };

      /** Runs the statements and the inline data in pending: returns when more text is needed */
      const runPending = async (final: boolean) => {
         while (!this._isCancelled) {
            if (data) {
               if (!await readData(final)) return;
               continue;
            }

            const result = splitStatements(pending, this._dialect, { terminator, final });
            terminator = result.terminator;
            let inlineData = false;

            for (let i = 0; i < result.statements.length && !this._isCancelled; i++) {
               await runStatement(result.statements[i]);
               if (data) { // The text after the statement is its data, not SQL
                  pending = pending.slice(result.ends[i]);
                  inlineData = true;
                  break;
               }
            }

            if (inlineData) continue;
            pending = result.rest;
            return;
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
            if (!data && !hasTerminator && pending.length - scannedLength < MIN_SCAN_SIZE) continue;

            await runPending(false);
            scannedLength = pending.length;
         }

         if (!this._isCancelled) {
            pending += decoder.end();
            await runPending(true);
            completed = !this._isCancelled;
         }
      }
      finally {
         data?.sink?.abort();
         await this.close(completed);
         emitProgress(true);
      }
   }
}
