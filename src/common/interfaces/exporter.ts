export interface TableParams {
   table: string;
   includeStructure: boolean;
   includeContent: boolean;
   includeDropStatement: boolean;
}

export interface ExportOptions {
   schema: string;
   tables: {
      table: string;
      includeStructure: boolean;
      includeContent: boolean;
      includeDropStatement: boolean;
   }[];
   includes: {[key: string]: boolean};
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
