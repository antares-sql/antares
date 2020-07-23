import Structure from '@/ipc-api/Structure';

export default {
   methods: {
      async updateField (payload) {
         const params = {
            uid: this.connection.uid,
            schema: this.workspace.breadcrumbs.schema,
            table: this.workspace.breadcrumbs.table,
            ...payload
         };

         try {
            const { status, response } = await Structure.updateTableCell(params);
            if (status === 'success')
               this.$refs.queryTable.applyUpdate(payload);
            else
               this.addNotification({ status: 'error', message: response });
         }
         catch (err) {
            this.addNotification({ status: 'error', message: err.stack });
         }
      },
      async deleteSelected (payload) {
         const params = {
            uid: this.connection.uid,
            schema: this.workspace.breadcrumbs.schema,
            table: this.workspace.breadcrumbs.table,
            ...payload
         };

         try {
            const { status, response } = await Structure.deleteTableRows(params);
            if (status === 'success') {
               const { primary, rows } = params;
               this.results = { ...this.results, rows: this.results.rows.filter(row => !rows.includes(row[primary])) };
               this.$refs.queryTable.refreshScroller();// Necessary to re-render virtual scroller
            }
            else
               this.addNotification({ status: 'error', message: response });
         }
         catch (err) {
            this.addNotification({ status: 'error', message: err.stack });
         }
      }
   }
};
