import { querySplitter, removeComments, splitStatements } from 'common/libs/sqlScanner';
import { describe, expect, it } from 'vitest';

describe('querySplitter', () => {
   it('splits on semicolons and keeps each statement verbatim', () => {
      const sql = 'SELECT 1;\n\n  SELECT\n     2 ;\nSELECT 3';
      const statements = querySplitter(sql, 'mysql');

      expect(statements).toEqual(['SELECT 1;', 'SELECT\n     2 ;', 'SELECT 3']);
      // The query tab finds the statement at the cursor with indexOf
      for (const statement of statements) expect(sql).toContain(statement);
   });

   // #580
   it('ignores semicolons in comments and leaves out comment-only statements', () => {
      expect(querySplitter('/* SCRATCHPAD; */', 'mysql')).toEqual([]);
      expect(querySplitter('/* a; b */ SELECT 1; -- x; y\nSELECT 2;', 'pg')).toEqual(['/* a; b */ SELECT 1;', '-- x; y\nSELECT 2;']);
   });

   it('keeps semicolons and whitespace inside strings and quoted identifiers', () => {
      expect(querySplitter('INSERT INTO t VALUES (\'a;\n   b\'); SELECT "x;y" FROM t;', 'pg'))
         .toEqual(['INSERT INTO t VALUES (\'a;\n   b\');', 'SELECT "x;y" FROM t;']);
      expect(querySplitter('SELECT `a;b`, [c;d] FROM t; SELECT 1;', 'sqlite')).toEqual(['SELECT `a;b`, [c;d] FROM t;', 'SELECT 1;']);
   });

   it('handles MySQL backslash escapes', () => {
      expect(querySplitter('SELECT \'it\\\'s; ok\', "a\\"; b"; SELECT 2;', 'mysql')).toEqual(['SELECT \'it\\\'s; ok\', "a\\"; b";', 'SELECT 2;']);
   });

   it('handles PostgreSQL dollar quotes and escape strings', () => {
      const fn = 'CREATE FUNCTION f() RETURNS int AS $body$\nBEGIN\n  -- keep; me\n  RETURN 1;\nEND;\n$body$ LANGUAGE plpgsql;';
      expect(querySplitter(`${fn}\nSELECT E'\\'; still a string';`, 'pg')).toEqual([fn, 'SELECT E\'\\\'; still a string\';']);
      expect(querySplitter('SELECT $1, \'$2b$12$x;y\'; SELECT 2;', 'pg')).toEqual(['SELECT $1, \'$2b$12$x;y\';', 'SELECT 2;']);
   });

   it('keeps transaction statements separate', () => {
      expect(querySplitter('BEGIN; UPDATE t SET a = 1; COMMIT;', 'pg')).toEqual(['BEGIN;', 'UPDATE t SET a = 1;', 'COMMIT;']);
      expect(querySplitter('BEGIN TRANSACTION; DELETE FROM t; END;', 'sqlite')).toEqual(['BEGIN TRANSACTION;', 'DELETE FROM t;', 'END;']);
   });

   it('keeps MySQL routines with nested blocks and control flow together', () => {
      const routine = `CREATE PROCEDURE p(IN x INT)
BEGIN
   DECLARE y INT DEFAULT 0;
   IF x > 0 THEN
      BEGIN
         SET y = CASE WHEN x > 10 THEN 2 ELSE 1 END;
      END;
   END IF;
   CASE y WHEN 1 THEN SELECT 'one'; ELSE SELECT 'other'; END CASE;
   WHILE y < 3 DO SET y = y + 1; END WHILE;
END;`;
      expect(querySplitter(`${routine}\nCALL p(1);`, 'mysql')).toEqual([routine, 'CALL p(1);']);
   });

   it('keeps triggers and anonymous blocks together', () => {
      const mysqlTrigger = 'CREATE TRIGGER trg BEFORE INSERT ON t FOR EACH ROW BEGIN SET NEW.a = 1; SET NEW.b = 2; END;';
      expect(querySplitter(`${mysqlTrigger} SELECT 1;`, 'mysql')).toEqual([mysqlTrigger, 'SELECT 1;']);

      const sqliteTrigger = 'CREATE TRIGGER trg AFTER INSERT ON t BEGIN UPDATE t SET a = CASE WHEN NEW.a IS NULL THEN 0 ELSE NEW.a END; END;';
      expect(querySplitter(`${sqliteTrigger} SELECT 1;`, 'sqlite')).toEqual([sqliteTrigger, 'SELECT 1;']);

      const block = 'EXECUTE BLOCK AS DECLARE x INT; BEGIN x = 1; END';
      expect(querySplitter(`${block};\nSELECT 1 FROM RDB$DATABASE;`, 'firebird')).toEqual([`${block};`, 'SELECT 1 FROM RDB$DATABASE;']);

      const anonymous = 'BEGIN NOT ATOMIC DECLARE x INT; SET x = 1; END;';
      expect(querySplitter(`${anonymous} SELECT 1;`, 'maria')).toEqual([anonymous, 'SELECT 1;']);
   });

   it('follows the isql SET TERM command of Firebird scripts', () => {
      const script = `CREATE TABLE t (a INT);
-- PSQL
SET TERM ^ ;
CREATE TRIGGER trg FOR t BEFORE INSERT AS
DECLARE x INT;
BEGIN
   x = 1; -- ^ in a comment
   NEW.a = '^';
END^
EXECUTE BLOCK AS BEGIN END^
SET TERM ; ^
INSERT INTO t VALUES (1);`;

      expect(querySplitter(script, 'firebird')).toEqual([
         'CREATE TABLE t (a INT);',
         'CREATE TRIGGER trg FOR t BEFORE INSERT AS\nDECLARE x INT;\nBEGIN\n   x = 1; -- ^ in a comment\n   NEW.a = \'^\';\nEND',
         'EXECUTE BLOCK AS BEGIN END',
         'INSERT INTO t VALUES (1);'
      ]);

      expect(querySplitter('SET TERM !! ;\nSELECT 1 FROM RDB$DATABASE!!\nSET TERM ; !!\nSELECT 2 FROM RDB$DATABASE;', 'firebird'))
         .toEqual(['SELECT 1 FROM RDB$DATABASE', 'SELECT 2 FROM RDB$DATABASE;']);

      // Not an isql command for other engines
      expect(querySplitter('SET TERM ^ ;', 'pg')).toEqual(['SET TERM ^ ;']);
   });

   // #1025: nothing in a single statement must be changed
   it('keeps a nested subquery intact', () => {
      const sql = `SELECT CONCAT('Prefix ', GROUP_CONCAT(sub.id SEPARATOR ' '))
FROM (
    SELECT id
    FROM my_table
    WHERE status = 1
    AND (col_a LIKE '%--x%' OR col_b LIKE '%#y%')
    ORDER BY created_at DESC
    LIMIT 10
) AS sub;`;
      expect(querySplitter(removeComments(sql, 'mysql'), 'mysql')).toEqual([sql]);
   });
});

describe('removeComments', () => {
   it('removes comments outside strings only', () => {
      expect(removeComments('SELECT \'a /* b */ c\' AS x, \'--d\' AS y -- comment\nFROM t /* block */;', 'pg'))
         .toBe('SELECT \'a /* b */ c\' AS x, \'--d\' AS y \nFROM t  ;');
   });

   it('separates tokens joined by a block comment', () => {
      expect(removeComments('SELECT/* x */1', 'pg')).toBe('SELECT 1');
   });

   it('handles MySQL comment syntax and keeps executable comments', () => {
      expect(removeComments('SELECT 1--1, 2 # note\n/*!40101 SET NAMES utf8 */ /*+ BKA(t) */', 'mysql'))
         .toBe('SELECT 1--1, 2 \n/*!40101 SET NAMES utf8 */ /*+ BKA(t) */');
   });

   it('keeps comments inside PostgreSQL dollar quotes', () => {
      const body = '$$ BEGIN -- keep\n RETURN 1; /* keep */ END; $$';
      expect(removeComments(`SELECT ${body} -- drop`, 'pg')).toBe(`SELECT ${body} `);
   });
});

describe('splitStatements', () => {
   const script = `-- header
CREATE TABLE "t" (a INT, b VARCHAR(20)); /* note; */
INSERT INTO "t" VALUES (1, 'a;b'), (2, 'it''s');
SET TERM ^ ;
CREATE TRIGGER trg FOR t BEFORE INSERT AS
DECLARE x INT;
BEGIN
   x = 1;
END^
SET TERM ; ^
INSERT INTO "t" VALUES (3, '^');
SELECT 1 FROM RDB$DATABASE`;

   it('splits a script read in chunks like the whole script', () => {
      const expected = querySplitter(script, 'firebird');

      for (const size of [1, 2, 3, 7, 16, 50]) {
         const statements: string[] = [];
         let rest = '';
         let terminator: string;

         for (let i = 0; i < script.length; i += size) {
            const result = splitStatements(rest + script.slice(i, i + size), 'firebird', { terminator });
            statements.push(...result.statements);
            ({ rest, terminator } = result);
         }
         statements.push(...splitStatements(rest, 'firebird', { terminator, final: true }).statements);

         expect(statements).toEqual(expected);
      }
   });
});
