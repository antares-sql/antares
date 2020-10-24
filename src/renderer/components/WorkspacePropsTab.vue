<template>
   <div class="workspace-query-tab column col-12 columns col-gapless">
      <div class="workspace-query-runner column col-12">
         <div class="workspace-query-runner-footer">
            <div class="workspace-query-buttons">
               <button
                  class="btn btn-primary btn-sm"
               >
                  <span>{{ $t('word.save') }}</span>
                  <i class="mdi mdi-24px mdi-content-save ml-1" />
               </button>
               <button
                  class="btn btn-link btn-sm mr-0"
                  :title="$t('message.clearChanges')"
               >
                  <span>{{ $t('word.clear') }}</span>
                  <i class="mdi mdi-24px mdi-delete-sweep ml-1" />
               </button>

               <div class="divider-vert py-3" />

               <button
                  class="btn btn-dark btn-sm"
                  :title="$t('message.addNewField')"
               >
                  <span>{{ $t('word.add') }}</span>
                  <i class="mdi mdi-24px mdi-playlist-plus ml-1" />
               </button>
               <button
                  class="btn btn-dark btn-sm"
               >
                  <span>{{ $t('word.indexes') }}</span>
                  <i class="mdi mdi-24px mdi-key mdi-rotate-45 ml-1" />
               </button>
               <button
                  class="btn btn-dark btn-sm"
               >
                  <span>{{ $t('word.foreignKeys') }}</span>
                  <i class="mdi mdi-24px mdi-key-link ml-1" />
               </button>
               <button
                  class="btn btn-dark btn-sm"
               >
                  <span>{{ $t('word.options') }}</span>
                  <i class="mdi mdi-24px mdi-cogs ml-1" />
               </button>
            </div>
         </div>
      </div>
      <div class="workspace-query-results column col-12">
         <WorkspacePropsTable
            v-if="localFields"
            ref="queryTable"
            :results="localFields"
            :tab-uid="tabUid"
            :conn-uid="connection.uid"
            :table="table"
            :schema="schema"
            mode="table"
         />
      </div>
   </div>
</template>

<script>
import Tables from '@/ipc-api/Tables';
import WorkspacePropsTable from '@/components/WorkspacePropsTable';
import { mapGetters, mapActions } from 'vuex';

export default {
   name: 'WorkspacePropsTab',
   components: {
      WorkspacePropsTable
   },
   props: {
      connection: Object,
      table: String
   },
   data () {
      return {
         tabUid: 'prop',
         isQuering: false,
         localFields: [],
         localKeyUsage: [],
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
         return this.workspace.selected_tab === 'prop';
      },
      schema () {
         return this.workspace.breadcrumbs.schema;
      }
   },
   watch: {
      table () {
         if (this.isSelected) {
            this.getFieldsData();
            this.lastTable = this.table;
         }
      },
      isSelected (val) {
         if (val && this.lastTable !== this.table) {
            this.getFieldsData();
            this.lastTable = this.table;
         }
      }
   },
   created () {
      this.getFieldsData();
      window.addEventListener('keydown', this.onKey);
   },
   methods: {
      ...mapActions({
         addNotification: 'notifications/addNotification',
         setTabFields: 'workspaces/setTabFields',
         setTabKeyUsage: 'workspaces/setTabKeyUsage'
      }),
      async getFieldsData () {
         if (!this.table) return;
         this.isQuering = true;
         const fieldsArr = [];
         const keysArr = [];

         // if table changes clear cached values
         if (this.lastTable !== this.table)
            this.setTabFields({ cUid: this.connection.uid, tUid: this.tabUid, fields: [] });

         const params = {
            uid: this.connection.uid,
            schema: this.schema,
            table: this.workspace.breadcrumbs.table
         };

         try { // Columns data
            const { status, response } = await Tables.getTableColumns(params);
            if (status === 'success') {
               this.localFields = response;
               fieldsArr.push(response);
            }
            else
               this.addNotification({ status: 'error', message: response });
         }
         catch (err) {
            this.addNotification({ status: 'error', message: err.stack });
         }

         try { // Key usage (foreign keys)
            const { status, response } = await Tables.getKeyUsage(params);

            if (status === 'success') {
               this.localKeyUsage = response;
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
      reloadFields () {
         this.getFieldsData();
      },
      showAddModal () {
         this.isAddModal = true;
      },
      hideAddModal () {
         this.isAddModal = false;
      },
      onKey (e) {
         e.stopPropagation();
         if (e.key === 'F5')
            this.reloadFields();
      },
      setRefreshInterval () {
         if (this.refreshInterval)
            clearInterval(this.refreshInterval);

         if (+this.autorefreshTimer) {
            this.refreshInterval = setInterval(() => {
               if (!this.isQuering)
                  this.reloadFields();
            }, this.autorefreshTimer * 1000);
         }
      }
   }
};
</script>
