import postgresqlTypes from '../data-types/postgresql';
import { Customizations } from '../interfaces/customizations';
import { defaults } from './defaults';

export const customizations: Customizations = {
   ...defaults,
   // Defaults
   defaultPort: 5432,
   defaultUser: 'postgres',
   defaultDatabase: 'postgres',
   dataTypes: postgresqlTypes,
   indexTypes: [
      'PRIMARY',
      'INDEX',
      'UNIQUE'
   ],
   foreignActions: [
      'RESTRICT',
      'CASCADE',
      'SET NULL',
      'NO ACTION'
   ],
   // Core
   database: true,
   sslConnection: true,
   sshConnection: true,
   cancelQueries: true,
   // Tools
   processesList: true,
   // Structure
   schemas: true,
   tables: true,
   views: true,
   materializedViews: true,
   triggers: true,
   triggerFunctions: true,
   routines: true,
   functions: true,
   // Misc
   elementsWrapper: '"',
   stringsWrapper: '\'',
   tableAdd: true,
   tableDuplicate: true,
   tableDdl: true,
   viewAdd: true,
   materializedViewAdd: true,
   triggerAdd: true,
   triggerFunctionAdd: true,
   routineAdd: true,
   functionAdd: true,
   schemaDrop: true,
   schemaExport: true,
   schemaImport: true,
   databaseEdit: false,
   tableSettings: true,
   viewSettings: true,
   materializedViewSettings: true,
   triggerSettings: true,
   triggerFunctionSettings: true,
   routineSettings: true,
   functionSettings: true,
   indexes: true,
   foreigns: true,
   nullable: true,
   tableArray: true,
   procedureSql: '$procedure$\r\n\r\n$procedure$',
   procedureContext: true,
   procedureContextValues: ['IN', 'OUT', 'INOUT'],
   procedureLanguage: true,
   functionSql: '$function$\r\n\r\n$function$',
   triggerFunctionSql: '$function$\r\nBEGIN\r\n\r\nEND\r\n$function$',
   triggerFunctionlanguages: ['plpgsql'],
   functionContext: true,
   functionLanguage: true,
   triggerSql: 'EXECUTE PROCEDURE ',
   triggerStatementInCreation: true,
   triggerMultipleEvents: true,
   triggerTableInName: true,
   triggerOnlyRename: false,
   triggerEnableDisable: true,
   languages: ['sql', 'plpgsql', 'c', 'internal'],
   readOnlyMode: true
};
