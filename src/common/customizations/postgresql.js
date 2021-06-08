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
   routines: true,
   functions: true,
   // Settings
   tableAdd: true,
   viewAdd: true,
   triggerAdd: false,
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
   triggerMultipleEvents: true,
   triggerTableInName: true,
   triggerOnlyRename: true,
   languages: ['sql', 'plpgsql', 'c', 'internal']
};
