import { describe, expect, it } from 'vitest';

import { findAutoIncrementColumn, normalizeIntegers, parseTrigger, parseViewSelect } from '../../../src/main/libs/db/engines/sqlite/SQLiteParsers';

describe('SQLite parseTrigger', () => {
   it.each([
      ['backticks (as written by Antares)', 'CREATE TRIGGER `main`.`trg` BEFORE INSERT ON `products` FOR EACH ROW BEGIN SELECT 1; END'],
      ['double quotes', 'CREATE TRIGGER "trg" BEFORE INSERT ON "products" BEGIN SELECT 1; END'],
      ['brackets', 'CREATE TRIGGER [trg] BEFORE INSERT ON [products] BEGIN SELECT 1; END'],
      ['no quotes', 'CREATE TRIGGER trg BEFORE INSERT ON products BEGIN SELECT 1; END'],
      ['lowercase, newlines', 'create trigger trg\nbefore insert\non products\nfor each row\nbegin\n  select 1;\nend']
   ])('parses %s', (_label, statement) => {
      expect(parseTrigger(statement, 'trg')).toMatchObject({ name: 'trg', table: 'products', activation: 'BEFORE', event: 'INSERT' });
      expect(parseTrigger(statement, 'trg').sql).toMatch(/^begin[\s\S]*end$/i);
   });

   it('parses INSTEAD OF, UPDATE OF columns and WHEN', () => {
      const trigger = parseTrigger('CREATE TRIGGER t INSTEAD OF UPDATE OF a, b ON v FOR EACH ROW WHEN NEW.a > 0 BEGIN UPDATE x SET a = NEW.a; END', 't');
      expect(trigger).toEqual({ name: 't', table: 'v', activation: 'INSTEAD OF', event: 'UPDATE', sql: 'BEGIN UPDATE x SET a = NEW.a; END' });
   });

   it('defaults the timing to BEFORE (SQLite default)', () => {
      expect(parseTrigger('CREATE TRIGGER t DELETE ON x BEGIN SELECT 1; END', 't').activation).toBe('BEFORE');
   });

   it('reads table and event from the header, not from the body', () => {
      expect(parseTrigger('CREATE TRIGGER t AFTER DELETE ON "a" BEGIN INSERT INTO log SELECT * FROM b; END', 't'))
         .toMatchObject({ table: 'a', event: 'DELETE', activation: 'AFTER' });
   });
});

describe('SQLite parseViewSelect', () => {
   it('returns the SELECT of a view', () => {
      expect(parseViewSelect('CREATE VIEW cheap_products AS SELECT id, name FROM products')).toBe('SELECT id, name FROM products');
      expect(parseViewSelect('CREATE VIEW "has as in name" AS\nSELECT 1')).toBe('SELECT 1');
      expect(parseViewSelect('CREATE VIEW v (a, b) AS SELECT 1, 2')).toBe('SELECT 1, 2');
   });
});

describe('SQLite normalizeIntegers', () => {
   it('keeps safe integers as numbers and turns larger ones into exact strings', () => {
      const row = normalizeIntegers({
         small: 42n,
         negative: -7n,
         maxSafe: BigInt(Number.MAX_SAFE_INTEGER),
         steamId: 76561198012345679n,
         minInt64: -9223372036854775808n,
         real: 1.5,
         text: 'x',
         empty: null as null
      });

      expect(row).toEqual({
         small: 42,
         negative: -7,
         maxSafe: Number.MAX_SAFE_INTEGER,
         steamId: '76561198012345679',
         minInt64: '-9223372036854775808',
         real: 1.5,
         text: 'x',
         empty: null
      });
   });
});

describe('SQLite findAutoIncrementColumn', () => {
   const columns = [{ name: 'id', type: 'INTEGER', pk: 1 }, { name: 'name', type: 'TEXT', pk: 0 }];

   // #821: the AUTOINCREMENT of a table was lost after altering it
   it('finds the INTEGER PRIMARY KEY declared with AUTOINCREMENT', () => {
      expect(findAutoIncrementColumn('CREATE TABLE t (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT)', columns)).toBe('id');
      expect(findAutoIncrementColumn('create table t (id integer primary key autoincrement, name text)', columns)).toBe('id');
   });

   it('ignores tables without AUTOINCREMENT and the keyword in strings or comments', () => {
      expect(findAutoIncrementColumn('CREATE TABLE t (id INTEGER PRIMARY KEY, name TEXT)', columns)).toBeNull();
      expect(findAutoIncrementColumn('CREATE TABLE t (id INTEGER PRIMARY KEY, name TEXT DEFAULT \'AUTOINCREMENT\') -- AUTOINCREMENT', columns)).toBeNull();
      expect(findAutoIncrementColumn(undefined, columns)).toBeNull();
   });
});
