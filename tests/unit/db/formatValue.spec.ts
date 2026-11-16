import { describe, expect, it, vi } from 'vitest';

import { formatValue } from '../../../src/main/libs/db/core/formatValue';
import { QueryDialect } from '../../../src/main/libs/db/core/QueryDialect';
import { FirebirdDialect } from '../../../src/main/libs/db/engines/firebird/FirebirdDialect';
import { MariaDBDialect, MySQLDialect } from '../../../src/main/libs/db/engines/mysql/MySQLDialect';
import { PostgreSQLDialect } from '../../../src/main/libs/db/engines/postgresql/PostgreSQLDialect';
import { SQLiteDialect } from '../../../src/main/libs/db/engines/sqlite/SQLiteDialect';

const dialects: [string, QueryDialect][] = [
   ['mysql', new MySQLDialect()],
   ['maria', new MariaDBDialect()],
   ['pg', new PostgreSQLDialect()],
   ['sqlite', new SQLiteDialect()],
   ['firebird', new FirebirdDialect()]
];

const tricky = 'it\'s "quoted" \\ back\\slash 50% _ünïcødé_\nnew line';

describe.each(dialects)('%s literals', (_name, dialect) => {
   it('quotes strings', () => {
      expect(dialect.quoteString(tricky)).toMatchSnapshot();
   });

   it('renders blobs', () => {
      expect(dialect.blobLiteral(Buffer.from([0, 1, 255, 104, 105]))).toMatchSnapshot();
      expect(dialect.blobLiteral(Buffer.alloc(0))).toMatchSnapshot();
   });

   it('renders bits and rejects invalid ones', () => {
      expect(dialect.bitLiteral('0101')).toBe('b\'0101\'');
      expect(() => dialect.bitLiteral('01\' OR 1=1')).toThrow(/Invalid bit value/);
   });

   it('renders booleans', () => {
      expect([dialect.booleanLiteral('true'), dialect.booleanLiteral('false')]).toMatchSnapshot();
   });

   it('compares JSON', () => {
      expect(dialect.jsonEquals({ a: 'it\'s', b: [1, 2] })).toMatchSnapshot();
   });
});

describe('formatValue', () => {
   const dialect = new PostgreSQLDialect();
   const readFile = vi.fn(() => Buffer.from('hi'));
   const format = (type: string, value: unknown) => formatValue(dialect, type, value, { readFile });

   it('renders NULL before looking at the type', () => {
      expect(format('VARCHAR', null)).toEqual({ sql: 'NULL', reload: false });
      expect(format('BLOB', undefined)).toEqual({ sql: 'NULL', reload: false });
   });

   it('keeps numbers raw', () => {
      expect(format('INTEGER', '42')).toEqual({ sql: '42', reload: false });
      expect(format('NUMERIC', 1.5)).toEqual({ sql: '1.5', reload: false });
   });

   it('quotes text with the dialect', () => {
      expect(format('VARCHAR', 'it\'s').sql).toBe('\'it\'\'s\'');
      expect(format('TEXT', 'x').sql).toBe('\'x\'');
   });

   it('reads BLOB files through the injected reader and asks for a reload', () => {
      expect(format('BYTEA', '/tmp/file.bin')).toEqual({ sql: 'decode(\'6869\', \'hex\')', reload: true });
      expect(readFile).toHaveBeenCalledWith('/tmp/file.bin');
   });

   it('renders an empty BLOB when no file is given', () => {
      readFile.mockClear();
      expect(format('BYTEA', '')).toEqual({ sql: 'decode(\'\', \'hex\')', reload: false });
      expect(readFile).not.toHaveBeenCalled();
   });

   it('asks for a reload after writing bits', () => {
      expect(format('BIT', '101')).toEqual({ sql: 'b\'101\'', reload: true });
   });

   it('renders booleans with the dialect', () => {
      expect(format('BOOLEAN', 'true').sql).toBe('true');
      expect(formatValue(new SQLiteDialect(), 'BOOLEAN', 'true', { readFile }).sql).toBe('1');
   });

   it('quotes any other type as a string', () => {
      expect(format('DATE', '2026-01-01').sql).toBe('\'2026-01-01\'');
   });
});
