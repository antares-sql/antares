const defaults = require('./defaults');

module.exports = {
   ...defaults,
   // Core
   collations: false,
   engines: false,
   // Tools
   processesList: true,
   // Structure
   tables: true,
   views: true,
   triggers: true,
   routines: true,
   functions: true,
   schedulers: false,
   // Settings
   databaseEdit: false,
   tableSettings: false,
   viewSettings: false,
   triggerSettings: false,
   routineSettings: false,
   functionSettings: false,
   schedulerSettings: false,
   indexes: true,
   foreigns: true,
   sortableFields: false
};
