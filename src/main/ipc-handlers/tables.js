import { ipcMain } from 'electron';
import { sqlEscaper } from 'common/libs/sqlEscaper';
import { TEXT, LONG_TEXT, NUMBER, BLOB } from 'common/fieldTypes';
import fs from 'fs';

// TODO: remap objects based on client

export default (connections) => {
   ipcMain.handle('get-table-columns', async (event, { uid, schema, table }) => {
      try {
         const { rows } = await connections[uid]
            .select('*')
            .schema('information_schema')
            .from('COLUMNS')
            .where({ TABLE_SCHEMA: `= '${schema}'`, TABLE_NAME: `= '${table}'` })
            .orderBy({ ORDINAL_POSITION: 'ASC' })
            .run();

         const result = rows.map(field => {
            return {
               name: field.COLUMN_NAME,
               key: field.COLUMN_KEY.toLowerCase(),
               type: field.DATA_TYPE,
               schema: field.TABLE_SCHEMA,
               table: field.TABLE_NAME,
               numPrecision: field.NUMERIC_PRECISION,
               datePrecision: field.DATETIME_PRECISION,
               charLength: field.CHARACTER_MAXIMUM_LENGTH,
               isNullable: field.IS_NULLABLE,
               default: field.COLUMN_DEFAULT,
               charset: field.CHARACTER_SET_NAME,
               collation: field.COLLATION_NAME,
               autoIncrement: field.EXTRA.includes('auto_increment'),
               comment: field.COLUMN_COMMENT
            };
         });
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

   ipcMain.handle('get-key-usage', async (event, { uid, schema, table }) => {
      try {
         const { rows } = await connections[uid]
            .select('*')
            .schema('information_schema')
            .from('KEY_COLUMN_USAGE')
            .where({ TABLE_SCHEMA: `= '${schema}'`, TABLE_NAME: `= '${table}'`, REFERENCED_TABLE_NAME: 'IS NOT NULL' })
            .run();

         const result = rows.map(field => {
            return {
               schema: field.TABLE_SCHEMA,
               table: field.TABLE_NAME,
               column: field.COLUMN_NAME,
               position: field.ORDINAL_POSITION,
               constraintPosition: field.POSITION_IN_UNIQUE_CONSTRAINT,
               constraintName: field.CONSTRAINT_NAME,
               refSchema: field.REFERENCED_TABLE_SCHEMA,
               refTable: field.REFERENCED_TABLE_NAME,
               refColumn: field.REFERENCED_COLUMN_NAME
            };
         });

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

   ipcMain.handle('get-foreign-list', async (event, params) => {
      try {
         const query = connections[params.uid]
            .select(`${params.column} AS foreignColumn`)
            .schema(params.schema)
            .from(params.table)
            .orderBy('foreignColumn ASC');

         if (params.description)
            query.select(`LEFT(${params.description}, 20) AS foreignDescription`);

         const results = await query.run();

         return { status: 'success', response: results };
      }
      catch (err) {
         return { status: 'error', response: err.toString() };
      }
   });
};
