const { _electron: electron } = require('playwright');
const { strict: assert } = require('assert');

const isWindows = process.platform === 'win32';
async function wait (ms) {
   return new Promise(resolve => {
      setTimeout(resolve, ms);
   });
}

(async () => {
   if (isWindows) {
      console.log('Termporary skipping tests on Windows');
      return;
   }

   console.log('Starting tests');
   // Launch Electron app.
   const electronApp = await electron.launch({ args: ['dist/main.js'] });

   if (isWindows) await wait(5000);

   /**
     * App main window state
     * @type {{isVisible: boolean; isDevToolsOpened: boolean; isCrashed: boolean}}
     */
   const windowState = await electronApp.evaluate(({ BrowserWindow }) => {
      const mainWindow = BrowserWindow.getAllWindows()[0];
      const getState = () => ({
         isVisible: mainWindow.isVisible(),
         isDevToolsOpened: mainWindow.webContents.isDevToolsOpened()
      });

      return new Promise((resolve) => {
         if (mainWindow.isVisible())
            resolve(getState());
         else
            mainWindow.once('ready-to-show', () => setTimeout(() => resolve(getState()), 0));
      });
   });

   // Check main window state
   assert.ok(windowState.isVisible, 'Main window not visible');
   assert.ok(!windowState.isDevToolsOpened, 'DevTools opened');
   assert.ok(!windowState.isCrashed, 'Window crashed');

   /**
     * Rendered Main window web-page
     * @type {Page}
     */
   const page = await electronApp.firstWindow();
   console.log(await page.title());

   // Check web-page content
   const element = await page.$('#wrapper', { strict: true });

   assert.notStrictEqual(element, null, 'Can\'t find root element');
   assert.notStrictEqual((await element.innerHTML()).trim(), '', 'Window content is empty');

   // Close app
   await electronApp.close();
   console.log('Tests finished');
})();
