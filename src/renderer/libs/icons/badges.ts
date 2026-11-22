/**
 * Badges: small marks drawn in the bottom-right corner of a glyph (centered on 18,18 of the 24×24 grid).
 * Each badge has one fixed meaning across the app. The glyph under a badge is cut out along the badge
 * outline (see `iconMarkup()` in index.ts), so the badge never overlaps the glyph lines.
 *
 * Classes: `f` = area filled with the duotone tint, `d` = solid detail.
 */
export const badges: Record<string, string> = {
   // new, add
   plus: '<path d="M18 14v8M14 18h8"/>',
   // remove
   minus: '<path d="M14 18h8"/>',
   // delete permanently
   x: '<path d="M15 15l6 6M21 15l-6 6"/>',
   // checked, constraint
   check: '<path d="M14.3 18.2l2.5 2.5 4.9-5.2"/>',
   // blocked, cancelled
   ban: '<circle cx="18" cy="18" r="3.8"/><path d="M15.3 20.7l5.4-5.4"/>',
   // properties, settings
   cog: '<circle cx="18" cy="18" r="2.4"/><path d="M21.03 19.75L21.72 20.15M18 21.5L18 22.3M14.97 19.75L14.28 20.15M14.97 16.25L14.28 15.85M18 14.5L18 13.7M21.03 16.25L21.72 15.85"/>',
   // view, preview
   eye: '<path d="M12 18q6-5.8 12 0q-6 5.8-12 0z"/><circle class="d" cx="18" cy="18" r="1.4"/>',
   // edit
   pencil: '<path d="M14 22l.6-2.9 5.6-5.6a1.6 1.6 0 0 1 2.3 2.3l-5.6 5.6z"/>',
   // reference, move, go to
   arrow: '<path d="M14 18h8M18.5 14.5L22 18l-3.5 3.5"/>',
   // export
   up: '<path d="M18 22v-8M14.5 17.5L18 14l3.5 3.5"/>',
   // import, download
   down: '<path d="M18 14v8M14.5 18.5L18 22l3.5-3.5"/>',
   // scheduled, history
   clock: '<circle cx="18" cy="18" r="4.2"/><path d="M18 16v2.1l1.4 1"/>',
   // refresh, replace
   sync: '<path d="M21.3 16.1A3.8 3.8 0 1 0 21.6 19.6"/><path d="M22.3 13.3v3h-3"/>',
   // run
   play: '<path class="f" d="M16 14.6v6.8a.7.7 0 0 0 1.05.6l5.2-3.4a.7.7 0 0 0 0-1.2l-5.2-3.4a.7.7 0 0 0-1.05.6z"/>',
   // warning
   alert: '<path d="M18 14.2v4.3M18 21.6v.1"/>',
   // search
   search: '<circle cx="17.2" cy="17.2" r="2.8"/><path d="M19.3 19.3l2.5 2.5"/>',
   // favorite
   heart: '<path class="f" d="M18 21.6l-3.2-3.2a2.1 2.1 0 0 1 3.2-2.7 2.1 2.1 0 0 1 3.2 2.7z"/>',
   // protected, encrypted
   lock: '<rect class="f" x="14.5" y="17.6" width="7" height="5" rx="1.2"/><path d="M16 17.6v-1.4a2 2 0 0 1 4 0v1.4"/>',
   // code, SQL
   code: '<path d="M16 15.5L13.6 18l2.4 2.5M20 15.5l2.4 2.5-2.4 2.5"/>',
   // trigger
   bolt: '<path class="f" d="M18.8 13.8l-3.3 4.6h3.1l-.6 3.8 3.3-4.6h-3.1z"/>'
};
