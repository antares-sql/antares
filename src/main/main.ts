import { app, BrowserWindow, /* session, */ nativeImage, Menu, ipcMain } from 'electron';
import * as path from 'path';
import * as Store from 'electron-store';
import * as windowStateKeeper from 'electron-window-state';
import * as remoteMain from '@electron/remote/main';

import ipcHandlers from './ipc-handlers';

Store.initRenderer();
const persistentStore = new Store({ name: 'settings' });

const appTheme = persistentStore.get('application_theme');
const isDevelopment = process.env.NODE_ENV !== 'production';
const isMacOS = process.platform === 'darwin';
const isLinux = process.platform === 'linux';
const isWindows = process.platform === 'win32';
const gotTheLock = app.requestSingleInstanceLock();

process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = 'true';

// global reference to mainWindow (necessary to prevent window from being garbage collected)
let mainWindow: BrowserWindow;
let mainWindowState: windowStateKeeper.State;

async function createMainWindow () {
   const icon = require('../renderer/images/logo-64.png');
   const window = new BrowserWindow({
      width: mainWindowState.width,
      height: mainWindowState.height,
      x: mainWindowState.x,
      y: mainWindowState.y,
      minWidth: 900,
      minHeight: 550,
      title: 'Antares SQL',
      icon: nativeImage.createFromDataURL(icon.default),
      webPreferences: {
         nodeIntegration: true,
         contextIsolation: false,
         spellcheck: false
      },
      autoHideMenuBar: true,
      titleBarStyle: isLinux ? 'default' :'hidden',
      titleBarOverlay: isWindows
         ? {
            color: appTheme === 'dark' ? '#3f3f3f' : '#fff',
            symbolColor: appTheme === 'dark' ? '#fff' : '#000',
            height: 30
         }
         : false,
      trafficLightPosition: isMacOS ? { x: 10, y: 8 } : undefined,
      backgroundColor: '#1d1d1d'
   });

   mainWindowState.manage(window);
   window.on('moved', saveWindowState);

   remoteMain.enable(window.webContents);

   try {
      if (isDevelopment)
         await window.loadURL('http://localhost:9080');
      else {
         const indexPath = path.resolve(__dirname, 'index.html');
         await window.loadFile(indexPath);
      }
   }
   catch (err) {
      console.log(err);
   }

   window.on('closed', () => {
      window.removeListener('moved', saveWindowState);
      mainWindow = null;
   });

   return window;
}

if (!gotTheLock) app.quit();
else {
   require('@electron/remote/main').initialize();

   // Initialize ipcHandlers
   ipcHandlers();

   ipcMain.on('refresh-theme-settings', () => {
      const appTheme = persistentStore.get('application_theme');
      mainWindow.setTitleBarOverlay({
         color: appTheme === 'dark' ? '#3f3f3f' : '#fff',
         symbolColor: appTheme === 'dark' ? '#fff' : '#000'
      });
   });

   // quit application when all windows are closed
   app.on('window-all-closed', () => {
      // on macOS it is common for applications to stay open until the user explicitly quits
      if (!isMacOS) app.quit();
   });

   app.on('activate', async () => {
      // on macOS it is common to re-create a window even after all windows have been closed
      if (mainWindow === null)
         mainWindow = await createMainWindow();
   });

   // create main BrowserWindow when electron is ready
   app.on('ready', async () => {
      mainWindowState = windowStateKeeper({
         defaultWidth: 1024,
         defaultHeight: 800
      });

      mainWindow = await createMainWindow();
      createAppMenu();

      if (isDevelopment)
         mainWindow.webContents.openDevTools();

      process.on('uncaughtException', error => {
         mainWindow.webContents.send('unhandled-exception', error);
      });

      process.on('unhandledRejection', error => {
         mainWindow.webContents.send('unhandled-exception', error);
      });
   });

   app.on('browser-window-created', (event, window) => {
      if (isDevelopment) {
         const { antares } = require('../../package.json');
         const extensionPath = path.resolve(__dirname, `../../misc/${antares.devtoolsId}`);
         window.webContents.session.loadExtension(extensionPath, { allowFileAccess: true }).catch(console.error);
      }
   });
}

function createAppMenu () {
   let menu: Electron.Menu = null;

   if (isMacOS) {
      menu = Menu.buildFromTemplate([
         {
            label: app.name,
            submenu: [
               { role: 'about' },
               { type: 'separator' },
               {
                  label: 'Check for Updates...',
                  click: (_menuItem, win) => win.webContents.send('open-updates-preferences')
               },
               {
                  label: 'Preferences',
                  click: (_menuItem, win) => win.webContents.send('toggle-preferences'),
                  accelerator: 'CmdOrCtrl+,'
               },
               { type: 'separator' },
               { role: 'hide' },
               { role: 'hideOthers' },
               { type: 'separator' },
               { role: 'quit' }
            ]
         },
         {
            role: 'editMenu'
         },
         {
            role: 'viewMenu'
         },
         {
            role: 'windowMenu'
         }
      ]);
   }

   Menu.setApplicationMenu(menu);
}

function saveWindowState () {
   mainWindowState.saveState(mainWindow);
}
