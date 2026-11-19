import { describe, expect, it } from 'vitest';

import { arrayRowsToObjects, uniqueColumnNames } from '../../../src/main/libs/db/core/resultRows';

describe('uniqueColumnNames', () => {
   it('keeps distinct names', () => {
      expect(uniqueColumnNames(['id', 'name'])).toEqual(['id', 'name']);
   });

   it('suffixes later duplicates', () => {
      expect(uniqueColumnNames(['?column?', '?column?', '?column?'])).toEqual(['?column?', '?column?_2', '?column?_3']);
   });

   it('does not clash with real columns named like a suffix', () => {
      expect(uniqueColumnNames(['a', 'a', 'a_2'])).toEqual(['a', 'a_3', 'a_2']);
   });

   it('treats the same name in different tables as distinct', () => {
      expect(uniqueColumnNames(['name', 'name', 'id', 'id'], ['f.', 'a.', 'a.', 'a.'])).toEqual(['name', 'name', 'id', 'id_2']);
   });
});

describe('arrayRowsToObjects', () => {
   it('maps values by column position', () => {
      expect(arrayRowsToObjects([[1, 2, 3]], ['a', 'a_2', 'b'])).toEqual([{ a: 1, a_2: 2, b: 3 }]);
   });
});
