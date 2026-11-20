import { describe, expect, it } from 'vitest';

import { getSqlDialect } from '@/libs/editor/sql/dialects';

/** Name of the innermost syntax nodes covering each occurrence of `word` */
const nodesAt = (dialect: string, sql: string, word: string) => {
   const tree = getSqlDialect(dialect).dialect.language.parser.parse(sql);
   const names: string[] = [];
   let from = sql.indexOf(word);
   while (from !== -1) {
      names.push(tree.resolveInner(from + 1, 1).name);
      from = sql.indexOf(word, from + 1);
   }
   return names;
};

describe('SQL dialects', () => {
   it('parses PostgreSQL dollar-quoted bodies as SQL', () => {
      const sql = 'CREATE FUNCTION f() RETURNS int AS $function$ SELECT 1 FROM t $function$ LANGUAGE sql';
      expect(nodesAt('postgresql', sql, 'SELECT')).toEqual(['Keyword']);
      expect(nodesAt('postgresql', sql, '$function$')).toEqual(['String', 'String']);
   });

   it('parses $$ bodies with nested strings', () => {
      const sql = 'DO $$ BEGIN RAISE NOTICE \'hello\'; END $$';
      expect(nodesAt('postgresql', sql, 'BEGIN')).toEqual(['Keyword']);
      expect(nodesAt('postgresql', sql, 'hello')).toEqual(['String']);
   });

   it('keeps quoted strings as strings', () => {
      expect(nodesAt('postgresql', 'SELECT \'select\'', 'select')).toEqual(['String']);
   });

   it('falls back to the generic dialect', () => {
      expect(getSqlDialect('unknown')).toBe(getSqlDialect('sql'));
      expect(nodesAt('sql', 'select sum(x) from t', 'select')).toEqual(['Keyword']);
   });
});
