import { Extension } from '@codemirror/state';
import { EditorView, showPanel } from '@codemirror/view';

/**
 * Small toolbar floating in the top right corner of the editor (format, clear, ...).
 * It is a top panel like the search widget and the "go to line" dialog, so CodeMirror stacks
 * them instead of drawing one over the other. The panel only hosts `dom`: its content is
 * rendered by Vue (QueryEditor teleports the `actions` slot into it).
 * Must come after the search extension to stay below the search widget.
 */
export const actionsPanel = (dom: HTMLElement): Extension => [
   showPanel.of(() => ({ dom, top: true })),
   EditorView.baseTheme({
      '.cm-editor-actions': {
         display: 'flex',
         gap: '2px',
         width: 'fit-content',
         marginLeft: 'auto',
         marginTop: '4px',
         padding: '2px',
         borderRadius: '4px',
         boxShadow: '0 2px 8px rgba(0, 0, 0, 0.35)',
         opacity: '0.75',
         transition: 'opacity 0.15s',
         '&:hover, &:focus-within': { opacity: '1' }
      },
      '.cm-editor-action': {
         display: 'inline-flex',
         alignItems: 'center',
         justifyContent: 'center',
         width: '24px',
         height: '24px',
         padding: '0',
         border: 'none',
         borderRadius: '3px',
         background: 'transparent',
         color: 'inherit',
         cursor: 'pointer',
         '&:disabled': { opacity: '0.4', cursor: 'default' }
      }
   })
];
