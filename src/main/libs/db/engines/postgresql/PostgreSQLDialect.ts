import * as antares from 'common/interfaces/antares';

import { QueryDialect } from '../../core/QueryDialect';

export class PostgreSQLDialect extends QueryDialect {
   quoteIdentifier (name: string) {
      return `"${name}"`;
   }

   blobLiteral (data: Buffer) {
      return `decode('${data.toString('hex')}', 'hex')`;
   }

   jsonEquals (value: unknown) {
      return `::text = ${this.quoteString(JSON.stringify(value))}`;
   }

   // PostgreSQL has no LIMIT/OFFSET on UPDATE/DELETE
   protected limitRaw (query: antares.QueryBuilderObject, selectArray: string[]) {
      return selectArray.length && query.limit ? `LIMIT ${query.limit} ` : '';
   }

   protected offsetRaw (query: antares.QueryBuilderObject, selectArray: string[]) {
      return selectArray.length && query.offset ? `OFFSET ${query.offset} ` : '';
   }
}
