// TODO: unfinished
import Tables from '@/ipc-api/Tables';
import { ref } from 'vue';

export default function useResultTables (uid, reloadTable, addNotification) {
   const tableRef = ref(null);
   const isQuering = ref(false);

   async function updateField (payload) {
      isQuering.value = true;

      const params = {
         uid: uid,
         ...payload
      };

      try {
         const { status, response } = await Tables.updateTableCell(params);
         if (status === 'success') {
            if (response.reload)// Needed for blob fields
               reloadTable();
            else
               tableRef.applyUpdate(payload);
         }
         else
            addNotification({ status: 'error', message: response });
      }
      catch (err) {
         addNotification({ status: 'error', message: err.stack });
      }

      isQuering.value = false;
   }

   async function deleteSelected (payload) {
      isQuering.value = true;

      const params = {
         uid: uid,
         ...payload
      };

      try {
         const { status, response } = await Tables.deleteTableRows(params);
         isQuering.value = false;

         if (status === 'success')
            reloadTable();
         else
            this.addNotification({ status: 'error', message: response });
      }
      catch (err) {
         this.addNotification({ status: 'error', message: err.stack });
         isQuering.value = false;
      }
   }

   return {
      tableRef,
      isQuering,
      updateField,
      deleteSelected
   };
}
