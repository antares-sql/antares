export type LoggerLevel = 'query' | 'error'

export const ipcLogger = ({ content, cUid, level }: {content: string; cUid: string; level: LoggerLevel}) => {
   if (level === 'error') {
      if (process.type !== undefined) {
         const mainWindow = require('electron').webContents.fromId(1);
         mainWindow.send('non-blocking-exception', { cUid, message: content, date: new Date() });
      }
      if (process.env.NODE_ENV === 'development' && process.type === 'browser') console.log(content);
   }
   else if (level === 'query') {
      // Remove comments, newlines and multiple spaces
      const escapedSql = content.replace(/(\/\*(.|[\r\n])*?\*\/)|(--(.*|[\r\n]))/gm, '').replace(/\s\s+/g, ' ');
      if (process.type !== undefined) {
         const mainWindow = require('electron').webContents.fromId(1);
         mainWindow.send('query-log', { cUid, sql: escapedSql, date: new Date() });
      }
      if (process.env.NODE_ENV === 'development' && process.type === 'browser') console.log(escapedSql);
   }
};