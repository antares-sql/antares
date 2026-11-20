import { escapeAndQuote, querySplitter, removeComments, valueToSqlString } from 'common/libs/sqlUtils';
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

   // #667: a Julian day was formatted as milliseconds since 1970
   it('keeps numeric SQLite dates as numbers', () => {
      expect(valueToSqlString({ val: 2459067.57491964, client: 'sqlite', field: { type: 'DATETIME' } })).toBe('2459067.57491964');
      expect(valueToSqlString({ val: 1596671273, client: 'sqlite', field: { type: 'DATE' } })).toBe('1596671273');
      expect(valueToSqlString({ val: '2020-08-06 01:47:53', client: 'sqlite', field: { type: 'DATETIME' } })).toBe('\'2020-08-06 01:47:53\'');
   });
});

describe('querySplitter (PostgreSQL dollar quoting)', () => {
   /** What a query tab sends: comments removed, then split */
   const split = (sql: string) => querySplitter(removeComments(sql), 'pg');
   const count = (text: string, token: string) => text.split(token).length - 1;

   // #1003: every character after the first one was followed by the tag ("C$$E$$T$$...")
   it.each(['$$', '$body$'])('keeps a plpgsql function quoted with %s intact', tag => {
      const sql = `CREATE FUNCTION get_userid(username text) RETURNS int
AS ${tag}
#print_strict_params on
DECLARE
userid int;
BEGIN
    SELECT users.userid INTO STRICT userid
        FROM users WHERE users.username = get_userid.username;
    RETURN userid;
END;
${tag} LANGUAGE plpgsql;
SELECT get_userid('x');`;

      const queries = split(sql);
      expect(queries).toHaveLength(2);
      expect(queries[0]).toMatch(/^CREATE FUNCTION get_userid\(username text\) RETURNS int\s+AS /);
      expect(queries[0].endsWith(`${tag} LANGUAGE plpgsql;`)).toBe(true);
      expect(count(queries[0], tag)).toBe(2);
      expect(queries[1]).toBe('SELECT get_userid(\'x\');');
   });

   it('ignores dollar signs inside regular strings', () => {
      expect(split('UPDATE users SET pwd = \'$2b$12$abc;def\' WHERE id = 1; SELECT 1;'))
         .toEqual(['UPDATE users SET pwd = \'$2b$12$abc;def\' WHERE id = 1;', 'SELECT 1;']);
   });

   // String literals must reach the server unchanged (whitespace after ";", comment markers)
   it('keeps whitespace after a semicolon inside a string', () => {
      expect(split('INSERT INTO t VALUES (\'a;\n   b\');')).toEqual(['INSERT INTO t VALUES (\'a;\n   b\');']);
   });

   it('keeps comment markers inside strings', () => {
      expect(split('SELECT \'a /* b */ c\' AS x, \'--d\' AS y;')).toEqual(['SELECT \'a /* b */ c\' AS x, \'--d\' AS y;']);
   });
});
