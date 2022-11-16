import { Customizations } from '../interfaces/customizations';
import { defaults } from './defaults';
import firebirdTypes from '../data-types/firebird';

export const customizations: Customizations = {
   ...defaults,
   // Defaults
   defaultPort: 3050,
   defaultUser: 'SYSDBA',
   defaultDatabase: null,
   dataTypes: firebirdTypes,
   indexTypes: [
      'PRIMARY',
      // 'CHECK',
      'UNIQUE'
   ],
   foreignActions: [
      'RESTRICT',
      'NO ACTION',
      'CASCADE',
      'SET NULL',
      'SET DEFAULT'
   ],
   // Core
   database: true,
   collations: false,
   engines: false,
   connectionSchema: false,
   sslConnection: false,
   sshConnection: false,
   fileConnection: false,
   cancelQueries: false,
   // Tools
   processesList: false,
   usersManagement: false,
   variables: false,
   // Structure
   schemas: false,
   tables: true,
   views: true,
   triggers: true,
   routines: false,
   functions: false,
   // Settings
   elementsWrapper: '"',
   stringsWrapper: '\'',
   tableAdd: true,
   tableSettings: true,
   indexes: true,
   foreigns: true,
   nullable: true
};
