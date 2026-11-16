import { describe, expect, it } from 'vitest';

import { parseFunctionDefinition } from '../../../src/main/libs/db/engines/postgresql/PostgreSQLParsers';

describe('PostgreSQL parseFunctionDefinition', () => {
   it('parses a function', () => {
      const def = 'CREATE OR REPLACE FUNCTION s.product_price(p_id integer)\n RETURNS numeric\n LANGUAGE plpgsql\n SECURITY DEFINER\nAS $function$ BEGIN RETURN 1; END $function$\n';
      expect(parseFunctionDefinition(def)).toEqual({
         sql: '$function$ BEGIN RETURN 1; END $function$',
         security: 'DEFINER',
         language: 'plpgsql',
         returns: 'NUMERIC'
      });
   });

   it('parses a procedure (no RETURNS) and strips SETOF from functions', () => {
      expect(parseFunctionDefinition('CREATE OR REPLACE PROCEDURE s.p(IN a integer)\n LANGUAGE sql\nAS $procedure$ SELECT 1 $procedure$')).toEqual({
         sql: '$procedure$ SELECT 1 $procedure$',
         security: 'INVOKER',
         language: 'sql'
      });
      expect(parseFunctionDefinition('CREATE FUNCTION f()\n RETURNS SETOF text\n LANGUAGE sql\nAS $f$ SELECT \'a\' $f$').returns).toBe('TEXT');
   });

   it('reads header clauses only, not text inside the body', () => {
      const def = 'CREATE FUNCTION f()\n RETURNS integer\n LANGUAGE plpgsql\nAS $function$ BEGIN -- SECURITY DEFINER\nRETURN 1; END $function$';
      expect(parseFunctionDefinition(def).security).toBe('INVOKER');
   });
});
