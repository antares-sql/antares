import * as antares from 'common/interfaces/antares';

import { QueryDialect } from '../../core/QueryDialect';

/**
 * Firebird has no schemas, uses FIRST/SKIP on SELECT and ROWS on UPDATE/DELETE,
 * and has no multi-row INSERT ... VALUES.
 */
export class FirebirdDialect extends QueryDialect {
   quoteIdentifier (name: string) {
      return `"${name}"`;
   }

   protected tableRef (query: antares.QueryBuilderObject) {
      return this.quoteIdentifier(query.from);
   }

   protected whereClauses (clauses: string[]) {
      return clauses.map(clause => clause.replace('= null', 'IS NULL'));
   }

   render (query: antares.QueryBuilderObject): string {
      if (query.insert.length)
         return this.renderInsert(query);

      const whereArray = this.whereClauses(this.reduce(query.where));
      const whereRaw = whereArray.length ? ` WHERE ${whereArray.join(' AND ')}` : '';
      const rowsRaw = query.limit ? ` ROWS ${query.limit}` : '';

      if (query.delete)
         return `DELETE FROM ${this.tableRef(query)}${whereRaw}${rowsRaw}`;

      const updateArray = this.reduce(query.update);
      if (updateArray.length)
         return `UPDATE ${this.tableRef(query)} SET ${updateArray.join(', ')}${whereRaw}${rowsRaw}`;

      const firstRaw = query.limit ? ` FIRST ${query.limit}` : '';
      const skipRaw = query.offset ? ` SKIP ${query.offset}` : '';
      const selectArray = this.reduce(query.select);
      const fromRaw = query.from ? ` FROM ${this.tableRef(query)}` : '';
      const groupByArray = this.reduce(query.groupBy);
      const groupByRaw = groupByArray.length ? ` GROUP BY ${groupByArray.join(', ')}` : '';
      const orderByArray = this.reduce(query.orderBy);
      const orderByRaw = orderByArray.length ? ` ORDER BY ${orderByArray.join(', ')}` : '';

      return `SELECT${firstRaw}${skipRaw} ${selectArray.length ? selectArray.join(', ') : '*'}${fromRaw}${whereRaw}${groupByRaw}${orderByRaw}`;
   }

   /** One statement per row, split by the client before execution */
   private renderInsert (query: antares.QueryBuilderObject): string {
      const fields = Object.keys(query.insert[0]).map(field => this.insertField(field)).join(', ');

      return query.insert
         .map(row => `INSERT INTO ${this.tableRef(query)} (${fields}) VALUES (${Object.values(row).join(', ')})`)
         .join(';\n');
   }
}
