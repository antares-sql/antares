export const shortcutEvents: Record<string, { i18n: string; i18nParam?: string | number; context?: 'tab' | 'main' }> = {
   'run-or-reload': { i18n: 'application.runOrReload', context: 'tab' },
   'open-new-tab': { i18n: 'application.openNewTab', context: 'tab' },
   'close-tab': { i18n: 'application.closeTab', context: 'tab' },
   'format-query': { i18n: 'database.formatQuery', context: 'tab' },
   'kill-query': { i18n: 'database.killQuery', context: 'tab' },
   'query-history': { i18n: 'database.queryHistory', context: 'tab' },
   'clear-query': { i18n: 'database.clearQuery', context: 'tab' },
   // 'save-file': { i18n: 'application.saveFile', context: 'tab' },
   'open-file': { i18n: 'application.openFile', context: 'tab' },
   'save-file-as': { i18n: 'application.saveFileAs', context: 'tab' },
   'next-tab': { i18n: 'application.nextTab' },
   'prev-tab': { i18n: 'application.previousTab' },
   'open-all-connections': { i18n: 'application.openAllConnections' },
   'open-filter': { i18n: 'application.openFilter' },
   'next-page': { i18n: 'application.nextResultsPage' },
   'prev-page': { i18n: 'application.previousResultsPage' },
   'toggle-console': { i18n: 'application.toggleConsole' },
   'save-content': { i18n: 'application.saveContent' },
   'create-connection': { i18n: 'connection.createNewConnection' },
   'open-settings': { i18n: 'application.openSettings' },
   'open-scratchpad': { i18n: 'application.openNotes' },
   setFullScreen: { i18n: 'application.fullScreen', context: 'main' },
   setZoomIn: { i18n: 'application.zoomIn', context: 'main' },
   setZoomOut: { i18n: 'application.zoomOut', context: 'main' },
   setZoomReset: { i18n: 'application.zoomReset', context: 'main' }
};

interface ShortcutRecord {
   event: string;
   isFunction?: boolean;
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
      event: 'setFullScreen',
      isFunction: true,
      keys: ['F11'],
      os: ['darwin', 'linux', 'win32']
   },
   {
      event: 'setZoomIn',
      isFunction: true,
      keys: ['CommandOrControl+='],
      os: ['darwin', 'linux', 'win32']
   },
   {
      event: 'setZoomOut',
      isFunction: true,
      keys: ['CommandOrControl+-'],
      os: ['darwin', 'linux', 'win32']
   },
   {
      event: 'setZoomReset',
      isFunction: true,
      keys: ['CommandOrControl+0'],
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
      i18n: 'application.selectTabNumber',
      i18nParam: i
   };

   shortcuts.push({
      event: `select-tab-${i}`,
      keys: [`CommandOrControl+${i}`],
      os: ['darwin', 'linux', 'win32']
   });
}

export { ShortcutRecord, shortcuts };
