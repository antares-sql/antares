import { ipcMain } from 'electron';

export default (connections) => {
   ipcMain.handle('get-view-informations', async (event, params) => {
      try {
         const result = await connections[params.uid].getViewInformations(params);
         return { status: 'success', response: result };
      }
      catch (err) {
         return { status: 'error', response: err.toString() };
      }
   });

   ipcMain.handle('drop-view', async (event, params) => {
      try {
         await connections[params.uid].dropView(params);
         return { status: 'success' };
      }
      catch (err) {
         return { status: 'error', response: err.toString() };
      }
   });

   ipcMain.handle('alter-view', async (event, params) => {
      try {
         await connections[params.uid].alterView(params);
         return { status: 'success' };
      }
      catch (err) {
         return { status: 'error', response: err.toString() };
      }
   });

   ipcMain.handle('create-view', async (event, params) => {
      try {
         await connections[params.uid].createView(params);
         return { status: 'success' };
      }
      catch (err) {
         return { status: 'error', response: err.toString() };
      }
   });
};
