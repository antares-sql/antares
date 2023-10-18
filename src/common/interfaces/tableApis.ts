import { UsableLocale } from '@faker-js/faker';

export interface TableUpdateParams {
   uid: string;
   schema: string;
   table: string;
   primary?: string;
   id: number | string;
   content: number | string | boolean | Date | Blob | null;
   type: string;
   field: string;
}

export interface TableDeleteParams {
   uid: string;
   schema: string;
   table: string;
   primary?: string;
   field: string;
   // eslint-disable-next-line @typescript-eslint/no-explicit-any
   rows: {[key: string]: any};
}

export type TableFilterOperator = '=' | '!=' | '>' | '<' | '>=' | '<=' | 'IN' | 'NOT IN' | 'LIKE' | 'NOT LIKE' | 'RLIKE' | 'NOT RLIKE' | 'BETWEEN' | 'IS NULL' | 'IS NOT NULL'

export interface TableFilterClausole {
   active: boolean;
   field: string;
   op:TableFilterOperator;
   value: '';
   value2: '';
}

export interface InsertRowsParams {
   uid: string;
   schema: string;
   table: string;
   row: {[key: string]: {
         group: string;
         method: string;
         // eslint-disable-next-line @typescript-eslint/no-explicit-any
         params: any;
         // eslint-disable-next-line @typescript-eslint/no-explicit-any
         value: any;
         length: number;
      };
   };
   repeat: number;
   fields: {[key: string]: string};
   locale: UsableLocale;
}
