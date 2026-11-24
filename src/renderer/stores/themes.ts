import { EditorThemeDefinition } from 'common/themes/editorTheme';
import { DEFAULT_ACCENT, FolderColorSlot, folderColorSlotOf, folderColorSlots } from 'common/themes/folderColors';
import { AntaresTheme, resolveEditorTheme, THEME_SCHEMA_VERSION, ThemeAppearance, themeCssVariables, validateTheme } from 'common/themes/theme';
import Store from 'electron-store';
import { defineStore } from 'pinia';

import Application from '@/ipc-api/Application';
import { getEditorTheme } from '@/libs/editor/themes';
import { useSettingsStore } from '@/stores/settings';

const themesStore = new Store({ name: 'themes' });
const settingsStore = new Store({ name: 'settings' });

/** Editor theme of the built-in themes, also the base of the custom themes without an editor section */
export const baseEditorThemes: Record<ThemeAppearance, string> = { dark: 'twilight', light: 'sqlserver' };

export const builtinThemes: AntaresTheme[] = [
   { schemaVersion: THEME_SCHEMA_VERSION, id: 'dark', name: 'Dark', appearance: 'dark', author: 'Antares SQL' },
   { schemaVersion: THEME_SCHEMA_VERSION, id: 'light', name: 'Light', appearance: 'light', author: 'Antares SQL' }
];

const systemAppearance = (): ThemeAppearance => window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';

/** Installed themes are re-validated on load: the file can be edited by hand */
const loadInstalledThemes = (): AntaresTheme[] => {
   const raw = themesStore.get('installed', []);
   if (!Array.isArray(raw)) return [];
   return raw.map(theme => validateTheme(theme).theme).filter(Boolean);
};

const saveInstalledThemes = (themes: AntaresTheme[]) => {
   themesStore.set('installed', JSON.parse(JSON.stringify(themes)));
};

/**
 * Before themes carried their editor colors, the editor theme was a separate setting.
 * If the user picked an editor theme other than the default one, keep the same look with
 * an installed theme "<App theme> + <Editor theme>". Runs once, before the stores are created.
 */
export const migrateLegacyEditorTheme = () => {
   if (themesStore.get('legacy_editor_theme_migrated')) return;
   themesStore.set('legacy_editor_theme_migrated', true);

   const editorCode = settingsStore.get('editor_theme') as string;
   const appTheme = settingsStore.get('application_theme', systemAppearance()) as string;
   if (!editorCode || (appTheme !== 'dark' && appTheme !== 'light')) return;
   const appearance = appTheme as ThemeAppearance;
   const editor = getEditorTheme(editorCode === 'eclupse' ? 'eclipse' : editorCode);
   if (!editor || editor.code === baseEditorThemes[appearance]) return;

   const base = builtinThemes.find(theme => theme.id === appearance);
   const migrated: AntaresTheme = {
      schemaVersion: THEME_SCHEMA_VERSION,
      id: `${appearance}-${editor.code}`.replace(/[^a-z0-9-]/g, '-'),
      name: `${base.name} + ${editor.name}`,
      appearance,
      description: 'Created from your previous application and editor theme settings',
      tags: ['migrated'],
      editor: { colors: editor.editor, syntax: editor.tokens }
   };
   const installed = loadInstalledThemes().filter(theme => theme.id !== migrated.id);
   saveInstalledThemes([...installed, migrated]);
   settingsStore.set('application_theme', migrated.id);
};

/** Theme gallery (github.com/antares-sql/themes). ANTARES_THEMES_URL points it elsewhere, e.g. a local copy while developing */
export const themeGalleryUrl = (process.env.ANTARES_THEMES_URL || 'https://raw.githubusercontent.com/antares-sql/themes/main/').replace(/\/?$/, '/');
export const themeGalleryRepository = 'https://github.com/antares-sql/themes';

export interface GalleryTheme {
   id: string;
   name: string;
   appearance: ThemeAppearance;
   author?: string;
   description?: string;
   tags: string[];
   /** Absolute URLs */
   theme: string;
   preview: string;
}

const fetchWithTimeout = async (url: string, timeout = 15000) => {
   const controller = new AbortController();
   const timer = setTimeout(() => controller.abort(), timeout);
   try {
      const response = await fetch(url, { signal: controller.signal, cache: 'no-cache' });
      if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
      return response;
   }
   finally {
      clearTimeout(timer);
   }
};

export type ThemeImportResult =
   | { status: 'success'; theme: AntaresTheme; warnings: string[] }
   | { status: 'canceled' }
   | { status: 'error'; errors: string[] };

export const useThemesStore = defineStore('themes', {
   state: () => ({
      installed: loadInstalledThemes() as AntaresTheme[]
   }),
   getters: {
      allThemes (): AntaresTheme[] {
         return [...builtinThemes, ...this.installed];
      },
      activeTheme (): AntaresTheme {
         const id = useSettingsStore().applicationTheme;
         return this.allThemes.find((theme: AntaresTheme) => theme.id === id) ??
            builtinThemes.find(theme => theme.id === systemAppearance());
      },
      appearance (): ThemeAppearance {
         return this.activeTheme.appearance;
      },
      /** CSS custom properties to set on #wrapper (none for the built-in themes) */
      cssVariables (): Record<string, string> {
         return themeCssVariables(this.activeTheme);
      },
      /** Accent of the app outside folders */
      defaultAccent (): string {
         return (this.activeTheme as AntaresTheme).accent?.default ?? DEFAULT_ACCENT;
      },
      /** Color shown for a stored folder color: the active theme can remap every palette slot */
      resolveFolderColor (): (stored: string) => string {
         const accent = (this.activeTheme as AntaresTheme).accent ?? {};
         return (stored: string) => {
            if (!stored) return accent.default ?? DEFAULT_ACCENT;
            const slot = folderColorSlotOf(stored);
            return (slot && accent[slot]) || stored;
         };
      },
      /** The folder palette with the colors of the active theme (`hex` is the value stored in the folder) */
      folderPalette (): { name: FolderColorSlot; hex: string; color: string }[] {
         const accent = (this.activeTheme as AntaresTheme).accent ?? {};
         return folderColorSlots.map(slot => ({ name: slot.name, hex: slot.hex, color: accent[slot.name] ?? slot.hex }));
      },
      /** Editor theme of any theme: its editor section over the base editor theme of its appearance */
      editorThemeOf: () => (theme: AntaresTheme): EditorThemeDefinition =>
         resolveEditorTheme(theme, getEditorTheme(baseEditorThemes[theme.appearance])),
      editorTheme (): EditorThemeDefinition {
         return this.editorThemeOf(this.activeTheme);
      },
      /** Editor syntax colors as --syntax-<token> variables, so SQL highlighted outside the editor matches it */
      syntaxVariables (): Record<string, string> {
         const vars: Record<string, string> = {};
         for (const [token, style] of Object.entries((this.editorTheme as EditorThemeDefinition).tokens))
            if (style?.color) vars[`--syntax-${token.replace(/[A-Z]/g, c => '-' + c.toLowerCase())}`] = style.color;

         return vars;
      }
   },
   actions: {
      isBuiltin (id: string) {
         return builtinThemes.some(theme => theme.id === id);
      },
      /** Adds or replaces an installed theme. Built-in themes can't be replaced */
      installTheme (theme: AntaresTheme) {
         if (this.isBuiltin(theme.id)) throw new Error(`"${theme.id}" is the id of a built-in theme`);
         this.installed = [...this.installed.filter((t: AntaresTheme) => t.id !== theme.id), theme];
         saveInstalledThemes(this.installed);
      },
      removeTheme (id: string) {
         const removed = this.installed.find((theme: AntaresTheme) => theme.id === id);
         if (!removed) return;
         if (useSettingsStore().applicationTheme === id)
            useSettingsStore().changeApplicationTheme(removed.appearance);
         this.installed = this.installed.filter((theme: AntaresTheme) => theme.id !== id);
         saveInstalledThemes(this.installed);
      },
      /** Parses and validates a theme file content */
      parseThemeFile (content: string): ThemeImportResult {
         let raw: unknown;
         try {
            raw = JSON.parse(content);
         }
         catch (err) {
            return { status: 'error', errors: [`Invalid JSON: ${(err as Error).message}`] };
         }
         const { theme, errors, warnings } = validateTheme(raw);
         if (!theme) return { status: 'error', errors };
         if (this.isBuiltin(theme.id)) return { status: 'error', errors: [`"${theme.id}" is the id of a built-in theme: use another id`] };
         return { status: 'success', theme, warnings };
      },
      /** Lets the user pick a theme file, installs and activates it */
      async importThemeFromFile (): Promise<ThemeImportResult> {
         const result = await Application.showOpenDialog({
            properties: ['openFile'],
            filters: [{ name: 'Antares theme', extensions: ['json'] }]
         });
         if (result.canceled || !result.filePaths.length) return { status: 'canceled' };

         // read-file resolves with { status: 'error' } instead of rejecting
         const content: unknown = await Application.readFile({ filePath: result.filePaths[0], encoding: 'utf8' });
         if (typeof content !== 'string')
            return { status: 'error', errors: [String((content as { response?: string })?.response ?? 'Unable to read the file')] };

         const parsed = this.parseThemeFile(content);
         if (parsed.status === 'success') {
            this.installTheme(parsed.theme);
            useSettingsStore().changeApplicationTheme(parsed.theme.id);
         }
         return parsed;
      },
      /** Downloads the list of the gallery themes (only when the user opens the gallery) */
      async fetchGallery (): Promise<GalleryTheme[]> {
         const index = await (await fetchWithTimeout(new URL('index.json', themeGalleryUrl).href)).json();
         if (!Array.isArray(index?.themes)) throw new Error('Invalid gallery index');
         const url = (relative: string) => new URL(String(relative), themeGalleryUrl).href;
         return index.themes
            .filter((entry: GalleryTheme) => typeof entry?.id === 'string' && typeof entry?.name === 'string' && typeof entry?.theme === 'string')
            .map((entry: GalleryTheme) => ({
               id: entry.id,
               name: entry.name,
               appearance: entry.appearance === 'light' ? 'light' : 'dark',
               author: typeof entry.author === 'string' ? entry.author : undefined,
               description: typeof entry.description === 'string' ? entry.description : undefined,
               tags: Array.isArray(entry.tags) ? entry.tags.filter(tag => typeof tag === 'string') : [],
               theme: url(entry.theme),
               preview: entry.preview ? url(entry.preview) : ''
            }));
      },
      /** Downloads, validates, installs and activates a gallery theme */
      async installFromGallery (entry: GalleryTheme): Promise<ThemeImportResult> {
         let content: string;
         try {
            content = await (await fetchWithTimeout(entry.theme)).text();
         }
         catch (err) {
            return { status: 'error', errors: [(err as Error).message] };
         }
         const parsed = this.parseThemeFile(content);
         if (parsed.status === 'success') {
            this.installTheme(parsed.theme);
            useSettingsStore().changeApplicationTheme(parsed.theme.id);
         }
         return parsed;
      },
      /** Saves a theme as a JSON file (e.g. to share it or to start a new theme from it) */
      async exportTheme (id: string): Promise<boolean> {
         const theme = this.allThemes.find((t: AntaresTheme) => t.id === id);
         if (!theme) return false;
         const result = await Application.showSaveDialog({ defaultPath: `${theme.id}.json`, filters: [{ name: 'Antares theme', extensions: ['json'] }] });
         if (result.canceled || !result.filePath) return false;
         const content = { $schema: 'https://raw.githubusercontent.com/antares-sql/themes/main/schema/theme.schema.json', ...theme };
         const written = await Application.writeFile(result.filePath, JSON.stringify(content, null, 2));
         return written?.status !== 'error';
      }
   }
});
