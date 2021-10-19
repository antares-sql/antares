<template>
   <div v-show="isSelected" class="workspace-query-tab column col-12 columns col-gapless no-outline p-0">
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
                        <i v-if="!+autorefreshTimer" class="mdi mdi-24px mdi-refresh mr-1" />
                        <i v-else class="mdi mdi-24px mdi-history mdi-flip-h mr-1" />
                        <span>{{ $t('word.refresh') }}</span>
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
               <div class="btn-group">
                  <button
                     class="btn btn-dark btn-sm mr-0"
                     :disabled="isQuering || page === 1"
                     title="CTRL+ᐊ"
                     @click="pageChange('prev')"
                  >
                     <i class="mdi mdi-24px mdi-skip-previous" />
                  </button>
                  <div class="dropdown" :class="{'active': isPageMenu}">
                     <div @click="openPageMenu">
                        <div class="btn btn-dark btn-sm mr-0 no-radius dropdown-toggle text-bold px-3">
                           {{ page }}
                        </div>
                        <div class="menu px-3">
                           <span>{{ $t('message.pageNumber') }}</span>
                           <input
                              ref="pageSelect"
                              v-model="pageProxy"
                              type="number"
                              min="1"
                              class="form-input"
                              @blur="setPageNumber"
                           >
                        </div>
                     </div>
                  </div>
                  <button
                     class="btn btn-dark btn-sm mr-0"
                     :disabled="isQuering || (results.length && results[0].rows.length < limit)"
                     title="CTRL+ᐅ"
                     @click="pageChange('next')"
                  >
                     <i class="mdi mdi-24px mdi-skip-next" />
                  </button>
               </div>

               <div class="divider-vert py-3" />

               <button
                  class="btn btn-sm"
                  :class="{'btn-primary': isSearch, 'btn-dark': !isSearch}"
                  @click="isSearch = !isSearch"
               >
                  <i class="mdi mdi-24px mdi-magnify" />
               </button>
               <button
                  v-if="isTable"
                  class="btn btn-dark btn-sm"
                  :disabled="isQuering"
                  @click="showFakerModal"
               >
                  <i class="mdi mdi-24px mdi-playlist-plus mr-1" />
                  <span>{{ $t('message.tableFiller') }}</span>
               </button>

               <div class="dropdown table-dropdown pr-2">
                  <button
                     :disabled="isQuering"
                     class="btn btn-dark btn-sm dropdown-toggle mr-0 pr-0"
                     tabindex="0"
                  >
                     <i class="mdi mdi-24px mdi-file-export mr-1" />
                     <span>{{ $t('word.export') }}</span>
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
               <div
                  v-if="results.length"
                  class="d-flex"
                  :title="$t('message.queryDuration')"
               >
                  <i class="mdi mdi-timer-sand mdi-rotate-180 pr-1" /> <b>{{ results[0].duration / 1000 }}s</b>
               </div>
               <div v-if="results.length && results[0].rows">
                  {{ $t('word.results') }}: <b>{{ results[0].rows.length | localeString }}</b>
               </div>
               <div v-if="hasApproximately || (page > 1 && approximateCount)">
                  {{ $t('word.total') }}: <b :title="$t('word.approximately')">≈ {{ approximateCount | localeString }}</b>
               </div>
               <div class="d-flex" :title="$t('word.schema')">
                  <i class="mdi mdi-18px mdi-database mr-1" /><b>{{ schema }}</b>
               </div>
            </div>
         </div>
      </div>
      <WorkspaceTabTableFilters
         v-if="isSearch"
         :fields="fields"
         @filter="updateFilters"
         @filter-change="onFilterChange"
      />
      <div class="workspace-query-results p-relative column col-12">
         <BaseLoader v-if="isQuering" />
         <WorkspaceTabQueryTable
            v-if="results"
            ref="queryTable"
            :results="results"
            :tab-uid="tabUid"
            :conn-uid="connection.uid"
            :is-selected="isSelected"
            mode="table"
            :element-type="elementType"
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
import BaseLoader from '@/components/BaseLoader';
import WorkspaceTabQueryTable from '@/components/WorkspaceTabQueryTable';
import WorkspaceTabTableFilters from '@/components/WorkspaceTabTableFilters';
import ModalNewTableRow from '@/components/ModalNewTableRow';
import ModalFakerRows from '@/components/ModalFakerRows';
import { mapGetters, mapActions } from 'vuex';
import tableTabs from '@/mixins/tableTabs';

export default {
   name: 'WorkspaceTabTable',
   components: {
      BaseLoader,
      WorkspaceTabQueryTable,
      WorkspaceTabTableFilters,
      ModalNewTableRow,
      ModalFakerRows
   },
   filters: {
      localeString (val) {
         if (val !== null)
            return val.toLocaleString();
      }
   },
   mixins: [tableTabs],
   props: {
      connection: Object,
      isSelected: Boolean,
      table: String,
      schema: String,
      elementType: String
   },
   data () {
      return {
         tabUid: 'data', // ???
         isQuering: false,
         isPageMenu: false,
         isSearch: false,
         results: [],
         lastTable: null,
         isAddModal: false,
         isFakerModal: false,
         autorefreshTimer: 0,
         refreshInterval: null,
         sortParams: {},
         filters: [],
         page: 1,
         pageProxy: 1,
         approximateCount: 0
      };
   },
   computed: {
      ...mapGetters({
         getWorkspace: 'workspaces/getWorkspace',
         selectedWorkspace: 'workspaces/getSelected',
         limit: 'settings/getDataTabLimit'
      }),
      workspace () {
         return this.getWorkspace(this.connection.uid);
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
      },
      hasApproximately () {
         return this.results.length &&
            this.results[0].rows &&
            this.results[0].rows.length === this.limit &&
            this.results[0].rows.length < this.approximateCount;
      }
   },
   watch: {
      schema () {
         if (this.isSelected) {
            this.page = 1;
            this.approximateCount = 0;
            this.sortParams = {};
            this.getTableData();
            this.lastTable = this.table;
            this.$refs.queryTable.resetSort();
         }
      },
      table () {
         if (this.isSelected) {
            this.page = 1;
            this.approximateCount = 0;
            this.sortParams = {};
            this.getTableData();
            this.lastTable = this.table;
            this.$refs.queryTable.resetSort();
         }
      },
      page (val, oldVal) {
         if (val && val > 0 && val !== oldVal) {
            this.pageProxy = this.page;
            this.getTableData();
         }
      },
      isSelected (val) {
         if (val) {
            this.changeBreadcrumbs({ schema: this.schema, [this.elementType]: this.table });

            if (this.lastTable !== this.table)
               this.getTableData();
         }
      },
      isSearch (val) {
         if (this.filters.length > 0 && !val) {
            this.filters = [];
            this.getTableData();
         }
         this.resizeScroller();
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
         addNotification: 'notifications/addNotification',
         changeBreadcrumbs: 'workspaces/changeBreadcrumbs'
      }),
      async getTableData () {
         if (!this.table || !this.isSelected) return;
         this.isQuering = true;

         // if table changes clear cached values
         if (this.lastTable !== this.table)
            this.results = [];

         this.lastTable = this.table;

         const params = {
            uid: this.connection.uid,
            schema: this.schema,
            table: this.table,
            limit: this.limit,
            page: this.page,
            sortParams: this.sortParams,
            where: this.filters || []
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

         if (this.results.length && this.results[0].rows.length === this.limit) {
            try { // Table approximate count
               const { status, response } = await Tables.getTableApproximateCount(params);

               if (status === 'success')
                  this.approximateCount = response;
               else
                  this.addNotification({ status: 'error', message: response });
            }
            catch (err) {
               this.addNotification({ status: 'error', message: err.stack });
            }
         }

         this.isQuering = false;
      },
      getTable () {
         return this.table;
      },
      reloadTable () {
         this.getTableData();
      },
      hardSort (sortParams) {
         this.sortParams = sortParams;
         this.getTableData();
      },
      openPageMenu () {
         if (this.isQuering || (this.results.length && this.results[0].rows.length < this.limit && this.page === 1)) return;

         this.isPageMenu = true;
         if (this.isPageMenu)
            setTimeout(() => this.$refs.pageSelect.focus(), 20);
      },
      setPageNumber () {
         this.isPageMenu = false;

         if (this.pageProxy > 0)
            this.page = this.pageProxy;
         else
            this.pageProxy = this.page;
      },
      pageChange (direction) {
         if (this.isQuering) return;

         if (direction === 'next' && (this.results.length && this.results[0].rows.length === this.limit)) {
            if (!this.page)
               this.page = 2;
            else
               this.page++;
         }
         else if (direction === 'prev' && this.page > 1)
            this.page--;
      },
      showAddModal () {
         this.isAddModal = true;
      },
      hideAddModal () {
         this.isAddModal = false;
      },
      showFakerModal () {
         if (this.isQuering) return;
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

            if (e.ctrlKey || e.metaKey) {
               if (e.key === 'ArrowRight')
                  this.pageChange('next');
               if (e.key === 'ArrowLeft')
                  this.pageChange('prev');
               if (e.keyCode === 70) // f
                  this.isSearch = !this.isSearch;
            }
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
      },
      onFilterChange (clausoles) {
         this.resizeScroller();
         if (clausoles.length === 0)
            this.isSearch = false;
      },
      resizeScroller () {
         setTimeout(() => this.$refs.queryTable.refreshScroller(), 1);
      },
      updateFilters (clausoles) {
         this.filters = clausoles;
         this.getTableData();
      }
   }
};
</script>
