'use strict';

import { app, BrowserWindow, /* session, */ nativeImage, Menu } from 'electron';
import * as path from 'path';
import Store from 'electron-store';

import ipcHandlers from './ipc-handlers';

Store.initRenderer();

const isDevelopment = process.env.NODE_ENV !== 'production';
const gotTheLock = app.requestSingleInstanceLock();

process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = 'true';

// global reference to mainWindow (necessary to prevent window from being garbage collected)
let mainWindow;

async function createMainWindow () {
   const icon = require('../renderer/images/logo-32.png');
   const window = new BrowserWindow({
      width: 1024,
      height: 800,
      minWidth: 900,
      minHeight: 550,
      title: 'Antares',
      autoHideMenuBar: true,
      icon: nativeImage.createFromDataURL(icon.default),
      webPreferences: {
         nodeIntegration: true,
         contextIsolation: false,
         'web-security': false,
         enableRemoteModule: true,
         spellcheck: false
      },
      frame: false,
      backgroundColor: '#1d1d1d'
   });

   try {
      if (isDevelopment) { //
         await window.loadURL(`http://localhost:${process.env.ELECTRON_WEBPACK_WDS_PORT}`);

         // const { default: installExtension, VUEJS3_DEVTOOLS } = require('electron-devtools-installer');

         // const oldDevToolsID = session.defaultSession.getAllExtensions().find(ext => ext.name === 'Vue.js devtools').id;
         // session.defaultSession.removeExtension(oldDevToolsID);
         // const toolName = await installExtension(VUEJS3_DEVTOOLS);
         // console.log(toolName, 'installed');
      }
      else
         await window.loadURL(new URL(`file:///${path.join(__dirname, 'index.html')}`).href);
   }
   catch (err) {
      console.log(err);
   }

   window.on('closed', () => {
      mainWindow = null;
   });

   window.webContents.on('devtools-opened', () => {
      window.focus();
      setImmediate(() => {
         window.focus();
      });
   });

   return window;
};

if (!gotTheLock)
   app.quit();
else {
   require('@electron/remote/main').initialize();

   // Initialize ipcHandlers
   ipcHandlers();

   // quit application when all windows are closed
   app.on('window-all-closed', () => {
      // on macOS it is common for applications to stay open until the user explicitly quits
      if (process.platform !== 'darwin')
         app.quit();
   });

   app.on('activate', async () => {
      // on macOS it is common to re-create a window even after all windows have been closed
      if (mainWindow === null) {
         mainWindow = await createMainWindow();
         if (isDevelopment)
            mainWindow.webContents.openDevTools();
      }
   });

   // create main BrowserWindow when electron is ready
   app.on('ready', async () => {
      mainWindow = await createMainWindow();
      Menu.setApplicationMenu(null);
      if (isDevelopment)
         mainWindow.webContents.openDevTools();
   });
}
