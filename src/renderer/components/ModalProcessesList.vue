<template>
   <Teleport to="#window-content">
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
         <div ref="trapRef" class="modal-container p-0 pb-4">
            <div class="modal-header pl-2">
               <div class="modal-title h6">
                  <div class="d-flex">
                     <i class="mdi mdi-24px mdi-memory mr-1" />
                     <span class="cut-text">{{ t('message.processesList') }}: {{ connectionName }}</span>
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
                           :title="`${t('word.refresh')}`"
                           @click="getProcessesList"
                        >
                           <i v-if="!+autorefreshTimer" class="mdi mdi-24px mdi-refresh mr-1" />
                           <i v-else class="mdi mdi-24px mdi-history mdi-flip-h mr-1" />
                        </button>
                        <div class="btn btn-dark btn-sm dropdown-toggle pl-0 pr-0" tabindex="0">
                           <i class="mdi mdi-24px mdi-menu-down" />
                        </div>
                        <div class="menu px-3">
                           <span>{{ t('word.autoRefresh') }}: <b>{{ +autorefreshTimer ? `${autorefreshTimer}s` : 'OFF' }}</b></span>
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
                        <span>{{ t('word.export') }}</span>
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
                     {{ t('word.processes') }}: <b>{{ sortedResults.length.toLocaleString() }}</b>
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
                        <template #default="{ items }">
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
   </Teleport>
</template>

<script setup lang="ts">
import { Component, computed, onBeforeUnmount, onMounted, onUpdated, Prop, Ref, ref } from 'vue';
import { ipcRenderer } from 'electron';
import { ConnectionParams } from 'common/interfaces/antares';
import { exportRows } from '../libs/exportRows';
import { useNotificationsStore } from '@/stores/notifications';
import { useFocusTrap } from '@/composables/useFocusTrap';
import Schema from '@/ipc-api/Schema';
import { useConnectionsStore } from '@/stores/connections';
import BaseVirtualScroll from '@/components/BaseVirtualScroll.vue';
import ModalProcessesListRow from '@/components/ModalProcessesListRow.vue';
import ModalProcessesListContext from '@/components/ModalProcessesListContext.vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const { addNotification } = useNotificationsStore();
const { getConnectionName } = useConnectionsStore();

const { trapRef } = useFocusTrap();

const props = defineProps({
   connection: Object as Prop<ConnectionParams>
});

const emit = defineEmits(['close']);

const tableWrapper: Ref<HTMLDivElement> = ref(null);
const table: Ref<HTMLDivElement> = ref(null);
const resultTable: Ref<Component & {updateWindow: () => void}> = ref(null);
const resultsSize = ref(1000);
const isQuering = ref(false);
const isContext = ref(false);
const autorefreshTimer = ref(0);
const refreshInterval: Ref<NodeJS.Timeout> = ref(null);
const contextEvent = ref(null);
const selectedCell = ref(null);
const selectedRow: Ref<number> = ref(null);
const results = ref([]);
const fields = ref([]);
const currentSort = ref('');
const currentSortDir = ref('asc');
const scrollElement = ref(null);

const connectionName = computed(() => getConnectionName(props.connection.uid));

const sortedResults = computed(() => {
   if (currentSort.value) {
      return [...results.value].sort((a, b) => {
         let modifier = 1;
         const valA = typeof a[currentSort.value] === 'string' ? a[currentSort.value].toLowerCase() : a[currentSort.value];
         const valB = typeof b[currentSort.value] === 'string' ? b[currentSort.value].toLowerCase() : b[currentSort.value];
         if (currentSortDir.value === 'desc') modifier = -1;
         if (valA < valB) return -1 * modifier;
         if (valA > valB) return 1 * modifier;
         return 0;
      });
   }
   else
      return results.value;
});

const getProcessesList = async () => {
   isQuering.value = true;

   try { // Table data
      const { status, response } = await Schema.getProcesses(props.connection.uid);

      if (status === 'success') {
         results.value = response;
         fields.value = response.length ? Object.keys(response[0]) : [];
      }
      else
         addNotification({ status: 'error', message: response });
   }
   catch (err) {
      addNotification({ status: 'error', message: err.stack });
   }

   isQuering.value = false;
};

const setRefreshInterval = () => {
   clearRefresh();

   if (+autorefreshTimer.value) {
      refreshInterval.value = setInterval(() => {
         if (!isQuering.value)
            getProcessesList();
      }, autorefreshTimer.value * 1000);
   }
};

const clearRefresh = () => {
   if (refreshInterval.value)
      clearInterval(refreshInterval.value);
};

const resizeResults = () => {
   if (resultTable.value) {
      const el = tableWrapper.value.parentElement;

      if (el) {
         const size = el.offsetHeight;
         resultsSize.value = size;
      }
      resultTable.value.updateWindow();
   }
};

const refreshScroller = () => resizeResults();

const sort = (field: string) => {
   if (field === currentSort.value) {
      if (currentSortDir.value === 'asc')
         currentSortDir.value = 'desc';
      else
         resetSort();
   }
   else {
      currentSortDir.value = 'asc';
      currentSort.value = field;
   }
};

const resetSort = () => {
   currentSort.value = '';
   currentSortDir.value = 'asc';
};

const stopRefresh = () => {
   autorefreshTimer.value = 0;
   clearRefresh();
};

const selectRow = (row: number) => {
   selectedRow.value = Number(row);
};

const contextMenu = (event: MouseEvent, cell: { id: number; field: string }) => {
   if ((event.target as HTMLElement).localName === 'input') return;
   stopRefresh();

   selectedCell.value = cell;
   selectedRow.value = Number(cell.id);
   contextEvent.value = event;
   isContext.value = true;
};

const killProcess = async () => {
   try { // Table data
      const { status, response } = await Schema.killProcess({ uid: props.connection.uid, pid: selectedRow.value });

      if (status === 'success')
         getProcessesList();
      else
         addNotification({ status: 'error', message: response });
   }
   catch (err) {
      addNotification({ status: 'error', message: err.stack });
   }
};

const closeContext = () => {
   isContext.value = false;
};

const copyCell = () => {
   const row = results.value.find(row => Number(row.id) === selectedRow.value);
   const valueToCopy = row[selectedCell.value.field];
   navigator.clipboard.writeText(valueToCopy);
};

const copyRow = () => {
   const row = results.value.find(row => Number(row.id) === selectedRow.value);
   const rowToCopy = JSON.parse(JSON.stringify(row));
   navigator.clipboard.writeText(JSON.stringify(rowToCopy));
};

const closeModal = () => emit('close');

const downloadTable = (format: 'csv' | 'json') => {
   if (!sortedResults.value) return;
   exportRows({
      type: format,
      content: sortedResults.value,
      table: 'processes'
   });
};

const onKey = (e:KeyboardEvent) => {
   e.stopPropagation();
   if (e.key === 'Escape')
      closeModal();
};

ipcRenderer.on('run-or-reload', getProcessesList);

window.addEventListener('keydown', onKey, { capture: true });

onMounted(() => {
   getProcessesList();
   window.addEventListener('resize', resizeResults);
});

onUpdated(() => {
   if (table.value)
      refreshScroller();
   if (tableWrapper.value)
      scrollElement.value = tableWrapper.value;
});

onBeforeUnmount(() => {
   window.removeEventListener('keydown', onKey, { capture: true });
   window.removeEventListener('resize', resizeResults);
   clearInterval(refreshInterval.value);

   ipcRenderer.removeListener('run-or-reload', getProcessesList);
});

defineExpose({ refreshScroller });
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
