import * as antares from 'common/interfaces/antares';
import * as exporter from 'common/interfaces/exporter';
import { SqlExporter } from './SqlExporter';
import { BLOB, BIT, DATE, DATETIME, FLOAT, NUMBER, TEXT_SEARCH } from 'common/fieldTypes';
import hexToBinary from 'common/libs/hexToBinary';
import * as moment from 'moment';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import * as QueryStream from 'pg-query-stream';
import { PostgreSQLClient } from '../../clients/PostgreSQLClient';

export default class PostgreSQLExporter extends SqlExporter {
   constructor (client: PostgreSQLClient, tables: exporter.TableParams[], options: exporter.ExportOptions) {
      super(tables, options);

      this._client = client;
   }

   async getSqlHeader () {
      let dump = await super.getSqlHeader();
      dump += `


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;\n\n\n`;

      if (this.schemaName !== 'public') dump += `CREATE SCHEMA "${this.schemaName}";\n\n`;

      dump += await this.getCreateTypes();

      return dump;
   }

   async getCreateTable (tableName: string) {
      /* eslint-disable camelcase */
      interface SequenceRecord {
         sequence_catalog: string;
         sequence_schema: string;
         sequence_name: string;
         data_type: string;
         numeric_precision: number;
         numeric_precision_radix: number;
         numeric_scale: number;
         start_value: string;
         minimum_value: string;
         maximum_value: string;
         increment: string;
         cycle_option: string;
      }
      /* eslint-enable camelcase */

      let createSql = '';
      const sequences = [];
      const columnsSql = [];
      const arrayTypes: {[key: string]: string} = {
         _int2: 'smallint',
         _int4: 'integer',
         _int8: 'bigint',
         _float4: 'real',
         _float8: 'double precision',
         _char: '"char"',
         _varchar: 'character varying'
      };

      // Table columns
      const { rows } = await this._client.raw(`
         SELECT * 
         FROM "information_schema"."columns" 
         WHERE "table_schema" = '${this.schemaName}' 
         AND "table_name" = '${tableName}' 
         ORDER BY "ordinal_position" ASC
      `, { schema: 'information_schema' });

      if (!rows.length) return '';

      for (const column of rows) {
         let fieldType = column.data_type;
         if (fieldType === 'USER-DEFINED') fieldType = `"${this.schemaName}".${column.udt_name}`;
         else if (fieldType === 'ARRAY') {
            if (Object.keys(arrayTypes).includes(fieldType))
               fieldType = arrayTypes[column.udt_name] + '[]';
            else
               fieldType = column.udt_name.replaceAll('_', '') + '[]';
         }

         const columnArr = [
            `"${column.column_name}"`,
            `${fieldType}${column.character_maximum_length ? `(${column.character_maximum_length})` : ''}`
         ];

         if (column.column_default) {
            columnArr.push(`DEFAULT ${column.column_default}`);
            if (column.column_default.includes('nextval')) {
               const sequenceName = column.column_default.split('\'')[1];
               sequences.push(sequenceName);
            }
         }
         if (column.is_nullable === 'NO') columnArr.push('NOT NULL');

         columnsSql.push(columnArr.join(' '));
      }

      // Table sequences
      for (let sequence of sequences) {
         if (sequence.includes('.')) sequence = sequence.split('.')[1];

         const { rows } = await this._client
            .select('*')
            .schema('information_schema')
            .from('sequences')
            .where({ sequence_schema: `= '${this.schemaName}'`, sequence_name: `= '${sequence}'` })
            .run<SequenceRecord>();

         if (rows.length) {
            createSql += `CREATE SEQUENCE "${this.schemaName}"."${sequence}"
   START WITH ${rows[0].start_value}
   INCREMENT BY ${rows[0].increment}
   MINVALUE ${rows[0].minimum_value}
   MAXVALUE ${rows[0].maximum_value}
   CACHE 1;\n`;

            // createSql += `\nALTER TABLE "${sequence}" OWNER TO ${this._client._params.user};\n\n`;
         }
      }

      // Table create
      createSql += `\nCREATE TABLE "${this.schemaName}"."${tableName}"(
   ${columnsSql.join(',\n   ')}
);\n`;

      // createSql += `\nALTER TABLE "${tableName}" OWNER TO ${this._client._params.user};\n\n`;

      // Table indexes
      createSql += '\n';
      const { rows: indexes } = await this._client
         .select('*')
         .schema('pg_catalog')
         .from('pg_indexes')
         .where({ schemaname: `= '${this.schemaName}'`, tablename: `= '${tableName}'` })
         .run<{indexdef: string}>();

      for (const index of indexes)
         createSql += `${index.indexdef};\n`;

      // Table foreigns
      const { rows: foreigns } = await this._client.raw(`
         SELECT 
            tc.table_schema, 
            tc.constraint_name, 
            tc.table_name, 
            kcu.column_name, 
            ccu.table_schema AS foreign_table_schema,
            ccu.table_name AS foreign_table_name,
            ccu.column_name AS foreign_column_name,
            rc.update_rule,
            rc.delete_rule
         FROM information_schema.table_constraints AS tc 
         JOIN information_schema.key_column_usage AS kcu
            ON tc.constraint_name = kcu.constraint_name
            AND tc.table_schema = kcu.table_schema
         JOIN information_schema.constraint_column_usage AS ccu
            ON ccu.constraint_name = tc.constraint_name
            AND ccu.table_schema = tc.table_schema
         JOIN information_schema.referential_constraints AS rc 
            ON rc.constraint_name = kcu.constraint_name
         WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_schema = '${this.schemaName}'
         AND tc.table_name = '${tableName}'
      `);

      for (const foreign of foreigns) {
         this._postTablesSql += `\nALTER TABLE ONLY "${this.schemaName}"."${tableName}"
   ADD CONSTRAINT "${foreign.constraint_name}" FOREIGN KEY ("${foreign.column_name}") REFERENCES "${this.schemaName}"."${foreign.foreign_table_name}" ("${foreign.foreign_column_name}") ON UPDATE ${foreign.update_rule} ON DELETE ${foreign.delete_rule};\n`;
      }

      return createSql;
   }

   getDropTable (tableName: string) {
      return `DROP TABLE IF EXISTS "${this.schemaName}"."${tableName}";`;
   }

   async * getTableInsert (tableName: string) {
      let rowCount = 0;
      const sqlStr = '';

      const countResults = await this._client.raw(`SELECT COUNT(1) as count FROM "${this.schemaName}"."${tableName}"`);
      if (countResults.rows.length === 1) rowCount = countResults.rows[0].count;

      if (rowCount > 0) {
         const columns = await this._client.getTableColumns({
            table: tableName,
            schema: this.schemaName
         });

         const columnNames = columns.map(col => '"' + col.name + '"').join(', ');

         yield sqlStr;

         const stream = await this._queryStream(
            `SELECT ${columnNames} FROM "${this.schemaName}"."${tableName}"`
         );

         for await (const row of stream) {
            if (this.isCancelled) {
               stream.destroy();
               yield null;
               return;
            }

            let sqlInsertString = `INSERT INTO "${this.schemaName}"."${tableName}" (${columnNames}) VALUES`;

            sqlInsertString += ' (';

            for (const i in columns) {
               const column = columns[i];
               const val = row[column.name];

               if (val === null) sqlInsertString += 'NULL';
               else if (DATE.includes(column.type)) {
                  sqlInsertString += moment(val).isValid()
                     ? this.escapeAndQuote(moment(val).format('YYYY-MM-DD'))
                     : val;
               }
               else if (DATETIME.includes(column.type)) {
                  let datePrecision = '';
                  for (let i = 0; i < column.datePrecision; i++)
                     datePrecision += i === 0 ? '.S' : 'S';

                  sqlInsertString += moment(val).isValid()
                     ? this.escapeAndQuote(moment(val).format(`YYYY-MM-DD HH:mm:ss${datePrecision}`))
                     : this.escapeAndQuote(val);
               }
               else if ('isArray' in column) {
                  let parsedVal;
                  if (Array.isArray(val))
                     parsedVal = JSON.stringify(val).replaceAll('[', '{').replaceAll(']', '}');
                  else
                     parsedVal = typeof val === 'string' ? val.replaceAll('[', '{').replaceAll(']', '}') : '';
                  sqlInsertString += `'${parsedVal}'`;
               }
               else if (TEXT_SEARCH.includes(column.type))
                  sqlInsertString += `'${val.replaceAll('\'', '\'\'')}'`;
               else if (BIT.includes(column.type))
                  sqlInsertString += `b'${hexToBinary(Buffer.from(val).toString('hex'))}'`;
               else if (BLOB.includes(column.type))
                  sqlInsertString += `decode('${val.toString('hex').toUpperCase()}', 'hex')`;
               else if (NUMBER.includes(column.type))
                  sqlInsertString += val;
               else if (FLOAT.includes(column.type))
                  sqlInsertString += parseFloat(val);
               else if (val === '') sqlInsertString += '\'\'';
               else {
                  sqlInsertString += typeof val === 'string'
                     ? this.escapeAndQuote(val)
                     : typeof val === 'object'
                        ? this.escapeAndQuote(JSON.stringify(val))
                        : val;
               }

               if (parseInt(i) !== columns.length - 1)
                  sqlInsertString += ', ';
            }

            sqlInsertString += ');\n';

            yield sqlInsertString;
         }

         yield sqlStr;
      }
   }

   async getCreateTypes () {
      let sqlString = '';
      const { rows: types } = await this._client.raw<antares.QueryResult<{typname: string; enumlabel: string}>>(`
         SELECT pg_type.typname, pg_enum.enumlabel 
         FROM pg_type 
         JOIN pg_enum ON pg_enum.enumtypid = pg_type.oid;
      `);

      if (types.length) { // TODO: refactor
         sqlString += this.buildComment('Dump of types\n------------------------------------------------------------') + '\n\n';

         const typesArr = types.reduce((arr, type) => {
            if (arr.every(el => el.name !== type.typname))
               arr.push({ name: type.typname, enums: [this.escapeAndQuote(type.enumlabel)] });
            else {
               const i = arr.findIndex(el => el.name === type.typname);
               arr[i].enums.push(this.escapeAndQuote(type.enumlabel));
            }

            return arr;
         }, []);

         for (const type of typesArr) {
            sqlString += `CREATE TYPE "${this.schemaName}"."${type.name}" AS ENUM (
   ${type.enums.join(',\n\t')}
);`;
         }

         // sqlString += `\nALTER TYPE "${tableName}" OWNER TO ${this._client._params.user};\n`
      }

      return sqlString;
   }

   async getCreateAggregates () {
      let sqlString = '';

      const { rows: aggregates } = await this._client.raw(`
         SELECT proname
         FROM   pg_proc
         WHERE  prokind = 'a'
         AND pronamespace::regnamespace::text = '${this.schemaName}'
         ORDER BY 1;
      `);

      if (aggregates.length) {
         for (const aggregate of aggregates) {
            const { rows: aggregateDef } = await this._client.raw(
               `SELECT 
                  format(
                     E'CREATE AGGREGATE %s (\n%s\n);'
                     , (pg_identify_object('pg_proc'::regclass, aggfnoid, 0)).identity
                     , array_to_string(
                        ARRAY[
                     format(E'\tSFUNC = %s', aggtransfn::regproc)
                     , format(E'\tSTYPE = %s', format_type(aggtranstype, NULL))
                     , CASE aggfinalfn WHEN '-'::regproc THEN NULL ELSE format(E'\tFINALFUNC = %s',aggfinalfn::text) END
                     , CASE aggsortop WHEN 0 THEN NULL ELSE format(E'\tSORTOP = %s', oprname) END
                     , CASE WHEN agginitval IS NULL THEN NULL ELSE format(E'\tINITCOND = %s', agginitval) END
                        ]
                        , E',\n'
                     )
                  )
               FROM pg_aggregate
               LEFT JOIN pg_operator ON pg_operator.oid = aggsortop
               WHERE aggfnoid = '${this.schemaName}.${aggregate.proname}'::regproc;`
            );

            if (aggregateDef.length)
               sqlString += '\n\n' + aggregateDef[0].format;
         }
      }

      return sqlString + '\n\n\n';
   }

   async getViews () {
      const { rows: views } = await this._client.raw(`SELECT * FROM "pg_views" WHERE "schemaname"='${this.schemaName}'`);
      let sqlString = '';

      for (const view of views) {
         sqlString += `\nDROP VIEW IF EXISTS "${view.viewname}";\n`;

         //          const { rows: columns } = await this._client
         //             .select('*')
         //             .schema('information_schema')
         //             .from('columns')
         //             .where({ table_schema: `= '${this.schemaName}'`, table_name: `= '${view.viewname}'` })
         //             .orderBy({ ordinal_position: 'ASC' })
         //             .run();

         //          sqlString += `
         // CREATE VIEW "${this.schemaName}"."${view.viewname}" AS
         // SELECT
         //    ${columns.reduce((acc, curr) => {
         //       const fieldType = curr.data_type === 'USER-DEFINED' ? curr.udt_name : curr.data_type;
         //       acc.push(`NULL::${fieldType}${curr.character_maximum_length ? `(${curr.character_maximum_length})` : ''} AS "${curr.column_name}"`);
         //       return acc;
         //    }, []).join(',\n   ')};
         // `;

         sqlString += `\nCREATE OR REPLACE VIEW "${this.schemaName}"."${view.viewname}" AS \n${view.definition}\n`;
      }

      return sqlString;
   }

   async getTriggers () {
      /* eslint-disable camelcase */
      interface TriggersResult {
         event_object_table: string;
         table_name: string;
         trigger_name: string;
         events: string[];
         event_manipulation: string;
      }
      /* eslint-enable camelcase */
      let sqlString = '';

      // Trigger functions
      const { rows: triggerFunctions } = await this._client.raw(
         `SELECT DISTINCT routine_name AS name FROM information_schema.routines WHERE routine_type = 'FUNCTION' AND routine_schema = '${this.schemaName}' AND data_type = 'trigger'`
      );

      for (const func of triggerFunctions) {
         const { rows: functionDef } = await this._client.raw(
            `SELECT pg_get_functiondef((SELECT oid FROM pg_proc WHERE proname = '${func.name}')) AS definition`
         );
         sqlString += `\n${functionDef[0].definition};\n`;
      }

      const { rows: triggers } = await this._client.raw<antares.QueryResult<TriggersResult>>(
         `SELECT * FROM "information_schema"."triggers" WHERE "trigger_schema"='${this.schemaName}'`
      );

      const remappedTriggers = triggers.reduce((acc, trigger) => {
         const i = acc.findIndex(t => t.trigger_name === trigger.trigger_name && t.event_object_table === trigger.event_object_table);
         if (i === -1) {
            trigger.events = [trigger.event_manipulation];
            acc.push(trigger);
         }
         else
            acc[i].events.push(trigger.event_manipulation);

         return acc;
      }, []);

      for (const trigger of remappedTriggers)
         sqlString += `\nCREATE TRIGGER "${trigger.trigger_name}" ${trigger.action_timing} ${trigger.events.join(' OR ')} ON "${this.schemaName}"."${trigger.event_object_table}" FOR EACH ${trigger.action_orientation} ${trigger.action_statement};\n`;

      return sqlString;
   }

   async getFunctions () {
      let sqlString = '';
      const { rows: functions } = await this._client.raw(
         `SELECT DISTINCT routine_name AS name FROM information_schema.routines WHERE routine_type = 'FUNCTION' AND routine_schema = '${this.schemaName}' AND data_type != 'trigger'`
      );

      for (const func of functions) {
         const { rows: functionDef } = await this._client.raw(
            `SELECT pg_get_functiondef((SELECT oid FROM pg_proc WHERE proname = '${func.name}')) AS definition`
         );
         sqlString += `\n${functionDef[0].definition};\n`;
      }

      sqlString += await this.getCreateAggregates();

      return sqlString;
   }

   async getRoutines () {
      let sqlString = '';
      const { rows: functions } = await this._client.raw(
         `SELECT DISTINCT routine_name AS name FROM information_schema.routines WHERE routine_type = 'PROCEDURE' AND routine_schema = '${this.schemaName}'`
      );

      for (const func of functions) {
         const { rows: functionDef } = await this._client.raw(
            `SELECT pg_get_functiondef((SELECT oid FROM pg_proc WHERE proname = '${func.name}')) AS definition`
         );
         sqlString += `\n${functionDef[0].definition};\n`;
      }

      return sqlString;
   }

   async _queryStream (sql: string) {
      if (process.env.NODE_ENV === 'development') console.log('EXPORTER:', sql);
      const connection = await this._client.getConnection();
      const query = new QueryStream(sql, null);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const stream = (connection as any).query(query);
      const dispose = () => connection.end();

      stream.on('end', dispose);
      stream.on('error', dispose);
      stream.on('close', dispose);
      return stream;
   }

   escapeAndQuote (val: string) {
      // eslint-disable-next-line no-control-regex
      const CHARS_TO_ESCAPE = /[\0\b\t\n\r\x1a"'\\]/g;
      const CHARS_ESCAPE_MAP: {[key: string]: string} = {
         '\0': '\\0',
         '\b': '\\b',
         '\t': '\\t',
         '\n': '\\n',
         '\r': '\\r',
         '\x1a': '\\Z',
         '"': '\\"',
         '\'': '\\\'',
         '\\': '\\\\'
      };
      let chunkIndex = CHARS_TO_ESCAPE.lastIndex = 0;
      let escapedVal = '';
      let match;

      while ((match = CHARS_TO_ESCAPE.exec(val))) {
         escapedVal += val.slice(chunkIndex, match.index) + CHARS_ESCAPE_MAP[match[0]];
         chunkIndex = CHARS_TO_ESCAPE.lastIndex;
      }

      if (chunkIndex === 0)
         return `'${val}'`;

      if (chunkIndex < val.length)
         return `'${escapedVal + val.slice(chunkIndex)}'`;

      return `'${escapedVal}'`;
   }
}
