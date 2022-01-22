module.exports = [
   {
      group: 'integer',
      types: [
         {
            name: 'TINYINT',
            length: 4,
            collation: false,
            unsigned: true,
            zerofill: true
         },
         {
            name: 'SMALLINT',
            length: true,
            collation: false,
            unsigned: true,
            zerofill: true
         },
         {
            name: 'INT',
            length: true,
            collation: false,
            unsigned: true,
            zerofill: true
         },
         {
            name: 'MEDIUMINT',
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
            name: 'BIT',
            length: true,
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
            name: 'DOUBLE',
            length: true,
            collation: false,
            unsigned: false,
            zerofill: false
         },
         {
            name: 'DECIMAL',
            length: true,
            scale: true,
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
            name: 'TINYTEXT',
            length: false,
            collation: true,
            unsigned: false,
            zerofill: false
         },
         {
            name: 'MEDIUMTEXT',
            length: false,
            collation: true,
            unsigned: false,
            zerofill: false
         },
         {
            name: 'TEXT',
            length: false,
            collation: true,
            unsigned: false,
            zerofill: false
         },
         {
            name: 'LONGTEXT',
            length: false,
            collation: true,
            unsigned: false,
            zerofill: false
         },
         {
            name: 'JSON',
            length: false,
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
            name: 'BINARY',
            length: true,
            collation: false,
            unsigned: false,
            zerofill: false
         },
         {
            name: 'VARBINARY',
            length: true,
            collation: false,
            unsigned: false,
            zerofill: false
         },
         {
            name: 'TINYBLOB',
            length: false,
            collation: false,
            unsigned: false,
            zerofill: false
         },
         {
            name: 'BLOB',
            length: false,
            collation: false,
            unsigned: false,
            zerofill: false
         },
         {
            name: 'MEDIUMBLOB',
            length: false,
            collation: false,
            unsigned: false,
            zerofill: false
         },
         {
            name: 'LONGBLOB',
            length: false,
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
            length: true,
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
            name: 'YEAR',
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
         },
         {
            name: 'TIMESTAMP',
            length: false,
            collation: false,
            unsigned: false,
            zerofill: false
         }
      ]
   },
   {
      group: 'spatial',
      types: [
         {
            name: 'POINT',
            length: false,
            collation: false,
            unsigned: false,
            zerofill: false
         },
         {
            name: 'LINESTRING',
            length: false,
            collation: false,
            unsigned: false,
            zerofill: false
         },
         {
            name: 'POLYGON',
            length: false,
            collation: false,
            unsigned: false,
            zerofill: false
         },
         {
            name: 'GEOMETRY',
            length: false,
            collation: false,
            unsigned: false,
            zerofill: false
         },
         {
            name: 'MULTIPOINT',
            length: false,
            collation: false,
            unsigned: false,
            zerofill: false
         },
         {
            name: 'MULTILINESTRING',
            length: false,
            collation: false,
            unsigned: false,
            zerofill: false
         },
         {
            name: 'MULTIPOLYGON',
            length: false,
            collation: false,
            unsigned: false,
            zerofill: false
         },
         {
            name: 'GEOMETRYCOLLECTION',
            length: false,
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
            name: 'ENUM',
            length: true,
            collation: false,
            unsigned: false,
            zerofill: false
         },
         {
            name: 'SET',
            length: true,
            collation: false,
            unsigned: false,
            zerofill: false
         }
      ]
   },
   {
      group: 'unknown',
      types: [
         {
            name: 'UNKNOWN',
            length: false,
            collation: false,
            unsigned: false,
            zerofill: false
         }
      ]
   }
];
