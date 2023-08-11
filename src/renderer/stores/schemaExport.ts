import { defineStore } from 'pinia';

export const useSchemaExportStore = defineStore('schemaExport', {
   state: () => ({
      isExportModal: false,
      selectedTable: undefined as undefined | string,
      selectedSchema: undefined as undefined | string
   }),
   actions: {
      showExportModal (schema?: string, table?: string) {
         this.selectedTable = table;
         this.selectedSchema = schema;
         this.isExportModal = true;
      },
      hideExportModal () {
         this.isExportModal = false;
         this.selectedTable = undefined;
         this.selectedSchema = undefined;
      }
   }
});
