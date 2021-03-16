const defaults = require('./defaults');

module.exports = {
   ...defaults,
   // Core
   collations: true,
   engines: true,
   // Tools
   processesList: true,
   // Structure
   schemas: true,
   tables: true,
   views: true,
   triggers: true,
   routines: true,
   functions: true,
   schedulers: true,
   // Settings
   tableAdd: true,
   viewAdd: true,
   triggerAdd: true,
   routineAdd: true,
   functionAdd: true,
   schedulerAdd: true,
   schemaEdit: true,
   tableSettings: true,
   viewSettings: true,
   triggerSettings: true,
   routineSettings: true,
   functionSettings: true,
   schedulerSettings: true,
   indexes: true,
   foreigns: true,
   sortableFields: true,
   zerofill: true
};
