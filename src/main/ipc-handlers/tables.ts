import customizations from 'common/customizations';
import { ARRAY, BIT, BLOB, BOOLEAN, DATE, DATETIME, FLOAT, LONG_TEXT, NUMBER, TEXT, TEXT_SEARCH } from 'common/fieldTypes';
import * as antares from 'common/interfaces/antares';
import { InsertRowsParams } from 'common/interfaces/tableApis';
import { fakerCustom } from 'common/libs/fakerCustom';
import { formatJsonForSqlWhere, sqlEscaper } from 'common/libs/sqlUtils';
import { ipcMain } from 'electron';
import * as fs from 'fs';
import * as moment from 'moment';

import { validateSender } from '../libs/misc/validateSender';

export default (connections: Record<string, antares.Client>) => {
   ipcMain.handle('get-table-columns', async (event, params) => {
      if (!validateSender(event.senderFrame)) return { status: 'error', response: 'Unauthorized process' };

      try {
         const result = await connections[params.uid].getTableColumns(params);
         return { status: 'success', response: result };
      }
      catch (err) {
         return { status: 'error', response: err.toString() };
      }
   });

   ipcMain.handle('get-table-data', async (event, { uid, schema, table, limit, page, sortParams, where }) => {
      if (!validateSender(event.senderFrame)) return { status: 'error', response: 'Unauthorized process' };

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

         if (where)
            query.where(where);

         const result = await query.run({ details: true, schema });

         return { status: 'success', response: result };
      }
      catch (err) {
         return { status: 'error', response: err.toString() };
      }
   });

   ipcMain.handle('get-table-count', async (event, params) => {
      if (!validateSender(event.senderFrame)) return { status: 'error', response: 'Unauthorized process' };

      try {
         const result = await connections[params.uid].getTableApproximateCount(params);
         return { status: 'success', response: result };
      }
      catch (err) {
         return { status: 'error', response: err.toString() };
      }
   });

   ipcMain.handle('get-table-options', async (event, params) => {
      if (!validateSender(event.senderFrame)) return { status: 'error', response: 'Unauthorized process' };

      try {
         const result = await connections[params.uid].getTableOptions(params);
         return { status: 'success', response: result };
      }
      catch (err) {
         return { status: 'error', response: err.toString() };
      }
   });

   ipcMain.handle('get-table-indexes', async (event, params) => {
      if (!validateSender(event.senderFrame)) return { status: 'error', response: 'Unauthorized process' };

      try {
         const result = await connections[params.uid].getTableIndexes(params);

         return { status: 'success', response: result };
      }
      catch (err) {
         return { status: 'error', response: err.toString() };
      }
   });

   ipcMain.handle('get-table-checks', async (event, params) => {
      if (!validateSender(event.senderFrame)) return { status: 'error', response: 'Unauthorized process' };

      try {
         const result = await connections[params.uid].getTableChecks(params);

         return { status: 'success', response: result };
      }
      catch (err) {
         return { status: 'error', response: err.toString() };
      }
   });

   ipcMain.handle('get-table-ddl', async (event, params) => {
      if (!validateSender(event.senderFrame)) return { status: 'error', response: 'Unauthorized process' };

      try {
         const result = await connections[params.uid].getTableDll(params);

         return { status: 'success', response: result };
      }
      catch (err) {
         return { status: 'error', response: err.toString() };
      }
   });

   ipcMain.handle('get-key-usage', async (event, params) => {
      if (!validateSender(event.senderFrame)) return { status: 'error', response: 'Unauthorized process' };

      try {
         const result = await connections[params.uid].getKeyUsage(params);

         return { status: 'success', response: result };
      }
      catch (err) {
         return { status: 'error', response: err.toString() };
      }
   });

   ipcMain.handle('update-table-cell', async (event, params) => {
      if (!validateSender(event.senderFrame)) return { status: 'error', response: 'Unauthorized process' };

      delete params.row._antares_id;
      const { stringsWrapper: sw } = customizations[connections[params.uid]._client];

      try { // TODO: move to client classes
         let escapedParam;
         let reload = false;
         const id = typeof params.id === 'number' ? params.id : `${sw}${params.id}${sw}`;

         if ([...NUMBER, ...FLOAT].includes(params.type))
            escapedParam = params.content;
         else if ([...TEXT, ...LONG_TEXT].includes(params.type)) {
            switch (connections[params.uid]._client) {
               case 'mysql':
               case 'maria':
                  escapedParam = `"${sqlEscaper(params.content)}"`;
                  break;
               case 'pg':
               case 'sqlite':
               case 'firebird':
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
                  case 'firebird':
                     fileBlob = fs.readFileSync(params.content);
                     escapedParam = `decode('${fileBlob.toString('hex')}', 'hex')`;
                     break;
                  case 'sqlite':
                     fileBlob = fs.readFileSync(params.content);
                     escapedParam = `X'${fileBlob.toString('hex')}'`;
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
                  case 'firebird':
                     escapedParam = 'decode(\'\', \'hex\')';
                     break;
                  case 'sqlite':
                     escapedParam = 'X\'\'';
                     break;
               }
            }
         }
         else if (BIT.includes(params.type)) {
            escapedParam = `b'${sqlEscaper(params.content)}'`;
            reload = true;
         }
         else if (BOOLEAN.includes(params.type)) {
            switch (connections[params.uid]._client) {
               case 'mysql':
               case 'maria':
               case 'pg':
               case 'firebird':
                  escapedParam = params.content;
                  break;
               case 'sqlite':
                  escapedParam = Number(params.content === 'true');
                  break;
            }
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
            delete orgRow._antares_id;

            reload = true;

            for (const key in orgRow) {
               if (typeof orgRow[key] === 'string')
                  orgRow[key] = ` = '${orgRow[key]}'`;
               else if (typeof orgRow[key] === 'object' && orgRow[key] !== null)
                  orgRow[key] = formatJsonForSqlWhere(orgRow[key], connections[params.uid]._client);
               else if (orgRow[key] === null)
                  orgRow[key] = `IS ${orgRow[key]}`;
               else
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
      if (!validateSender(event.senderFrame)) return { status: 'error', response: 'Unauthorized process' };

      if (params.primary) {
         // eslint-disable-next-line @typescript-eslint/no-explicit-any
         const idString = params.rows.map((row: Record<string, any>) => {
            const fieldName = Object.keys(row)[0].includes('.') ? `${params.table}.${params.primary}` : params.primary;

            return typeof row[fieldName] === 'string'
               ? `'${row[fieldName]}'`
               : row[fieldName];
         }).join(',');

         try {
            const result: unknown = await connections[params.uid]
               .schema(params.schema)
               .delete(params.table)
               .where({ [params.primary]: `IN (${idString})` })
               .limit(params.rows.length)
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

                  if (row[key] === null)
                     row[key] = 'IS NULL';
                  else
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

   ipcMain.handle('insert-table-fake-rows', async (event, params: InsertRowsParams) => {
      if (!validateSender(event.senderFrame)) return { status: 'error', response: 'Unauthorized process' };

      try { // TODO: move to client classes
         const rows: Record<string, string | number | boolean | Date | Buffer>[] = [];

         for (let i = 0; i < +params.repeat; i++) {
            const insertObj: Record<string, string | number | boolean | Date | Buffer> = {};

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
                        case 'sqlite':
                        case 'firebird':
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
                  const parsedParams: Record<string, string | number | boolean | Date | Buffer> = {};
                  let fakeValue;

                  if (params.locale)
                     fakerCustom.locale = params.locale;

                  if (Object.keys(params.row[key].params).length) {
                     Object.keys(params.row[key].params).forEach(param => {
                        if (!isNaN(params.row[key].params[param]))// Converts string numerics params to number
                           parsedParams[param] = Number(params.row[key].params[param]);
                     });
                     // eslint-disable-next-line @typescript-eslint/no-explicit-any
                     fakeValue = (fakerCustom as any)[params.row[key].group][params.row[key].method](parsedParams);
                  }
                  else
                     // eslint-disable-next-line @typescript-eslint/no-explicit-any
                     fakeValue = (fakerCustom as any)[params.row[key].group][params.row[key].method]();

                  if (typeof fakeValue === 'string') {
                     if (params.row[key].length)
                        fakeValue = fakeValue.substring(0, params.row[key].length);

                     switch (connections[params.uid]._client) {
                        case 'mysql':
                        case 'maria':
                           fakeValue = `'${sqlEscaper(fakeValue)}'`;
                           break;
                        case 'pg':
                        case 'sqlite':
                        case 'firebird':
                           fakeValue = `'${fakeValue.replaceAll('\'', '\'\'')}'`;
                           break;
                     }
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
      if (!validateSender(event.senderFrame)) return { status: 'error', response: 'Unauthorized process' };

      try {
         const query = connections[uid]
            .select(`${column} AS foreign_column`)
            .schema(schema)
            .from(table)
            .orderBy('foreign_column ASC');

         if (description)
            query.select(`LEFT(${description}, 20) AS foreign_description`);

         const results = await query.run<Record<string, string>>();

         const parsedResults: Record<string, string>[] = [];

         for (const row of results.rows) {
            const remappedRow: Record<string, string> = {};

            for (const key in row)
               remappedRow[key.toLowerCase()] = row[key];// Thanks Firebird -.-

            parsedResults.push(remappedRow);
         }

         results.rows = parsedResults;

         return { status: 'success', response: results };
      }
      catch (err) {
         return { status: 'error', response: err.toString() };
      }
   });

   ipcMain.handle('create-table', async (event, params) => {
      if (!validateSender(event.senderFrame)) return { status: 'error', response: 'Unauthorized process' };

      try {
         await connections[params.uid].createTable(params);
         return { status: 'success' };
      }
      catch (err) {
         return { status: 'error', response: err.toString() };
      }
   });

   ipcMain.handle('alter-table', async (event, params) => {
      if (!validateSender(event.senderFrame)) return { status: 'error', response: 'Unauthorized process' };

      try {
         await connections[params.uid].alterTable(params);
         return { status: 'success' };
      }
      catch (err) {
         return { status: 'error', response: err.toString() };
      }
   });

   ipcMain.handle('duplicate-table', async (event, params) => {
      if (!validateSender(event.senderFrame)) return { status: 'error', response: 'Unauthorized process' };

      try {
         await connections[params.uid].duplicateTable(params);
         return { status: 'success' };
      }
      catch (err) {
         return { status: 'error', response: err.toString() };
      }
   });

   ipcMain.handle('truncate-table', async (event, params) => {
      if (!validateSender(event.senderFrame)) return { status: 'error', response: 'Unauthorized process' };

      try {
         await connections[params.uid].truncateTable(params);
         return { status: 'success' };
      }
      catch (err) {
         return { status: 'error', response: err.toString() };
      }
   });

   ipcMain.handle('drop-table', async (event, params) => {
      if (!validateSender(event.senderFrame)) return { status: 'error', response: 'Unauthorized process' };

      try {
         await connections[params.uid].dropTable(params);
         return { status: 'success' };
      }
      catch (err) {
         return { status: 'error', response: err.toString() };
      }
   });
};
