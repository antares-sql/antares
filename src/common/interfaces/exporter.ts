export interface TableParams {
   table: string;
   includeStructure: boolean;
   includeContent: boolean;
   includeDropStatement: boolean;
}

export interface ExportOptions {
   schema: string;
   includes: {
      functions: boolean;
      views: boolean;
      triggers: boolean;
      routines: boolean;
      schedulers: boolean;
   };
   outputFormat: 'sql' | 'sql.zip';
   outputFile: string;
   sqlInsertAfter: number;
   sqlInsertDivider: 'bytes' | 'rows';
}

export interface ExportState {
   totalItems?: number;
   currentItemIndex?: number;
   currentItem?: string;
   op?: string;
}
