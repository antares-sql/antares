import { TypesGroup } from 'common/interfaces/antares';

export default [
   {
      group: 'integer',
      types: [
         {
            name: 'SMALLINT',
            length: false,
            collation: false,
            unsigned: true,
            zerofill: true
         },
         {
            name: 'INTEGER',
            length: false,
            collation: false,
            unsigned: true,
            zerofill: true
         },
         {
            name: 'BIGINT',
            length: false,
            collation: false,
            unsigned: true,
            zerofill: true
         }
      ]
   },
   {
      group: 'float',
      types: [
         {
            name: 'DECIMAL',
            length: true,
            scale: true,
            collation: false,
            unsigned: false,
            zerofill: false
         },
         {
            name: 'NUMERIC',
            length: true,
            scale: true,
            collation: false,
            unsigned: false,
            zerofill: false
         },
         {
            name: 'FLOAT',
            length: false,
            collation: false,
            unsigned: false,
            zerofill: false
         },
         {
            name: 'DOUBLE PRECISION',
            length: false,
            collation: false,
            unsigned: false,
            zerofill: false
         }
      ]
   },
   {
      group: 'string',
      types: [
         {
            name: 'CHAR',
            length: true,
            collation: true,
            unsigned: false,
            zerofill: false
         },
         {
            name: 'VARCHAR',
            length: true,
            collation: true,
            unsigned: false,
            zerofill: false
         }
      ]
   },
   {
      group: 'binary',
      types: [
         {
            name: 'BLOB',
            length: true,
            collation: false,
            unsigned: false,
            zerofill: false
         }
      ]
   },
   {
      group: 'time',
      types: [
         {
            name: 'DATE',
            length: false,
            collation: false,
            unsigned: false,
            zerofill: false
         },
         {
            name: 'TIME',
            length: true,
            collation: false,
            unsigned: false,
            zerofill: false
         },
         {
            name: 'TIMESTAMP',
            length: false,
            collation: false,
            unsigned: false,
            zerofill: false
         }
      ]
   }
] as TypesGroup[];
