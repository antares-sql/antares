import * as antares from './antares';

export interface ImportOptions {
   uid: string;
   schema: string;
   type: antares.ClientCode;
   file: string;
}

export interface ImportState {
   fileSize?: number;
   readPosition?: number;
   percentage?: number;
   queryCount?: number;
   op?: string;
}
