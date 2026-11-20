/**
 * Schema relations diagram: data collected in main and pure layout used by the renderer.
 */
import { SchemaDiagram } from 'common/interfaces/antares';
import { describe, expect, it, vi } from 'vitest';

import { DatabaseClient } from '../../../src/main/libs/db/core/contracts';
import { getSchemaDiagram } from '../../../src/main/libs/db/core/schemaDiagram';
import {
   boxSize,
   diagramBounds,
   fieldY,
   HEADER_HEIGHT,
   layoutDiagram,
   relationPath,
   ROW_HEIGHT,
   visibleRelations
} from '../../../src/renderer/libs/schemaDiagramLayout';

const fakeClient = () => ({
   getStructure: vi.fn(async () => [
      { name: 'other', tables: [{ name: 'x', type: 'table' }] },
      {
         name: 'shop',
         tables: [
            { name: 'customers', type: 'table' },
            { name: 'orders', type: 'table' },
            { name: 'orders_view', type: 'view' }
         ]
      }
   ]),
   getTableColumns: vi.fn(async ({ table }: { table: string }) => table === 'customers'
      ? [{ name: 'id', type: 'INT', key: 'pri', nullable: false, extra: 'ignored' }]
      : [{ name: 'id', type: 'INT', key: 'pri', nullable: false }, { name: 'customer_id', type: 'INT', key: '', nullable: true }]),
   getKeyUsage: vi.fn(async ({ table }: { table: string }) => table === 'orders'
      ? [{ constraintName: 'fk_customer', table: 'orders', field: 'customer_id', refSchema: 'shop', refTable: 'customers', refField: 'id', onUpdate: 'CASCADE' }]
      : [])
}) as unknown as DatabaseClient & { getStructure: ReturnType<typeof vi.fn> };

const diagram = (tables: Record<string, string[]>, relations: [string, string, string, string][]): SchemaDiagram => ({
   schema: 's',
   tables: Object.entries(tables).map(([name, fields]) => ({ name, fields: fields.map(f => ({ name: f, type: 'INT' })) })),
   relations: relations.map(([table, field, refTable, refField]) => ({ constraintName: `${table}_${field}`, table, field, refSchema: 's', refTable, refField }))
});

describe('getSchemaDiagram', () => {
   it('collects columns and foreign keys of the base tables of the schema', async () => {
      const client = fakeClient();

      expect(await getSchemaDiagram(client, 'shop')).toEqual({
         schema: 'shop',
         tables: [
            { name: 'customers', fields: [{ name: 'id', type: 'INT', key: 'pri', nullable: false }] },
            {
               name: 'orders',
               fields: [
                  { name: 'id', type: 'INT', key: 'pri', nullable: false },
                  { name: 'customer_id', type: 'INT', key: '', nullable: true }
               ]
            }
         ],
         relations: [
            { constraintName: 'fk_customer', table: 'orders', field: 'customer_id', refSchema: 'shop', refTable: 'customers', refField: 'id' }
         ]
      });
      expect(client.getStructure).toHaveBeenCalledWith(new Set(['shop']));
   });

   it('uses the given tables without reading the structure', async () => {
      const client = fakeClient();
      const result = await getSchemaDiagram(client, 'shop', ['customers']);

      expect(result.tables.map(t => t.name)).toEqual(['customers']);
      expect(client.getStructure).not.toHaveBeenCalled();
   });

   it('returns an empty diagram for an unknown schema', async () => {
      expect(await getSchemaDiagram(fakeClient(), 'missing')).toEqual({ schema: 'missing', tables: [], relations: [] });
   });
});

describe('schema diagram layout', () => {
   it('draws only relations between tables of the schema', () => {
      const d = diagram({ a: ['id'], b: ['a_id'] }, [['b', 'a_id', 'a', 'id'], ['b', 'a_id', 'missing', 'id']]);
      d.relations.push({ constraintName: 'ext', table: 'b', field: 'a_id', refSchema: 'other', refTable: 'a', refField: 'id' });

      expect(visibleRelations(d).map(r => r.refTable)).toEqual(['a']);
   });

   it('sizes boxes from the number of fields', () => {
      const size = boxSize({ name: 't', fields: [{ name: 'a', type: 'INT' }, { name: 'b', type: 'INT' }] });
      expect(size.height).toBe(HEADER_HEIGHT + 2 * ROW_HEIGHT + 6);
      expect(size.width).toBeGreaterThanOrEqual(150);
   });

   it('puts referenced tables to the left and isolated tables below', () => {
      const d = diagram(
         { customers: ['id'], orders: ['id', 'customer_id'], items: ['order_id'], logs: ['id'] },
         [['orders', 'customer_id', 'customers', 'id'], ['items', 'order_id', 'orders', 'id']]
      );
      const boxes = layoutDiagram(d);

      expect(boxes.customers.x).toBeLessThan(boxes.orders.x);
      expect(boxes.orders.x).toBeLessThan(boxes.items.x);

      const linkedBottom = Math.max(...['customers', 'orders', 'items'].map(n => boxes[n].y + boxes[n].height));
      expect(boxes.logs.y).toBeGreaterThan(linkedBottom);
   });

   it('survives cycles and self references', () => {
      const d = diagram(
         { a: ['id', 'b_id', 'parent_id'], b: ['id', 'a_id'] },
         [['a', 'b_id', 'b', 'id'], ['b', 'a_id', 'a', 'id'], ['a', 'parent_id', 'a', 'id']]
      );
      const boxes = layoutDiagram(d);

      expect(Object.keys(boxes).sort()).toEqual(['a', 'b']);
      expect(boxes.a.x).not.toBe(boxes.b.x);
   });

   it('never overlaps boxes', () => {
      const tables: Record<string, string[]> = {};
      const relations: [string, string, string, string][] = [];
      for (let i = 0; i < 60; i++) {
         tables[`t${i}`] = Array.from({ length: (i % 7) + 1 }, (_, f) => `f${f}`);
         if (i > 0 && i % 3) relations.push([`t${i}`, 'f0', `t${Math.floor(i / 3)}`, 'f0']);
      }

      const boxes = Object.values(layoutDiagram(diagram(tables, relations)));
      for (let i = 0; i < boxes.length; i++) {
         for (let j = i + 1; j < boxes.length; j++) {
            const [a, b] = [boxes[i], boxes[j]];
            const overlap = a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;
            expect(overlap).toBe(false);
         }
      }
   });

   it('computes bounds and field anchors', () => {
      const box = { x: 10, y: 20, width: 100, height: 80 };
      const table = { name: 't', fields: [{ name: 'a', type: 'INT' }, { name: 'b', type: 'INT' }] };

      expect(diagramBounds({ a: box, b: { x: 200, y: 0, width: 50, height: 50 } })).toEqual({ x: 10, y: 0, width: 240, height: 100 });
      expect(fieldY(box, table, 'b')).toBe(20 + HEADER_HEIGHT + ROW_HEIGHT * 1.5);
      expect(fieldY(box, table, 'missing')).toBe(20 + HEADER_HEIGHT / 2);
   });

   it('joins the facing sides of the boxes', () => {
      const left = { x: 0, y: 0, width: 100, height: 50 };
      const right = { x: 300, y: 0, width: 100, height: 50 };

      expect(relationPath(right, 10, left, 20)).toMatch(/^M 300 10 C .* 100 20$/);
      expect(relationPath(left, 10, right, 20)).toMatch(/^M 100 10 C .* 300 20$/);
      // Same column: a loop on the right side
      expect(relationPath(left, 10, { ...left, y: 100 }, 120)).toMatch(/^M 100 10 C .* 100 120$/);
   });
});
