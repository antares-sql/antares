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
   triggers: false,
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
   triggerSettings: false,
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
   languages: ['sql', 'plpgsql', 'c', 'internal']
};
