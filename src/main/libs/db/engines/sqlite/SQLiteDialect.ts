import { QueryDialect } from '../../core/QueryDialect';

export class SQLiteDialect extends QueryDialect {
   quoteIdentifier (name: string) {
      return `"${name}"`;
   }

   // No boolean type: stored as 0/1
   booleanLiteral (value: string | boolean) {
      return String(Number(value === 'true' || value === true));
   }

   protected whereClauses (clauses: string[]) {
      return clauses.map(clause => clause.replace('= null', 'IS NULL'));
   }
}
