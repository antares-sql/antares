import { ipcMain } from 'electron';
import { sqlEscaper } from 'common/libs/sqlEscaper';
import { TEXT, LONG_TEXT, NUMBER, BLOB } from 'common/fieldTypes';
import fs from 'fs';

export default (connections) => {
   ipcMain.handle('get-table-columns', async (event, params) => {
      try {
         const result = await connections[params.uid].getTableColumns(params);
         return { status: 'success', response: result };
      }
      catch (err) {
         return { status: 'error', response: err.toString() };
      }
   });

   ipcMain.handle('get-table-data', async (event, { uid, schema, table }) => {
      try {
         const result = await connections[uid]
            .select('*')
            .schema(schema)
            .from(table)
            .limit(1000)
            .run();

         return { status: 'success', response: result };
      }
      catch (err) {
         return { status: 'error', response: err.toString() };
      }
   });

   ipcMain.handle('get-key-usage', async (event, params) => {
      try {
         const result = await connections[params.uid].getKeyUsage(params);

         return { status: 'success', response: result };
      }
      catch (err) {
         return { status: 'error', response: err.toString() };
      }
   });

   ipcMain.handle('update-table-cell', async (event, params) => {
      try {
         let escapedParam;
         let reload = false;
         const id = typeof params.id === 'number' ? params.id : `"${params.id}"`;

         if (NUMBER.includes(params.type))
            escapedParam = params.content;
         else if ([...TEXT, ...LONG_TEXT].includes(params.type))
            escapedParam = `"${sqlEscaper(params.content)}"`;
         else if (BLOB.includes(params.type)) {
            if (params.content) {
               const fileBlob = fs.readFileSync(params.content);
               escapedParam = `0x${fileBlob.toString('hex')}`;
               reload = true;
            }
            else
               escapedParam = '""';
         }
         else
            escapedParam = `"${sqlEscaper(params.content)}"`;

         await connections[params.uid]
            .update({ [params.field]: `= ${escapedParam}` })
            .schema(params.schema)
            .from(params.table)
            .where({ [params.primary]: `= ${id}` })
            .run();

         return { status: 'success', response: { reload } };
      }
      catch (err) {
         return { status: 'error', response: err.toString() };
      }
   });

   ipcMain.handle('delete-table-rows', async (event, params) => {
      try {
         const result = await connections[params.uid]
            .schema(params.schema)
            .delete(params.table)
            .where({ [params.primary]: `IN (${params.rows.join(',')})` })
            .run();

         return { status: 'success', response: result };
      }
      catch (err) {
         return { status: 'error', response: err.toString() };
      }
   });

   ipcMain.handle('insert-table-rows', async (event, params) => {
      try {
         const insertObj = {};
         for (const key in params.row) {
            const type = params.fields[key];
            let escapedParam;

            if (params.row[key] === null)
               escapedParam = 'NULL';
            else if (NUMBER.includes(type))
               escapedParam = params.row[key];
            else if ([...TEXT, ...LONG_TEXT].includes(type))
               escapedParam = `"${sqlEscaper(params.row[key])}"`;
            else if (BLOB.includes(type)) {
               if (params.row[key]) {
                  const fileBlob = fs.readFileSync(params.row[key]);
                  escapedParam = `0x${fileBlob.toString('hex')}`;
               }
               else
                  escapedParam = '""';
            }
            else
               escapedParam = `"${sqlEscaper(params.row[key])}"`;

            insertObj[key] = escapedParam;
         }

         for (let i = 0; i < params.repeat; i++) {
            await connections[params.uid]
               .schema(params.schema)
               .into(params.table)
               .insert(insertObj)
               .run();
         }

         return { status: 'success' };
      }
      catch (err) {
         return { status: 'error', response: err.toString() };
      }
   });

   ipcMain.handle('get-foreign-list', async (event, { uid, schema, table, column, description }) => {
      try {
         const query = connections[uid]
            .select(`${column} AS foreignColumn`)
            .schema(schema)
            .from(table)
            .orderBy('foreignColumn ASC');

         if (description)
            query.select(`LEFT(${description}, 20) AS foreignDescription`);

         const results = await query.run();

         return { status: 'success', response: results };
      }
      catch (err) {
         return { status: 'error', response: err.toString() };
      }
   });
};
