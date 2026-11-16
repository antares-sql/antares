import { describe, expect, it } from 'vitest';

import { parseTrigger, parseViewSelect } from '../../../src/main/libs/db/engines/sqlite/SQLiteParsers';

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
