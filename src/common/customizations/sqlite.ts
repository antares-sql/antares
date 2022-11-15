import { Customizations } from '../interfaces/customizations';
import { defaults } from './defaults';
import sqliteTypes from '../data-types/sqlite';

export const customizations: Customizations = {
   ...defaults,
   dataTypes: sqliteTypes,
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
   fileConnection: true,
   // Structure
   schemas: false,
   tables: true,
   views: true,
   triggers: true,
   // Settings
   elementsWrapper: '"',
   stringsWrapper: '\'',
   tableAdd: true,
   viewAdd: true,
   triggerAdd: true,
   schemaEdit: false,
   tableSettings: true,
   tableRealCount: true,
   viewSettings: true,
   triggerSettings: true,
   indexes: true,
   foreigns: true,
   sortableFields: true,
   nullable: true,
   nullablePrimary: true,
   triggerSql: 'BEGIN\r\n\r\nEND',
   readOnlyMode: true
};
