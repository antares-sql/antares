import { DATE, DATETIME } from 'common/fieldTypes';
import { InsertRowsParams } from 'common/interfaces/tableApis';
import { fakerCustom } from 'common/libs/fakerCustom';
import { ipcMain } from 'electron';
import * as fs from 'fs';
import moment = require('moment');

import { DatabaseClient, requireCapability } from '../libs/db/core/contracts';
import { formatValue, rowValueCondition, rowValueLiteral } from '../libs/db/core/formatValue';
import { validateSender } from '../libs/misc/validateSender';
import { createHandle, IpcMainLike } from './handle';

export default (connections: Record<string, DatabaseClient>, ipc: IpcMainLike = ipcMain) => {
   const handle = createHandle(ipc);

   handle('get-table-columns', async (params) => {
      return await connections[params.uid].getTableColumns(params);
   });

   handle('get-table-data', async ({ uid, schema, table, limit, page, sortParams, where }) => {
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

      return result;
   });

   handle('get-table-count', async (params) => {
      return await connections[params.uid].getTableApproximateCount(params);
   });

   handle('get-table-options', async (params) => {
      return await connections[params.uid].getTableOptions(params);
   });

   handle('get-table-indexes', async (params) => {
      const result = await connections[params.uid].getTableIndexes(params);

      return result;
   });

   handle('get-table-checks', async (params) => {
      const result = await requireCapability(connections[params.uid], 'tableCheck').getTableChecks(params);

      return result;
   });

   handle('get-table-ddl', async (params) => {
      const result = await requireCapability(connections[params.uid], 'tableDdl').getTableDll(params);

      return result;
   });

   handle('get-key-usage', async (params) => {
      const result = await connections[params.uid].getKeyUsage(params);

      return result;
   });

   ipc.handle('update-table-cell', async (event, params) => {
      if (!validateSender(event.senderFrame)) return { status: 'error', response: 'Unauthorized process' };

      delete params.row._antares_id;
      const client = connections[params.uid];

      try {
         const { sql: escapedParam, reload: valueReload } = formatValue(client.dialect, params.type, params.content, { readFile: fs.readFileSync });
         let reload = valueReload;
         const id = rowValueLiteral(client.dialect, params.id);

         if (params.primary) { // Single-column key; composite keys use the no-primary path below
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

            for (const key in orgRow)
               orgRow[key] = rowValueCondition(client.dialect, orgRow[key]);

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

   ipc.handle('delete-table-rows', async (event, params) => {
      if (!validateSender(event.senderFrame)) return { status: 'error', response: 'Unauthorized process' };

      const { dialect } = connections[params.uid];

      if (params.primary) {
         // eslint-disable-next-line @typescript-eslint/no-explicit-any
         const idString = params.rows.map((row: Record<string, any>) => {
            const fieldName = Object.keys(row)[0].includes('.') ? `${params.table}.${params.primary}` : params.primary;

            return rowValueLiteral(dialect, row[fieldName]);
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
               for (const key in row)
                  row[key] = rowValueCondition(dialect, row[key]);

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

   ipc.handle('insert-table-fake-rows', async (event, params: InsertRowsParams) => {
      if (!validateSender(event.senderFrame)) return { status: 'error', response: 'Unauthorized process' };

      const client = connections[params.uid];

      try {
         const rows: Record<string, string | number | boolean | Date | Buffer>[] = [];

         for (let i = 0; i < +params.repeat; i++) {
            const insertObj: Record<string, string | number | boolean | Date | Buffer> = {};

            for (const key in params.row) {
               const type = params.fields[key];
               let escapedParam;

               if (!('group' in params.row[key]) || params.row[key].group === 'manual') { // Manual value
                  escapedParam = formatValue(client.dialect, type, params.row[key].value, { readFile: fs.readFileSync }).sql;

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

                     fakeValue = client.dialect.quoteString(fakeValue);
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

   ipc.handle('get-foreign-list', async (event, { uid, schema, table, column, description }) => {
      if (!validateSender(event.senderFrame)) return { status: 'error', response: 'Unauthorized process' };
      const { dialect } = connections[uid];

      try {
         const query = connections[uid]
            .select(`${dialect.quoteIdentifier(column)} AS foreign_column`)
            .schema(schema)
            .from(table)
            .orderBy('foreign_column ASC');

         if (description)
            query.select(`LEFT(${dialect.quoteIdentifier(description)}, 20) AS foreign_description`);

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

   handle('create-table', async (params) => {
      await connections[params.uid].createTable(params);
   });

   handle('alter-table', async (params) => {
      await connections[params.uid].alterTable(params);
   });

   handle('duplicate-table', async (params) => {
      await connections[params.uid].duplicateTable(params);
   });

   handle('truncate-table', async (params) => {
      await connections[params.uid].truncateTable(params);
   });

   handle('drop-table', async (params) => {
      await connections[params.uid].dropTable(params);
   });
};
