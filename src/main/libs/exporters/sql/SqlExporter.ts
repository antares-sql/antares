import moment = require('moment');

import { BaseExporter } from '../BaseExporter';

/** Converts a value read from the database into an SQL literal */
export type ValueFormatter = (value: unknown) => string;

/** A column whose values are written in the INSERT statements */
export interface DataColumn {
   name: string;
   /** SQL expression read in the SELECT (defaults to the quoted column name) */
   select?: string;
   format: ValueFormatter;
}

/** Plain numbers can be written without quotes */
export const NUMERIC_LITERAL = /^[+-]?(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?$/;

export type ExtraItem = 'functions' | 'views' | 'triggers' | 'routines' | 'schedulers';

/**
 * SQL dump: header, tables (drop, structure, data), SQL to run after the tables (foreign keys,
 * indexes...), extra items (views, triggers, routines...) and footer.
 * Engine exporters implement the statements and the reading of rows.
 */
export abstract class SqlExporter extends BaseExporter {
   protected _commentChar = '--';
   /** SQL to execute after the creation and the data of all tables */
   protected _postTablesSql = '';
   /** Rows of an INSERT ... VALUES statement can be grouped (sqlInsertAfter / sqlInsertDivider options) */
   protected _multiRowInsert = true;
   /** Order of the extra items in the dump */
   protected _extraItemsOrder: ExtraItem[] = ['functions', 'views', 'triggers', 'routines', 'schedulers'];
   /** SQL to execute after the extra items */
   protected _postExtrasSql = '';

   get schemaName () {
      return this._options.schema;
   }

   abstract get host (): string;

   abstract getServerVersion (): Promise<string>;

   /** Identifier quoting */
   abstract quoteName (name: string): string;

   /** Opens the resources used by the dump (e.g. a connection with a consistent snapshot) */
   async prepare (): Promise<void> {
      return undefined;
   }

   async dump () {
      await this.prepare();

      const { includes } = this._options;
      const extraItems = this._extraItemsOrder.filter(key => includes[key]);
      const totalTableToProcess = this._tables.filter(
         t => t.includeStructure || t.includeContent || t.includeDropStatement
      ).length;
      const processingItemCount = totalTableToProcess + extraItems.length;

      const exportState = {
         totalItems: processingItemCount,
         currentItemIndex: 0,
         currentItem: '',
         op: ''
      };

      const header = await this.getSqlHeader();
      await this.writeString(header);
      await this.writeString('\n\n\n');

      for (const item of this._tables) {
         // user abort operation
         if (this.isCancelled) return;

         // skip item if not set to output any detail for them
         if (
            !item.includeStructure &&
            !item.includeContent &&
            !item.includeDropStatement
         )
            continue;

         exportState.currentItemIndex++;
         exportState.currentItem = item.table;
         exportState.op = 'FETCH';

         this.emitUpdate(exportState);

         const tableHeader = this.buildComment(
            `Dump of table ${item.table}\n------------------------------------------------------------`
         );
         await this.writeString(tableHeader);
         await this.writeString('\n\n');

         if (item.includeDropStatement) {
            const dropTableSyntax = this.getDropTable(item.table);
            await this.writeString(dropTableSyntax);
            await this.writeString('\n\n');
         }

         if (item.includeStructure) {
            const createTableSyntax = await this.getCreateTable(item.table);
            await this.writeString(createTableSyntax);
            await this.writeString('\n\n');
         }

         if (item.includeContent) {
            exportState.op = 'WRITE';
            this.emitUpdate(exportState);
            await this.writeTableData(item.table);
            if (this.isCancelled) return;
            await this.writeString('\n\n');
         }

         await this.writeString('\n\n');
      }

      // SQL to execute after tables creation
      if (this._postTablesSql) {
         await this.writeString(this._postTablesSql);
         await this.writeString('\n\n');
      }

      for (const item of extraItems) {
         if (this.isCancelled) return;

         exportState.currentItemIndex++;
         exportState.currentItem = item;
         exportState.op = 'PROCESSING';
         this.emitUpdate(exportState);

         const data = await this.getExtraItem(item);
         if (data) {
            const header =
               this.buildComment(
                  `Dump of ${item}\n------------------------------------------------------------`
               ) + '\n\n';

            await this.writeString(header);
            await this.writeString(data);
            await this.writeString('\n\n');
         }
      }

      if (this._postExtrasSql) {
         await this.writeString(this._postExtrasSql);
         await this.writeString('\n\n');
      }

      const footer = await this.getFooter();
      await this.writeString(footer);
   }

   /** SQL of views, triggers, routines...: empty if the engine has none */
   protected getExtraItem (item: ExtraItem): Promise<string> {
      switch (item) {
         case 'views': return this.getViews();
         case 'triggers': return this.getTriggers();
         case 'functions': return this.getFunctions();
         case 'routines': return this.getRoutines();
         case 'schedulers': return this.getSchedulers();
         default: return Promise.resolve('');
      }
   }

   /**
    * INSERT statements of a table, streamed: rows are never all in memory.
    * The statements before/after the data are written only if the table has rows.
    */
   async writeTableData (tableName: string) {
      const columns = await this.getDataColumns(tableName);
      if (!columns.length) return;

      const { sqlInsertDivider, sqlInsertAfter } = this._options;
      const maxRows = sqlInsertDivider === 'rows' ? Math.max(1, Number(sqlInsertAfter) || 1) : Infinity;
      const maxLength = sqlInsertDivider === 'bytes' ? Math.max(1, Number(sqlInsertAfter) || 1) * 1024 : Infinity;
      const insertHead = this.getInsertHead(tableName, columns);
      const formatters = columns.map(column => column.format);
      const columnsCount = formatters.length;

      let hasRows = false;
      let statementRows = 0;
      let statementLength = 0;

      for await (const row of this.streamRows(tableName, columns)) {
         if (this.isCancelled) return; // Leaving the loop closes the stream

         if (!hasRows) {
            hasRows = true;
            await this.writeString(this.getBeforeTableData(tableName));
         }

         let tuple = '(';
         for (let i = 0; i < columnsCount; i++) {
            if (i) tuple += ', ';
            tuple += formatters[i](row[i]);
         }
         tuple += ')';

         let sql: string;
         if (!this._multiRowInsert)
            sql = `${insertHead} ${tuple};\n`;
         else {
            sql = statementRows === 0 ? `${insertHead}\n\t${tuple}` : `,\n\t${tuple}`;
            statementRows++;
            statementLength += sql.length;

            if (statementRows >= maxRows || statementLength >= maxLength) {
               sql += ';\n';
               statementRows = 0;
               statementLength = 0;
            }
         }

         await this.writeString(sql);
      }

      if (statementRows > 0)
         await this.writeString(';\n');

      if (hasRows)
         await this.writeString(this.getAfterTableData(tableName));
   }

   /** Columns to dump, in the order of the rows returned by streamRows */
   abstract getDataColumns (tableName: string): Promise<DataColumn[]>;

   /** Rows of the table as arrays of values in the order of the columns */
   abstract streamRows (tableName: string, columns: DataColumn[]): AsyncIterable<unknown[]>;

   /** e.g. INSERT INTO "table" ("a", "b") VALUES */
   getInsertHead (tableName: string, columns: DataColumn[]) {
      return `INSERT INTO ${this.quoteName(tableName)} (${columns.map(c => this.quoteName(c.name)).join(', ')}) VALUES`;
   }

   /** SQL written before the INSERT statements of a table with rows */
   // eslint-disable-next-line @typescript-eslint/no-unused-vars
   getBeforeTableData (_tableName: string) {
      return '';
   }

   /** SQL written after the INSERT statements of a table with rows */
   // eslint-disable-next-line @typescript-eslint/no-unused-vars
   getAfterTableData (_tableName: string) {
      return '';
   }

   /**
    * Generic literal of a value, by its JavaScript type. Strings are written as read: dates and times
    * keep the server format, precision and time zone.
    */
   formatValue (value: unknown, quoteString: (value: string) => string, blobLiteral: (data: Buffer) => string): string {
      if (value === null || value === undefined) return 'NULL';

      switch (typeof value) {
         case 'string':
            return quoteString(value);
         case 'number':
            return Number.isFinite(value) ? String(value) : quoteString(String(value));
         case 'bigint':
            return String(value);
         case 'boolean':
            return value ? 'TRUE' : 'FALSE';
      }

      if (value instanceof Uint8Array) return blobLiteral(Buffer.from(value.buffer, value.byteOffset, value.byteLength));
      if (value instanceof Date) return quoteString(moment(value).format('YYYY-MM-DD HH:mm:ss.SSS'));

      return quoteString(JSON.stringify(value));
   }

   buildComment (text: string) {
      return text
         .split('\n')
         .map(txt => `${this._commentChar} ${txt}`)
         .join('\n');
   }

   async getSqlHeader () {
      const serverVersion = await this.getServerVersion();
      const header = `************************************************************
Antares - SQL Client
Version ${process.env.PACKAGE_VERSION}

https://antares-sql.app/
https://github.com/antares-sql/antares

Host: ${this.host} (${serverVersion})
Database: ${this.schemaName}
Generation time: ${moment().format()}
************************************************************`;

      return this.buildComment(header);
   }

   async getFooter () {
      return this.buildComment(`Dump completed on ${moment().format()}`);
   }

   abstract getCreateTable (tableName: string): Promise<string>;

   abstract getDropTable (tableName: string): string;

   async getViews () {
      return '';
   }

   async getTriggers () {
      return '';
   }

   async getSchedulers () {
      return '';
   }

   async getFunctions () {
      return '';
   }

   async getRoutines () {
      return '';
   }
}
