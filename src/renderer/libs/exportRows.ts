import { ClientCode } from 'common/interfaces/antares';
import { jsonToSqlInsert } from 'common/libs/sqlUtils';
import * as json2php from 'json2php';
import * as moment from 'moment';

export type ExportFormat = 'csv' | 'json' | 'sql' | 'php' | 'md';

export interface ExportRowsArgs {
   type: ExportFormat;
   content: object[];
   table: string;
   page?: number;
   client?: ClientCode;
   fields?: {
      [key: string]: {type: string; datePrecision: number};
   };
   sqlOptions?: {
      sqlInsertAfter: number;
      sqlInsertDivider: 'bytes' | 'rows';
      targetTable: string;
   };
   csvOptions?: {
      header: boolean;
      fieldDelimiter: string;
      linesTerminator: string;
      stringDelimiter: string;
   };
}

export const DEFAULT_CSV_OPTIONS: ExportRowsArgs['csvOptions'] = {
   header: true,
   fieldDelimiter: ';',
   linesTerminator: '\\n',
   stringDelimiter: 'double'
};

const MIME_TYPES: Record<ExportFormat, string> = {
   csv: 'text/csv',
   json: 'application/json',
   sql: 'text/sql',
   php: 'application/x-httpd-php',
   md: 'text/markdown'
};

// Cells wider than this are not used to pad the whole column, so a single long text value doesn't bloat every row
const MD_MAX_PAD_WIDTH = 40;

const markdownCell = (col: unknown): string => {
   let value: string;

   if (col === null || col === undefined) value = 'NULL';
   else if (col instanceof Date) value = moment(col).format('YYYY-MM-DD HH:mm:ss');
   else if (col instanceof Buffer) value = col.toString('base64');
   else if (col instanceof Uint8Array) value = Buffer.from(col).toString('base64');
   else if (typeof col === 'object') value = JSON.stringify(col);
   else value = String(col);

   return value
      .replaceAll('|', '\\|')
      .replace(/\r\n|\r|\n/g, '<br>');
};

const rowsToMarkdown = (rows: object[]): string => {
   if (!rows.length) return '';

   const headers = Object.keys(rows[0]);
   const rawRows = rows.map(row => Object.values(row));
   const body = rawRows.map(row => row.map(markdownCell));
   const isNumeric = headers.map((_, i) => {
      const values = rawRows.map(row => row[i]).filter(val => val !== null && val !== undefined);
      return values.length > 0 && values.every(val => typeof val === 'number' || typeof val === 'bigint');
   });
   const widths = headers.map((header, i) => Math.min(
      MD_MAX_PAD_WIDTH,
      Math.max(3, header.length, ...body.map(cells => cells[i].length))
   ));

   const formatLine = (cells: string[]) => `| ${cells.map((cell, i) => isNumeric[i]
      ? cell.padStart(widths[i])
      : cell.padEnd(widths[i])).join(' | ')} |`;

   const separator = `| ${widths.map((width, i) => isNumeric[i]
      ? `${'-'.repeat(width - 1)}:`
      : '-'.repeat(width)).join(' | ')} |`;

   return [
      formatLine(headers.map(header => markdownCell(header))),
      separator,
      ...body.map(formatLine)
   ].join('\n');
};

/**
 * Serializes rows in the given format
 */
export const formatRows = (args: ExportRowsArgs): string => {
   switch (args.type) {
      case 'csv': {
         const csvOptions = args.csvOptions || DEFAULT_CSV_OPTIONS;
         const csv = [];
         const sd = csvOptions.stringDelimiter === 'single'
            ? '\''
            : csvOptions.stringDelimiter === 'double'
               ? '"'
               : '';

         if (args.content.length && csvOptions.header)
            csv.push(Object.keys(args.content[0]).join(csvOptions.fieldDelimiter));

         for (const row of args.content) {
            csv.push(Object.values(row).map(col => {
               if (typeof col === 'string') return `${sd}${col}${sd}`;
               if (col instanceof Date) return `${sd}${moment(col).format('YYYY-MM-DD HH:mm:ss')}${sd}`;
               if (col instanceof Buffer) return col.toString('base64');
               if (col instanceof Uint8Array) return Buffer.from(col).toString('base64');
               return col;
            }).join(csvOptions.fieldDelimiter));
         }

         return csv.join(csvOptions.linesTerminator.replaceAll('\\n', '\n').replaceAll('\\r', '\r'));
      }
      case 'sql':
         return jsonToSqlInsert({
            json: args.content,
            client: args.client,
            fields: args.fields,
            table: args.sqlOptions?.targetTable || args.table,
            options: args.sqlOptions
         });
      case 'php': {
         const printer = json2php.make({ linebreak: '\n', indent: '\t', shortArraySyntax: true });
         const content = printer(args.content);
         return `<?php\n$${(args.sqlOptions?.targetTable || args.table).replaceAll('-', '_')} = ${content};`;
      }
      case 'json':
         return JSON.stringify(args.content, null, 3);
      case 'md':
         return rowsToMarkdown(args.content);
      default:
         return '';
   }
};

/**
 * Serializes rows in the given format and downloads them as a file
 */
export const exportRows = (args: ExportRowsArgs) => {
   const file = new Blob([formatRows(args)], { type: MIME_TYPES[args.type] });
   const downloadLink = document.createElement('a');
   downloadLink.download = `${args.sqlOptions?.targetTable || args.table}${args.page ? `-${args.page}` : ''}.${args.type}`;
   downloadLink.href = window.URL.createObjectURL(file);
   downloadLink.style.display = 'none';
   document.body.appendChild(downloadLink);
   downloadLink.click();
   downloadLink.remove();
};
