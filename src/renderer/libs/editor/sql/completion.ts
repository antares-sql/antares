import {
   acceptCompletion,
   autocompletion,
   completeAnyWord,
   Completion,
   CompletionContext,
   completionKeymap,
   CompletionResult,
   CompletionSource,
   snippetCompletion
} from '@codemirror/autocomplete';
import { keywordCompletionSource } from '@codemirror/lang-sql';
import { Extension, Prec } from '@codemirror/state';
import { keymap } from '@codemirror/view';

import { yieldingToAppShortcuts } from '../keymap';
import { SqlDialectDefinition } from './dialects';

/** Kind of a completion: also selects its icon (`cm-completionIcon-<type>`) */
export type SqlEntityType = 'table' | 'view' | 'materializedView' | 'trigger' | 'routine' | 'function' | 'scheduler' | 'column';

export interface SqlEntity {
   name: string;
   type: SqlEntityType;
}

export interface SqlCompletionProvider {
   /** Elements of the current schema (tables, views, routines, ...) */
   getEntities: () => SqlEntity[];
   /** Columns of the tables named in the query, offered with the other elements */
   getQueryColumns: (query: string) => Promise<string[]>;
   /** Columns of a table, when its name is followed by a dot; null if it's not a table */
   getTableColumns: (table: string) => Promise<string[] | null>;
}

export interface SqlCompletionOptions {
   definition: SqlDialectDefinition;
   provider: SqlCompletionProvider;
   activateOnTyping: boolean;
}

const identifier = /^[\w$]*$/;
const afterDot = /([\w$]+)\.([\w$]*)$/;
/** Boost of schema elements over keywords and words of the document (Ace score 1000) */
const entityBoost = 50;

/** `table.` → only the columns of that table */
const tableColumnsSource = (provider: SqlCompletionProvider): CompletionSource => async (context: CompletionContext) => {
   const match = context.matchBefore(afterDot);
   if (!match) return null;
   const [, table, partial] = afterDot.exec(match.text);
   const columns = await provider.getTableColumns(table);
   if (!columns?.length) return null;

   return {
      from: context.pos - partial.length,
      options: columns.map(column => ({ label: column, type: 'column', detail: 'column', boost: entityBoost })),
      validFor: identifier
   };
};

/** Sources that never answer right after `something.` */
const notAfterDot = (source: CompletionSource): CompletionSource => (context: CompletionContext) =>
   context.matchBefore(afterDot) ? null : source(context);

const keywordsSource = (definition: SqlDialectDefinition): CompletionSource =>
   keywordCompletionSource(definition.dialect, false, label => ({ label, type: 'keyword', detail: 'keyword', boost: -1 }));

const snippetsSource = (definition: SqlDialectDefinition): CompletionSource => {
   const snippets = (definition.snippets ?? []).map(snippet => snippetCompletion(snippet.template, {
      label: snippet.label,
      type: 'snippet',
      detail: 'snippet'
   }));

   return (context: CompletionContext) => {
      if (!snippets.length) return null;
      const word = context.matchBefore(/[\w$*]+/);
      if (!word && !context.explicit) return null;
      return { from: word ? word.from : context.pos, options: snippets, validFor: /^[\w$*]*$/ };
   };
};

/**
 * Schema elements, dialect keywords and words of the document in a single list:
 * like Ace, a label offered by more than one of them is shown once.
 */
const wordsSource = (definition: SqlDialectDefinition, provider: SqlCompletionProvider): CompletionSource => {
   const keywords = keywordsSource(definition);

   return async (context: CompletionContext) => {
      const word = context.matchBefore(/[\w$]+/);
      if (!word && !context.explicit) return null;

      const [columns, keywordResult, localResult] = await Promise.all([
         provider.getQueryColumns(context.state.doc.toString()),
         keywords(context),
         completeAnyWord(context)
      ]);

      const options = new Map<string, Completion>();
      const add = (completion: Completion) => {
         if (!options.has(completion.label)) options.set(completion.label, completion);
      };

      for (const entity of provider.getEntities())
         add({ label: entity.name, type: entity.type, detail: entity.type, boost: entityBoost });
      for (const column of columns)
         add({ label: column, type: 'column', detail: 'column', boost: entityBoost });
      for (const keyword of keywordResult?.options ?? [])
         add(keyword);
      for (const local of localResult?.options ?? [])
         add({ ...local, type: 'local', detail: 'local', boost: -2 });

      return {
         from: word ? word.from : context.pos,
         options: [...options.values()],
         validFor: identifier
      } as CompletionResult;
   };
};

export const sqlCompletion = ({ definition, provider, activateOnTyping }: SqlCompletionOptions): Extension => [
   autocompletion({
      activateOnTyping,
      icons: true,
      override: [
         tableColumnsSource(provider),
         notAfterDot(wordsSource(definition, provider)),
         notAfterDot(snippetsSource(definition))
      ]
   }),
   // Like Ace, Tab accepts the selected completion (before indentation)
   Prec.highest(keymap.of(yieldingToAppShortcuts([{ key: 'Tab', run: acceptCompletion }, ...completionKeymap])))
];
