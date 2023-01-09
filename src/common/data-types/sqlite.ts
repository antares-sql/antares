import { TypesGroup } from 'common/interfaces/antares';

export default [
   {
      group: 'integer',
      types: [
         {
            name: 'INT',
            length: 10,
            collation: false,
            unsigned: true,
            zerofill: true
         },
         {
            name: 'INTEGER',
            length: true,
            collation: false,
            unsigned: true,
            zerofill: true
         },
         {
            name: 'BIGINT',
            length: true,
            collation: false,
            unsigned: true,
            zerofill: true
         },
         {
            name: 'NUMERIC',
            length: true,
            collation: false,
            unsigned: true,
            zerofill: true
         },
         {
            name: 'BOOLEAN',
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
            name: 'FLOAT',
            length: true,
            collation: false,
            unsigned: false,
            zerofill: false
         },
         {
            name: 'REAL',
            length: true,
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
         },
         {
            name: 'TEXT',
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
            name: 'DATETIME',
            length: true,
            collation: false,
            unsigned: false,
            zerofill: false
         }
      ]
   },
   {
      group: 'other',
      types: [
         {
            name: 'NONE',
            length: false,
            collation: false,
            unsigned: false,
            zerofill: false
         }
      ]
   }
] as TypesGroup[];
