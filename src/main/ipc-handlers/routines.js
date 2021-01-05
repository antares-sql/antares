import { ipcMain } from 'electron';

export default (connections) => {
   ipcMain.handle('get-routine-informations', async (event, params) => {
      try {
         const result = await connections[params.uid].getRoutineInformations(params);
         return { status: 'success', response: result };
      }
      catch (err) {
         return { status: 'error', response: err.toString() };
      }
   });

   ipcMain.handle('drop-routine', async (event, params) => {
      try {
         await connections[params.uid].dropRoutine(params);
         return { status: 'success' };
      }
      catch (err) {
         return { status: 'error', response: err.toString() };
      }
   });

   ipcMain.handle('alter-routine', async (event, params) => {
      try {
         await connections[params.uid].alterRoutine(params);
         return { status: 'success' };
      }
      catch (err) {
         return { status: 'error', response: err.toString() };
      }
   });

   ipcMain.handle('create-routine', async (event, params) => {
      try {
         await connections[params.uid].createRoutine(params);
         return { status: 'success' };
      }
      catch (err) {
         return { status: 'error', response: err.toString() };
      }
   });
};
