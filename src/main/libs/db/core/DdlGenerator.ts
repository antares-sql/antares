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

   /**
    * Type definition from the engine catalog (common/data-types). Types missing from it
    * (enums, domains, extension types...) get no length/scale/collation/unsigned/zerofill options.
    */
   getTypeInfo (type: string): antares.TypeInformations {
      const name = type.toUpperCase();
      const info = this._dataTypes
         .reduce((acc, group) => [...acc, ...group.types], [] as antares.TypeInformations[])
         .find(_type => _type.name === name);

      return info || { name, length: false, scale: false, collation: false, unsigned: false, zerofill: false };
   }
}
