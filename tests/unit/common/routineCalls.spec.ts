import customizations from 'common/customizations';
import { buildFunctionCall, buildProcedureCall, formatRoutineArgument } from 'common/libs/routineCalls';
import { describe, expect, it } from 'vitest';

describe('routine calls', () => {
   it.each([
      ['mysql', 'CALL p(1,\'a\')', 'SELECT `f` (1,\'a\')'],
      ['maria', 'CALL p(1,\'a\')', 'SELECT `f` (1,\'a\')'],
      ['pg', 'CALL p(1,\'a\')', 'SELECT f(1,\'a\')'],
      ['firebird', 'EXECUTE PROCEDURE "p"(1,\'a\')', 'SELECT `f` (1,\'a\')'],
      ['sqlite', 'CALL `p`(1,\'a\')', 'SELECT `f` (1,\'a\')']
   ] as const)('%s', (client, procedure, func) => {
      expect(buildProcedureCall(client, 'p', ['1', '\'a\''])).toBe(procedure);
      expect(buildFunctionCall(client, 'f', ['1', '\'a\''])).toBe(func);
   });

   it('keeps "$" in names (valid in PostgreSQL identifiers)', () => {
      expect(buildFunctionCall('pg', 'calc$total', ['1'])).toBe('SELECT calc$total(1)');
      expect(buildProcedureCall('pg', 'p$&', [])).toBe('CALL p$&()');
   });
});

describe('formatRoutineArgument', () => {
   it('keeps numbers raw', () => {
      expect(formatRoutineArgument('pg', 'INTEGER', '42')).toBe('42');
   });

   it('quotes strings as string literals of the engine', () => {
      expect(formatRoutineArgument('pg', 'TEXT', 'it\'s')).toBe('\'it\'\'s\'');
      expect(formatRoutineArgument('mysql', 'VARCHAR', 'it\'s')).toBe('"it\\\'s"');
      // Firebird/SQLite: double quotes would be an identifier
      expect(formatRoutineArgument('firebird', 'VARCHAR', 'a')).toBe('\'a\'');
   });
});

describe('editor customizations', () => {
   it.each([
      ['mysql', 'mysql', 'mysql', false],
      ['maria', 'mysql', 'mariadb', false],
      ['pg', 'pgsql', 'postgresql', true],
      ['sqlite', 'sql', 'sql', false],
      ['firebird', 'sql', 'sql', false]
   ] as const)('%s', (client, aceMode, formatterLanguage, connectionString) => {
      expect(customizations[client]).toMatchObject({ aceMode, formatterLanguage, connectionString });
   });

   it('MariaDB inherits everything else from MySQL', () => {
      expect({ ...customizations.maria, formatterLanguage: null }).toEqual({ ...customizations.mysql, formatterLanguage: null });
   });
});
