import { functions } from '@/suggestions/sql/sql-functions';
import { keywords } from '@/suggestions/sql/sql-keywords';
import { operators } from '@/suggestions/sql/sql-operators';
import { variables } from '@/suggestions/sql/sql-variables';

export const completionItemProvider = (monaco) => {
   return {
      provideCompletionItems () {
         return { suggestions: [...functions(monaco), ...keywords(monaco), ...operators(monaco), ...variables(monaco)] };
      }
   };
};
