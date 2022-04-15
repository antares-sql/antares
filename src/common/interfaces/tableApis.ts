import { UsableLocale } from '@faker-js/faker';

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
