<template>
   <div v-show="isSelected" class="workspace-query-tab column col-12 columns col-gapless">
      <div class="workspace-query-runner column col-12">
         <div class="workspace-query-runner-footer">
            <div class="workspace-query-buttons">
               <div class="dropdown">
                  <div class="btn-group">
                     <button
                        class="btn btn-dark btn-sm mr-0 pr-1"
                        :class="{'loading':isQuering}"
                        title="F5"
                        @click="reloadTable"
                     >
                        <span>{{ $t('word.refresh') }}</span>
                        <i v-if="!+autorefreshTimer" class="mdi mdi-24px mdi-refresh ml-1" />
                        <i v-else class="mdi mdi-24px mdi-history mdi-flip-h ml-1" />
                     </button>
                     <div class="btn btn-dark btn-sm dropdown-toggle pl-0 pr-0" tabindex="0">
                        <i class="mdi mdi-24px mdi-menu-down" />
                     </div>
                     <div class="menu px-3">
                        <span>{{ $t('word.autoRefresh') }}: <b>{{ +autorefreshTimer ? `${autorefreshTimer}s` : 'OFF' }}</b></span>
                        <input
                           v-model="autorefreshTimer"
                           class="slider no-border"
                           type="range"
                           min="0"
                           max="30"
                           step="1"
                           @change="setRefreshInterval"
                        >
                     </div>
                  </div>
               </div>

               <button
                  v-if="isTable"
                  class="btn btn-dark btn-sm"
                  @click="showFakerModal"
               >
                  <span>{{ $t('message.tableFiller') }}</span>
                  <i class="mdi mdi-24px mdi-playlist-plus ml-1" />
               </button>

               <div class="dropdown export-dropdown pr-2">
                  <button
                     :disabled="isQuering"
                     class="btn btn-dark btn-sm dropdown-toggle mr-0 pr-0"
                     tabindex="0"
                  >
                     <span>{{ $t('word.export') }}</span>
                     <i class="mdi mdi-24px mdi-file-export ml-1" />
                     <i class="mdi mdi-24px mdi-menu-down" />
                  </button>
                  <ul class="menu text-left">
                     <li class="menu-item">
                        <a class="c-hand" @click="downloadTable('json')">JSON</a>
                     </li>
                     <li class="menu-item">
                        <a class="c-hand" @click="downloadTable('csv')">CSV</a>
                     </li>
                  </ul>
               </div>
            </div>
            <div class="workspace-query-info">
               <div v-if="results.length && results[0].rows">
                  {{ $t('word.results') }}: <b>{{ results[0].rows.length.toLocaleString() }}</b>
               </div>
               <div v-if="results.length && results[0].rows && tableInfo && results[0].rows.length < tableInfo.rows">
                  {{ $t('word.total') }}: <b>{{ tableInfo.rows.toLocaleString() }}</b> <small>({{ $t('word.approximately') }})</small>
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
            ref="queryTable"
            :results="results"
            :tab-uid="tabUid"
            :conn-uid="connection.uid"
            mode="table"
            @update-field="updateField"
            @delete-selected="deleteSelected"
            @hard-sort="hardSort"
         />
      </div>
      <ModalNewTableRow
         v-if="isAddModal"
         :fields="fields"
         :key-usage="keyUsage"
         :tab-uid="tabUid"
         @hide="hideAddModal"
         @reload="reloadTable"
      />
      <ModalFakerRows
         v-if="isFakerModal"
         :fields="fields"
         :key-usage="keyUsage"
         :tab-uid="tabUid"
         @hide="hideFakerModal"
         @reload="reloadTable"
      />
   </div>
</template>

<script>
import Tables from '@/ipc-api/Tables';
import WorkspaceQueryTable from '@/components/WorkspaceQueryTable';
import ModalNewTableRow from '@/components/ModalNewTableRow';
import ModalFakerRows from '@/components/ModalFakerRows';
import { mapGetters, mapActions } from 'vuex';
import tableTabs from '@/mixins/tableTabs';

export default {
   name: 'WorkspaceTableTab',
   components: {
      WorkspaceQueryTable,
      ModalNewTableRow,
      ModalFakerRows
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
         lastTable: null,
         isAddModal: false,
         isFakerModal: false,
         autorefreshTimer: 0,
         refreshInterval: null,
         sortParams: {}
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
      },
      isTable () {
         return !!this.workspace.breadcrumbs.table;
      },
      fields () {
         return this.results.length ? this.results[0].fields : [];
      },
      keyUsage () {
         return this.results.length ? this.results[0].keys : [];
      },
      tableInfo () {
         try {
            return this.workspace.structure.find(db => db.name === this.schema).tables.find(table => table.name === this.table);
         }
         catch (err) {
            return { rows: 0 };
         }
      }
   },
   watch: {
      table () {
         if (this.isSelected) {
            this.sortParams = {};
            this.getTableData();
            this.lastTable = this.table;
            this.$refs.queryTable.resetSort();
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
      window.addEventListener('keydown', this.onKey);
   },
   beforeDestroy () {
      window.removeEventListener('keydown', this.onKey);
      clearInterval(this.refreshInterval);
   },
   methods: {
      ...mapActions({
         addNotification: 'notifications/addNotification'
      }),
      async getTableData (sortParams) {
         if (!this.table) return;
         this.isQuering = true;

         // if table changes clear cached values
         if (this.lastTable !== this.table)
            this.results = [];

         const params = {
            uid: this.connection.uid,
            schema: this.schema,
            table: this.workspace.breadcrumbs.table || this.workspace.breadcrumbs.view,
            sortParams
         };

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

         this.isQuering = false;
      },
      getTable () {
         return this.table;
      },
      reloadTable () {
         this.getTableData(this.sortParams);
      },
      hardSort (sortParams) {
         this.sortParams = sortParams;
         this.getTableData(sortParams);
      },
      showAddModal () {
         this.isAddModal = true;
      },
      hideAddModal () {
         this.isAddModal = false;
      },
      showFakerModal () {
         this.isFakerModal = true;
      },
      hideFakerModal () {
         this.isFakerModal = false;
      },
      onKey (e) {
         if (this.isSelected) {
            e.stopPropagation();
            if (e.key === 'F5')
               this.reloadTable();
         }
      },
      setRefreshInterval () {
         if (this.refreshInterval)
            clearInterval(this.refreshInterval);

         if (+this.autorefreshTimer) {
            this.refreshInterval = setInterval(() => {
               if (!this.isQuering)
                  this.reloadTable();
            }, this.autorefreshTimer * 1000);
         }
      },
      downloadTable (format) {
         this.$refs.queryTable.downloadTable(format, this.table);
      }
   }
};
</script>
<style lang="scss" scoped>
.export-dropdown {
  .menu {
    min-width: 100%;

    .menu-item a:hover {
      background: $bg-color-gray;
    }
  }
}
</style>
