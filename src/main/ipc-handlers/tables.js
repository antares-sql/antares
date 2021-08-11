import { ipcMain } from 'electron';
import faker from 'faker';
import moment from 'moment';
import { sqlEscaper } from 'common/libs/sqlEscaper';
import { TEXT, LONG_TEXT, ARRAY, TEXT_SEARCH, NUMBER, FLOAT, BLOB, BIT, DATE, DATETIME } from 'common/fieldTypes';
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

   ipcMain.handle('get-table-data', async (event, { uid, schema, table, limit, page, sortParams }) => {
      try {
         const offset = (page - 1) * limit;
         const query = connections[uid]
            .select('*')
            .schema(schema)
            .from(table)
            .limit(limit)
            .offset(offset);

         if (sortParams && sortParams.field && sortParams.dir)
            query.orderBy({ [sortParams.field]: sortParams.dir.toUpperCase() });

         const result = await query.run({ details: true, schema });

         return { status: 'success', response: result };
      }
      catch (err) {
         return { status: 'error', response: err.toString() };
      }
   });

   ipcMain.handle('get-table-count', async (event, params) => {
      try {
         const result = await connections[params.uid].getTableApproximateCount(params);
         return { status: 'success', response: result };
      }
      catch (err) {
         return { status: 'error', response: err.toString() };
      }
   });

   ipcMain.handle('get-table-options', async (event, params) => {
      try {
         const result = await connections[params.uid].getTableOptions(params);
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
      delete params.row._id;

      try { // TODO: move to client classes
         let escapedParam;
         let reload = false;
         const id = typeof params.id === 'number' ? params.id : `"${params.id}"`;

         if ([...NUMBER, ...FLOAT].includes(params.type))
            escapedParam = params.content;
         else if ([...TEXT, ...LONG_TEXT].includes(params.type)) {
            switch (connections[params.uid]._client) {
               case 'mysql':
               case 'maria':
                  escapedParam = `"${sqlEscaper(params.content)}"`;
                  break;
               case 'pg':
                  escapedParam = `'${params.content.replaceAll('\'', '\'\'')}'`;
                  break;
            }
         }
         else if (ARRAY.includes(params.type))
            escapedParam = `'${params.content}'`;
         else if (TEXT_SEARCH.includes(params.type))
            escapedParam = `'${params.content.replaceAll('\'', '\'\'')}'`;
         else if (BLOB.includes(params.type)) {
            if (params.content) {
               let fileBlob;

               switch (connections[params.uid]._client) {
                  case 'mysql':
                  case 'maria':
                     fileBlob = fs.readFileSync(params.content);
                     escapedParam = `0x${fileBlob.toString('hex')}`;
                     break;
                  case 'pg':
                     fileBlob = fs.readFileSync(params.content);
                     escapedParam = `decode('${fileBlob.toString('hex')}', 'hex')`;
                     break;
               }
               reload = true;
            }
            else {
               switch (connections[params.uid]._client) {
                  case 'mysql':
                  case 'maria':
                     escapedParam = '\'\'';
                     break;
                  case 'pg':
                     escapedParam = 'decode(\'\', \'hex\')';
                     break;
               }
            }
         }
         else if ([...BIT].includes(params.type)) {
            escapedParam = `b'${sqlEscaper(params.content)}'`;
            reload = true;
         }
         else if (params.content === null)
            escapedParam = 'NULL';
         else
            escapedParam = `'${sqlEscaper(params.content)}'`;

         if (params.primary) { // TODO: handle multiple primary
            await connections[params.uid]
               .update({ [params.field]: `= ${escapedParam}` })
               .schema(params.schema)
               .from(params.table)
               .where({ [params.primary]: `= ${id}` })
               .limit(1)
               .run();
         }
         else {
            const { orgRow } = params;
            reload = true;

            for (const key in orgRow) {
               if (typeof orgRow[key] === 'string')
                  orgRow[key] = `'${orgRow[key]}'`;

               orgRow[key] = `= ${orgRow[key]}`;
            }

            await connections[params.uid]
               .schema(params.schema)
               .update({ [params.field]: `= ${escapedParam}` })
               .from(params.table)
               .where(orgRow)
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
         const idString = params.rows.map(row => {
            const fieldName = Object.keys(row)[0].includes('.') ? `${params.table}.${params.primary}` : params.primary;

            return typeof row[fieldName] === 'string'
               ? `"${row[fieldName]}"`
               : row[fieldName];
         }).join(',');

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
      try { // TODO: move to client classes
         const insertObj = {};
         for (const key in params.row) {
            const type = params.fields[key];
            let escapedParam;

            if (params.row[key] === null)
               escapedParam = 'NULL';
            else if ([...NUMBER, ...FLOAT].includes(type))
               escapedParam = +params.row[key];
            else if ([...TEXT, ...LONG_TEXT].includes(type)) {
               switch (connections[params.uid]._client) {
                  case 'mysql':
                  case 'maria':
                     escapedParam = `"${sqlEscaper(params.row[key].value)}"`;
                     break;
                  case 'pg':
                     escapedParam = `'${params.row[key].value.replaceAll('\'', '\'\'')}'`;
                     break;
               }
            }
            else if (BLOB.includes(type)) {
               if (params.row[key].value) {
                  let fileBlob;

                  switch (connections[params.uid]._client) {
                     case 'mysql':
                     case 'maria':
                        fileBlob = fs.readFileSync(params.row[key].value);
                        escapedParam = `0x${fileBlob.toString('hex')}`;
                        break;
                     case 'pg':
                        fileBlob = fs.readFileSync(params.row[key].value);
                        escapedParam = `decode('${fileBlob.toString('hex')}', 'hex')`;
                        break;
                  }
               }
               else {
                  switch (connections[params.uid]._client) {
                     case 'mysql':
                     case 'maria':
                        escapedParam = '""';
                        break;
                     case 'pg':
                        escapedParam = 'decode(\'\', \'hex\')';
                        break;
                  }
               }
            }

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
      try { // TODO: move to client classes
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
                  else if ([...TEXT, ...LONG_TEXT].includes(type)) {
                     switch (connections[params.uid]._client) {
                        case 'mysql':
                        case 'maria':
                           escapedParam = `"${sqlEscaper(params.row[key].value)}"`;
                           break;
                        case 'pg':
                           escapedParam = `'${params.row[key].value.replaceAll('\'', '\'\'')}'`;
                           break;
                     }
                  }
                  else if (BLOB.includes(type)) {
                     if (params.row[key].value) {
                        let fileBlob;

                        switch (connections[params.uid]._client) {
                           case 'mysql':
                           case 'maria':
                              fileBlob = fs.readFileSync(params.row[key].value);
                              escapedParam = `0x${fileBlob.toString('hex')}`;
                              break;
                           case 'pg':
                              fileBlob = fs.readFileSync(params.row[key].value);
                              escapedParam = `decode('${fileBlob.toString('hex')}', 'hex')`;
                              break;
                        }
                     }
                     else {
                        switch (connections[params.uid]._client) {
                           case 'mysql':
                           case 'maria':
                              escapedParam = '""';
                              break;
                           case 'pg':
                              escapedParam = 'decode(\'\', \'hex\')';
                              break;
                        }
                     }
                  }
                  else if (BIT.includes(type))
                     escapedParam = `b'${sqlEscaper(params.row[key].value)}'`;
                  else
                     escapedParam = `'${sqlEscaper(params.row[key].value)}'`;

                  insertObj[key] = escapedParam;
               }
               else { // Faker value
                  const parsedParams = {};
                  let fakeValue;

                  if (params.locale)
                     faker.locale = params.locale;

                  if (Object.keys(params.row[key].params).length) {
                     Object.keys(params.row[key].params).forEach(param => {
                        if (!isNaN(params.row[key].params[param]))
                           parsedParams[param] = +params.row[key].params[param];
                     });
                     fakeValue = faker[params.row[key].group][params.row[key].method](parsedParams);
                  }
                  else
                     fakeValue = faker[params.row[key].group][params.row[key].method]();

                  if (typeof fakeValue === 'string') {
                     if (params.row[key].length)
                        fakeValue = fakeValue.substr(0, params.row[key].length);
                     fakeValue = `'${sqlEscaper(fakeValue)}'`;
                  }
                  else if ([...DATE, ...DATETIME].includes(type))
                     fakeValue = `'${moment(fakeValue).format('YYYY-MM-DD HH:mm:ss.SSSSSS')}'`;

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
            .select(`${column} AS foreign_column`)
            .schema(schema)
            .from(table)
            .orderBy('foreign_column ASC');

         if (description)
            query.select(`LEFT(${description}, 20) AS foreign_description`);

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

   ipcMain.handle('duplicate-table', async (event, params) => {
      try {
         await connections[params.uid].duplicateTable(params);
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
