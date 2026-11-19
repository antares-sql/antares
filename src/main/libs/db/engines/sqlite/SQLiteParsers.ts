/**
 * Pure parsers of SQLite metadata (CREATE statements stored in sqlite_master).
 */

/** An identifier in any SQLite quoting style: "x", `x`, [x] or bare */
const IDENT = '(?:"(?:[^"]|"")+"|`(?:[^`]|``)+`|\\[[^\\]]+\\]|[^\\s.(]+)';

const unquote = (identifier: string) => {
   const quote = identifier[0];
   if (quote === '"' || quote === '`')
      return identifier.slice(1, -1).replaceAll(quote + quote, quote);
   if (quote === '[')
      return identifier.slice(1, -1);
   return identifier;
};

export interface TriggerDefinition {
   sql: string;
   name: string;
   table: string;
   activation: string;
   event: string;
}

const TRIGGER_HEADER = new RegExp(
   `^\\s*CREATE\\s+(?:TEMP(?:ORARY)?\\s+)?TRIGGER\\s+(?:IF\\s+NOT\\s+EXISTS\\s+)?(?:${IDENT}\\.)?${IDENT}\\s+` +
   '(?:(BEFORE|AFTER|INSTEAD\\s+OF)\\s+)?(DELETE|INSERT|UPDATE)(?:\\s+OF\\s+[^]*?)?\\s+ON\\s+' +
   `(${IDENT})`,
   'i'
);

/** Parses a CREATE TRIGGER statement. `sql` is the BEGIN ... END block */
export function parseTrigger (statement: string, name: string): TriggerDefinition {
   const header = statement.match(TRIGGER_HEADER);
   if (!header)
      throw new Error(`Unable to parse trigger definition: ${statement}`);

   const afterHeader = statement.slice(header.index + header[0].length);
   const begin = afterHeader.search(/\bBEGIN\b/i);

   return {
      sql: begin >= 0 ? afterHeader.slice(begin).trim() : afterHeader.trim(),
      name,
      table: unquote(header[3]),
      activation: (header[1] ?? 'BEFORE').toUpperCase().replace(/\s+/, ' '),
      event: header[2].toUpperCase()
   };
}

const VIEW_HEADER = new RegExp(
   `^\\s*CREATE\\s+(?:TEMP(?:ORARY)?\\s+)?VIEW\\s+(?:IF\\s+NOT\\s+EXISTS\\s+)?(?:${IDENT}\\.)?${IDENT}\\s*(?:\\([^)]*\\)\\s*)?AS\\s`,
   'i'
);

/** The SELECT of a CREATE VIEW statement */
export function parseViewSelect (statement: string): string {
   const header = statement.match(VIEW_HEADER);
   return header ? statement.slice(header[0].length) : statement.match(/(?<=(AS|as)( |\n)).*?$/gs)?.[0];
}

/**
 * Converts the BigInt values of a row read with safeIntegers(true): numbers within the safe range
 * become Number, larger ones become strings (as the pg driver does for int8), so they keep their
 * exact value in the UI and in the WHERE clauses built from them.
 */
export const normalizeIntegers = <T extends Record<string, unknown>>(row: T): T => {
   for (const key in row) {
      const value = row[key];
      if (typeof value === 'bigint') {
         (row as Record<string, unknown>)[key] = value >= Number.MIN_SAFE_INTEGER && value <= Number.MAX_SAFE_INTEGER
            ? Number(value)
            : value.toString();
      }
   }
   return row;
};
