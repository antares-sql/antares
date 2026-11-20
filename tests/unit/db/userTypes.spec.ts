/**
 * PostgreSQL user-defined types builders are pure: they turn what the type tab sends into SQL.
 */
import * as antares from 'common/interfaces/antares';
import { pgQuoteIdent, pgTypeIdentifier } from 'common/libs/pgIdentifiers';
import { describe, expect, it } from 'vitest';

import { PostgreSQLTypes } from '../../../src/main/libs/db/engines/postgresql/PostgreSQLTypes';

const types = new PostgreSQLTypes();

const details = (type: Partial<antares.UserTypeDetails>): antares.UserTypeDetails => ({
   schema: 'shop',
   name: 'status',
   kind: 'enum',
   comment: '',
   values: [],
   attributes: [],
   baseType: '',
   notNull: false,
   default: '',
   checks: [],
   ...type
});

/** Details as read from the server: every item has its oldName */
const existing = (type: Partial<antares.UserTypeDetails>) => details({
   ...type,
   values: (type.values ?? []).map(v => ({ ...v, oldName: v.name })),
   attributes: (type.attributes ?? []).map(a => ({ ...a, oldName: a.name })),
   checks: (type.checks ?? []).map(c => ({ ...c, oldName: c.name }))
});

describe('PostgreSQL type identifiers', () => {
   it('quotes only when needed', () => {
      expect(pgQuoteIdent('mood')).toBe('mood');
      expect(pgQuoteIdent('Mood')).toBe('"Mood"');
      expect(pgQuoteIdent('my type')).toBe('"my type"');
      expect(pgQuoteIdent('user')).toBe('"user"');
      expect(pgQuoteIdent('a"b')).toBe('"a""b"');
   });

   it('writes types of the table schema like the built-in ones, qualifies the others', () => {
      expect(pgTypeIdentifier('shop', 'mood', 'shop')).toBe('MOOD');
      expect(pgTypeIdentifier('shop', 'Weight', 'shop')).toBe('"Weight"');
      expect(pgTypeIdentifier('public', 'citext', 'shop')).toBe('public.citext');
      expect(pgTypeIdentifier('My Schema', 'mood', 'shop')).toBe('"My Schema".mood');
   });
});

describe('PostgreSQL user types: create', () => {
   it('creates an enum with its comment', () => {
      expect(types.createType(details({ values: [{ name: 'on' }, { name: 'it\'s off' }], comment: 'Lamp state' }))).toEqual([
         'CREATE TYPE "shop"."status" AS ENUM (\'on\', \'it\'\'s off\')',
         'COMMENT ON TYPE "shop"."status" IS \'Lamp state\''
      ]);
   });

   it('creates a composite type', () => {
      expect(types.createType(details({ kind: 'composite', name: 'size', attributes: [{ name: 'w', type: 'integer' }, { name: 'Unit', type: 'varchar(5)' }] }))).toEqual([
         'CREATE TYPE "shop"."size" AS ("w" integer, "Unit" varchar(5))'
      ]);
   });

   it('creates a domain', () => {
      expect(types.createType(details({
         kind: 'domain',
         name: 'Weight',
         baseType: 'numeric(8,3)',
         default: '0',
         notNull: true,
         checks: [{ name: 'positive', clause: 'VALUE >= 0' }, { name: '', clause: 'VALUE < 1000' }],
         comment: 'kg'
      }))).toEqual([
         'CREATE DOMAIN "shop"."Weight" AS numeric(8,3) DEFAULT 0 NOT NULL CONSTRAINT "positive" CHECK (VALUE >= 0) CHECK (VALUE < 1000)',
         'COMMENT ON DOMAIN "shop"."Weight" IS \'kg\''
      ]);
   });

   it('creates a range', () => {
      expect(types.createType(details({ kind: 'range', name: 'span', baseType: 'numeric' }))).toEqual([
         'CREATE TYPE "shop"."span" AS RANGE (SUBTYPE = numeric)'
      ]);
   });

   it('validates the details', () => {
      expect(() => types.createType(details({ name: ' ' }))).toThrow('name is required');
      expect(() => types.createType(details({ kind: 'domain' }))).toThrow('base type is required');
      expect(() => types.createType(details({ kind: 'range' }))).toThrow('subtype is required');
      expect(() => types.createType(details({ kind: 'composite', attributes: [{ name: 'a', type: '' }] }))).toThrow('name and a type');
   });
});

describe('PostgreSQL user types: alter', () => {
   const status = existing({ values: [{ name: 'a' }, { name: 'b' }] });

   it('does nothing without changes', () => {
      expect(types.alterType({ type: status, original: status })).toEqual([]);
   });

   it('renames and adds enum values next to their neighbors', () => {
      const type = details({
         values: [
            { name: 'first' },
            { name: 'A', oldName: 'a' },
            { name: 'middle' },
            { name: 'b', oldName: 'b' },
            { name: 'last' },
            { name: 'later' }
         ]
      });

      expect(types.alterType({ type, original: status })).toEqual([
         'ALTER TYPE "shop"."status" RENAME VALUE \'a\' TO \'A\'',
         'ALTER TYPE "shop"."status" ADD VALUE \'first\' BEFORE \'A\'',
         'ALTER TYPE "shop"."status" ADD VALUE \'middle\' AFTER \'A\'',
         'ALTER TYPE "shop"."status" ADD VALUE \'last\' AFTER \'b\'',
         'ALTER TYPE "shop"."status" ADD VALUE \'later\' AFTER \'last\''
      ]);
   });

   it('adds the first value of an empty enum', () => {
      expect(types.alterType({ type: details({ values: [{ name: 'x' }] }), original: existing({}) })).toEqual([
         'ALTER TYPE "shop"."status" ADD VALUE \'x\''
      ]);
   });

   it('refuses to remove or reorder enum values', () => {
      expect(() => types.alterType({ type: details({ values: [{ name: 'a', oldName: 'a' }] }), original: status })).toThrow('can not be removed: b');
      expect(() => types.alterType({
         type: details({ values: [{ name: 'b', oldName: 'b' }, { name: 'a', oldName: 'a' }] }),
         original: status
      })).toThrow('can not be reordered');
   });

   it('alters composite attributes', () => {
      const original = existing({ kind: 'composite', attributes: [{ name: 'w', type: 'integer' }, { name: 'h', type: 'integer' }, { name: 'old', type: 'text' }] });
      const type = details({
         kind: 'composite',
         attributes: [
            { name: 'width', type: 'bigint', oldName: 'w' },
            { name: 'h', type: 'integer', oldName: 'h' },
            { name: 'unit', type: 'varchar(5)' }
         ]
      });

      expect(types.alterType({ type, original })).toEqual([
         'ALTER TYPE "shop"."status" DROP ATTRIBUTE "old"',
         'ALTER TYPE "shop"."status" RENAME ATTRIBUTE "w" TO "width"',
         'ALTER TYPE "shop"."status" ALTER ATTRIBUTE "width" TYPE bigint',
         'ALTER TYPE "shop"."status" ADD ATTRIBUTE "unit" varchar(5)'
      ]);
   });

   it('alters domain default, NOT NULL and checks', () => {
      const original = existing({
         kind: 'domain',
         baseType: 'integer',
         default: '1',
         checks: [{ name: 'keep', clause: 'VALUE > 0' }, { name: 'renamed', clause: 'VALUE < 9' }, { name: 'changed', clause: 'VALUE <> 5' }, { name: 'dropped', clause: 'true' }]
      });
      const type = details({
         kind: 'domain',
         baseType: 'integer',
         default: '',
         notNull: true,
         checks: [
            { name: 'keep', clause: 'VALUE > 0', oldName: 'keep' },
            { name: 'lower_than_9', clause: 'VALUE < 9', oldName: 'renamed' },
            { name: 'changed', clause: 'VALUE <> 6', oldName: 'changed' },
            { name: 'added', clause: 'VALUE <> 7' }
         ]
      });

      expect(types.alterType({ type, original })).toEqual([
         'ALTER DOMAIN "shop"."status" DROP DEFAULT',
         'ALTER DOMAIN "shop"."status" SET NOT NULL',
         'ALTER DOMAIN "shop"."status" RENAME CONSTRAINT "renamed" TO "lower_than_9"',
         'ALTER DOMAIN "shop"."status" DROP CONSTRAINT "changed"',
         'ALTER DOMAIN "shop"."status" DROP CONSTRAINT "dropped"',
         'ALTER DOMAIN "shop"."status" ADD CONSTRAINT "added" CHECK (VALUE <> 7)',
         'ALTER DOMAIN "shop"."status" ADD CONSTRAINT "changed" CHECK (VALUE <> 6)'
      ]);
   });

   it('changes the comment, then renames', () => {
      const original = existing({ kind: 'range', baseType: 'numeric', comment: 'old' });

      expect(types.alterType({ type: { ...original, name: 'span', comment: '' }, original })).toEqual([
         'COMMENT ON TYPE "shop"."status" IS NULL',
         'ALTER TYPE "shop"."status" RENAME TO "span"'
      ]);
      expect(types.alterType({ type: { ...original, kind: 'domain', name: 'd' }, original: { ...original, kind: 'domain' } })).toEqual([
         'ALTER DOMAIN "shop"."status" RENAME TO "d"'
      ]);
   });

   it('refuses changes PostgreSQL does not support', () => {
      const domain = existing({ kind: 'domain', baseType: 'integer' });
      expect(() => types.alterType({ type: { ...domain, baseType: 'bigint' }, original: domain })).toThrow('base type of a domain can not be changed');
      expect(() => types.alterType({ type: { ...domain, kind: 'range' }, original: domain })).toThrow('kind of a type can not be changed');
   });
});

describe('PostgreSQL user types: drop and parsing', () => {
   it('drops types and domains', () => {
      expect(types.dropType({ schema: 'shop', name: 'status', kind: 'enum' })).toBe('DROP TYPE "shop"."status"');
      expect(types.dropType({ schema: 'shop', name: 'Weight', kind: 'domain' })).toBe('DROP DOMAIN "shop"."Weight"');
   });

   it('extracts CHECK clauses', () => {
      expect(types.checkClause('CHECK ((VALUE > 0))')).toBe('(VALUE > 0)');
      expect(types.checkClause('CHECK ((VALUE > 0)) NOT VALID')).toBe('(VALUE > 0)');
      expect(types.checkClause('weird')).toBe('weird');
   });
});
