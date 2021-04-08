import Tables from '@/ipc-api/Tables';

export default {
   computed: {
      schema () {
         return this.workspace.breadcrumbs.schema;
      }
   },
   methods: {
      async updateField (payload) {
         this.isQuering = true;

         const params = {
            uid: this.connection.uid,
            ...payload
         };

         try {
            const { status, response } = await Tables.updateTableCell(params);
            if (status === 'success') {
               if (response.reload)// Needed for blob fields
                  this.reloadTable();
               else
                  this.$refs.queryTable.applyUpdate(payload);
            }
            else
               this.addNotification({ status: 'error', message: response });
         }
         catch (err) {
            this.addNotification({ status: 'error', message: err.stack });
         }

         this.isQuering = false;
      },
      async deleteSelected (payload) {
         this.isQuering = true;

         const params = {
            uid: this.connection.uid,
            ...payload
         };

         try {
            const { status, response } = await Tables.deleteTableRows(params);
            this.isQuering = false;

            if (status === 'success')
               this.reloadTable();
            else
               this.addNotification({ status: 'error', message: response });
         }
         catch (err) {
            this.addNotification({ status: 'error', message: err.stack });
            this.isQuering = false;
         }
      }
   }
};
