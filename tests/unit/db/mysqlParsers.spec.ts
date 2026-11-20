import { describe, expect, it } from 'vitest';

import { CreateTableColumn, parseCreateTableColumns, parseEvent, parseReturnType, parseRoutine, parseTrigger } from '../../../src/main/libs/db/engines/mysql/MySQLParsers';

describe('MySQL parseCreateTableColumns', () => {
   const columns = (definitions: string) =>
      parseCreateTableColumns(`CREATE TABLE \`t\` (\n${definitions}\n) ENGINE=InnoDB`) as Record<string, CreateTableColumn>;

   it('separates DEFAULT from a column CHECK (#757)', () => {
      const { data } = columns('  `data` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`data`))');
      expect(data.default).toBe('NULL');
      expect(data.check).toBe('json_valid(`data`)');
   });

   it('reads DEFAULT values containing keywords, spaces and parentheses', () => {
      const result = columns([
         '  `a` varchar(20) NOT NULL DEFAULT \'CHECK (x) COMMENT\' COMMENT \'note\',',
         '  `b` datetime(3) DEFAULT current_timestamp(3) ON UPDATE current_timestamp(3),',
         '  `c` int(11) DEFAULT (1 + 2) CHECK (`c` > 0)'
      ].join('\n'));
      expect(result.a.default).toBe('\'CHECK (x) COMMENT\'');
      expect(result.a.check).toBeUndefined();
      expect(result.b.default).toBe('current_timestamp(3)');
      expect(result.c.default).toBe('(1 + 2)');
      expect(result.c.check).toBe('`c` > 0');
   });
});

describe('MySQL parseTrigger', () => {
   it('parses a single statement trigger (no BEGIN ... END)', () => {
      expect(parseTrigger('CREATE DEFINER=`root`@`%` TRIGGER `products_bi` BEFORE INSERT ON `products` FOR EACH ROW SET NEW.price = ABS(NEW.price)', 'products_bi')).toEqual({
         definer: '`root`@`%`',
         sql: 'SET NEW.price = ABS(NEW.price)',
         name: 'products_bi',
         table: 'products',
         activation: 'BEFORE',
         event: 'INSERT'
      });
   });

   it('parses a BEGIN ... END trigger', () => {
      const trigger = parseTrigger('CREATE DEFINER=`app`@`localhost` TRIGGER `log_au` AFTER UPDATE ON `orders` FOR EACH ROW BEGIN\n  INSERT INTO log VALUES (NEW.id);\nEND', 'log_au');
      expect(trigger).toMatchObject({ sql: 'BEGIN\n  INSERT INTO log VALUES (NEW.id);\nEND', table: 'orders', activation: 'AFTER', event: 'UPDATE' });
   });

   it('reads timing and event from the header, not from the body or the name', () => {
      const trigger = parseTrigger('CREATE DEFINER=`root`@`%` TRIGGER `AFTER_DELETE_x` BEFORE INSERT ON `t` FOR EACH ROW UPDATE other SET n = n + 1', 'AFTER_DELETE_x');
      expect(trigger).toMatchObject({ activation: 'BEFORE', event: 'INSERT', sql: 'UPDATE other SET n = n + 1' });
   });

   it('skips FOLLOWS / PRECEDES', () => {
      const trigger = parseTrigger('CREATE DEFINER=`root`@`%` TRIGGER `b` BEFORE INSERT ON `t` FOR EACH ROW FOLLOWS `a` SET NEW.x = 1', 'b');
      expect(trigger.sql).toBe('SET NEW.x = 1');
   });
});

describe('MySQL parseRoutine', () => {
   it('separates characteristics from the body', () => {
      const routine = parseRoutine('CREATE DEFINER=`root`@`%` PROCEDURE `get_product`(IN p_id INT, OUT p_name VARCHAR(100))\n    READS SQL DATA\n    COMMENT \'Get a product\'\nBEGIN SELECT name INTO p_name FROM products WHERE id = p_id; END');
      expect(routine).toEqual({
         definer: '`root`@`%`',
         sql: 'BEGIN SELECT name INTO p_name FROM products WHERE id = p_id; END',
         comment: 'Get a product',
         security: 'DEFINER',
         deterministic: false,
         dataAccess: 'READS SQL DATA'
      });
   });

   it('parses a single statement body', () => {
      expect(parseRoutine('CREATE DEFINER=`root`@`%` PROCEDURE `p`()\nSELECT 1').sql).toBe('SELECT 1');
   });

   it('ignores keywords inside the body', () => {
      const routine = parseRoutine('CREATE DEFINER=`root`@`%` PROCEDURE `p`()\nBEGIN\n  -- not DETERMINISTIC, NO SQL, SQL SECURITY INVOKER\n  SELECT 1;\nEND');
      expect(routine).toMatchObject({ deterministic: false, dataAccess: 'CONTAINS SQL', security: 'DEFINER' });
   });

   it('parses functions: RETURNS, DETERMINISTIC, NOT DETERMINISTIC', () => {
      const func = parseRoutine('CREATE DEFINER=`root`@`%` FUNCTION `f`(p_id int) RETURNS decimal(10,2)\n    DETERMINISTIC\n    SQL SECURITY INVOKER\nRETURN 1');
      expect(func).toMatchObject({ returns: 'decimal(10,2)', deterministic: true, security: 'INVOKER', sql: 'RETURN 1' });
      expect(parseRoutine('CREATE FUNCTION `f`() RETURNS int NOT DETERMINISTIC RETURN 1').deterministic).toBe(false);
      expect(parseRoutine('CREATE FUNCTION `f`() RETURNS varchar(10) CHARSET utf8mb4 RETURN \'a\'')).toMatchObject({ returns: 'varchar(10) CHARSET utf8mb4', sql: 'RETURN \'a\'' });
   });

   it('handles parentheses and quotes inside parameters', () => {
      expect(parseRoutine('CREATE PROCEDURE `p`(IN a DECIMAL(10,2), IN b ENUM(\'x)\',\'y\'))\nSELECT a').sql).toBe('SELECT a');
   });
});

describe('MySQL parseReturnType', () => {
   it('splits type and length', () => {
      expect(parseReturnType('varchar(100) CHARSET utf8mb4')).toEqual({ returns: 'VARCHAR', returnsLength: 100 });
      expect(parseReturnType('int')).toEqual({ returns: 'INT', returnsLength: NaN });
   });
});

describe('MySQL parseEvent', () => {
   it('parses a recurring event', () => {
      expect(parseEvent('CREATE DEFINER=`root`@`%` EVENT `cleanup` ON SCHEDULE EVERY 1 DAY STARTS \'2030-01-01 00:00:00\' ON COMPLETION NOT PRESERVE DISABLE COMMENT \'Nightly\' DO DELETE FROM products WHERE price = 0', 'cleanup')).toEqual({
         definer: '`root`@`%`',
         sql: 'DELETE FROM products WHERE price = 0',
         name: 'cleanup',
         comment: 'Nightly',
         state: 'DISABLE',
         preserve: false,
         execution: 'EVERY',
         every: ['1', 'DAY'],
         starts: '2030-01-01 00:00:00',
         ends: '',
         at: ''
      });
   });

   it('parses a one-time event', () => {
      expect(parseEvent('CREATE DEFINER=`root`@`%` EVENT `once` ON SCHEDULE AT \'2030-05-01 10:00:00\' ON COMPLETION PRESERVE ENABLE DO CALL p()', 'once'))
         .toMatchObject({ execution: 'ONCE', at: '2030-05-01 10:00:00', preserve: true, state: 'ENABLE', every: [] });
   });

   it('reads the state from the header, not from the body', () => {
      expect(parseEvent('CREATE EVENT `e` ON SCHEDULE EVERY 1 HOUR ON COMPLETION NOT PRESERVE DISABLE DO UPDATE flags SET mode = \'ENABLE\'', 'e').state).toBe('DISABLE');
   });
});
