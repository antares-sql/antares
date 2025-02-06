import { TableDeleteParams, TableUpdateParams } from 'common/interfaces/tableApis';
import { Component, Ref, ref } from 'vue';

import Tables from '@/ipc-api/Tables';
import { useNotificationsStore } from '@/stores/notifications';
const { addNotification } = useNotificationsStore();

export function useResultTables (uid: string, reloadTable: () => void) {
   const queryTable: Ref<Component & {
      resetSort: () => void;
      resizeResults: () => void;
      refreshScroller: () => void;
      downloadTable: (format: string, fileName: string) => void;
      applyUpdate: (payload: TableUpdateParams) => void;
   }> = ref(null);
   const isQuering = ref(false);

   async function updateField (payload: TableUpdateParams) {
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
               queryTable.value.applyUpdate(payload);
         }
         else
            addNotification({ status: 'error', message: response });
      }
      catch (err) {
         addNotification({ status: 'error', message: err.stack });
      }

      isQuering.value = false;
   }

   async function deleteSelected (payload: TableDeleteParams) {
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
            addNotification({ status: 'error', message: response });
      }
      catch (err) {
         addNotification({ status: 'error', message: err.stack });
         isQuering.value = false;
      }
   }

   return {
      queryTable,
      isQuering,
      updateField,
      deleteSelected
   };
}
