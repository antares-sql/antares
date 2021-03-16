module.exports = [
   {
      group: 'integer',
      types: [
         {
            name: 'SMALLINT',
            length: true,
            unsigned: true
         },
         {
            name: 'INTEGER',
            length: true,
            unsigned: true
         },
         {
            name: 'BIGINT',
            length: true,
            unsigned: true
         },
         {
            name: 'DECIMAL',
            length: true,
            unsigned: true
         },
         {
            name: 'NUMERIC',
            length: true,
            unsigned: true
         },
         {
            name: 'SMALLSERIAL',
            length: true,
            unsigned: true
         },
         {
            name: 'SERIAL',
            length: true,
            unsigned: true
         },
         {
            name: 'BIGSERIAL',
            length: true,
            unsigned: true
         }
      ]
   },
   {
      group: 'float',
      types: [
         {
            name: 'REAL',
            length: true,
            unsigned: true
         },
         {
            name: 'DOUBLE PRECISION',
            length: true,
            unsigned: true
         }
      ]
   },
   {
      group: 'monetary',
      types: [
         {
            name: 'money',
            length: true,
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
            name: 'CHAR',
            length: false,
            unsigned: false
         },
         {
            name: 'CHARACTER',
            length: false,
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
            length: true,
            unsigned: false
         }
      ]
   },
   {
      group: 'time',
      types: [
         {
            name: 'TIMESTAMP',
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
            length: true,
            unsigned: false
         },
         {
            name: 'TIME',
            length: true,
            unsigned: false
         },
         {
            name: 'TIME WITH TIME ZONE',
            length: true,
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
            length: false,
            unsigned: false
         },
         {
            name: 'BIT VARYING',
            length: false,
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
];
