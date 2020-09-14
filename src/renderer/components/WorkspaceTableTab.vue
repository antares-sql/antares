<template>
   <div class="workspace-query-tab column col-12 columns col-gapless">
      <div class="workspace-query-runner column col-12">
         <div class="workspace-query-runner-footer">
            <div class="workspace-query-buttons">
               <button
                  class="btn btn-link btn-sm"
                  :class="{'loading':isQuering}"
                  @click="reloadTable"
               >
                  <span>{{ $t('word.refresh') }}</span>
                  <i class="mdi mdi-24px mdi-refresh ml-1" />
               </button>
               <button
                  class="btn btn-link btn-sm"
                  :class="{'disabled':isQuering}"
                  @click="showAddModal"
               >
                  <span>{{ $t('word.add') }}</span>
                  <i class="mdi mdi-24px mdi-playlist-plus ml-1" />
               </button>
            </div>
            <div class="workspace-query-info">
               <div v-if="results.rows">
                  {{ $t('word.results') }}: <b>{{ results.rows.length }}</b>
               </div>
               <div v-if="workspace.breadcrumbs.database">
                  {{ $t('word.schema') }}: <b>{{ workspace.breadcrumbs.database }}</b>
               </div>
            </div>
         </div>
      </div>
      <div class="workspace-query-results column col-12">
         <WorkspaceQueryTable
            v-if="results"
            v-show="!isQuering"
            ref="queryTable"
            :results="results"
            :tab-uid="tabUid"
            @update-field="updateField"
            @delete-selected="deleteSelected"
         />
      </div>
      <ModalNewTableRow
         v-if="isAddModal"
         :tab-uid="tabUid"
         @hide="hideAddModal"
         @reload="reloadTable"
      />
   </div>
</template>

<script>
import Tables from '@/ipc-api/Tables';
import WorkspaceQueryTable from '@/components/WorkspaceQueryTable';
import ModalNewTableRow from '@/components/ModalNewTableRow';
import { mapGetters, mapActions } from 'vuex';
import tableTabs from '@/mixins/tableTabs';

export default {
   name: 'WorkspaceTableTab',
   components: {
      WorkspaceQueryTable,
      ModalNewTableRow
   },
   mixins: [tableTabs],
   props: {
      connection: Object,
      table: String
   },
   data () {
      return {
         tabUid: 'data',
         isQuering: false,
         results: [],
         fields: [],
         keyUsage: [],
         lastTable: null,
         isAddModal: false
      };
   },
   computed: {
      ...mapGetters({
         getWorkspace: 'workspaces/getWorkspace'
      }),
      workspace () {
         return this.getWorkspace(this.connection.uid);
      },
      isSelected () {
         return this.workspace.selected_tab === 'data';
      }
   },
   watch: {
      table () {
         if (this.isSelected) {
            this.getTableData();
            this.lastTable = this.table;
         }
      },
      isSelected (val) {
         if (val && this.lastTable !== this.table) {
            this.getTableData();
            this.lastTable = this.table;
         }
      }
   },
   created () {
      this.getTableData();
   },
   methods: {
      ...mapActions({
         addNotification: 'notifications/addNotification',
         setTabFields: 'workspaces/setTabFields',
         setTabKeyUsage: 'workspaces/setTabKeyUsage'
      }),
      async getTableData () {
         if (!this.table) return;
         this.isQuering = true;
         this.results = [];
         const fieldsArr = [];
         const keysArr = [];
         this.setTabFields({ cUid: this.connection.uid, tUid: this.tabUid, fields: [] });

         const params = {
            uid: this.connection.uid,
            schema: this.schema,
            table: this.workspace.breadcrumbs.table
         };

         try { // Columns data
            const { status, response } = await Tables.getTableColumns(params);
            if (status === 'success') {
               this.fields = response;// Needed to add new rows
               fieldsArr.push(response);
            }
            else
               this.addNotification({ status: 'error', message: response });
         }
         catch (err) {
            this.addNotification({ status: 'error', message: err.stack });
         }

         try { // Table data
            const { status, response } = await Tables.getTableData(params);

            if (status === 'success')
               this.results = [response];
            else
               this.addNotification({ status: 'error', message: response });
         }
         catch (err) {
            this.addNotification({ status: 'error', message: err.stack });
         }

         try { // Key usage (foreign keys)
            const { status, response } = await Tables.getKeyUsage(params);
            if (status === 'success') {
               this.keyUsage = response;// Needed to add new rows
               keysArr.push(response);
            }
            else
               this.addNotification({ status: 'error', message: response });
         }
         catch (err) {
            this.addNotification({ status: 'error', message: err.stack });
         }

         this.setTabFields({ cUid: this.connection.uid, tUid: this.tabUid, fields: fieldsArr });
         this.setTabKeyUsage({ cUid: this.connection.uid, tUid: this.tabUid, keyUsage: keysArr });
         this.isQuering = false;
      },
      getTable () {
         return this.table;
      },
      reloadTable () {
         this.getTableData();
      },
      showAddModal () {
         this.isAddModal = true;
      },
      hideAddModal () {
         this.isAddModal = false;
      }
   }
};
</script>

<style lang="scss">
.workspace-tabs {
  align-content: baseline;

  .workspace-query-runner {
    .workspace-query-runner-footer {
      display: flex;
      justify-content: space-between;
      padding: 0.3rem 0.6rem 0.4rem;
      align-items: center;

      .workspace-query-buttons {
        display: flex;

        .btn {
          display: flex;
          align-self: center;
          color: $body-font-color;
          margin-right: 0.4rem;
        }
      }

      .workspace-query-info {
        display: flex;

        > div + div {
          padding-left: 0.6rem;
        }
      }
    }
  }
}

</style>
