import { sqlEscaper } from 'common/libs/sqlUtils';

import { QueryDialect } from '../../core/QueryDialect';

/** MySQL */
export class MySQLDialect extends QueryDialect {
   quoteIdentifier (name: string) {
      return `\`${name}\``;
   }

   // MySQL treats backslash as an escape character inside string literals
   quoteString (value: string) {
      return `'${sqlEscaper(value)}'`;
   }

   blobLiteral (data: Buffer) {
      return data.length ? `0x${data.toString('hex')}` : '\'\'';
   }

   jsonEquals (value: unknown) {
      return ` = CAST(${this.quoteString(JSON.stringify(value))} AS JSON)`;
   }
}

/** MariaDB: JSON is an alias of LONGTEXT, compared as a string */
export class MariaDBDialect extends MySQLDialect {
   jsonEquals (value: unknown) {
      return ` = ${this.quoteString(JSON.stringify(value))}`;
   }
}
