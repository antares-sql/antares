import { ARRAY, BIT, BLOB, BOOLEAN, FLOAT, LONG_TEXT, NUMBER, STRUCTURED_TEXT, TEXT, TEXT_SEARCH } from 'common/fieldTypes';

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

   if ([...TEXT, ...LONG_TEXT, ...STRUCTURED_TEXT].includes(type))
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

/**
 * Bytes of a binary value sent back by the UI. Rows reach the renderer with Uint8Array values and
 * come back JSON-cloned ({ "0": 18, "1": 52, ... }) or as a serialized Buffer ({ type: 'Buffer', data }).
 */
export function binaryValue (value: unknown): Buffer | null {
   if (Buffer.isBuffer(value)) return value;
   if (value instanceof Uint8Array) return Buffer.from(value);

   if (value && typeof value === 'object' && !Array.isArray(value)) {
      const obj = value as Record<string, unknown>;
      if (obj.type === 'Buffer' && Array.isArray(obj.data))
         return Buffer.from(obj.data as number[]);

      const keys = Object.keys(obj);
      const isByteArray = keys.length > 0 && keys.every((key, i) => {
         const byte = obj[key];
         return key === String(i) && Number.isInteger(byte) && (byte as number) >= 0 && (byte as number) <= 255;
      });
      if (isByteArray)
         return Buffer.from(keys.map(key => obj[key] as number));
   }

   return null;
}

/** Literal of a value read from a result row, to find the row again (WHERE of updates and deletes) */
export function rowValueLiteral (dialect: QueryDialect, value: unknown): string {
   if (value === null || value === undefined) return 'NULL';
   if (typeof value === 'number' || typeof value === 'bigint' || typeof value === 'boolean') return String(value);

   const bytes = binaryValue(value);
   if (bytes) return dialect.blobLiteral(bytes);

   return dialect.quoteString(String(value));
}

/** Condition matching a value read from a result row, appended to the column name */
export function rowValueCondition (dialect: QueryDialect, value: unknown): string {
   if (value === null || value === undefined) return 'IS NULL';
   if (typeof value === 'object' && !binaryValue(value)) return dialect.jsonEquals(value);
   return `= ${rowValueLiteral(dialect, value)}`;
}
