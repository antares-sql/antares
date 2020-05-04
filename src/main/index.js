'use strict';

import { app, BrowserWindow } from 'electron';
import * as path from 'path';
import { format as formatUrl } from 'url';
import installExtension, { VUEJS_DEVTOOLS } from 'electron-devtools-installer';

const isDevelopment = process.env.NODE_ENV !== 'production';
process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = 'true';

// global reference to mainWindow (necessary to prevent window from being garbage collected)
let mainWindow;

function createMainWindow () {
   const window = new BrowserWindow({
      width: 1024,
      height: 800,
      icon: path.join(__static, 'logo-32.png'),
      webPreferences: {
         nodeIntegration: true,
         'web-security': false
      }
   });

   if (isDevelopment)
      window.loadURL(`http://localhost:${process.env.ELECTRON_WEBPACK_WDS_PORT}`);
   else {
      window.loadURL(formatUrl({
         pathname: path.join(__dirname, 'index.html'),
         protocol: 'file',
         slashes: true
      }));
   }

   if (isDevelopment) {
      window.webContents.openDevTools();

      installExtension(VUEJS_DEVTOOLS)
         .then(name => {
            console.log(name, 'installed');
         })
         .catch(err => {
            console.log(err);
         });
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

// quit application when all windows are closed
app.on('window-all-closed', () => {
   // on macOS it is common for applications to stay open until the user explicitly quits
   if (process.platform !== 'darwin')
      app.quit();
});

app.on('activate', () => {
   // on macOS it is common to re-create a window even after all windows have been closed
   if (mainWindow === null)
      mainWindow = createMainWindow();
});

// create main BrowserWindow when electron is ready
app.on('ready', () => {
   mainWindow = createMainWindow();
});
