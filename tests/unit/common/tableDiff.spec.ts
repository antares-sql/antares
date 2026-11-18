import { TableField } from 'common/interfaces/antares';
import { diffTableFields, isFieldDefinitionChanged, longestIncreasingSubsequence } from 'common/libs/tableDiff';
import { describe, expect, it } from 'vitest';

const field = (name: string, extra: Partial<TableField> = {}): TableField => ({
   _antares_id: `id_${name}`,
   name,
   type: 'INT',
   numLength: 11,
   nullable: false,
   default: null,
   schema: 's',
   alias: name,
   tableAlias: '',
   orgTable: 't',
   ...extra
});

const cols = (...names: string[]) => names.map(name => field(name));
const clone = <T>(v: T): T => JSON.parse(JSON.stringify(v));

/**
 * Applies the diff like MySQL/MariaDB does with a single ALTER statement:
 * clauses in the given order, AFTER resolved against the new names (verified on MariaDB 10.11).
 */
const applyAlter = (original: TableField[], local: TableField[]) => {
   const { additions, changes, deletions } = diffTableFields(original, local);
   const finalOrder = local.map(f => f.name);
   const clauses = [
      ...additions.map(f => ({ kind: 'add' as const, f })),
      ...changes.map(f => ({ kind: 'change' as const, f }))
   ].sort((a, b) => finalOrder.indexOf(a.f.name) - finalOrder.indexOf(b.f.name));

   const columns = original.map(f => f.name);
   const place = (name: string, after: string | false) => {
      if (after === false) columns.unshift(name);
      else {
         const i = columns.indexOf(after);
         if (i === -1) throw new Error(`Unknown column '${after}'`);
         columns.splice(i + 1, 0, name);
      }
   };

   for (const { kind, f } of clauses) {
      if (kind === 'add') {
         if (f.after === undefined) columns.push(f.name);
         else place(f.name, f.after);
      }
      else {
         const i = columns.indexOf((f as TableField & { orgName: string }).orgName);
         if (f.after === undefined) columns[i] = f.name;
         else {
            columns.splice(i, 1);
            place(f.name, f.after);
         }
      }
   }

   for (const d of deletions) columns.splice(columns.indexOf(d.name), 1);
   return { columns, additions, changes, deletions };
};

describe('longestIncreasingSubsequence', () => {
   it.each([
      [[], 0],
      [[0, 1, 2, 3], 4],
      [[3, 2, 1, 0], 1],
      [[2, 0, 1, 3], 3],
      [[4, 0, 1, 2, 3], 4]
   ])('%j → length %i', (seq, len) => {
      const lis = [...longestIncreasingSubsequence(seq)].sort((a, b) => a - b);
      expect(lis).toHaveLength(len);
      for (let i = 1; i < lis.length; i++)
         expect(seq[lis[i]]).toBeGreaterThan(seq[lis[i - 1]]);
   });
});

describe('isFieldDefinitionChanged', () => {
   it('ignores null/undefined, empty strings and number/string mismatches', () => {
      const a = field('a', { comment: undefined, collation: null, numScale: null, unsigned: undefined });
      const b = field('a', { comment: '', collation: undefined, numScale: undefined, unsigned: false, numLength: '11' as unknown as number });
      expect(isFieldDefinitionChanged(a, b)).toBe(false);
   });

   it('distinguishes an empty string default from no default', () => {
      expect(isFieldDefinitionChanged(field('a', { default: null }), field('a', { default: '' }))).toBe(true);
   });

   it('ignores non definition properties', () => {
      expect(isFieldDefinitionChanged(field('a', { order: 1, key: 'pri' }), field('a', { order: 5, key: '' }))).toBe(false);
   });
});

describe('diffTableFields', () => {
   it('produces nothing when saving without changes', () => {
      const original = cols('id', 'a', 'b', 'c');
      expect(diffTableFields(original, clone(original))).toEqual({ additions: [], changes: [], deletions: [] });
   });

   it('adds a column in the middle without touching the others', () => {
      const original = cols('id', 'a', 'b');
      const local = clone(original);
      local.splice(2, 0, field('x'));
      const { additions, changes, columns } = applyAlter(original, local);

      expect(additions.map(f => [f.name, f.after])).toEqual([['x', 'a']]);
      expect(changes).toEqual([]);
      expect(columns).toEqual(['id', 'a', 'x', 'b']);
   });

   it('moves a single column when bringing it to the top', () => {
      const original = cols('a', 'b', 'c', 'd');
      const local = [original[2], original[0], original[1], original[3]].map(clone);
      const { changes, columns } = applyAlter(original, local);

      expect(changes.map(f => [f.name, f.after])).toEqual([['c', false]]);
      expect(columns).toEqual(['c', 'a', 'b', 'd']);
   });

   it('changes a definition without repositioning the column', () => {
      const original = cols('id', 'a', 'b');
      const local = clone(original);
      local[1].nullable = true;
      const { changes } = diffTableFields(original, local);

      expect(changes).toHaveLength(1);
      expect(changes[0]).toMatchObject({ name: 'a', orgName: 'a' });
      expect(changes[0]).not.toHaveProperty('after');
   });

   it('renames a column', () => {
      const original = cols('id', 'a');
      const local = clone(original);
      local[1].name = 'a2';
      const { changes, columns } = applyAlter(original, local);

      expect(changes.map(f => [f.orgName, f.name, f.after])).toEqual([['a', 'a2', undefined]]);
      expect(columns).toEqual(['id', 'a2']);
   });

   it('adds a column after a column renamed in the same save', () => {
      const original = cols('id', 'a', 'b');
      const local = clone(original);
      local[1].name = 'a2';
      local.splice(2, 0, field('x'));
      const { columns } = applyAlter(original, local);

      expect(columns).toEqual(['id', 'a2', 'x', 'b']);
   });

   it('handles additions, deletions, renames and moves together', () => {
      const original = cols('a', 'b', 'c', 'd', 'e');
      const [a, b, c, d] = original.map(clone);
      b.name = 'b2';
      const local = [d, b, field('y'), a, c]; // e deleted
      const { columns, deletions } = applyAlter(original, local);

      expect(deletions.map(f => f.name)).toEqual(['e']);
      expect(columns).toEqual(['d', 'b2', 'y', 'a', 'c']);
   });

   it('reaches the target order with the minimum number of moves for any permutation', () => {
      const names = ['a', 'b', 'c', 'd', 'e', 'f'];
      let seed = 42;
      const random = () => (seed = (seed * 16807) % 2147483647) / 2147483647;

      for (let run = 0; run < 300; run++) {
         const original = cols(...names);
         const local = clone(original).sort(() => random() - 0.5);
         if (random() < 0.3) local.splice(Math.floor(random() * local.length), 1);
         if (random() < 0.3) local.splice(Math.floor(random() * (local.length + 1)), 0, field(`n${run}`));

         const { columns, changes } = applyAlter(original, local);
         expect(columns).toEqual(local.map(f => f.name));

         const survivors = local.filter(f => original.some(o => o._antares_id === f._antares_id));
         const lis = longestIncreasingSubsequence(survivors.map(f => original.findIndex(o => o._antares_id === f._antares_id)));
         expect(changes).toHaveLength(survivors.length - lis.size);
      }
   });
});
