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
   functions: false,
   schedulers: false,
   // Settings
   tableAdd: true,
   viewAdd: true,
   triggerAdd: false,
   routineAdd: true,
   functionAdd: false,
   databaseEdit: false,
   tableSettings: true,
   viewSettings: true,
   triggerSettings: false,
   routineSettings: true,
   functionSettings: false,
   schedulerSettings: false,
   indexes: true,
   foreigns: true,
   sortableFields: false,
   nullable: true,
   tableArray: true,
   procedureSql: '$BODY$\r\n\r\n$BODY$'
};
