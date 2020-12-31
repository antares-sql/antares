import { ipcMain } from 'electron';

export default (connections) => {
   ipcMain.handle('get-trigger-informations', async (event, params) => {
      try {
         const result = await connections[params.uid].getTriggerInformations(params);
         return { status: 'success', response: result };
      }
      catch (err) {
         return { status: 'error', response: err.toString() };
      }
   });

   ipcMain.handle('drop-trigger', async (event, params) => {
      try {
         await connections[params.uid].dropTrigger(params);
         return { status: 'success' };
      }
      catch (err) {
         return { status: 'error', response: err.toString() };
      }
   });

   ipcMain.handle('alter-trigger', async (event, params) => {
      try {
         await connections[params.uid].alterTrigger(params);
         return { status: 'success' };
      }
      catch (err) {
         return { status: 'error', response: err.toString() };
      }
   });

   ipcMain.handle('create-trigger', async (event, params) => {
      try {
         await connections[params.uid].createTrigger(params);
         return { status: 'success' };
      }
      catch (err) {
         return { status: 'error', response: err.toString() };
      }
   });
};
