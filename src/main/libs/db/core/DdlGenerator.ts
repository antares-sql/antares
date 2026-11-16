import * as antares from 'common/interfaces/antares';

/**
 * Base of the per-engine DDL generators: pure classes that build CREATE/ALTER/DROP statements
 * from UI parameters and return SQL. Executing it (and multi-step orchestration) is up to the client.
 */
export abstract class DdlGenerator {
   protected readonly _dataTypes: antares.TypesGroup[];

   constructor (dataTypes: antares.TypesGroup[]) {
      this._dataTypes = dataTypes;
   }

   /** Type definition from the engine catalog (common/data-types) */
   getTypeInfo (type: string): antares.TypeInformations {
      return this._dataTypes
         .reduce((acc, group) => [...acc, ...group.types], [])
         .filter(_type => _type.name === type.toUpperCase())[0];
   }
}
