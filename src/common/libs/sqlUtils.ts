/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-useless-escape */
import { lineString, point, polygon } from '@turf/helpers';
import { BIT, BLOB, DATE, DATETIME, FLOAT, IS_MULTI_SPATIAL, NUMBER, SPATIAL, TEXT_SEARCH } from 'common/fieldTypes';
import * as antares from 'common/interfaces/antares';
import { ClientCode } from 'common/interfaces/antares';
import * as moment from 'moment';

import customizations from '../customizations';
import { getArrayDepth } from './getArrayDepth';
import hexToBinary, { HexChar } from './hexToBinary';

/**
 * Splits a SQL string into multiple queries based on semicolons (;).
 * Handles BEGIN-END blocks, strings, comments, and PostgreSQL dollar-quoted tags.
 *
 * @param {string} sql - The SQL string to split.
 * @param {ClientCode} dbType - The database type (e.g., 'pg', 'mysql').
 * @returns {string[]} - An array of separated SQL queries.
 */
export const querySplitter =(sql: string, dbType: ClientCode): string[] => {
   const queries: string[] = [];
   let currentQuery = '';
   let insideBlock = false;
   let insideString = false;
   let stringDelimiter: string | null = null;
   let insideDollarTag = false;
   let dollarTagDelimiter: string | null = null;

   // Regex patterns for BEGIN-END blocks, dollar tags in PostgreSQL, and semicolons
   const beginRegex = /\bBEGIN\b/i;
   const endRegex = /\bEND\b;/i;
   const dollarTagRegex = /\$(\w+)?\$/; // Matches $tag$ or $$

   // Split on semicolons, keeping semicolons attached to the lines
   const lines = sql.split(/(?<=;)/);

   for (let line of lines) {
      line = line.trim();

      if (!line) continue;

      for (let i = 0; i < line.length; i++) {
         const char = line[i];

         // Handle string boundaries
         if ((char === '\'' || char === '"') && (!insideString || char === stringDelimiter)) {
            if (!insideString) {
               insideString = true;
               stringDelimiter = char;
            }
            else {
               insideString = false;
               stringDelimiter = null;
            }
         }

         currentQuery += char;

         if (dbType === 'pg') {
         // Handle dollar-quoted blocks in PostgreSQL
            if (!insideString && line.slice(i).match(dollarTagRegex)) {
               const match = line.slice(i).match(dollarTagRegex);
               if (match) {
                  const tag = match[0];
                  if (!insideDollarTag) {
                     insideDollarTag = true;
                     dollarTagDelimiter = tag;
                     currentQuery += tag;
                     i += tag.length - 1;
                  }
                  else if (dollarTagDelimiter === tag) {
                     insideDollarTag = false;
                     dollarTagDelimiter = null;
                     currentQuery += tag;
                     i += tag.length - 1;
                  }
               }
            }
         }

         // Check BEGIN-END blocks
         if (!insideString && !insideDollarTag) {
            if (beginRegex.test(line))
               insideBlock = true;

            if (insideBlock && endRegex.test(line))
               insideBlock = false;
         }
      }

      // Append the query if we encounter a semicolon outside a BEGIN-END block, outside a string, and outside dollar tags
      if (!insideBlock && !insideString && !insideDollarTag && /;\s*$/.test(line)) {
         queries.push(currentQuery.trim());
         currentQuery = '';
      }
   }

   // Add any remaining query
   if (currentQuery.trim())
      queries.push(currentQuery.trim());

   return queries;
};

/**
 * Removes all comments (both single-line and multi-line) from a SQL string.
 *
 * @param {string} sql - The SQL string to process.
 * @returns {string} - The SQL string without comments.
 */
export const removeComments = (sql: string): string => {
   let result = '';
   let insideSingleLineComment = false;
   let insideMultiLineComment = false;

   for (let i = 0; i < sql.length; i++) {
      const char = sql[i];
      const nextChar = sql[i + 1] || '';

      // Handle single-line comments (--)
      if (!insideMultiLineComment && char === '-' && nextChar === '-')
         insideSingleLineComment = true;

      // Handle multi-line comments (/* */)
      if (!insideSingleLineComment && char === '/' && nextChar === '*') {
         insideMultiLineComment = true;
         i++; // Skip the '*' character
         continue;
      }

      if (insideMultiLineComment && char === '*' && nextChar === '/') {
         insideMultiLineComment = false;
         i++; // Skip the '/' character
         continue;
      }

      // Skip characters inside comments
      if (insideSingleLineComment) {
         if (char === '\n')
            insideSingleLineComment = false;

         continue;
      }

      if (insideMultiLineComment)
         continue;

      // Append non-comment characters to the result
      result += char;
   }

   return result;
};

/**
 * Escapes a string for safe use in SQL queries.
 *
 * @param {string} string - The string to escape.
 * @returns {string} - The escaped string.
 */
export const sqlEscaper = (string: string): string => {
   // eslint-disable-next-line no-control-regex
   const pattern = /[\0\x08\x09\x1a\n\r"'\\\%]/gm;
   const regex = new RegExp(pattern);
   return string.replace(regex, char => {
      const m = ['\\0', '\\x08', '\\x09', '\\x1a', '\\n', '\\r', '\'', '\"', '\\', '\\\\', '%'];
      const r = ['\\\\0', '\\\\b', '\\\\t', '\\\\z', '\\\\n', '\\\\r', '\\\'', '\\\"', '\\\\', '\\\\\\\\', '\%'];
      return r[m.indexOf(char)] || char;
   });
};

/**
 * Converts a value into a GeoJSON object based on its type.
 *
 * @param {any} val - The value to convert.
 * @returns {object} - The generated GeoJSON object.
 */
export const objectToGeoJSON = (val: any) => {
   if (Array.isArray(val)) {
      if (getArrayDepth(val) === 1)
         return lineString(val.reduce((acc, curr) => [...acc, [curr.x, curr.y]], []));
      else
         return polygon(val.map(arr => arr.reduce((acc: any, curr: any) => [...acc, [curr.x, curr.y]], [])));
   }
   else
      return point([val.x, val.y]);
};

/**
 * Escapes and wraps a string in quotes for safe use in SQL queries.
 *
 * @param {string} val - The string to process.
 * @param {ClientCode} client - The database type (e.g., 'pg', 'mysql').
 * @returns {string} - The escaped and quoted string.
 */
export const escapeAndQuote = (val: string, client: ClientCode) => {
   const { stringsWrapper: sw } = customizations[client];
   // eslint-disable-next-line no-control-regex
   const CHARS_TO_ESCAPE = sw === '"' ? /[\0\b\t\n\r\x1a"'\\]/g : /[\0\b\t\n\r\x1a'\\]/g;
   const CHARS_ESCAPE_MAP: Record<string, string> = {
      '\0': '\\0',
      '\b': '\\b',
      '\t': '\\t',
      '\n': '\\n',
      '\r': '\\r',
      '\x1a': '\\Z',
      '\'': '\\\'',
      '\\': '\\\\'
   };

   if (sw === '"')
      CHARS_ESCAPE_MAP['"'] = '\\"';

   let chunkIndex = CHARS_TO_ESCAPE.lastIndex = 0;
   let escapedVal = '';
   let match;

   while ((match = CHARS_TO_ESCAPE.exec(val))) {
      escapedVal += val.slice(chunkIndex, match.index) + CHARS_ESCAPE_MAP[match[0]];
      chunkIndex = CHARS_TO_ESCAPE.lastIndex;
   }

   if (chunkIndex === 0)
      return `${sw}${val}${sw}`;

   if (chunkIndex < val.length)
      return `${sw}${escapedVal + val.slice(chunkIndex)}${sw}`;

   return `${sw}${escapedVal}${sw}`;
};

/**
 * Converts a value into a SQL string based on the field type and database type.
 *
 * @param {object} args - Arguments containing the value, database type, and field type.
 * @returns {string} - The generated SQL string.
 */
export const valueToSqlString = (args: {
   val: any;
   client: ClientCode;
   field: { type: string; datePrecision?: number; precision?: number | false; isArray?: boolean };
}): string => {
   let parsedValue;
   const { val, client, field } = args;
   const { stringsWrapper: sw } = customizations[client];

   if (val === null)
      parsedValue = 'NULL';
   else if (DATE.includes(field.type)) {
      parsedValue = moment(val).isValid()
         ? escapeAndQuote(moment(val).format('YYYY-MM-DD'), client)
         : val;
   }
   else if (DATETIME.includes(field.type)) {
      let datePrecision = '';
      for (let i = 0; i < field.datePrecision; i++)
         datePrecision += i === 0 ? '.S' : 'S';

      parsedValue = moment(val).isValid()
         ? escapeAndQuote(moment(val).format(`YYYY-MM-DD HH:mm:ss${datePrecision}`), client)
         : escapeAndQuote(val, client);
   }
   else if ('isArray' in field && field.isArray) {
      let localVal;
      if (Array.isArray(val)) {
         localVal = JSON
            .stringify(val)
            .replaceAll('[', '{')
            .replaceAll(']', '}');
      }
      else {
         localVal = typeof val === 'string'
            ? val
               .replaceAll('[', '{')
               .replaceAll(']', '}')
            : '';
      }
      parsedValue = `'${localVal}'`;
   }
   else if (TEXT_SEARCH.includes(field.type))
      parsedValue = `'${val.replaceAll('\'', '\'\'')}'`;
   else if (BIT.includes(field.type))
      parsedValue = `b'${hexToBinary(Buffer.from(new Uint8Array(Object.values(val))).toString('hex') as undefined as HexChar[])}'`;
   else if (BLOB.includes(field.type)) {
      let buffer: Buffer;
      if (val instanceof Uint8Array)
         buffer = Buffer.from(val);
      else
         buffer = val;

      if (['mysql', 'maria'].includes(client))
         parsedValue = `X'${buffer.toString('hex').toUpperCase()}'`;
      else if (client === 'pg')
         parsedValue = `decode('${buffer.toString('hex').toUpperCase()}', 'hex')`;
   }
   else if (NUMBER.includes(field.type))
      parsedValue = val;
   else if (FLOAT.includes(field.type))
      parsedValue = parseFloat(val);
   else if (SPATIAL.includes(field.type)) {
      let geoJson;
      if (IS_MULTI_SPATIAL.includes(field.type)) {
         const features = [];
         for (const element of val)
            features.push(objectToGeoJSON(element));

         geoJson = {
            type: 'FeatureCollection',
            features
         };
      }
      else
         geoJson = objectToGeoJSON(val);

      parsedValue = `ST_GeomFromGeoJSON('${JSON.stringify(geoJson)}')`;
   }
   else if (val === '') parsedValue = `${sw}${sw}`;
   else {
      parsedValue = typeof val === 'string'
         ? escapeAndQuote(val, client)
         : typeof val === 'object'
            ? escapeAndQuote(JSON.stringify(val), client)
            : val;
   }

   return parsedValue;
};

/**
 * Converts a JSON array into an SQL INSERT query.
 *
 * @param {object} args - Arguments containing the JSON data, database type, fields, and options.
 * @returns {string} - The generated SQL INSERT query.
 */
export const jsonToSqlInsert = (args: {
   json: Record<string, any>[];
   client: ClientCode;
   fields: Record<string, { type: string; datePrecision: number }>;
   table: string;
   options?: { sqlInsertAfter: number; sqlInsertDivider: 'bytes' | 'rows' };
}) => {
   const { client, json, fields, table, options } = args;
   const sqlInsertAfter = options && options.sqlInsertAfter ? options.sqlInsertAfter : 1;
   const sqlInsertDivider = options && options.sqlInsertDivider ? options.sqlInsertDivider : 'rows';
   const { elementsWrapper: ew } = customizations[client];
   const fieldNames = Object.keys(json[0]).map(key => `${ew}${key.split('.').pop()}${ew}`);
   let insertStmt = `INSERT INTO ${ew}${table}${ew} (${fieldNames.join(', ')}) VALUES `;
   let insertsString = '';
   let queryLength = 0;
   let rowsWritten = 0;

   for (const row of json) {
      const values = [];

      values.push(Object.keys(row).map(key => (
         valueToSqlString({ val: row[key], client, field: fields[key] })
      )));

      if (
         (sqlInsertDivider === 'bytes' && queryLength >= sqlInsertAfter * 1024) ||
         (sqlInsertDivider === 'rows' && rowsWritten === sqlInsertAfter)
      ) {
         insertsString += insertStmt + ';';
         insertStmt = `\nINSERT INTO ${ew}${table}${ew} (${fieldNames.join(', ')}) VALUES `;
         rowsWritten = 0;
      }
      rowsWritten++;

      if (rowsWritten > 1) insertStmt += ',\n';

      insertStmt += `(${values.join(',')})`;
      queryLength = insertStmt.length;
   }

   if (rowsWritten > 0)
      insertsString += insertStmt + ';';

   return insertsString;
};

/**
 * Formats a JSON value for use in an SQL WHERE clause.
 *
 * @param {object} jsonValue - The JSON value to format.
 * @param {ClientCode} clientType - The database type (e.g., 'pg', 'mysql').
 * @returns {string} - The formatted SQL WHERE clause.
 */
export const formatJsonForSqlWhere = (jsonValue: object, clientType: antares.ClientCode) => {
   const formattedValue = JSON.stringify(jsonValue);

   switch (clientType) {
      case 'mysql':
         return ` = CAST('${formattedValue}' AS JSON)`;
      case 'maria':
         return ` = '${formattedValue}'`;
      case 'pg':
         return `::text = '${formattedValue}'`;
      case 'firebird':
      case 'sqlite':
      default:
         return ` = '${formattedValue}'`;
   }
};
