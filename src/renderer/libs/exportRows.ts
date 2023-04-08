import { ClientCode } from 'common/interfaces/antares';
import { jsonToSqlInsert } from 'common/libs/sqlUtils';

export const exportRows = (args: {
   type: 'csv' | 'json'| 'sql';
   content: object[];
   table: string;
   client?: ClientCode;
   fields?: {
      [key: string]: {type: string; datePrecision: number};
   };
   sqlOptions?: {sqlInsertAfter: number; sqlInsertDivider: 'bytes' | 'rows'};
}) => {
   let mime;
   let content;

   switch (args.type) {
      case 'csv': {
         mime = 'text/csv';
         const csv = [];

         if (args.content.length)
            csv.push(Object.keys(args.content[0]).join(';'));

         for (const row of args.content) {
            csv.push(Object.values(row).map(col => {
               if (typeof col === 'string') return `"${col}"`;
               if (col instanceof Buffer) return col.toString('base64');
               if (col instanceof Uint8Array) return Buffer.from(col).toString('base64');
               return col;
            }).join(';'));
         }

         content = csv.join('\n');
         break;
      }
      case 'sql': {
         mime = 'text/sql';
         const sql = jsonToSqlInsert({
            json: args.content,
            client:
            args.client,
            fields: args.fields,
            table: args.table,
            options: args.sqlOptions
         });

         content = sql;
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
   downloadLink.download = `${args.table}.${args.type}`;
   downloadLink.href = window.URL.createObjectURL(file);
   downloadLink.style.display = 'none';
   document.body.appendChild(downloadLink);
   downloadLink.click();
   downloadLink.remove();
};
