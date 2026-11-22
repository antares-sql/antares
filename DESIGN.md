# DESIGN.md

UI guidelines for **Antares SQL**. Their purpose is to keep new screens consistent with the existing ones.
Read this before adding or changing anything in `src/renderer/`. For architecture, commands and code conventions see [AGENTS.md](AGENTS.md).

**Golden rule:** before writing new markup or CSS, find the closest existing screen and copy its structure.
Antares is a dense desktop tool, not a web page. Keep it compact, keyboard-friendly and the same in both themes.

## Foundations

### Styling stack

- **Spectre.css** is the base framework (grid, forms, buttons, menus, modals, tabs, tooltips, empty states).
  It is vendored in [src/renderer/scss/spectre/](src/renderer/scss/spectre/) (0.5.9, MIT, upstream is unmaintained): it is our code now, fix it there instead of overriding it.
  Use its classes first: `columns`/`column col-*`, `form-group`, `form-label`, `form-input`, `btn`, `menu`, `tile`, `empty`, `tooltip`, `d-flex`, `text-*`, `m*-*`/`p*-*`.
- Global overrides and helpers live in [src/renderer/scss/main.scss](src/renderer/scss/main.scss). Theme colors are **tokens** (CSS custom properties):
  their values live **only** in [themes/dark-theme.scss](src/renderer/scss/themes/dark-theme.scss) and [themes/light-theme.scss](src/renderer/scss/themes/light-theme.scss),
  the rules that use them in [themes/_theme-rules.scss](src/renderer/scss/themes/_theme-rules.scss) (one set of rules for every theme).
- Every SFC style block automatically gets `@/scss/_variables.scss` and a `$platform` variable (injected by `sass-loader` in `webpack.renderer.config.js`). Do not import them again.
- Component styles: `<style lang="scss" scoped>` by default. Use an unscoped block only when you must style children that Spectre or a teleported element renders. In that case, prefix every selector with the component's root class.

### Color

| Token | Value | Use |
|---|---|---|
| `var(--primary-color)` | `#e36929` by default | Accent: primary buttons, active tab underline, focus rings, links, selection, SQL keywords |
| `var(--primary-color-dark)` | primary darkened 30% | Hover/pressed state of the accent |
| `var(--primary-color-shadow)` | primary at 20% alpha | Default of `--focus-ring-color`. Focus ring: `box-shadow: 0 0 0 var(--focus-ring-width) var(--focus-ring-color)` |
| `var(--success)` (`$success-color`) | `#32b643` | Connected state, success notifications |
| `var(--warning)` (`$warning-color`) | `#e0a40c` | Connecting state, warnings |
| `var(--error)` (`$error-color`) | `#de3b28` | Failed state, errors, destructive emphasis. Status colors are theme tokens: the SCSS variables point to them, so never pass them to Sass color functions (`darken`, `rgba($c, a)`): use `adjust-lightness()` / `with-alpha()` from the vendored Spectre or `color-mix()` |
| `var(--bg-app)`, `var(--bg-panel)`, `var(--bg-surface)`, `var(--bg-raised)` | per theme | Surfaces: app background → side panels → modals/console → menus/popups |
| `var(--text)`, `var(--text-muted)` | per theme | Text |
| `var(--border)`, `var(--border-subtle)`, `var(--separator)`, `var(--divider)` | per theme | Control borders, tab/list borders, editor/console separators, dividers |
| `var(--input-bg*)`, `var(--grid-*)`, `var(--table-*)`, `var(--diagram-*)`, ... | per theme | See the full list in the theme files |

Rules:
- **The accent is dynamic.** The connection folder color overrides `--primary-color` at runtime (see `changeAccentColor()` in [TheFooter.vue](src/renderer/components/TheFooter.vue)).
  For accent colors, always use `var(--primary-color*)`. Never use `$primary-color` or a hard-coded orange.
  Because of this, any accent color can appear: text on the accent must use `var(--primary-color-text)`, which `changeAccentColor()` computes from the WCAG contrast (light text unless it drops below 3:1).
- **The accent is not a theme token**: themes never set `--primary-color*` directly, the folder color always drives it. A theme can only change the **palette** the folders pick from and the default accent (`accent` section, slots in [folderColors.ts](src/common/themes/folderColors.ts)): folders store the default hex of a slot and `useThemesStore().resolveFolderColor()` returns the color of the active theme. Always show folder colors through it.
- Do not hard-code hex values in components. If a color depends on the theme, use a token. If no token fits, add it to **every** theme file
  (same name, same order) and use it in `_theme-rules.scss` or in the component. Tokens are a public contract for future custom themes: do not rename them.
- Theme tokens are defined on `#wrapper`, so they are visible only inside it (teleported modals target `#window-content`, which is inside).
- Status colors are for status only. Do not use them for decoration.
- The setting bar is dark in every built-in theme: its text uses `var(--settingbar-text)`, not `--text`. Context menus use `--context-*` and inherit their text color (no `text-light` on their icons).

### Data-type colors

Column types are colored consistently everywhere: grid cells, field lists, autocompletion, SQL highlight.

| Variable (theme token) | Default | Types |
|---|---|---|
| `$string-color` (`var(--type-string)`) | seagreen | char/varchar/text/json/uuid/... |
| `$number-color` (`var(--type-number)`) | cornflowerblue | int/decimal/float/... |
| `$date-color` (`var(--type-date)`) | coral | date/time/timestamp/... |
| `$bit-color` (`var(--type-bit)`) | lightskyblue | bit/boolean |
| `$blob-color` (`var(--type-blob)`) | darkorchid | blob/binary/bytea |
| `$array-color` (`var(--type-array)`) | yellowgreen | arrays |
| `$enum-color` (`var(--type-enum)`) | goldenrod | enum/set |
| `$unknown-color` (`var(--type-unknown)`) | gray | anything else |

Use the generated `.type-<typename>` classes from [_data-types.scss](src/renderer/scss/_data-types.scss). When a new engine adds a type, map it there and do not color it inline.
Key icons (PK/FK/unique/index) come from [_table-keys.scss](src/renderer/scss/_table-keys.scss). Engine logos come from [_db-icons.scss](src/renderer/scss/_db-icons.scss).

### Typography

- Use Spectre's default font stack and sizes. **Dense areas use `0.7rem`**: result grid cells and headers, menus, small selects.
- Headings inside panels and modals: `h6` / `h5` classes, not big headings. Modal headers are uppercase (global rule in `main.scss`).
- Monospace only for SQL/code (code editors, `code.sql`).
- Long names (tables, schemas, connections) must never wrap or overflow. Use `.cut-text` and put the full text in `title`.

### Spacing and sizing

- Spacing uses Spectre's utility scale (`m-1`/`p-1` = 0.2rem, `-2` = 0.4rem). `main.scss` adds `-3` (0.6rem) and `-4` (0.8rem). Prefer utilities over custom margins.
- Shape is tokenized in [themes/_shape-tokens.scss](src/renderer/scss/themes/_shape-tokens.scss), so themes can change it:
  - corners: `$border-radius` (= `var(--radius)`, 0.3rem); small elements use `calc(var(--radius) / 2)`; setting-bar tiles use `var(--radius-lg)`. `50%` only for real circles. Do not invent other radii;
  - lines: `var(--border-width)` for borders and separators, `var(--border-width-lg)` for indicators and selected outlines, `var(--grid-border-width)` in the results grid;
  - `var(--focus-ring-width)`, `var(--focus-ring-color)`, `var(--scrollbar-size)`.
  `$border-width` and `$border-width-lg` point to these tokens too: in SCSS do math on them only inside `calc()`.
- Fixed layout sizes are variables: `$titlebar-height`, `$footer-height`, `$settingbar-width`, `$explorebar-width`, `$excluding-size`. Use them instead of repeating the numbers.
- Layout is flexbox. There are no responsive breakpoints: the window is a desktop app and panels resize. Make content scroll, never squash it.

### Iconography

- Use [BaseIcon.vue](src/renderer/components/BaseIcon.vue) with **Material Design Icons** (`@mdi/js`, names like `mdiContentSave`). Do not add other icon libraries, raw SVG files or icon fonts.
  `type="custom"` is reserved for user-uploaded connection icons.
- Standard sizes:

  | Size | Where |
  |---|---|
  | `16` | Inline in dense lists/trees |
  | `18` | Context menu items, info labels in toolbars, form addons |
  | `24` | Toolbar buttons (Save, Clear, Run, ...) |
  | `36`–`48` | Empty states, the large icons of the setting bar |

- **Vertical alignment of icons.** `BaseIcon` renders an inline SVG: left alone it sits on the text baseline and looks too high,
  and in a plain `d-flex` row it is aligned to the top (`align-items` defaults to `stretch`, which an SVG with a fixed size ignores). Rules:
  - the element that holds icon + text (button, menu item, label, toolbar info) gets `p-vcentered` (flex + `align-items: center`),
    **not** a bare `d-flex`;
  - put the text in a `<span>` (a sibling element, not a loose text node) and give the icon only `class="mr-1"` (`ml-1` when it follows the text);
  - never nudge icons with `mt-1`, `pt-1`, `top` or line-height tweaks: they only fit one font size and break with the interface text size setting.
    The existing `mt-1` icons are legacy: fix them to `p-vcentered` when you touch that markup;
  - icon-only buttons: `p-vcentered` plus `justify-content: center` when the button is wider than the icon, and a `title`;
  - wrappers of buttons or button groups (`.dropdown`, `.btn-group` inside a toolbar) must be `p-vcentered` too: a block wrapper around an
    `inline-flex` group adds a text line box (taller by the descender), so the group sits higher than the other toolbar buttons;
  - check the result in a screenshot at 100% and at a larger interface text size.
- Reuse the same icon for the same concept everywhere: `mdiContentSave` save, `mdiDeleteSweep` clear changes, `mdiWrenchCog` settings, `mdiContentCopy` copy, `mdiDatabase` schema, `mdiTableArrowRight` export, `mdiHistory` history.
  Search the components for the concept before picking a new icon.

### Motion

- Use the named transitions in [_transitions.scss](src/renderer/scss/_transitions.scss): `fade`, `fade-slide-down`, `slide-fade`, `jump-down`, ...
  Add a new one there only if none fits.
- Keep motion short (0.15–0.3s), ease-based and non-blocking. Spinners: Spectre `.loading` (recolored to the accent) or `.rotate` on an icon.
- The modal overlay blur can be disabled by the user (`#wrapper.no-blur`). Do not add other blur effects that ignore this setting.

### Themes

- The root `#wrapper` gets `theme-dark` or `theme-light` from the **appearance** of the active theme ([App.vue](src/renderer/App.vue)), plus the theme tokens as inline CSS variables. Use the appearance (`useThemesStore().appearance`) for dark/light assets such as logos, never the theme id.
- Each theme carries its code editor colors: there is no separate editor theme. Its syntax colors are also exposed as `--syntax-<token>` (used by the `.sql-hl-*` classes), so SQL looks the same in the editor, the console and the history.
- Installed themes can only use the tokens: when a component needs a new color, add a token (see Color) instead of styling `.theme-dark` / `.theme-light`.
- **Every UI change must be checked in both themes.** Most visual regressions are "looks fine in dark, unreadable in light".

## App layout

```
┌──────────────────────────────────────────────────────────────┐
│ TheTitleBar ($titlebar-height)                               │
├────┬───────────────┬─────────────────────────────────────────┤
│Set-│ Workspace     │ Workspace tabs (.tab + .tab-item)       │
│ting│ ExploreBar    ├─────────────────────────────────────────┤
│Bar │ ($explorebar- │ .workspace-query-runner-footer (toolbar)│
│    │  width,       ├─────────────────────────────────────────┤
│    │  resizable)   │ Tab content (forms / grid / editor)     │
├────┴───────────────┴─────────────────────────────────────────┤
│ TheFooter ($footer-height): version, accent, console toggle  │
└──────────────────────────────────────────────────────────────┘
```

- A new tab type follows the existing `WorkspaceTab*` pattern: a root `workspace-query-tab column col-12 columns col-gapless` shown with `v-show="isSelected"`, then a toolbar, then the content.
- The **tab toolbar** (`.workspace-query-runner-footer`) has two sides:
  - left, `.workspace-query-buttons`: primary action first (`btn btn-primary btn-sm`), then secondary actions (`btn btn-link btn-sm` / `btn btn-dark btn-sm`), each with a 24px icon and a short label;
  - right, `.workspace-query-info`: read-only context (schema, row count, duration) with 18px icons and a `title` tooltip.
- Property/edit tabs (`WorkspaceTabProps*`, `WorkspaceTabNew*`) use the same toolbar, with Save + Clear (and Add/Delete where it makes sense), and a `container > columns > column col-auto` form.

## Components and patterns

### Buttons

| Class | Meaning |
|---|---|
| `btn btn-primary` | The single main action of a view or modal (Save, Confirm, Run). Only **one** per area. |
| `btn btn-dark` | Neutral secondary actions in toolbars |
| `btn btn-link` | Low-emphasis actions (Cancel, Clear, Remove row) |
| `btn btn-clear` | Close "×" in modal headers, tabs and chips |
| `btn-sm` | Inside toolbars and dense areas |

- Add `.loading` while an async action runs and set `:disabled` when it cannot run. A "Save" button is disabled until something changed.
- Icon-only buttons must have a `title` (or `tooltip` + `data-tooltip`) with an i18n string.

### Forms

- Use Spectre markup: `form-group` → `form-label` + `form-input`. Horizontal forms use `form-horizontal` with `col-*` label/input pairs (see the settings and connection panels).
- Selects use [BaseSelect.vue](src/renderer/components/BaseSelect.vue) with `class="form-select"` (`small-select` in grids), not a native `<select>`.
  Foreign-key and faker pickers have their own components (`ForeignKeySelect`, `FakerSelect`).
- Focus is always visible: the accent border plus the focus ring (`--focus-ring-width`, `--focus-ring-color`). Do not remove outlines without a replacement (`.no-outline` is for grid cells only).
- Engine-specific fields appear only behind a `workspace.customizations.<flag>` check, never `client === '...'` (see AGENTS.md).

### Modals

- Generic confirm/edit dialogs extend [BaseConfirmModal.vue](src/renderer/components/BaseConfirmModal.vue). Do not write a new modal shell.
  - Slots: `header` (title, with an icon), `body`. The footer is Confirm (`btn-primary`) + Cancel (`btn-link`). Override labels with `confirm-text`/`cancel-text`.
  - Sizes: `small` (default), `400`, `medium`, `large`, `resize`.
  - It already handles teleport to `#window-content`, the focus trap, Escape and the overlay click. Custom modals must provide the same behaviour (`useFocusTrap`, Escape closes, `Teleport to="#window-content"`).
- Destructive confirmations name the object being deleted and use the confirm button text that describes the action (e.g. "Delete"), not just "Confirm".
- File names: `Modal<Name>.vue`, or `<ParentComponent>Modal.vue` when tied to one tab.

### Context menus

- Use [BaseContextMenu.vue](src/renderer/components/BaseContextMenu.vue). It positions itself and flips near window edges.
- Each item: `div.context-element` → `span.d-flex` → `BaseIcon` (18px, `class="text-light mt-1 mr-1"`) + label. Nested menus use `.context-submenu`.
- Order: open/edit actions → copy/export → structural actions → destructive actions last (delete/drop/truncate), separated if needed.
- Hide items the engine does not support (customizations flag). Do not show them disabled.

### Empty, loading and error states

- Empty: Spectre `.empty` with `.empty-icon` (BaseIcon 48px) + `.empty-title h5` (+ optional `.empty-action`). See `ModalHistory`, `WorkspaceEmptyState`, `WorkspaceTab*EmptyState`.
- Loading a whole panel: [BaseLoader.vue](src/renderer/components/BaseLoader.vue). Loading an action: `.loading` on its button.
- Errors from IPC calls go to the notification board: `useNotificationsStore().addNotification({ status: 'error', message })`.
  Do not use `alert()`, inline red text for server errors, or console-only failures. Use `status: 'success'` sparingly, for actions with no other visible result.

### Tabs

- Spectre `.tab` / `.tab-item`. The active state is the 2px accent underline animated by `main.scss`. Do not add other active styles.
- Closable tabs have a `btn btn-clear` and support middle-click close where the workspace tabs already do.

### Result grid and data display

- Results use `.workspace-query-results .table` with `.th`/`.td` divs, virtualized with [BaseVirtualScroll.vue](src/renderer/components/BaseVirtualScroll.vue). Never render unbounded row lists without virtualization.
- Cells: `0.7rem`, ellipsis, a fixed max-width, the value colored by data type, `NULL` shown distinctly.
- Editing happens in place. Pending changes are highlighted until saved or cleared.

### Status indicators

Connection state uses the badge classes `badge-connected` (success), `badge-connecting` (warning, pulsing) and `badge-failed` (error). Reuse them for any similar state dot.

### Layering (z-index)

Use the existing levels instead of a new number: `1–2` sticky grid headers / local stacking, `9–10` panels and resizers, `99` floating editors, `400` context menus, `401` select dropdowns, `999+` modals/notifications.
If you need a new layer, check these first.

## Interaction and accessibility

- **Keyboard first.** Every frequent action should have a shortcut registered in [src/common/shortcuts.ts](src/common/shortcuts.ts) (shown in *Settings → Shortcuts*). Escape closes the topmost modal/menu, Enter confirms simple modals, and F5 refreshes.
- Text selection is off globally (`body { user-select: none }`). Turn it back on only where users need to copy text (editors, inputs, cells being edited).
- Use `title` for truncated text and icon-only controls, and `c-hand` / `c-help` for the cursor where it helps.
- Do not rely on color alone: status dots have a tooltip, and changed rows also change their style.

## Text and i18n

- All visible strings go through `t('...')`. Add keys to [en-US.ts](src/renderer/i18n/en-US.ts) first and reuse existing keys (`general.save`, `general.cancel`, `general.confirm`, `general.clear`, ...) before creating new ones.
- Tone: short, neutral, sentence case. Labels use nouns or verbs ("Save", "Export table"), not full sentences. Database objects keep the server's own casing.
- Do not concatenate translated fragments. Use i18n interpolation so word order can change per locale. Leave room for longer languages (German, Russian): never fix a button width to fit English.

## Checklist for UI changes

- [ ] Reuses an existing pattern/component (toolbar, BaseConfirmModal, BaseContextMenu, BaseSelect, BaseIcon, empty state).
- [ ] Accent colors use `var(--primary-color*)`. There are no hard-coded colors in components. Theme colors are in **both** theme files.
- [ ] Checked in dark **and** light theme, and with a non-default (light) folder accent color.
- [ ] Icons are MDI, with a standard size and the same concept→icon mapping used elsewhere.
- [ ] Strings are in `en-US.ts`. Icon-only controls have a title.
- [ ] Engine-specific UI is gated by a `customizations` flag.
- [ ] Long names truncate with a tooltip, and big lists are virtualized.
- [ ] Keyboard: Escape/Enter behave, and a shortcut is added if the action is frequent.
- [ ] `npm run lint` passes (eslint + stylelint).
- [ ] Verified in the running app (`.claude/skills/run-app`), with a screenshot for visual changes.
