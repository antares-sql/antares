'use strict';

import { app, BrowserWindow, /* session, */ nativeImage, Menu } from 'electron';
import * as path from 'path';
import Store from 'electron-store';
import * as remoteMain from '@electron/remote/main';

import ipcHandlers from './ipc-handlers';

// remoteMain.initialize();
Store.initRenderer();

const isDevelopment = process.env.NODE_ENV !== 'production';
const isMacOS = process.platform === 'darwin';
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
         spellcheck: false
      },
      frame: false,
      titleBarStyle: isMacOS ? 'hidden' : 'default',
      trafficLightPosition: isMacOS ? { x: 10, y: 8 } : undefined,
      backgroundColor: '#1d1d1d'
   });

   remoteMain.enable(window.webContents);

   try {
      if (isDevelopment) {
         const { default: installExtension, VUEJS_DEVTOOLS } = require('electron-devtools-installer');
         const options = {
            loadExtensionOptions: { allowFileAccess: true }
         };

         installExtension(VUEJS_DEVTOOLS, options)
            .then((name) => {
               console.log(`Added Extension: ${name}`);
               mainWindow.webContents.openDevTools();
            })
            .catch((err) => console.log('An error occurred: ', err));

         await window.loadURL('http://localhost:9080');
      }
      else {
         const indexPath = path.resolve(__dirname, 'index.html');
         await window.loadFile(indexPath);
      }
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
}

if (!gotTheLock) app.quit();
else {
   require('@electron/remote/main').initialize();

   // Initialize ipcHandlers
   ipcHandlers();

   // quit application when all windows are closed
   app.on('window-all-closed', () => {
      // on macOS it is common for applications to stay open until the user explicitly quits
      if (isMacOS) app.quit();
   });

   app.on('activate', async () => {
      // on macOS it is common to re-create a window even after all windows have been closed
      if (mainWindow === null)
         mainWindow = await createMainWindow();
   });

   // create main BrowserWindow when electron is ready
   app.on('ready', async () => {
      mainWindow = await createMainWindow();
      createAppMenu();

      process.on('uncaughtException', (error) => {
         mainWindow.webContents.send('unhandled-exception', error);
      });

      process.on('unhandledRejection', (error) => {
         mainWindow.webContents.send('unhandled-exception', error);
      });
   });
}

function createAppMenu () {
   let menu = null;

   if (isMacOS) {
      menu = Menu.buildFromTemplate([
         {
            role: 'appMenu'
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
