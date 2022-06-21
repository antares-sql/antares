import { TypesGroup } from 'common/interfaces/antares';

export default [
   {
      group: 'integer',
      types: [
         {
            name: 'SMALLINT',
            length: false,
            unsigned: true
         },
         {
            name: 'INTEGER',
            length: false,
            unsigned: true
         },
         {
            name: 'BIGINT',
            length: false,
            unsigned: true
         },
         {
            name: 'DECIMAL',
            length: false,
            unsigned: true
         },
         {
            name: 'SMALLSERIAL',
            length: false,
            unsigned: true
         },
         {
            name: 'SERIAL',
            length: false,
            unsigned: true
         },
         {
            name: 'BIGSERIAL',
            length: false,
            unsigned: true
         }
      ]
   },
   {
      group: 'float',
      types: [
         {
            name: 'REAL',
            length: false,
            unsigned: true
         },
         {
            name: 'NUMERIC',
            length: true,
            unsigned: true,
            scale: true
         },
         {
            name: 'DOUBLE PRECISION',
            length: false,
            unsigned: true
         }
      ]
   },
   {
      group: 'monetary',
      types: [
         {
            name: 'money',
            length: false,
            unsigned: true
         }
      ]
   },
   {
      group: 'string',
      types: [
         {
            name: 'CHARACTER VARYING',
            length: true,
            unsigned: false
         },
         {
            name: 'CHARACTER',
            length: true,
            unsigned: false
         },
         {
            name: 'TEXT',
            length: false,
            unsigned: false
         },
         {
            name: '"CHAR"',
            length: false,
            unsigned: false
         },
         {
            name: 'NAME',
            length: false,
            unsigned: false
         }
      ]
   },
   {
      group: 'binary',
      types: [
         {
            name: 'BYTEA',
            length: false,
            unsigned: false
         }
      ]
   },
   {
      group: 'time',
      types: [
         {
            name: 'TIMESTAMP WITHOUT TIME ZONE',
            length: false,
            unsigned: false
         },
         {
            name: 'TIMESTAMP WITH TIME ZONE',
            length: false,
            unsigned: false
         },
         {
            name: 'DATE',
            length: false,
            unsigned: false
         },
         {
            name: 'TIME WITHOUT TIME ZONE',
            length: false,
            unsigned: false
         },
         {
            name: 'TIME WITH TIME ZONE',
            length: false,
            unsigned: false
         },
         {
            name: 'INTERVAL',
            length: false,
            unsigned: false
         }
      ]
   },
   {
      group: 'boolean',
      types: [
         {
            name: 'BOOLEAN',
            length: false,
            unsigned: false
         }
      ]
   },
   {
      group: 'geometric',
      types: [
         {
            name: 'POINT',
            length: false,
            unsigned: false
         },
         {
            name: 'LINE',
            length: false,
            unsigned: false
         },
         {
            name: 'LSEG',
            length: false,
            unsigned: false
         },
         {
            name: 'BOX',
            length: false,
            unsigned: false
         },
         {
            name: 'PATH',
            length: false,
            unsigned: false
         },
         {
            name: 'POLYGON',
            length: false,
            unsigned: false
         },
         {
            name: 'CIRCLE',
            length: false,
            unsigned: false
         }
      ]
   },
   {
      group: 'network',
      types: [
         {
            name: 'CIDR',
            length: false,
            unsigned: false
         },
         {
            name: 'INET',
            length: false,
            unsigned: false
         },
         {
            name: 'MACADDR',
            length: false,
            unsigned: false
         },
         {
            name: 'MACADDR8',
            length: false,
            unsigned: false
         }
      ]
   },
   {
      group: 'bit',
      types: [
         {
            name: 'BIT',
            length: true,
            unsigned: false
         },
         {
            name: 'BIT VARYING',
            length: true,
            unsigned: false
         }
      ]
   },
   {
      group: 'text search',
      types: [
         {
            name: 'TSVECTOR',
            length: false,
            unsigned: false
         },
         {
            name: 'TSQUERY',
            length: false,
            unsigned: false
         }
      ]
   },
   {
      group: 'uuid',
      types: [
         {
            name: 'UUID',
            length: false,
            unsigned: false
         }
      ]
   },
   {
      group: 'xml',
      types: [
         {
            name: 'XML',
            length: false,
            unsigned: false
         }
      ]
   },
   {
      group: 'json',
      types: [
         {
            name: 'JSON',
            length: false,
            unsigned: false
         },
         {
            name: 'JSONB',
            length: false,
            unsigned: false
         },
         {
            name: 'JSONPATH',
            length: false,
            unsigned: false
         }
      ]
   }
] as TypesGroup[];
