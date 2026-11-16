import { QueryDialect } from '../../core/QueryDialect';

/** MySQL / MariaDB */
export class MySQLDialect extends QueryDialect {
   quoteIdentifier (name: string) {
      return `\`${name}\``;
   }
}
