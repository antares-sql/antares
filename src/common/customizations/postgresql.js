const defaults = require('./defaults');

module.exports = {
   ...defaults,
   // Defaults
   defaultPort: 5432,
   defaultUser: 'postgres',
   defaultDatabase: 'postgres',
   // Core
   database: true,
   // Tools
   processesList: true,
   // Structure
   tables: true,
   views: true,
   triggers: true,
   triggerFunctions: true,
   routines: true,
   functions: true,
   // Settings
   tableAdd: true,
   viewAdd: true,
   triggerAdd: true,
   routineAdd: true,
   functionAdd: true,
   databaseEdit: false,
   tableSettings: true,
   viewSettings: true,
   triggerSettings: true,
   routineSettings: true,
   functionSettings: true,
   indexes: true,
   foreigns: true,
   nullable: true,
   tableArray: true,
   procedureSql: '$BODY$\r\n\r\n$BODY$',
   procedureContext: true,
   procedureLanguage: true,
   functionSql: '$BODY$\r\n\r\n$BODY$',
   functionContext: true,
   functionLanguage: true,
   triggerSql: 'EXECUTE PROCEDURE ',
   triggerStatementInCreation: true,
   triggerMultipleEvents: true,
   triggerTableInName: true,
   triggerOnlyRename: false,
   languages: ['sql', 'plpgsql', 'c', 'internal']
};
