/**
 * Result rows are objects keyed by column name: two columns with the same name (`SELECT a.id, b.id`,
 * `SELECT 1, 2` on PostgreSQL) would share a key and one of the values would be lost (#634, #975).
 * Drivers are asked for array rows, and the columns get unique names here.
 */

/**
 * Unique names for the columns of a result set: later duplicates get a numeric suffix (id, id_2, id_3).
 * `prefixes` (e.g. "table." for nested results) are part of the key: the same name in different
 * tables is not a duplicate.
 */
export function uniqueColumnNames (names: string[], prefixes: string[] = []): string[] {
   const keys = new Set(names.map((name, i) => `${prefixes[i] ?? ''}${name}`));
   const used = new Set<string>();

   return names.map((name, i) => {
      const prefix = prefixes[i] ?? '';
      let unique = name;

      // A suffixed name must not clash with a real column either (SELECT a, a, a_2)
      for (let n = 2; used.has(`${prefix}${unique}`) || (unique !== name && keys.has(`${prefix}${unique}`)); n++)
         unique = `${name}_${n}`;

      used.add(`${prefix}${unique}`);
      return unique;
   });
}

/** Array rows to object rows with the given keys (in column order) */
export function arrayRowsToObjects (rows: unknown[][], keys: string[]): Record<string, unknown>[] {
   return rows.map(row => {
      const obj: Record<string, unknown> = {};
      keys.forEach((key, i) => {
         obj[key] = row[i];
      });
      return obj;
   });
}
