import { ipcMain } from 'electron';

export default (connections) => {
   ipcMain.handle('get-scheduler-informations', async (event, params) => {
      try {
         const result = await connections[params.uid].getEventInformations(params);
         return { status: 'success', response: result };
      }
      catch (err) {
         return { status: 'error', response: err.toString() };
      }
   });

   ipcMain.handle('drop-scheduler', async (event, params) => {
      try {
         await connections[params.uid].dropEvent(params);
         return { status: 'success' };
      }
      catch (err) {
         return { status: 'error', response: err.toString() };
      }
   });

   ipcMain.handle('alter-scheduler', async (event, params) => {
      try {
         await connections[params.uid].alterEvent(params);
         return { status: 'success' };
      }
      catch (err) {
         return { status: 'error', response: err.toString() };
      }
   });

   ipcMain.handle('create-scheduler', async (event, params) => {
      try {
         await connections[params.uid].createEvent(params);
         return { status: 'success' };
      }
      catch (err) {
         return { status: 'error', response: err.toString() };
      }
   });
};
