/** PostgreSQL keywords that can't be used as unquoted type names (reserved + type/function name keywords) */
const reservedKeywords = new Set([
   'all', 'analyse', 'analyze', 'and', 'any', 'array', 'as', 'asc', 'asymmetric', 'authorization', 'binary', 'both',
   'case', 'cast', 'check', 'collate', 'collation', 'column', 'concurrently', 'constraint', 'create', 'cross',
   'current_catalog', 'current_date', 'current_role', 'current_schema', 'current_time', 'current_timestamp',
   'current_user', 'default', 'deferrable', 'desc', 'distinct', 'do', 'else', 'end', 'except', 'false', 'fetch',
   'for', 'foreign', 'freeze', 'from', 'full', 'grant', 'group', 'having', 'ilike', 'in', 'initially', 'inner',
   'intersect', 'into', 'is', 'isnull', 'join', 'lateral', 'leading', 'left', 'like', 'limit', 'localtime',
   'localtimestamp', 'natural', 'not', 'notnull', 'null', 'offset', 'on', 'only', 'or', 'order', 'outer', 'overlaps',
   'placing', 'primary', 'references', 'returning', 'right', 'select', 'session_user', 'similar', 'some',
   'symmetric', 'system_user', 'table', 'tablesample', 'then', 'to', 'trailing', 'true', 'union', 'unique', 'user',
   'using', 'variadic', 'verbose', 'when', 'where', 'window', 'with'
]);

/** Quotes a PostgreSQL identifier only when needed (like quote_ident()) */
export function pgQuoteIdent (name: string): string {
   return /^[a-z_][a-z0-9_$]*$/.test(name) && !reservedKeywords.has(name)
      ? name
      : `"${name.replaceAll('"', '""')}"`;
}

/**
 * How a user-defined type (enum, domain, extension type...) is written in the column definitions
 * of a table of `tableSchema`: types of other schemas are schema-qualified, names that need quotes are quoted
 * and plain names are upper case like the built-in types (unquoted identifiers are case-insensitive).
 */
export function pgTypeIdentifier (typeSchema: string, typeName: string, tableSchema: string): string {
   if (typeSchema !== tableSchema)
      return `${pgQuoteIdent(typeSchema)}.${pgQuoteIdent(typeName)}`;

   const quoted = pgQuoteIdent(typeName);
   return quoted === typeName ? typeName.toUpperCase() : quoted;
}
