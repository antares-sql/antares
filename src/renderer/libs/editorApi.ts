/**
 * Methods exposed by the QueryEditor component (via `defineExpose`).
 * Components must use these instead of the underlying editor instance,
 * so the editor engine can be swapped without touching them.
 */
export interface EditorApi {
   getValue: () => string;
   /** Replaces the whole content of the editor */
   setValue: (value: string) => void;
   getSelectedText: () => string;
   /** Cursor position as an offset from the start of the content */
   getCursorIndex: () => number;
   focus: () => void;
   /** Recomputes the editor layout after its container has been resized */
   resize: () => void;
   /** Formats the whole content with the SQL formatter of the workspace engine */
   format: () => void;
}
