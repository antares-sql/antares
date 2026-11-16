import * as antares from 'common/interfaces/antares';

/** A clause passed to the builder: raw string/number, array of raw strings or `{ column: 'expression' }` object */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Clause = string | number | string[] | Record<string, any>;

/**
 * Renders a QueryBuilderObject to SQL for a specific engine.
 * Pure: no state, no I/O. Engines customize the hooks (quoting, table reference, limit/offset).
 */
export abstract class QueryDialect {
   /** Quotes a table/schema/column name */
   abstract quoteIdentifier (name: string): string;

   // Literals

   /** SQL string literal (standard SQL: single quotes, quotes doubled) */
   quoteString (value: string): string {
      return `'${value.replaceAll('\'', '\'\'')}'`;
   }

   /** Binary literal */
   blobLiteral (data: Buffer): string {
      return `X'${data.toString('hex')}'`;
   }

   /** Bit string literal, e.g. b'0101' */
   bitLiteral (bits: string): string {
      if (!/^[01]*$/.test(bits))
         throw new Error(`Invalid bit value: ${bits}`);
      return `b'${bits}'`;
   }

   /** Boolean value as received from the UI ('true' / 'false' / boolean) */
   booleanLiteral (value: string | boolean): string {
      return String(value);
   }

   /** Equality condition on a JSON column, appended to the column name: `col${jsonEquals(v)}` */
   jsonEquals (value: unknown): string {
      return ` = ${this.quoteString(JSON.stringify(value))}`;
   }

   /** Quotes the keys of object clauses: `where({ id: '= 1' })` → `"id" = 1` */
   protected clauseKey (key: string): string {
      return this.quoteIdentifier(key);
   }

   /** Quotes the column names of INSERT statements */
   protected insertField (field: string): string {
      return this.quoteIdentifier(field);
   }

   protected tableRef (query: antares.QueryBuilderObject): string {
      return `${query.schema ? `${this.quoteIdentifier(query.schema)}.` : ''}${this.quoteIdentifier(query.from)}`;
   }

   /** Post-processes WHERE clauses */
   protected whereClauses (clauses: string[]): string[] {
      return clauses;
   }

   // eslint-disable-next-line @typescript-eslint/no-unused-vars
   protected limitRaw (query: antares.QueryBuilderObject, _selectArray: string[]): string {
      return query.limit ? `LIMIT ${query.limit} ` : '';
   }

   // eslint-disable-next-line @typescript-eslint/no-unused-vars
   protected offsetRaw (query: antares.QueryBuilderObject, _selectArray: string[]): string {
      return query.offset ? `OFFSET ${query.offset} ` : '';
   }

   /** Flattens builder arguments into a list of SQL fragments */
   reduce (clauses: Clause[]): string[] {
      return clauses.reduce<string[]>((acc, curr) => {
         switch (typeof curr) {
            case 'number':
            case 'string':
               return [...acc, String(curr)];
            case 'object':
               if (Array.isArray(curr))
                  return [...acc, ...curr];
               else
                  return [...acc, ...Object.entries(curr).map(([key, value]) => `${this.clauseKey(key)} ${value}`)];
         }
         return acc;
      }, []);
   }

   protected fromRaw (query: antares.QueryBuilderObject): string {
      let fromRaw = '';

      if (!query.update.length && !Object.keys(query.insert).length && !!query.from)
         fromRaw = 'FROM';
      else if (Object.keys(query.insert).length)
         fromRaw = 'INTO';

      fromRaw += query.from ? ` ${this.tableRef(query)} ` : '';
      return fromRaw;
   }

   protected insertRaw (query: antares.QueryBuilderObject): string {
      if (!query.insert.length) return '';

      const fieldsList = Object.keys(query.insert[0]).map(field => this.insertField(field));
      const rowsList = query.insert.map(el => `(${Object.values(el).join(', ')})`);

      return `(${fieldsList.join(', ')}) VALUES ${rowsList.join(', ')} `;
   }

   render (query: antares.QueryBuilderObject): string {
      const selectArray = this.reduce(query.select);
      const selectRaw = selectArray.length ? `SELECT ${selectArray.join(', ')} ` : '';

      const fromRaw = this.fromRaw(query);

      const whereArray = this.whereClauses(this.reduce(query.where));
      const whereRaw = whereArray.length ? `WHERE ${whereArray.join(' AND ')} ` : '';

      const updateArray = this.reduce(query.update);
      const updateRaw = updateArray.length ? `SET ${updateArray.join(', ')} ` : '';

      const insertRaw = this.insertRaw(query);

      const groupByArray = this.reduce(query.groupBy);
      const groupByRaw = groupByArray.length ? `GROUP BY ${groupByArray.join(', ')} ` : '';

      const orderByArray = this.reduce(query.orderBy);
      const orderByRaw = orderByArray.length ? `ORDER BY ${orderByArray.join(', ')} ` : '';

      const limitRaw = this.limitRaw(query, selectArray);
      const offsetRaw = this.offsetRaw(query, selectArray);

      return `${selectRaw}${updateRaw ? 'UPDATE' : ''}${insertRaw ? 'INSERT ' : ''}${query.delete ? 'DELETE ' : ''}${fromRaw}${updateRaw}${whereRaw}${groupByRaw}${orderByRaw}${limitRaw}${offsetRaw}${insertRaw}`;
   }
}
