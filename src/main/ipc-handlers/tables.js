import { ipcMain } from 'electron';
import faker from 'faker';
import moment from 'moment';
import { sqlEscaper } from 'common/libs/sqlEscaper';
import { TEXT, LONG_TEXT, NUMBER, FLOAT, BLOB, BIT, DATE, DATETIME } from 'common/fieldTypes';
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

   ipcMain.handle('get-table-data', async (event, { uid, schema, table, sortParams }) => {
      try {
         const query = connections[uid]
            .select('*')
            .schema(schema)
            .from(table)
            .limit(1000);

         if (sortParams && sortParams.field && sortParams.dir)
            query.orderBy({ [sortParams.field]: sortParams.dir.toUpperCase() });

         const result = await query.run({ details: true });

         return { status: 'success', response: result };
      }
      catch (err) {
         return { status: 'error', response: err.toString() };
      }
   });

   ipcMain.handle('get-table-indexes', async (event, params) => {
      try {
         const result = await connections[params.uid].getTableIndexes(params);

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

         if ([...NUMBER, ...FLOAT].includes(params.type))
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
         else if ([...BIT].includes(params.type)) {
            escapedParam = `b'${sqlEscaper(params.content)}'`;
            reload = true;
         }
         else
            escapedParam = `"${sqlEscaper(params.content)}"`;

         if (params.primary) {
            await connections[params.uid]
               .update({ [params.field]: `= ${escapedParam}` })
               .schema(params.schema)
               .from(params.table)
               .where({ [params.primary]: `= ${id}` })
               .run();
         }
         else {
            const { row } = params;
            reload = true;

            for (const key in row) {
               if (typeof row[key] === 'string')
                  row[key] = `'${row[key]}'`;

               row[key] = `= ${row[key]}`;
            }

            await connections[params.uid]
               .schema(params.schema)
               .update({ [params.field]: `= ${escapedParam}` })
               .from(params.table)
               .where(row)
               .limit(1)
               .run();
         }

         return { status: 'success', response: { reload } };
      }
      catch (err) {
         return { status: 'error', response: err.toString() };
      }
   });

   ipcMain.handle('delete-table-rows', async (event, params) => {
      if (params.primary) {
         const idString = params.rows.map(row => typeof row[params.primary] === 'string'
            ? `"${row[params.primary]}"`
            : row[params.primary]).join(',');

         try {
            const result = await connections[params.uid]
               .schema(params.schema)
               .delete(params.table)
               .where({ [params.primary]: `IN (${idString})` })
               .run();

            return { status: 'success', response: result };
         }
         catch (err) {
            return { status: 'error', response: err.toString() };
         }
      }
      else {
         try {
            for (const row of params.rows) {
               for (const key in row) {
                  if (typeof row[key] === 'string')
                     row[key] = `'${row[key]}'`;

                  row[key] = `= ${row[key]}`;
               }

               await connections[params.uid]
                  .schema(params.schema)
                  .delete(params.table)
                  .where(row)
                  .limit(1)
                  .run();
            }

            return { status: 'success', response: [] };
         }
         catch (err) {
            return { status: 'error', response: err.toString() };
         }
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
            else if ([...NUMBER, ...FLOAT].includes(type))
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

         const rows = new Array(+params.repeat).fill(insertObj);

         await connections[params.uid]
            .schema(params.schema)
            .into(params.table)
            .insert(rows)
            .run();

         return { status: 'success' };
      }
      catch (err) {
         return { status: 'error', response: err.toString() };
      }
   });

   ipcMain.handle('insert-table-fake-rows', async (event, params) => {
      try {
         const rows = [];

         for (let i = 0; i < +params.repeat; i++) {
            const insertObj = {};

            for (const key in params.row) {
               const type = params.fields[key];
               let escapedParam;

               if (!('group' in params.row[key]) || params.row[key].group === 'manual') { // Manual value
                  if (params.row[key].value === null || params.row[key].value === undefined)
                     escapedParam = 'NULL';
                  else if ([...NUMBER, ...FLOAT].includes(type))
                     escapedParam = params.row[key].value;
                  else if ([...TEXT, ...LONG_TEXT].includes(type))
                     escapedParam = `"${sqlEscaper(params.row[key].value)}"`;
                  else if (BLOB.includes(type)) {
                     if (params.row[key].value) {
                        const fileBlob = fs.readFileSync(params.row[key].value);
                        escapedParam = `0x${fileBlob.toString('hex')}`;
                     }
                     else
                        escapedParam = '""';
                  }
                  else
                     escapedParam = `"${sqlEscaper(params.row[key].value)}"`;

                  insertObj[key] = escapedParam;
               }
               else { // Faker value
                  const parsedParams = {};
                  Object.keys(params.row[key].params).forEach(param => {
                     if (!isNaN(params.row[key].params[param]))
                        parsedParams[param] = +params.row[key].params[param];
                  });

                  let fakeValue = faker[params.row[key].group][params.row[key].method](parsedParams);

                  if (typeof fakeValue === 'string') {
                     if (params.row[key].length)
                        fakeValue = fakeValue.substr(0, params.row[key].length);
                     fakeValue = `"${sqlEscaper(fakeValue)}"`;
                  }
                  else if ([...DATE, ...DATETIME].includes(type))
                     fakeValue = `"${moment(fakeValue).format('YYYY-MM-DD HH:mm:ss.SSSSSS')}"`;

                  insertObj[key] = fakeValue;
               }
            }

            rows.push(insertObj);
         }

         await connections[params.uid]
            .schema(params.schema)
            .into(params.table)
            .insert(rows)
            .run();

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

   ipcMain.handle('create-table', async (event, params) => {
      try {
         await connections[params.uid].createTable(params);
         return { status: 'success' };
      }
      catch (err) {
         return { status: 'error', response: err.toString() };
      }
   });

   ipcMain.handle('alter-table', async (event, params) => {
      try {
         await connections[params.uid].alterTable(params);
         return { status: 'success' };
      }
      catch (err) {
         return { status: 'error', response: err.toString() };
      }
   });

   ipcMain.handle('truncate-table', async (event, params) => {
      try {
         await connections[params.uid].truncateTable(params);
         return { status: 'success' };
      }
      catch (err) {
         return { status: 'error', response: err.toString() };
      }
   });

   ipcMain.handle('drop-table', async (event, params) => {
      try {
         await connections[params.uid].dropTable(params);
         return { status: 'success' };
      }
      catch (err) {
         return { status: 'error', response: err.toString() };
      }
   });
};
