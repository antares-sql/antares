/**
 * Records introspection fixtures from the real databases (tests/fixtures/introspection/<engine>.json).
 * Runs only with ANTARES_RECORD_FIXTURES=1 (npm run test:fixtures:record):
 * the unit test tests/unit/clients/introspection.spec.ts replays them offline.
 *
 * Each fixture call stores the rows returned by every query and the method output computed
 * by replaying those rows: it pins the current mapping/parsing behavior of the clients.
 */
import * as fs from 'fs';
import * as path from 'path';
import { describe, expect, it, vi } from 'vitest';

import { hasCapability } from '../../src/main/libs/db/core/contracts';
import { offlineClient } from '../helpers/offlineClient';
import { FixtureFile, RecordedCall, recordRaw, replayRaw, toJson } from '../helpers/rawRecorder';
import { EngineName, getTestEngines } from './helpers/engines';

const FIXTURES_DIR = path.join(__dirname, '../fixtures/introspection');
const S = 'antares_fixtures';

/** Objects created for the recording, per engine. Statements run one by one (no splitting) */
const schemaSql: Record<EngineName, { schema: string; setup: string[]; teardown: string[] }> = {
   mysql: {
      schema: S,
      setup: [
         `CREATE DATABASE ${S}`,
         'CREATE TABLE categories (id INT NOT NULL AUTO_INCREMENT PRIMARY KEY, name VARCHAR(50) NOT NULL) ENGINE=InnoDB COMMENT=\'Categories\'',
         `CREATE TABLE products (
            id INT UNSIGNED NOT NULL AUTO_INCREMENT,
            name VARCHAR(100) NOT NULL DEFAULT 'unnamed' COMMENT 'Product name',
            price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
            status ENUM('draft','published') NOT NULL DEFAULT 'draft',
            tags SET('a','b','c') NULL,
            created_at DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
            category_id INT NULL,
            data JSON NULL,
            bits BIT(4) NULL,
            PRIMARY KEY (id),
            UNIQUE KEY products_name_uq (name),
            KEY products_price_idx (price, status),
            CONSTRAINT products_category_fk FOREIGN KEY (category_id) REFERENCES categories (id) ON UPDATE CASCADE ON DELETE SET NULL,
            CONSTRAINT products_price_chk CHECK (price >= 0)
         ) ENGINE=InnoDB COMMENT='Products'`,
         'CREATE VIEW cheap_products AS SELECT id, name FROM products WHERE price < 10',
         'CREATE TRIGGER products_bi BEFORE INSERT ON products FOR EACH ROW SET NEW.price = ABS(NEW.price)',
         `CREATE PROCEDURE get_product(IN p_id INT, OUT p_name VARCHAR(100))
            READS SQL DATA COMMENT 'Get a product'
            BEGIN SELECT name INTO p_name FROM products WHERE id = p_id; END`,
         `CREATE FUNCTION product_price(p_id INT) RETURNS DECIMAL(10,2)
            DETERMINISTIC READS SQL DATA
            BEGIN RETURN (SELECT price FROM products WHERE id = p_id); END`,
         'CREATE EVENT cleanup ON SCHEDULE EVERY 1 DAY STARTS \'2030-01-01 00:00:00\' DISABLE COMMENT \'Nightly\' DO DELETE FROM products WHERE price = 0'
      ],
      teardown: [`DROP DATABASE IF EXISTS ${S}`]
   },
   maria: null, // same as mysql, see below
   pg: {
      schema: S,
      setup: [
         `CREATE SCHEMA ${S}`,
         `CREATE TYPE ${S}.product_status AS ENUM ('draft', 'active', 'it''s over')`,
         `COMMENT ON TYPE ${S}.product_status IS 'Product lifecycle'`,
         `CREATE DOMAIN ${S}."Weight" AS NUMERIC(8,3) DEFAULT 0 NOT NULL CONSTRAINT weight_positive CHECK (VALUE >= 0)`,
         `CREATE TYPE ${S}.dimensions AS (width INTEGER, height INTEGER, unit VARCHAR(5))`,
         `CREATE TYPE ${S}.price_range AS RANGE (SUBTYPE = NUMERIC)`,
         `CREATE TABLE ${S}.categories (id SERIAL PRIMARY KEY, name VARCHAR(50) NOT NULL)`,
         `COMMENT ON TABLE ${S}.categories IS 'Categories'`,
         `CREATE TABLE ${S}.products (
            id SERIAL PRIMARY KEY,
            name VARCHAR(100) NOT NULL DEFAULT 'unnamed',
            price NUMERIC(10,2) NOT NULL DEFAULT 0,
            tags TEXT[] NULL,
            created_at TIMESTAMP DEFAULT now(),
            category_id INTEGER NULL,
            data JSONB NULL,
            flag BOOLEAN DEFAULT false,
            status ${S}.product_status DEFAULT 'draft',
            weight ${S}."Weight",
            size ${S}.dimensions NULL,
            CONSTRAINT products_name_uq UNIQUE (name),
            CONSTRAINT products_category_fk FOREIGN KEY (category_id) REFERENCES ${S}.categories (id) ON UPDATE CASCADE ON DELETE SET NULL,
            CONSTRAINT products_price_chk CHECK (price >= 0)
         )`,
         `COMMENT ON COLUMN ${S}.products.name IS 'Product name'`,
         `CREATE INDEX products_price_idx ON ${S}.products (price)`,
         `CREATE UNIQUE INDEX products_active_name_uq ON ${S}.products (name, category_id) WHERE flag AND price > 0`,
         `CREATE VIEW ${S}.cheap_products AS SELECT id, name FROM ${S}.products WHERE price < 10`,
         `CREATE MATERIALIZED VIEW ${S}.products_count AS SELECT count(*) AS n FROM ${S}.products`,
         `CREATE FUNCTION ${S}.product_price(p_id integer) RETURNS numeric LANGUAGE plpgsql AS $$ BEGIN RETURN (SELECT price FROM ${S}.products WHERE id = p_id); END $$`,
         `CREATE PROCEDURE ${S}.touch_product(IN p_id integer, INOUT p_name text) LANGUAGE plpgsql AS $$ BEGIN UPDATE ${S}.products SET created_at = now() WHERE id = p_id; END $$`,
         `CREATE FUNCTION ${S}.products_trg_fn() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN NEW.price := abs(NEW.price); RETURN NEW; END $$`,
         `CREATE TRIGGER products_bi BEFORE INSERT ON ${S}.products FOR EACH ROW EXECUTE FUNCTION ${S}.products_trg_fn()`
      ],
      teardown: [`DROP SCHEMA IF EXISTS ${S} CASCADE`]
   },
   sqlite: {
      schema: 'main',
      setup: [
         'CREATE TABLE categories (id INTEGER PRIMARY KEY AUTOINCREMENT, name VARCHAR(50) NOT NULL)',
         `CREATE TABLE products (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name VARCHAR(100) NOT NULL DEFAULT 'unnamed',
            price NUMERIC(10,2) NOT NULL DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            category_id INTEGER REFERENCES categories(id) ON UPDATE CASCADE ON DELETE SET NULL,
            data TEXT,
            CONSTRAINT products_price_chk CHECK (price >= 0)
         )`,
         'CREATE UNIQUE INDEX products_name_uq ON products (name)',
         'CREATE INDEX products_price_idx ON products (price)',
         'CREATE UNIQUE INDEX products_category_name_uq ON products (category_id, name) WHERE data IS NOT NULL',
         'CREATE VIEW cheap_products AS SELECT id, name FROM products WHERE price < 10',
         'CREATE TRIGGER products_bi BEFORE INSERT ON `products` BEGIN SELECT 1; END'
      ],
      teardown: [
         'DROP TRIGGER IF EXISTS products_bi',
         'DROP VIEW IF EXISTS cheap_products',
         'DROP TABLE IF EXISTS products',
         'DROP TABLE IF EXISTS categories'
      ]
   },
   firebird: {
      schema: S,
      setup: [
         'CREATE TABLE "categories" ("id" INTEGER NOT NULL PRIMARY KEY, "name" VARCHAR(50) NOT NULL)',
         `CREATE TABLE "products" (
            "id" INTEGER GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
            "name" VARCHAR(100) DEFAULT 'unnamed' NOT NULL,
            "price" DECIMAL(10,2) DEFAULT 0 NOT NULL,
            "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            "category_id" INTEGER,
            "notes" BLOB SUB_TYPE TEXT,
            "flag" BOOLEAN,
            CONSTRAINT "products_category_fk" FOREIGN KEY ("category_id") REFERENCES "categories" ("id") ON UPDATE CASCADE ON DELETE SET NULL,
            CONSTRAINT "products_name_uq" UNIQUE ("name"),
            CONSTRAINT "products_price_chk" CHECK ("price" >= 0)
         )`,
         'CREATE INDEX "products_price_idx" ON "products" ("price")',
         'CREATE VIEW "cheap_products" AS SELECT "id", "name" FROM "products" WHERE "price" < 10',
         'CREATE TRIGGER "products_bi" FOR "products" ACTIVE BEFORE INSERT POSITION 0 AS BEGIN NEW."price" = ABS(NEW."price"); END',
         `CREATE PROCEDURE "get_product" (p_id INTEGER) RETURNS (p_name VARCHAR(100)) AS
            BEGIN SELECT "name" FROM "products" WHERE "id" = :p_id INTO :p_name; SUSPEND; END`
      ],
      teardown: [
         'DROP PROCEDURE "get_product"',
         'DROP TRIGGER "products_bi"',
         'DROP VIEW "cheap_products"',
         'DROP TABLE "products"',
         'DROP TABLE "categories"'
      ]
   }
};
schemaSql.maria = schemaSql.mysql;

/** Introspection calls to record: [method, params, required capability] */
const callsFor = (engine: EngineName, schema: string): [string, unknown[], string?][] => [
   ['getStructure', [new Set([schema])]],
   ['getTableColumns', [{ schema, table: 'products' }]],
   ['getTableColumns', [{ schema, table: 'categories' }]],
   ['getTableIndexes', [{ schema, table: 'products' }]],
   ['getKeyUsage', [{ schema, table: 'products' }]],
   ['getTableOptions', [{ schema, table: 'products' }]],
   ['getViewInformations', [{ schema, view: 'cheap_products' }]],
   ['getTriggerInformations', [{ schema, trigger: engine === 'pg' ? 'products.products_bi' : 'products_bi' }]],
   ['getTableChecks', [{ schema, table: 'products' }], 'tableCheck'],
   ['getTableDll', [{ schema, table: 'products' }], 'tableDdl'],
   ['getMaterializedViewInformations', [{ schema, view: 'products_count' }], 'materializedViews'],
   ['getRoutineInformations', [{ schema, routine: engine === 'pg' ? 'touch_product' : 'get_product' }], 'routines'],
   ['getFunctionInformations', [{ schema, func: 'product_price' }], 'functions'],
   ['getEventInformations', [{ schema, scheduler: 'cleanup' }], 'schedulers'],
   ['getUserTypeInformations', [{ schema, userType: 'product_status' }], 'userTypes'],
   ['getUserTypeInformations', [{ schema, userType: 'Weight' }], 'userTypes'],
   ['getUserTypeInformations', [{ schema, userType: 'dimensions' }], 'userTypes'],
   ['getUserTypeInformations', [{ schema, userType: 'price_range' }], 'userTypes']
];

/** Sets are not JSON: params are stored as arrays and rebuilt by the replay */
const serializeParams = (params: unknown[]) => params.map(p => p instanceof Set ? { $set: [...p] } : p);

describe.skipIf(!process.env.ANTARES_RECORD_FIXTURES)('record introspection fixtures', () => {
   for (const engine of getTestEngines()) {
      it(`${engine.name}`, async () => {
         const { schema, setup, teardown } = schemaSql[engine.name];
         const client = await engine.connect();
         const execute = async (sql: string) => client.raw(sql, { split: false, ...(engine.name.match(/mysql|maria/) && !sql.startsWith('CREATE DATABASE') && !sql.startsWith('DROP DATABASE') ? { schema } : {}) });

         try {
            for (const sql of teardown) await execute(sql).catch((): null => null);
            for (const sql of setup) await execute(sql);

            const recorder = recordRaw(client);
            const fixture: FixtureFile = {
               engine: engine.name,
               server: JSON.stringify(toJson(await client.getVersion())),
               calls: []
            };
            recorder.take();

            for (const [method, params, capability] of callsFor(engine.name, schema)) {
               if (capability && !hasCapability(client, capability as never)) continue;
               if (typeof client[method] !== 'function') continue;

               const call: RecordedCall = { method, params: serializeParams(params), queries: [] };
               try {
                  await client[method](...params);
               }
               catch (_) {}
               call.queries = recorder.take();

               // Expected output: what the client code computes from the recorded rows
               const replayClient = offlineClient(engine.name);
               replayRaw(replayClient, call.queries);
               try {
                  call.output = toJson(await replayClient[method](...params));
               }
               catch (err) {
                  call.error = String(err);
               }

               fixture.calls.push(call);
            }

            fs.mkdirSync(FIXTURES_DIR, { recursive: true });
            fs.writeFileSync(path.join(FIXTURES_DIR, `${engine.name}.json`), JSON.stringify(fixture, null, 2) + '\n');
            expect(fixture.calls.length).toBeGreaterThan(5);
         }
         finally {
            vi.restoreAllMocks();
            for (const sql of teardown) await execute(sql).catch((): null => null);
            await client.destroy();
         }
      }, 120_000);
   }
});
