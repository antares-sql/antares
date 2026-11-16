import { escapeAndQuote, valueToSqlString } from 'common/libs/sqlUtils';
import { describe, expect, it } from 'vitest';

const tricky = 'it\'s "quoted" \\ back\nslash';

describe('escapeAndQuote', () => {
   it('uses backslash escapes for MySQL/MariaDB', () => {
      expect(escapeAndQuote(tricky, 'mysql')).toBe('"it\\\'s \\"quoted\\" \\\\ back\\nslash"');
      expect(escapeAndQuote('plain', 'maria')).toBe('"plain"');
   });

   it.each(['pg', 'sqlite', 'firebird'] as const)('uses standard SQL quoting for %s (backslash is literal)', client => {
      expect(escapeAndQuote(tricky, client)).toBe('\'it\'\'s "quoted" \\ back\nslash\'');
   });
});

describe('valueToSqlString', () => {
   it('quotes text values for the dump of each engine', () => {
      expect(valueToSqlString({ val: tricky, client: 'pg', field: { type: 'CHARACTER VARYING' } })).toBe('\'it\'\'s "quoted" \\ back\nslash\'');
      expect(valueToSqlString({ val: 'x', client: 'mysql', field: { type: 'VARCHAR' } })).toBe('"x"');
      expect(valueToSqlString({ val: null, client: 'pg', field: { type: 'TEXT' } })).toBe('NULL');
   });
});
