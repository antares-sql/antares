<template>
   <div class="modal active">
      <ModalProcessesListContext
         v-if="isContext"
         :context-event="contextEvent"
         :selected-row="selectedRow"
         :selected-cell="selectedCell"
         @copy-cell="copyCell"
         @copy-row="copyRow"
         @kill-process="killProcess"
         @close-context="closeContext"
      />
      <a class="modal-overlay" @click.stop="closeModal" />
      <div class="modal-container p-0 pb-4">
         <div class="modal-header pl-2">
            <div class="modal-title h6">
               <div class="d-flex">
                  <i class="mdi mdi-24px mdi-memory mr-1" />
                  <span class="cut-text">{{ $t('message.processesList') }}: {{ connectionName }}</span>
               </div>
            </div>
            <a class="btn btn-clear c-hand" @click.stop="closeModal" />
         </div>
         <div class="processes-toolbar py-2 px-4">
            <div class="workspace-query-buttons">
               <div class="dropdown pr-1">
                  <div class="btn-group">
                     <button
                        class="btn btn-dark btn-sm mr-0 pr-1 d-flex"
                        :class="{'loading':isQuering}"
                        :title="`${$t('word.refresh')} (F5)`"
                        @click="getProcessesList"
                     >
                        <i v-if="!+autorefreshTimer" class="mdi mdi-24px mdi-refresh mr-1" />
                        <i v-else class="mdi mdi-24px mdi-history mdi-flip-h mr-1" />
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
                           max="15"
                           step="0.5"
                           @change="setRefreshInterval"
                        >
                     </div>
                  </div>
               </div>
               <div class="dropdown table-dropdown">
                  <button
                     :disabled="isQuering"
                     class="btn btn-dark btn-sm dropdown-toggle d-flex mr-0 pr-0"
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
               <div v-if="sortedResults.length">
                  {{ $t('word.processes') }}: <b>{{ sortedResults.length.toLocaleString() }}</b>
               </div>
            </div>
         </div>
         <div class="modal-body py-0 workspace-query-results">
            <div
               ref="tableWrapper"
               class="vscroll"
               :style="{'height': resultsSize+'px'}"
            >
               <div ref="table" class="table table-hover">
                  <div class="thead">
                     <div class="tr">
                        <div
                           v-for="(field, index) in fields"
                           :key="index"
                           class="th c-hand"
                        >
                           <div ref="columnResize" class="column-resizable">
                              <div class="table-column-title" @click="sort(field)">
                                 <span>{{ field.toUpperCase() }}</span>
                                 <i
                                    v-if="currentSort === field"
                                    class="mdi sort-icon"
                                    :class="currentSortDir === 'asc' ? 'mdi-sort-ascending':'mdi-sort-descending'"
                                 />
                              </div>
                           </div>
                        </div>
                     </div>
                  </div>
                  <BaseVirtualScroll
                     ref="resultTable"
                     :items="sortedResults"
                     :item-height="22"
                     class="tbody"
                     :visible-height="resultsSize"
                     :scroll-element="scrollElement"
                  >
                     <template slot-scope="{ items }">
                        <ModalProcessesListRow
                           v-for="row in items"
                           :key="row.id"
                           class="process-row"
                           :row="row"
                           @select-row="selectRow(row.id)"
                           @contextmenu="contextMenu"
                           @stop-refresh="stopRefresh"
                        />
                     </template>
                  </BaseVirtualScroll>
               </div>
            </div>
         </div>
      </div>
   </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex';
import arrayToFile from '../libs/arrayToFile';
import Schema from '@/ipc-api/Schema';
import BaseVirtualScroll from '@/components/BaseVirtualScroll';
import ModalProcessesListRow from '@/components/ModalProcessesListRow';
import ModalProcessesListContext from '@/components/ModalProcessesListContext';

export default {
   name: 'ModalProcessesList',
   components: {
      BaseVirtualScroll,
      ModalProcessesListRow,
      ModalProcessesListContext
   },
   props: {
      connection: Object
   },
   data () {
      return {
         resultsSize: 1000,
         isQuering: false,
         isContext: false,
         autorefreshTimer: 0,
         refreshInterval: null,
         contextEvent: null,
         selectedCell: null,
         selectedRow: null,
         results: [],
         fields: [],
         currentSort: '',
         currentSortDir: 'asc',
         scrollElement: null
      };
   },
   computed: {
      ...mapGetters({
         getConnectionName: 'connections/getConnectionName'
      }),
      connectionName () {
         return this.getConnectionName(this.connection.uid);
      },
      sortedResults () {
         if (this.currentSort) {
            return [...this.results].sort((a, b) => {
               let modifier = 1;
               const valA = typeof a[this.currentSort] === 'string' ? a[this.currentSort].toLowerCase() : a[this.currentSort];
               const valB = typeof b[this.currentSort] === 'string' ? b[this.currentSort].toLowerCase() : b[this.currentSort];
               if (this.currentSortDir === 'desc') modifier = -1;
               if (valA < valB) return -1 * modifier;
               if (valA > valB) return 1 * modifier;
               return 0;
            });
         }
         else
            return this.results;
      }
   },
   created () {
      window.addEventListener('keydown', this.onKey, { capture: true });
   },
   updated () {
      if (this.$refs.table)
         this.refreshScroller();

      if (this.$refs.tableWrapper)
         this.scrollElement = this.$refs.tableWrapper;
   },
   mounted () {
      this.getProcessesList();
      window.addEventListener('resize', this.resizeResults);
   },
   beforeDestroy () {
      window.removeEventListener('keydown', this.onKey, { capture: true });
      window.removeEventListener('resize', this.resizeResults);
      clearInterval(this.refreshInterval);
   },
   methods: {
      ...mapActions({
         addNotification: 'notifications/addNotification'
      }),
      async getProcessesList () {
         this.isQuering = true;

         // if table changes clear cached values
         if (this.lastTable !== this.table)
            this.results = [];

         try { // Table data
            const { status, response } = await Schema.getProcesses(this.connection.uid);

            if (status === 'success') {
               this.results = response;
               this.fields = response.length ? Object.keys(response[0]) : [];
            }
            else
               this.addNotification({ status: 'error', message: response });
         }
         catch (err) {
            this.addNotification({ status: 'error', message: err.stack });
         }

         this.isQuering = false;
      },
      setRefreshInterval () {
         this.clearRefresh();

         if (+this.autorefreshTimer) {
            this.refreshInterval = setInterval(() => {
               if (!this.isQuering)
                  this.getProcessesList();
            }, this.autorefreshTimer * 1000);
         }
      },
      clearRefresh () {
         if (this.refreshInterval)
            clearInterval(this.refreshInterval);
      },
      resizeResults () {
         if (this.$refs.resultTable) {
            const el = this.$refs.tableWrapper.parentElement;

            if (el) {
               const size = el.offsetHeight;
               this.resultsSize = size;
            }
            this.$refs.resultTable.updateWindow();
         }
      },
      refreshScroller () {
         this.resizeResults();
      },
      sort (field) {
         if (field === this.currentSort) {
            if (this.currentSortDir === 'asc')
               this.currentSortDir = 'desc';
            else
               this.resetSort();
         }
         else {
            this.currentSortDir = 'asc';
            this.currentSort = field;
         }
      },
      resetSort () {
         this.currentSort = '';
         this.currentSortDir = 'asc';
      },
      stopRefresh () {
         this.autorefreshTimer = 0;
         this.clearRefresh();
      },
      selectRow (row) {
         this.selectedRow = row;
      },
      contextMenu (event, cell) {
         if (event.target.localName === 'input') return;
         this.stopRefresh();

         this.selectedCell = cell;
         this.selectedRow = cell.id;
         this.contextEvent = event;
         this.isContext = true;
      },
      async killProcess () {
         try { // Table data
            const { status, response } = await Schema.killProcess({ uid: this.connection.uid, pid: this.selectedRow });

            if (status === 'success')
               this.getProcessesList();
            else
               this.addNotification({ status: 'error', message: response });
         }
         catch (err) {
            this.addNotification({ status: 'error', message: err.stack });
         }
      },
      closeContext () {
         this.isContext = false;
      },
      copyCell () {
         const row = this.results.find(row => row.id === this.selectedRow);
         const valueToCopy = row[this.selectedCell.field];
         navigator.clipboard.writeText(valueToCopy);
      },
      copyRow () {
         const row = this.results.find(row => row.id === this.selectedRow);
         const rowToCopy = JSON.parse(JSON.stringify(row));
         navigator.clipboard.writeText(JSON.stringify(rowToCopy));
      },
      closeModal () {
         this.$emit('close');
      },
      downloadTable (format) {
         if (!this.sortedResults) return;
         arrayToFile({
            type: format,
            content: this.sortedResults,
            filename: 'processes'
         });
      },
      onKey (e) {
         e.stopPropagation();
         if (e.key === 'Escape')
            this.closeModal();
         if (e.key === 'F5')
            this.getProcessesList();
      }
   }
};
</script>

<style lang="scss" scoped>
.vscroll {
  height: 1000px;
  overflow: auto;
  overflow-anchor: none;
}

.column-resizable {
  &:hover,
  &:active {
    resize: horizontal;
    overflow: hidden;
  }
}

.table-column-title {
  display: flex;
  align-items: center;
}

.sort-icon {
  font-size: 0.7rem;
  line-height: 1;
  margin-left: 0.2rem;
}

.result-tabs {
  background: transparent !important;
  margin: 0;
}

.modal {
  align-items: flex-start;

  .modal-container {
    max-width: 75vw;
    margin-top: 10vh;

    .modal-body {
      height: 80vh;
    }
  }
}

.processes-toolbar {
  display: flex;
  justify-content: space-between;
}
</style>
