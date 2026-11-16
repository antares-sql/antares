import { ARRAY, BIT, BLOB, BOOLEAN, FLOAT, LONG_TEXT, NUMBER, TEXT, TEXT_SEARCH } from 'common/fieldTypes';

import { QueryDialect } from './QueryDialect';

export interface FormattedValue {
   /** SQL literal/expression to put in the statement */
   sql: string;
   /** The stored value may differ from what the UI shows (e.g. BLOB, BIT): the UI should reload the row */
   reload: boolean;
}

export interface FormatValueOptions {
   /** Reads a file for BLOB values (the UI sends a file path). Injected to keep this function pure */
   readFile: (path: string) => Buffer;
}

/**
 * Converts a value coming from the UI (cell editing, rows insertion) into an SQL literal
 * for the given column type and engine dialect.
 */
export function formatValue (
   dialect: QueryDialect,
   type: string,
   // eslint-disable-next-line @typescript-eslint/no-explicit-any
   value: any,
   { readFile }: FormatValueOptions
): FormattedValue {
   if (value === null || value === undefined)
      return { sql: 'NULL', reload: false };

   if ([...NUMBER, ...FLOAT].includes(type))
      return { sql: String(value), reload: false };

   if ([...TEXT, ...LONG_TEXT].includes(type))
      return { sql: dialect.quoteString(String(value)), reload: false };

   if (ARRAY.includes(type)) // PostgreSQL array literal, e.g. {1,2,3}
      return { sql: dialect.quoteString(String(value)), reload: false };

   if (TEXT_SEARCH.includes(type))
      return { sql: dialect.quoteString(String(value)), reload: false };

   if (BLOB.includes(type)) {
      const data = value ? readFile(value) : Buffer.alloc(0);
      return { sql: dialect.blobLiteral(data), reload: !!value };
   }

   if (BIT.includes(type))
      return { sql: dialect.bitLiteral(String(value)), reload: true };

   if (BOOLEAN.includes(type))
      return { sql: dialect.booleanLiteral(value), reload: false };

   return { sql: dialect.quoteString(String(value)), reload: false };
}
