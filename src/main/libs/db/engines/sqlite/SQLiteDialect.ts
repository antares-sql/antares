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

   protected whereClauses (clauses: string[]) {
      return clauses.map(clause => clause.replace('= null', 'IS NULL'));
   }
}
