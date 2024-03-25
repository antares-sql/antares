import { ClientCode } from 'common/interfaces/antares';
import { jsonToSqlInsert } from 'common/libs/sqlUtils';
import * as json2php from 'json2php';
import * as moment from 'moment';

export const exportRows = (args: {
   type: 'csv' | 'json'| 'sql' | 'php';
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
}) => {
   let mime;
   let content;

   switch (args.type) {
      case 'csv': {
         mime = 'text/csv';
         const csv = [];
         const sd = args.csvOptions.stringDelimiter === 'single'
            ? '\''
            : args.csvOptions.stringDelimiter === 'double'
               ? '"'
               : '';

         if (args.content.length && args.csvOptions.header)
            csv.push(Object.keys(args.content[0]).join(args.csvOptions.fieldDelimiter));

         for (const row of args.content) {
            csv.push(Object.values(row).map(col => {
               if (typeof col === 'string') return `${sd}${col}${sd}`;
               if (col instanceof Date) return `${sd}${moment(col).format('YYYY-MM-DD HH:mm:ss')}${sd}`;
               if (col instanceof Buffer) return col.toString('base64');
               if (col instanceof Uint8Array) return Buffer.from(col).toString('base64');
               return col;
            }).join(args.csvOptions.fieldDelimiter));
         }

         content = csv.join(args.csvOptions.linesTerminator.replaceAll('\\n', '\n').replaceAll('\\r', '\r'));
         break;
      }
      case 'sql': {
         mime = 'text/sql';
         const sql = jsonToSqlInsert({
            json: args.content,
            client:
            args.client,
            fields: args.fields,
            table: args.sqlOptions?.targetTable || args.table,
            options: args.sqlOptions
         });

         content = sql;
         break;
      }
      case 'php': {
         mime = 'application/x-httpd-php';
         const printer = json2php.make({ linebreak: '\n', indent: '\t', shortArraySyntax: true });
         content = printer(args.content);
         content = `<?php\n$${(args.sqlOptions?.targetTable || args.table).replaceAll('-', '_')} = ${content};`;
         break;
      }
      case 'json':
         mime = 'application/json';
         content = JSON.stringify(args.content, null, 3);
         break;
      default:
         break;
   }

   const file = new Blob([content], { type: mime });
   const downloadLink = document.createElement('a');
   downloadLink.download = `${args.sqlOptions?.targetTable || args.table}${args.page ? `-${args.page}` : ''}.${args.type}`;
   downloadLink.href = window.URL.createObjectURL(file);
   downloadLink.style.display = 'none';
   document.body.appendChild(downloadLink);
   downloadLink.click();
   downloadLink.remove();
};
