export const TEXT = [
   'CHAR',
   'VARCHAR',
   'CHARACTER',
   'CHARACTER VARYING'
];

export const LONG_TEXT = [
   'TEXT',
   'MEDIUMTEXT',
   'LONGTEXT',
   'JSON',
   'VARBINARY'
];

export const ARRAY = [
   'ARRAY',
   'ANYARRAY'
];

export const TEXT_SEARCH = [
   'TSVECTOR',
   'TSQUERY'
];

export const NUMBER = [
   'INT',
   'TINYINT',
   'SMALLINT',
   'MEDIUMINT',
   'BIGINT',
   'NUMERIC',
   'INTEGER',
   'SMALLSERIAL',
   'SERIAL',
   'BIGSERIAL',
   'OID',
   'XID',
   'INT64'
];

export const FLOAT = [
   'FLOAT',
   'DECIMAL',
   'DOUBLE',
   'REAL',
   'DOUBLE PRECISION',
   'MONEY'
];

export const IS_BIGINT = [
   'BIGINT',
   'BIGSERIAL',
   'DOUBLE PRECISION'
];

export const BOOLEAN = [
   'BOOL',
   'BOOLEAN'
];

export const DATE = ['DATE'];

export const TIME = [
   'TIME',
   'TIME WITH TIME ZONE'
];

export const DATETIME = [
   'DATETIME',
   'TIMESTAMP',
   'TIMESTAMP WITHOUT TIME ZONE',
   'TIMESTAMP WITH TIME ZONE'
];

// Used to check datetime fields only
export const HAS_TIMEZONE = [
   'TIMESTAMP WITH TIME ZONE',
   'TIME WITH TIME ZONE'
];

export const BLOB = [
   'BLOB',
   'TINYBLOB',
   'MEDIUMBLOB',
   'LONGBLOB',
   'LONG_BLOB',
   'BYTEA'
];

export const BIT = [
   'BIT',
   'BIT VARYING'
];

export const BINARY = [
   'BINARY'
];

export const UUID = [
   'UUID'
];

export const SPATIAL = [
   'POINT',
   'LINESTRING',
   'POLYGON',
   'GEOMETRY',
   'MULTIPOINT',
   'MULTILINESTRING',
   'MULTIPOLYGON',
   'GEOMCOLLECTION',
   'GEOMETRYCOLLECTION'
];

// Used to check multi spatial fields only
export const IS_MULTI_SPATIAL = [
   'MULTIPOINT',
   'MULTILINESTRING',
   'MULTIPOLYGON',
   'GEOMCOLLECTION',
   'GEOMETRYCOLLECTION'
];
