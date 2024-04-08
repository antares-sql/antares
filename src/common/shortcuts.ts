export const shortcutEvents: Record<string, { l18n: string; l18nParam?: string | number; context?: 'tab' }> = {
   'run-or-reload': { l18n: 'application.runOrReload', context: 'tab' },
   'open-new-tab': { l18n: 'application.openNewTab', context: 'tab' },
   'close-tab': { l18n: 'application.closeTab', context: 'tab' },
   'format-query': { l18n: 'database.formatQuery', context: 'tab' },
   'kill-query': { l18n: 'database.killQuery', context: 'tab' },
   'query-history': { l18n: 'database.queryHistory', context: 'tab' },
   'clear-query': { l18n: 'database.clearQuery', context: 'tab' },
   // 'save-file': { l18n: 'application.saveFile', context: 'tab' },
   'open-file': { l18n: 'application.openFile', context: 'tab' },
   'save-file-as': { l18n: 'application.saveFileAs', context: 'tab' },
   'next-tab': { l18n: 'application.nextTab' },
   'prev-tab': { l18n: 'application.previousTab' },
   'open-all-connections': { l18n: 'application.openAllConnections' },
   'open-filter': { l18n: 'application.openFilter' },
   'next-page': { l18n: 'application.nextResultsPage' },
   'prev-page': { l18n: 'application.previousResultsPage' },
   'toggle-console': { l18n: 'application.toggleConsole' },
   'save-content': { l18n: 'application.saveContent' },
   'create-connection': { l18n: 'connection.createNewConnection' },
   'open-settings': { l18n: 'application.openSettings' },
   'open-scratchpad': { l18n: 'application.openNotes' }
};

interface ShortcutRecord {
   event: string;
   keys: Electron.Accelerator[] | string[];
   /** Needed for default shortcuts */
   os: NodeJS.Platform[];
}

/**
 * Default shortcuts
 */
const shortcuts: ShortcutRecord[] = [
   {
      event: 'run-or-reload',
      keys: ['F5'],
      os: ['darwin', 'linux', 'win32']
   },
   {
      event: 'save-content',
      keys: ['CommandOrControl+S'],
      os: ['darwin', 'linux', 'win32']
   },
   {
      event: 'kill-query',
      keys: ['CommandOrControl+K'],
      os: ['darwin', 'linux', 'win32']
   },
   {
      event: 'format-query',
      keys: ['CommandOrControl+B'],
      os: ['darwin', 'linux', 'win32']
   },
   {
      event: 'clear-query',
      keys: ['CommandOrControl+Alt+W'],
      os: ['darwin', 'linux', 'win32']
   },
   {
      event: 'query-history',
      keys: ['CommandOrControl+G'],
      os: ['darwin', 'linux', 'win32']
   },
   {
      event: 'open-new-tab',
      keys: ['CommandOrControl+T'],
      os: ['darwin', 'linux', 'win32']
   },
   {
      event: 'close-tab',
      keys: ['CommandOrControl+W'],
      os: ['darwin', 'linux', 'win32']
   },
   {
      event: 'next-tab',
      keys: ['Alt+CommandOrControl+Right'],
      os: ['darwin', 'win32']
   },
   {
      event: 'prev-tab',
      keys: ['Alt+CommandOrControl+Left'],
      os: ['darwin', 'win32']
   },
   {
      event: 'next-tab',
      keys: ['CommandOrControl+PageDown'],
      os: ['linux', 'win32']
   },
   {
      event: 'prev-tab',
      keys: ['CommandOrControl+PageUp'],
      os: ['linux', 'win32']
   },
   {
      event: 'open-filter',
      keys: ['CommandOrControl+F'],
      os: ['darwin', 'linux', 'win32']
   },
   {
      event: 'next-page',
      keys: ['CommandOrControl+Right'],
      os: ['darwin', 'linux', 'win32']
   },
   {
      event: 'prev-page',
      keys: ['CommandOrControl+Left'],
      os: ['darwin', 'linux', 'win32']
   },
   {
      event: 'open-all-connections',
      keys: ['Shift+CommandOrControl+Space'],
      os: ['darwin', 'linux', 'win32']
   },
   {
      event: 'toggle-console',
      keys: ['CommandOrControl+F12'],
      os: ['darwin', 'linux', 'win32']
   },
   {
      event: 'toggle-console',
      keys: ['CommandOrControl+`'],
      os: ['darwin', 'linux', 'win32']
   },
   // {
   //    event: 'save-file',
   //    keys: ['CommandOrControl+S'],
   //    os: ['darwin', 'linux', 'win32']
   // },
   {
      event: 'open-file',
      keys: ['CommandOrControl+O'],
      os: ['darwin', 'linux', 'win32']
   },
   {
      event: 'save-file-as',
      keys: ['Shift+CommandOrControl+S'],
      os: ['darwin', 'linux', 'win32']
   }
];

for (let i = 1; i <= 9; i++) {
   shortcutEvents[`select-tab-${i}`] = {
      l18n: 'application.selectTabNumber',
      l18nParam: i
   };

   shortcuts.push({
      event: `select-tab-${i}`,
      keys: [`CommandOrControl+${i}`],
      os: ['darwin', 'linux', 'win32']
   });
}

export { ShortcutRecord, shortcuts };
