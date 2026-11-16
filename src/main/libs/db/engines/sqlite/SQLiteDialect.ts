import { QueryDialect } from '../../core/QueryDialect';

export class SQLiteDialect extends QueryDialect {
   quoteIdentifier (name: string) {
      return `"${name}"`;
   }

   // Historical behavior: object clause keys and INSERT columns are not quoted on SQLite
   protected clauseKey (key: string) {
      return key;
   }

   protected insertField (field: string) {
      return field;
   }

   // No boolean type: stored as 0/1
   booleanLiteral (value: string | boolean) {
      return String(Number(value === 'true' || value === true));
   }

   protected whereClauses (clauses: string[]) {
      return clauses.map(clause => clause.replace('= null', 'IS NULL'));
   }
}
