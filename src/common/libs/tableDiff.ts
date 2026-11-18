import { TableField } from 'common/interfaces/antares';

/** Column properties that are part of a column definition and editable from the UI */
const DEFINITION_KEYS: (keyof TableField)[] = [
   'name',
   'type',
   'numLength',
   'numScale',
   'charLength',
   'datePrecision',
   'enumValues',
   'isArray',
   'nullable',
   'unsigned',
   'zerofill',
   'autoIncrement',
   'default',
   'collation',
   'onUpdate',
   'comment'
];

const BOOLEAN_KEYS: (keyof TableField)[] = ['isArray', 'nullable', 'unsigned', 'zerofill', 'autoIncrement'];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const normalize = (key: keyof TableField, value: any) => {
   if (BOOLEAN_KEYS.includes(key)) return !!value;
   if (value === undefined || value === null) return null;
   // For `default` an empty string is meaningful (DEFAULT ''), elsewhere it means "not set"
   if (value === '' && key !== 'default') return null;
   if (typeof value === 'number') return String(value);
   return value;
};

export const isFieldDefinitionChanged = (original: TableField, local: TableField): boolean => {
   return DEFINITION_KEYS.some(key => normalize(key, original[key]) !== normalize(key, local[key]));
};

/**
 * Indexes (in `sequence`) of one longest strictly increasing subsequence.
 * O(n log n) patience sorting.
 */
export const longestIncreasingSubsequence = (sequence: number[]): Set<number> => {
   const tails: number[] = []; // index in sequence of the smallest tail of each length
   const prev: number[] = new Array(sequence.length).fill(-1);

   sequence.forEach((value, i) => {
      let lo = 0;
      let hi = tails.length;
      while (lo < hi) {
         const mid = (lo + hi) >> 1;
         if (sequence[tails[mid]] < value) lo = mid + 1;
         else hi = mid;
      }
      if (lo > 0) prev[i] = tails[lo - 1];
      tails[lo] = i;
   });

   const result = new Set<number>();
   let k = tails.length ? tails[tails.length - 1] : -1;
   while (k !== -1) {
      result.add(k);
      k = prev[k];
   }
   return result;
};

export type FieldWithPosition = TableField & {
   /** Column name to place this column after, `false` for FIRST, `undefined` to keep its position */
   after?: string | false;
};

export type FieldChange = FieldWithPosition & { orgName: string };

/**
 * Compares the original and the edited columns of a table, matched by `_antares_id`.
 *
 * - `additions`: new columns, always with a position.
 * - `changes`: only columns whose definition changed or that must be moved. A position (`after`)
 *   is set only for moved columns: the columns that keep their relative order are the longest
 *   increasing subsequence of the original positions, so a reorder moves the fewest columns.
 * - `deletions`: removed columns.
 *
 * Additions and changes are returned in the final column order: emitted in this order
 * in a single ALTER statement, every `AFTER` refers to a column already in its final place.
 */
export const diffTableFields = (originalFields: TableField[], localFields: TableField[]) => {
   const originalById = new Map(originalFields.map((field, i) => [field._antares_id, { field, index: i }]));
   const localIds = new Set(localFields.map(field => field._antares_id));

   const survivors = localFields.filter(field => originalById.has(field._antares_id));
   const stable = longestIncreasingSubsequence(survivors.map(field => originalById.get(field._antares_id).index));
   const stableIds = new Set(survivors.filter((_, i) => stable.has(i)).map(field => field._antares_id));

   const additions: FieldWithPosition[] = [];
   const changes: FieldChange[] = [];

   localFields.forEach((field, i) => {
      const after: string | false = i > 0 ? localFields[i - 1].name : false;
      const original = originalById.get(field._antares_id);

      if (!original) {
         additions.push({ ...field, after });
         return;
      }

      const moved = !stableIds.has(field._antares_id);
      if (!moved && !isFieldDefinitionChanged(original.field, field)) return;

      const change: FieldChange = { ...field, orgName: original.field.name };
      if (moved) change.after = after;
      else delete change.after;
      changes.push(change);
   });

   const deletions = originalFields.filter(field => !localIds.has(field._antares_id));

   return { additions, changes, deletions };
};
