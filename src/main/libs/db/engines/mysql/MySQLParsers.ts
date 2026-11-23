/**
 * Pure parsers of MySQL/MariaDB metadata (SHOW CREATE ... statements, information_schema rows).
 * No I/O: the client runs the queries and passes the results here.
 */

const match = (text: string, regex: RegExp) => text.match(regex)?.[0];

/** Skips a balanced parenthesized list starting at `start` (which must be '('), returns the index after ')' */
function skipParens (text: string, start: number) {
   let depth = 0;
   let quote: string = null;

   for (let i = start; i < text.length; i++) {
      const char = text[i];
      if (quote) {
         if (char === '\\') i++;
         else if (char === quote) quote = null;
         continue;
      }
      if (char === '\'' || char === '"' || char === '`') quote = char;
      else if (char === '(') depth++;
      else if (char === ')' && --depth === 0) return i + 1;
   }
   return text.length;
}

/** Routine characteristics that may follow the parameters, before the body */
const CHARACTERISTIC = /^\s*(COMMENT\s+'(?:[^'\\]|\\.|'')*'|LANGUAGE\s+SQL|NOT\s+DETERMINISTIC|DETERMINISTIC|CONTAINS\s+SQL|NO\s+SQL|READS\s+SQL\s+DATA|MODIFIES\s+SQL\s+DATA|SQL\s+SECURITY\s+(?:DEFINER|INVOKER))/i;

/** RETURNS clause of a function: type, optional length and charset/collation */
const RETURNS = /^\s*RETURNS\s+([a-z]+(?:\s+unsigned)?(?:\([^)]*\))?(?:\s+(?:unsigned|zerofill|CHARSET\s+\w+|COLLATE\s+\w+))*)/i;

export interface RoutineDefinition {
   definer: string;
   /** Body of the routine (BEGIN ... END block or single statement) */
   sql: string;
   comment: string;
   security: 'DEFINER' | 'INVOKER';
   deterministic: boolean;
   dataAccess: string;
   /** Raw RETURNS type of functions, e.g. "decimal(10,2)" */
   returns?: string;
}

/** Parses SHOW CREATE PROCEDURE / FUNCTION */
export function parseRoutine (statement: string): RoutineDefinition {
   const paramsStart = statement.search(/\(/);
   let rest = statement.slice(skipParens(statement, paramsStart));

   let returns: string;
   const returnsMatch = rest.match(RETURNS);
   if (returnsMatch) {
      returns = returnsMatch[1];
      rest = rest.slice(returnsMatch[0].length);
   }

   let header = '';
   let characteristic: RegExpMatchArray;
   while ((characteristic = rest.match(CHARACTERISTIC))) {
      header += ` ${characteristic[1]}`;
      rest = rest.slice(characteristic[0].length);
   }

   let dataAccess = 'CONTAINS SQL';
   if (/\bNO SQL\b/i.test(header)) dataAccess = 'NO SQL';
   if (/\bREADS SQL DATA\b/i.test(header)) dataAccess = 'READS SQL DATA';
   if (/\bMODIFIES SQL DATA\b/i.test(header)) dataAccess = 'MODIFIES SQL DATA';

   return {
      definer: match(statement, /(?<=DEFINER=).*?(?=\s)/s),
      sql: rest.trim(),
      comment: header.match(/COMMENT\s+'((?:[^'\\]|\\.|'')*)'/i)?.[1] ?? '',
      security: /SQL SECURITY INVOKER/i.test(header) ? 'INVOKER' : 'DEFINER',
      deterministic: /(?<!NOT )\bDETERMINISTIC\b/i.test(header),
      dataAccess,
      ...(returns !== undefined ? { returns } : {})
   };
}

/**
 * Splits a function RETURNS type into [TYPE, length] (e.g. "varchar(100)" → ['VARCHAR', 100]).
 * Precision and scale stay together as a string: "decimal(12,2)" → ['DECIMAL', '12,2']
 */
export function parseReturnType (returns: string): { returns: string; returnsLength: number | string } {
   const [type, length] = (returns ?? '').split(/\s/)[0].replace(')', '').split('(');
   return { returns: type.toUpperCase(), returnsLength: length?.includes(',') ? length.replace(/\s/g, '') : +length };
}

export interface ParameterTypeRow {
   NUMERIC_PRECISION: number | string;
   NUMERIC_SCALE: number | string;
   DATETIME_PRECISION: number | string;
   CHARACTER_MAXIMUM_LENGTH: number | string;
}

/** Length of a routine parameter read from information_schema.parameters: "12,2" for DECIMAL(12,2) */
export function parameterLength (row: ParameterTypeRow): number | string {
   if (row.NUMERIC_PRECISION)
      return Number(row.NUMERIC_SCALE) > 0 ? `${row.NUMERIC_PRECISION},${row.NUMERIC_SCALE}` : row.NUMERIC_PRECISION;

   return row.DATETIME_PRECISION || row.CHARACTER_MAXIMUM_LENGTH || '';
}

export interface TriggerDefinition {
   definer: string;
   sql: string;
   name: string;
   table: string;
   activation: string;
   event: string;
}

/** Parses SHOW CREATE TRIGGER: `CREATE DEFINER=x TRIGGER name {BEFORE|AFTER} {INSERT|UPDATE|DELETE} ON table FOR EACH ROW [{FOLLOWS|PRECEDES} other] body` */
export function parseTrigger (statement: string, name: string): TriggerDefinition {
   const header = statement.match(/\bTRIGGER\s+(?:`(?:[^`]|``)+`|\S+)(?:\.(?:`(?:[^`]|``)+`|\S+))?\s+(BEFORE|AFTER)\s+(INSERT|UPDATE|DELETE)\s+ON\s+(?:`((?:[^`]|``)+)`|(\S+))\s+FOR\s+EACH\s+ROW\s+(?:(?:FOLLOWS|PRECEDES)\s+(?:`(?:[^`]|``)+`|\S+)\s+)?/i);

   if (!header)
      throw new Error(`Unable to parse trigger definition: ${statement}`);

   return {
      definer: match(statement, /(?<=DEFINER=).*?(?=\s)/s),
      sql: statement.slice(header.index + header[0].length).trim(),
      name,
      table: header[3] ?? header[4],
      activation: header[1].toUpperCase(),
      event: header[2].toUpperCase()
   };
}

export interface EventDefinition {
   definer: string;
   sql: string;
   name: string;
   comment: string;
   state: string;
   preserve: boolean;
   execution: 'EVERY' | 'ONCE';
   every: string[];
   starts: string;
   ends: string;
   at: string;
}

/** Parses SHOW CREATE EVENT. Characteristics are read from the part before DO, never from the body */
export function parseEvent (statement: string, name: string): EventDefinition {
   const doMatch = statement.match(/\sDO\s/);
   const header = doMatch ? statement.slice(0, doMatch.index) : statement;
   const body = doMatch ? statement.slice(doMatch.index + doMatch[0].length) : '';

   const execution = /\bEVERY\b/.test(header) ? 'EVERY' : 'ONCE';
   const every = execution === 'EVERY' ? match(header, /(?<=EVERY )(\s*([^\s]+)){0,2}/s).replaceAll('\'', '').split(' ') : [];
   const starts = execution === 'EVERY' ? match(header, /(?<=STARTS ').*?(?=')/s) ?? '' : '';
   const ends = execution === 'EVERY' ? match(header, /(?<=ENDS ').*?(?=')/s) ?? '' : '';
   const at = execution === 'ONCE' ? match(header, /(?<=\bAT ').*?(?=')/s) ?? '' : '';

   return {
      definer: match(statement, /(?<=DEFINER=).*?(?=\s)/s),
      sql: body,
      name,
      comment: match(header, /(?<=COMMENT ').*?(?=')/s) ?? '',
      state: /\bDISABLE ON SLAVE\b/.test(header)
         ? 'DISABLE ON SLAVE'
         : /\bENABLE\b/.test(header) ? 'ENABLE' : 'DISABLE',
      preserve: /ON COMPLETION PRESERVE/.test(header),
      execution,
      every,
      starts,
      ends,
      at
   };
}

/** ALGORITHM of SHOW CREATE VIEW */
export const parseViewAlgorithm = (createView: string) => match(createView, /(?<=CREATE ALGORITHM=).*?(?=\s)/s);

export interface CreateTableColumn {
   name: string;
   type: string;
   length: string;
   default: string;
   /** Column-level CHECK clause (MariaDB, e.g. `json_valid(`col`)` of JSON columns) */
   check?: string;
}

/** End index (exclusive) of the parenthesized group opening at `start`, skipping quoted text */
function groupEnd (sql: string, start: number): number {
   let depth = 0;
   for (let i = start; i < sql.length; i++) {
      const ch = sql[i];
      if (ch === '\'' || ch === '"' || ch === '`') {
         i = quotedEnd(sql, i) - 1;
         continue;
      }
      if (ch === '(') depth++;
      else if (ch === ')' && --depth === 0) return i + 1;
   }
   return sql.length;
}

/** End index (exclusive) of the quoted text opening at `start` (doubled or backslash-escaped quotes) */
function quotedEnd (sql: string, start: number): number {
   const quote = sql[start];
   for (let i = start + 1; i < sql.length; i++) {
      if (sql[i] === '\\' && quote !== '`') i++;
      else if (sql[i] === quote) {
         if (sql[i + 1] === quote) i++;
         else return i + 1;
      }
   }
   return sql.length;
}

/**
 * Single term at `start`: a quoted literal (optionally prefixed, as b'01' or _utf8mb4'x'),
 * a parenthesized expression or a word optionally followed by its arguments (current_timestamp(3))
 */
function termEnd (sql: string, start: number): number {
   let i = start;
   while (i < sql.length && /[\w.+-]/.test(sql[i])) i++;
   if (sql[i] === '\'' || sql[i] === '"') return quotedEnd(sql, i);
   if (sql[i] === '(') return groupEnd(sql, i);
   return i;
}

/** Value of DEFAULT and clause of CHECK in the attributes of a SHOW CREATE TABLE column */
function parseColumnAttributes (details: string) {
   let defaultValue: string = null;
   let check: string;

   for (let i = 0; i < details.length;) {
      const ch = details[i];
      if (ch === '\'' || ch === '"' || ch === '`') {
         i = quotedEnd(details, i);
         continue;
      }
      if (ch === '(') {
         i = groupEnd(details, i);
         continue;
      }

      const keyword = /^(DEFAULT|CHECK)\s*/i.exec(details.slice(i));
      if (keyword && (i === 0 || /\s/.test(details[i - 1]))) {
         const start = i + keyword[0].length;
         const end = termEnd(details, start);
         if (keyword[1].toUpperCase() === 'DEFAULT')
            defaultValue = details.slice(start, end);
         else
            check = details.slice(start + 1, end - 1).trim();
         i = end;
         continue;
      }
      i++;
   }

   return { defaultValue, check };
}

/**
 * Column types and defaults as written in SHOW CREATE TABLE
 * (information_schema loses details such as the exact DEFAULT expression).
 */
export function parseCreateTableColumns (createTable?: string): Record<string, CreateTableColumn> | false {
   if (!createTable) return false;

   let n = 0;
   return createTable
      .split('')
      .reduce((acc: string, curr: string) => {
         if (curr === ')') n--;
         if (n !== 0) acc += curr;
         if (curr === '(') n++;
         return acc;
      }, '')
      .replaceAll('\n', '')
      .split(/,\s?(?![^(]*\))/)
      .map((f: string) => {
         try {
            const fieldArr = f.trim().split(' ');
            const nameAndType = fieldArr.slice(0, 2);
            if (nameAndType[0].charAt(0) !== '`') return null;

            const details = fieldArr.slice(2).join(' ');
            const { defaultValue, check } = parseColumnAttributes(details);
            const typeAndLength = nameAndType[1].replace(')', '').split('(');

            return {
               name: nameAndType[0].replaceAll('`', ''),
               type: typeAndLength[0].toUpperCase(),
               length: typeAndLength[1] ? typeAndLength[1] : null,
               default: defaultValue,
               ...(check ? { check } : {})
            };
         }
         catch (err) {
            return null;
         }
      })
      .filter(Boolean)
      .reduce((acc: Record<string, CreateTableColumn>, curr) => {
         acc[curr.name] = curr;
         return acc;
      }, {});
}

export interface ColumnRow {
   COLUMN_TYPE: string;
   NUMERIC_PRECISION: number;
   COLUMN_NAME: string;
   COLUMN_DEFAULT: string;
   COLUMN_KEY: string;
   DATA_TYPE: string;
   TABLE_SCHEMA: string;
   TABLE_NAME: string;
   NUMERIC_SCALE: number;
   DATETIME_PRECISION: number;
   CHARACTER_MAXIMUM_LENGTH: number;
   IS_NULLABLE: string;
   ORDINAL_POSITION: number;
   CHARACTER_SET_NAME: string;
   COLLATION_NAME: string;
   EXTRA: string;
   COLUMN_COMMENT: string;
}

/** information_schema.COLUMNS row (+ SHOW CREATE TABLE details) → Antares field */
export function mapColumn (field: ColumnRow, createColumns: Record<string, CreateTableColumn> | false) {
   const numLengthMatch = field.COLUMN_TYPE.match(/int\(([^)]+)\)/);
   const numLength = numLengthMatch ? +numLengthMatch.pop() : field.NUMERIC_PRECISION || null;
   const enumValues = /(enum|set)/.test(field.COLUMN_TYPE)
      ? field.COLUMN_TYPE.match(/\(([^)]+)\)/)[0].slice(1, -1)
      : null;
   const createColumn = createColumns && createColumns[field.COLUMN_NAME];

   return {
      name: field.COLUMN_NAME,
      key: field.COLUMN_KEY.toLowerCase(),
      type: createColumn ? createColumn.type : field.DATA_TYPE.toUpperCase(),
      schema: field.TABLE_SCHEMA,
      table: field.TABLE_NAME,
      numPrecision: field.NUMERIC_PRECISION,
      numScale: Number(field.NUMERIC_SCALE),
      numLength,
      enumValues,
      datePrecision: field.DATETIME_PRECISION,
      charLength: field.CHARACTER_MAXIMUM_LENGTH,
      nullable: field.IS_NULLABLE.includes('YES'),
      unsigned: field.COLUMN_TYPE.includes('unsigned'),
      zerofill: field.COLUMN_TYPE.includes('zerofill'),
      order: field.ORDINAL_POSITION,
      default: createColumn ? createColumn.default : field.COLUMN_DEFAULT,
      charset: field.CHARACTER_SET_NAME,
      collation: field.COLLATION_NAME,
      autoIncrement: field.EXTRA.includes('auto_increment'),
      // VIRTUAL GENERATED, STORED GENERATED (MariaDB < 10.2: PERSISTENT GENERATED), not DEFAULT_GENERATED (expression defaults)
      generated: /\b(VIRTUAL|STORED|PERSISTENT) GENERATED\b/i.test(field.EXTRA),
      onUpdate: field.EXTRA.toLowerCase().includes('on update')
         ? field.EXTRA.substr(field.EXTRA.indexOf('on update') + 9, field.EXTRA.length).trim()
         : '',
      comment: field.COLUMN_COMMENT,
      ...(createColumn?.check ? { check: createColumn.check } : {})
   };
}
