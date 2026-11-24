import {
   closeSearchPanel,
   findNext,
   findPrevious,
   getSearchQuery,
   openSearchPanel,
   replaceAll,
   replaceNext,
   search,
   SearchQuery,
   selectMatches,
   setSearchQuery
} from '@codemirror/search';
import { Extension } from '@codemirror/state';
import { EditorView, Panel, runScopeHandlers, ViewUpdate } from '@codemirror/view';

import { createIconElement } from '@/libs/icons';

/** Matches counted for the "n of m" label, beyond that it shows "m+" */
const maxCount = 999;

const svgIcon = (name: string) => createIconElement(name, 16);

const iconButton = (icon: string, title: string, onClick: () => void, className = '') => {
   const button = document.createElement('button');
   button.type = 'button';
   button.className = `cm-search-button ${className}`.trim();
   button.title = title;
   button.setAttribute('aria-label', title);
   button.appendChild(svgIcon(icon));
   button.addEventListener('mousedown', e => e.preventDefault()); // Keep the focus in the inputs
   button.addEventListener('click', onClick);
   return button;
};

const textField = (placeholder: string, value: string) => {
   const input = document.createElement('input');
   input.className = 'cm-search-input';
   input.placeholder = placeholder;
   input.setAttribute('aria-label', placeholder);
   input.value = value;
   input.spellcheck = false;
   return input;
};

const element = (className: string, ...children: HTMLElement[]) => {
   const div = document.createElement('div');
   div.className = className;
   div.append(...children);
   return div;
};

/** Number of matches and index of the one at the main selection */
const countMatches = (view: EditorView, query: SearchQuery) => {
   if (!query.valid) return { total: 0, current: 0 };
   const { from, to } = view.state.selection.main;
   const cursor = query.getCursor(view.state);
   let total = 0;
   let current = 0;
   for (let match = cursor.next(); !match.done; match = cursor.next()) {
      total++;
      if (match.value.from === from && match.value.to === to) current = total;
      if (total > maxCount) break;
   }
   return { total, current };
};

/** Compact search widget floating in the top right corner of the editor (like VS Code) */
const createSearchPanel = (view: EditorView): Panel => {
   let query = getSearchQuery(view.state);
   const readOnly = view.state.readOnly;

   const searchField = textField('Find', query.search);
   searchField.setAttribute('main-field', 'true');
   const replaceField = textField('Replace', query.replace);
   const counter = element('cm-search-counter');

   const toggles: Record<'caseSensitive' | 'wholeWord' | 'regexp', HTMLButtonElement> = {
      caseSensitive: null,
      wholeWord: null,
      regexp: null
   };

   const commit = () => {
      const next = new SearchQuery({
         search: searchField.value,
         caseSensitive: toggles.caseSensitive.classList.contains('active'),
         wholeWord: toggles.wholeWord.classList.contains('active'),
         regexp: toggles.regexp.classList.contains('active'),
         replace: replaceField.value
      });
      if (!next.eq(query)) {
         query = next;
         view.dispatch({ effects: setSearchQuery.of(query) });
      }
   };

   const toggle = (key: keyof typeof toggles) => () => {
      toggles[key].classList.toggle('active');
      toggles[key].setAttribute('aria-pressed', String(toggles[key].classList.contains('active')));
      commit();
   };

   toggles.caseSensitive = iconButton('match-case', 'Match case', toggle('caseSensitive'), 'cm-search-toggle');
   toggles.wholeWord = iconButton('whole-word', 'Match whole word', toggle('wholeWord'), 'cm-search-toggle');
   toggles.regexp = iconButton('regex', 'Use regular expression', toggle('regexp'), 'cm-search-toggle');

   const syncToggles = () => {
      for (const key of Object.keys(toggles) as (keyof typeof toggles)[]) {
         toggles[key].classList.toggle('active', query[key]);
         toggles[key].setAttribute('aria-pressed', String(query[key]));
      }
   };
   syncToggles();

   const updateCounter = () => {
      if (!query.search) {
         counter.textContent = '';
         counter.classList.remove('cm-search-no-results');
         return;
      }
      const { total, current } = countMatches(view, query);
      counter.textContent = total === 0
         ? 'No results'
         : total > maxCount
            ? `${current || '?'} of ${maxCount}+`
            : `${current || '?'} of ${total}`;
      counter.classList.toggle('cm-search-no-results', total === 0);
   };

   const replaceRow = element('cm-search-row cm-search-replace-row',
      replaceField,
      iconButton('search+sync', 'Replace', () => replaceNext(view)),
      iconButton('file+sync', 'Replace all', () => replaceAll(view))
   );

   const expander = iconButton('chevron-right', 'Toggle replace', () => {
      const open = !dom.classList.contains('cm-search-replace-open');
      dom.classList.toggle('cm-search-replace-open', open);
      expander.replaceChildren(svgIcon(open ? 'chevron-down' : 'chevron-right'));
      if (open) replaceField.focus();
   }, 'cm-search-expander');

   const searchRow = element('cm-search-row',
      element('cm-search-field', searchField, toggles.caseSensitive, toggles.wholeWord, toggles.regexp),
      counter,
      iconButton('arrow-up', 'Previous match (Shift+Enter)', () => findPrevious(view)),
      iconButton('arrow-down', 'Next match (Enter)', () => findNext(view)),
      iconButton('select-all', 'Select all matches (Alt+Enter)', () => selectMatches(view)),
      iconButton('x', 'Close (Escape)', () => closeSearchPanel(view))
   );

   const dom = element('cm-search cm-search-widget',
      ...(readOnly ? [] : [expander]),
      element('cm-search-rows', searchRow, ...(readOnly ? [] : [replaceRow]))
   );
   if (query.replace && !readOnly) expander.click();

   searchField.addEventListener('input', commit);
   replaceField.addEventListener('input', commit);

   dom.addEventListener('keydown', (e: KeyboardEvent) => {
      if (runScopeHandlers(view, e, 'search-panel'))
         e.preventDefault();

      else if (e.key === 'Enter' && e.target === searchField) {
         e.preventDefault();
         if (e.altKey) selectMatches(view);
         else if (e.shiftKey) findPrevious(view);
         else findNext(view);
      }
      else if (e.key === 'Enter' && e.target === replaceField) {
         e.preventDefault();
         if (e.ctrlKey || e.metaKey) replaceAll(view);
         else replaceNext(view);
      }
   });

   return {
      dom,
      top: true,
      mount () {
         searchField.select();
         updateCounter();
      },
      update (update: ViewUpdate) {
         for (const transaction of update.transactions) {
            for (const effect of transaction.effects) {
               if (effect.is(setSearchQuery) && !effect.value.eq(query)) {
                  // Query changed from outside (e.g. reopened with a new selection)
                  query = effect.value;
                  searchField.value = query.search;
                  replaceField.value = query.replace;
                  syncToggles();
               }
            }
         }
         if (update.docChanged || update.selectionSet || update.transactions.some(tr => tr.effects.some(e => e.is(setSearchQuery))))
            updateCounter();
      }
   };
};

/** Opens the search widget with the replace row expanded (Ace's Ctrl+H) */
export const openReplacePanel = (view: EditorView) => {
   if (view.state.readOnly) return openSearchPanel(view);
   openSearchPanel(view);
   const widget = view.dom.querySelector('.cm-search-widget');
   if (widget && !widget.classList.contains('cm-search-replace-open'))
      widget.querySelector<HTMLButtonElement>('.cm-search-expander')?.click();
   return true;
};

export const searchPanel = (): Extension => [
   search({ top: true, createPanel: createSearchPanel }),
   EditorView.baseTheme({
      // Floating widget instead of a full width bar
      // Panels (search, "go to line" dialog) float in the top right corner instead of full width bars
      '.cm-panels.cm-panels-top, .cm-panels.cm-panels-bottom': {
         position: 'absolute',
         top: '0',
         bottom: 'auto',
         left: 'auto',
         right: '18px',
         maxWidth: 'calc(100% - 36px)',
         border: 'none',
         backgroundColor: 'transparent'
      },
      '.cm-search-widget': {
         display: 'flex',
         alignItems: 'flex-start',
         gap: '2px',
         padding: '4px',
         borderRadius: '0 0 4px 4px',
         boxShadow: '0 2px 8px rgba(0, 0, 0, 0.35)',
         fontFamily: 'inherit',
         fontSize: '13px'
      },
      '.cm-search-rows': {
         display: 'flex',
         flexDirection: 'column',
         gap: '4px',
         minWidth: '0'
      },
      '.cm-search-row': {
         display: 'flex',
         alignItems: 'center',
         gap: '2px'
      },
      '.cm-search-replace-row': {
         display: 'none'
      },
      '.cm-search-replace-open .cm-search-replace-row': {
         display: 'flex'
      },
      '.cm-search-field': {
         display: 'flex',
         alignItems: 'center',
         gap: '1px',
         width: '260px',
         paddingRight: '2px',
         borderRadius: '2px'
      },
      '.cm-search-replace-row .cm-search-input': {
         width: '260px',
         flex: '0 0 auto'
      },
      '.cm-search-input': {
         flex: '1 1 auto',
         minWidth: '0',
         height: '24px',
         padding: '0 6px',
         border: 'none',
         borderRadius: '2px',
         outline: 'none',
         background: 'transparent',
         color: 'inherit',
         font: 'inherit'
      },
      '.cm-search-button': {
         display: 'inline-flex',
         alignItems: 'center',
         justifyContent: 'center',
         flex: '0 0 auto',
         width: '22px',
         height: '22px',
         padding: '0',
         border: '1px solid transparent',
         borderRadius: '3px',
         background: 'transparent',
         color: 'inherit',
         cursor: 'pointer',
         opacity: '0.85',
         '&:hover': { opacity: '1' }
      },
      '.cm-search-expander': {
         width: '16px',
         height: '24px'
      },
      '.cm-search-toggle.active': {
         opacity: '1',
         borderColor: 'var(--primary-color)',
         color: 'var(--primary-color)'
      },
      '.cm-search-counter': {
         minWidth: '72px',
         padding: '0 6px',
         whiteSpace: 'nowrap',
         opacity: '0.8'
      }
   })
];
