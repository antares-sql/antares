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
   routines: false,
   functions: false,
   schedulers: false,
   // Settings
   tableAdd: true,
   viewAdd: true,
   databaseEdit: false,
   tableSettings: true,
   viewSettings: true,
   triggerSettings: false,
   routineSettings: false,
   functionSettings: false,
   schedulerSettings: false,
   indexes: true,
   foreigns: true,
   sortableFields: false,
   nullable: true,
   arrays: true
};
