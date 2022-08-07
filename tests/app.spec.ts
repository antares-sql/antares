import { Page, _electron as electron } from 'playwright';
import { ElectronApplication } from 'playwright-core';
import { test, expect } from '@playwright/test';

let appWindow: Page;
let electronApp: ElectronApplication;

test.beforeAll(async () => {
   electronApp = await electron.launch({ args: ['dist/main.js'] });
   appWindow = await electronApp.firstWindow();
   await appWindow.waitForEvent('load');
});

test('launch app', async () => {
   const isPackaged = await electronApp.evaluate(async ({ app }) => {
      return app.isPackaged;
   });

   expect(isPackaged, 'expect is unpacked').toBe(false);
});

test('main window elements visibility', async () => {
   const visibleSelectors = [
      // '#titlebar',
      '#window-content',
      '#settingbar',
      '#footer'
   ];
   setTimeout(async () => {
      for (const selector of visibleSelectors)
         expect(await appWindow.isVisible(selector), `expect ${selector} visible`).toBe(true);
   }, 3000);
});

// test('SQLite connection', async () => {// FIXME: not working on GitHub Actions
//    await appWindow.selectOption('#connection-client', 'sqlite');// Select connection client
//    await appWindow.click('#connection-test');// Press test button
//    await new Promise(resolve => setTimeout(resolve, 50)); // Small toast wait
//    await appWindow.isVisible('.toast-primary');// If success toast
//    await appWindow.click('#connection-save');// Save connection
//    await appWindow.isVisible('.settingbar-top-elements .settingbar-element .dbi-sqlite');// If new connection in settingbar
//    await appWindow.click('#connection-connect');// Connect

//    // TODO: continue test chain
// });

test.afterAll(async () => {
   // await new Promise(resolve => setTimeout(resolve, 10000));
   await electronApp.close();
});
