import { RangeSet, StateEffect, StateField } from '@codemirror/state';
import { EditorView, gutter, GutterMarker } from '@codemirror/view';

/** Line markers toggled by clicking the left side of the gutter (visual bookmarks) */
const toggleBreakpoint = StateEffect.define<{ pos: number; on: boolean }>({
   map: (value, mapping) => ({ pos: mapping.mapPos(value.pos), on: value.on })
});

const breakpointMarker = new class extends GutterMarker {
   toDOM () {
      const marker = document.createElement('span');
      marker.className = 'cm-breakpoint-marker';
      return marker;
   }
}();

const breakpointState = StateField.define<RangeSet<GutterMarker>>({
   create: () => RangeSet.empty,
   update (set, transaction) {
      set = set.map(transaction.changes);
      for (const effect of transaction.effects) {
         if (effect.is(toggleBreakpoint)) {
            set = effect.value.on
               ? set.update({ add: [breakpointMarker.range(effect.value.pos)] })
               : set.update({ filter: from => from !== effect.value.pos });
         }
      }
      return set;
   }
});

const toggle = (view: EditorView, pos: number) => {
   let hasBreakpoint = false;
   view.state.field(breakpointState).between(pos, pos, () => {
      hasBreakpoint = true;
   });
   view.dispatch({ effects: toggleBreakpoint.of({ pos, on: !hasBreakpoint }) });
};

export const breakpoints = () => [
   breakpointState,
   gutter({
      class: 'cm-breakpoint-gutter',
      markers: view => view.state.field(breakpointState),
      initialSpacer: () => breakpointMarker,
      domEventHandlers: {
         mousedown (view, line) {
            toggle(view, line.from);
            return true;
         }
      }
   }),
   EditorView.baseTheme({
      '.cm-breakpoint-gutter .cm-gutterElement': {
         width: '14px',
         cursor: 'pointer',
         display: 'flex',
         alignItems: 'center',
         justifyContent: 'center'
      },
      '.cm-breakpoint-marker': {
         display: 'inline-block',
         width: '0',
         height: '0',
         borderLeft: '5px solid transparent',
         borderTop: '5px solid transparent',
         borderRight: '5px solid var(--primary-color)',
         transform: 'rotate(-45deg)'
      }
   })
];
